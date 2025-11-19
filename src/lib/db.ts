import { getAdminDb } from "@/lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";

export interface UserProfile {
  userId: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  createdAt: number;
  updatedAt: number;
}

export interface FolderDoc {
  name: string;
  parentId: string;
  userId: string;
  createdAt: number;
  deletedAt?: number; // Timestamp when folder was moved to trash
  isStarred?: boolean;
}

export interface FileDoc {
  userId: string;
  folderId: string;
  nameCiphertext: string;
  contentType: string;
  size: number;
  storageKey: string;
  checksum: string;
  iv: string;
  keyEnvelope: string;
  relativePath?: string;
  createdAt: number;
  updatedAt: number;
}

const folderCollection = () => getAdminDb().collection("folders");
const fileCollection = () => getAdminDb().collection("files");

export async function getFolderById(folderId: string) {
  const doc = await folderCollection().doc(folderId).get();
  if (!doc.exists) {
    return null;
  }
  return { id: doc.id, ...(doc.data() as FolderDoc) };
}

export async function createFolder(input: {
  name: string;
  parentId: string;
  userId: string;
}): Promise<{ id: string } & FolderDoc> {
  try {
    const doc: FolderDoc = {
      name: input.name,
      parentId: input.parentId,
      userId: input.userId,
      createdAt: Date.now(),
      isStarred: false,
    };
    const ref = await folderCollection().add(doc);
    return { id: ref.id, ...doc };
  } catch (error: unknown) {
    const errorCode = (error as { code?: number })?.code;
    const errorMessage =
      error instanceof Error ? error.message : String(error);

    // If Firestore database doesn't exist, provide helpful error
    if (errorCode === 5 || errorMessage.includes("NOT_FOUND")) {
      const projectId = process.env.FIREBASE_PROJECT_ID || "your-project";
      throw new Error(
        `Firestore database not found for project "${projectId}".\n\n` +
        `To fix this:\n` +
        `1. Go to https://console.firebase.google.com/project/${projectId}/firestore\n` +
        `2. Click "Create database"\n` +
        `3. Choose "Start in production mode"\n` +
        `4. Select a database location\n` +
        `5. Click "Enable"\n\n` +
        `After creating the database, restart your dev server and try again.`,
      );
    }

    throw error;
  }
}

export async function listFoldersForUser(userId: string, includeDeleted = false): Promise<
  Array<{ id: string } & FolderDoc>
> {
  try {
    const snapshot = await folderCollection()
      .where("userId", "==", userId)
      .get();

    const folders = snapshot.docs
      .map((doc) => ({
        id: doc.id,
        ...(doc.data() as FolderDoc),
      }))
      .filter((folder) => includeDeleted || !folder.deletedAt);

    // Sort in memory to avoid requiring a Firestore composite index
    return folders.sort((a, b) => a.createdAt - b.createdAt);
  } catch (error: unknown) {
    // Handle Firestore errors gracefully
    const errorMessage =
      error instanceof Error ? error.message : String(error);
    const errorCode = (error as { code?: number })?.code;

    // If collection doesn't exist yet or NOT_FOUND error, return empty array
    if (
      errorCode === 5 ||
      errorMessage.includes("NOT_FOUND") ||
      errorMessage.includes("not found")
    ) {
      return [];
    }

    // Re-throw other errors
    throw error;
  }
}

export async function listTrashFolders(userId: string): Promise<
  Array<{ id: string } & FolderDoc>
> {
  try {
    const snapshot = await folderCollection()
      .where("userId", "==", userId)
      .get();

    const folders = snapshot.docs
      .map((doc) => ({
        id: doc.id,
        ...(doc.data() as FolderDoc),
      }))
      .filter((folder) => folder.deletedAt !== undefined);

    // Sort by deletion date (most recently deleted first)
    return folders.sort((a, b) => (b.deletedAt || 0) - (a.deletedAt || 0));
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : String(error);
    const errorCode = (error as { code?: number })?.code;

    if (
      errorCode === 5 ||
      errorMessage.includes("NOT_FOUND") ||
      errorMessage.includes("not found")
    ) {
      return [];
    }

    throw error;
  }
}

export async function getFolderChildrenCount(folderId: string, userId: string): Promise<{ folders: number; files: number }> {
  // Count non-deleted subfolders
  const foldersSnapshot = await folderCollection()
    .where("parentId", "==", folderId)
    .where("userId", "==", userId)
    .get();

  const activeFolders = foldersSnapshot.docs.filter(
    (doc) => !(doc.data() as FolderDoc).deletedAt
  );

  // Count non-deleted files
  const filesSnapshot = await fileCollection()
    .where("folderId", "==", folderId)
    .where("userId", "==", userId)
    .get();

  // Files don't have deletedAt yet, but we'll count all for now
  const activeFiles = filesSnapshot.docs.length;

  return {
    folders: activeFolders.length,
    files: activeFiles,
  };
}

export async function deleteFolder(folderId: string, userId: string): Promise<void> {
  const folder = await getFolderById(folderId);
  if (!folder) {
    throw new Error("Folder not found.");
  }
  if (folder.userId !== userId) {
    throw new Error("Unauthorized to delete this folder.");
  }

  // Soft delete: set deletedAt timestamp instead of actually deleting
  // Note: This will delete the folder even if it has children
  await folderCollection().doc(folderId).update({
    deletedAt: Date.now(),
  });
}

export async function setFolderStarred(folderId: string, userId: string, isStarred: boolean): Promise<void> {
  const folder = await getFolderById(folderId);
  if (!folder) {
    throw new Error("Folder not found.");
  }
  if (folder.userId !== userId) {
    throw new Error("Unauthorized to update this folder.");
  }
  if (folder.deletedAt) {
    throw new Error("Cannot star a folder in trash.");
  }

  await folderCollection().doc(folderId).update({
    isStarred,
  });
}

export async function restoreFolder(folderId: string, userId: string): Promise<void> {
  const folder = await getFolderById(folderId);
  if (!folder) {
    throw new Error("Folder not found.");
  }
  if (folder.userId !== userId) {
    throw new Error("Unauthorized to restore this folder.");
  }
  if (!folder.deletedAt) {
    throw new Error("Folder is not in trash.");
  }

  // Check if parent folder still exists and is not deleted
  if (folder.parentId !== "root") {
    const parent = await getFolderById(folder.parentId);
    if (!parent || parent.deletedAt) {
      throw new Error("Parent folder no longer exists. Cannot restore.");
    }
  }

  // Remove deletedAt to restore
  await folderCollection().doc(folderId).update({
    deletedAt: FieldValue.delete(),
  });
}

export async function permanentDeleteFolder(folderId: string, userId: string): Promise<void> {
  const folder = await getFolderById(folderId);
  if (!folder) {
    throw new Error("Folder not found.");
  }
  if (folder.userId !== userId) {
    throw new Error("Unauthorized to permanently delete this folder.");
  }
  if (!folder.deletedAt) {
    throw new Error("Folder is not in trash.");
  }

  // Check if 30 days have passed
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  if (folder.deletedAt > thirtyDaysAgo) {
    throw new Error("Folder can only be permanently deleted after 30 days in trash.");
  }

  // Permanently delete the folder
  await folderCollection().doc(folderId).delete();
}

export async function cleanupOldTrash(userId: string): Promise<number> {
  try {
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const snapshot = await folderCollection()
      .where("userId", "==", userId)
      .where("deletedAt", "<=", thirtyDaysAgo)
      .get();

    const batch = getAdminDb().batch();
    let count = 0;

    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
      count++;
    });

    if (count > 0) {
      await batch.commit();
    }

    return count;
  } catch (error) {
    console.error("Error cleaning up old trash:", error);
    return 0;
  }
}

export async function createFileDoc(input: {
  userId: string;
  folderId: string;
  nameCiphertext: string;
  contentType: string;
  size: number;
  storageKey: string;
  checksum: string;
  iv: string;
  keyEnvelope: string;
  relativePath?: string;
}): Promise<{ id: string } & FileDoc> {
  const now = Date.now();
  const doc: FileDoc = {
    userId: input.userId,
    folderId: input.folderId,
    nameCiphertext: input.nameCiphertext,
    contentType: input.contentType,
    size: input.size,
    storageKey: input.storageKey,
    checksum: input.checksum,
    iv: input.iv,
    keyEnvelope: input.keyEnvelope,
    relativePath: input.relativePath,
    createdAt: now,
    updatedAt: now,
  };
  const ref = await fileCollection().add(doc);
  return { id: ref.id, ...doc };
}

export async function getFileById(userId: string, fileId: string) {
  const doc = await fileCollection().doc(fileId).get();
  if (!doc.exists) {
    return null;
  }
  const data = doc.data() as FileDoc;
  if (data.userId !== userId) {
    return null;
  }
  return { id: doc.id, ...data };
}

export async function listFilesForUser(userId: string, limit = 50) {
  const snapshot = await fileCollection()
    .where("userId", "==", userId)
    .orderBy("createdAt", "desc")
    .limit(limit)
    .get();

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as FileDoc),
  }));
}

export async function listFilesInFolder(userId: string, folderId: string) {
  const snapshot = await fileCollection()
    .where("userId", "==", userId)
    .where("folderId", "==", folderId)
    .orderBy("createdAt", "desc")
    .get();

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as FileDoc),
  }));
}

export async function deleteFileDoc(userId: string, fileId: string): Promise<void> {
  const ref = fileCollection().doc(fileId);
  const doc = await ref.get();
  if (!doc.exists) {
    throw new Error("File not found.");
  }
  const data = doc.data() as FileDoc;
  if (data.userId !== userId) {
    throw new Error("Unauthorized to delete this file.");
  }
  await ref.delete();
}

export async function getTotalFileSizeForUser(userId: string) {
  const snapshot = await fileCollection().where("userId", "==", userId).select("size").get();
  let totalBytes = 0;
  snapshot.docs.forEach((doc) => {
    const data = doc.data() as Pick<FileDoc, "size">;
    totalBytes += data.size || 0;
  });
  return { totalBytes, fileCount: snapshot.size };
}

export async function ensureFolderPath(
  userId: string,
  startingFolderId: string,
  segments: string[],
): Promise<string> {
  let currentParentId = startingFolderId;

  for (const rawSegment of segments) {
    if (!rawSegment) continue;

    const snapshot = await folderCollection().where("parentId", "==", currentParentId).get();
    const existingDoc = snapshot.docs.find((doc) => {
      const data = doc.data() as FolderDoc;
      return data.userId === userId && data.name === rawSegment && !data.deletedAt;
    });

    if (existingDoc) {
      currentParentId = existingDoc.id;
      continue;
    }

    const created = await createFolder({
      name: rawSegment,
      parentId: currentParentId,
      userId,
    });
    currentParentId = created.id;
  }

  return currentParentId;
}


