import { getAdminDb } from "@/lib/firebaseAdmin";

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

export async function listFoldersForUser(userId: string): Promise<
  Array<{ id: string } & FolderDoc>
> {
  try {
    const snapshot = await folderCollection()
      .where("userId", "==", userId)
      .get();

    const folders = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as FolderDoc),
    }));

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

export async function deleteFolder(folderId: string, userId: string): Promise<void> {
  const folder = await getFolderById(folderId);
  if (!folder) {
    throw new Error("Folder not found.");
  }
  if (folder.userId !== userId) {
    throw new Error("Unauthorized to delete this folder.");
  }

  // Check if folder has children
  const childrenSnapshot = await folderCollection()
    .where("parentId", "==", folderId)
    .limit(1)
    .get();

  if (!childrenSnapshot.empty) {
    throw new Error("Cannot delete folder with subfolders. Please delete subfolders first.");
  }

  await folderCollection().doc(folderId).delete();
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


