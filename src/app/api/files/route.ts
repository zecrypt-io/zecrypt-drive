import { NextResponse } from "next/server";
import { randomBytes, createHash } from "node:crypto";
import { verifySessionToken } from "@/lib/firebaseAdmin";
import {
  createFileDoc,
  getFolderById,
  listFilesInFolder,
  getFileById,
  deleteFileDoc,
  getTotalFileSizeForUser,
} from "@/lib/db";
import { uploadToSpaces, getSpacesSignedUrl, deleteFromSpaces } from "@/lib/spaces";

const ROOT_ID = "root";

async function authenticate(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    throw new Error("Unauthorized");
  }
  const token = authHeader.slice("Bearer ".length);
  const decoded = await verifySessionToken(token);
  return decoded.uid;
}

function sanitizeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export async function GET(request: Request) {
  try {
    const userId = await authenticate(request);
    const { searchParams } = new URL(request.url);
    const summary = searchParams.get("summary") === "true";
    if (summary) {
      const usage = await getTotalFileSizeForUser(userId);
      return NextResponse.json(usage);
    }

    const folderId = searchParams.get("folderId") || ROOT_ID;

    if (folderId !== ROOT_ID) {
      const folder = await getFolderById(folderId);
      if (!folder || folder.userId !== userId) {
        return NextResponse.json(
          { error: "Folder not found." },
          { status: 404 },
        );
      }
      if (folder.deletedAt) {
        return NextResponse.json(
          { error: "Folder is in trash." },
          { status: 400 },
        );
      }
    }

    const fileDocs = await listFilesInFolder(userId, folderId);
    const filesWithUrls = await Promise.all(
      fileDocs.map(async (file) => ({
        ...file,
        url: await getSpacesSignedUrl(file.storageKey),
      })),
    );
    return NextResponse.json({ files: filesWithUrls });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load files";
    const status = message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: Request) {
  try {
    const userId = await authenticate(request);
    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "File is required." },
        { status: 400 },
      );
    }

    const folderId =
      typeof formData.get("folderId") === "string"
        ? (formData.get("folderId") as string)
        : ROOT_ID;

    if (folderId !== ROOT_ID) {
      const folder = await getFolderById(folderId);
      if (!folder || folder.userId !== userId) {
        return NextResponse.json(
          { error: "Folder not found." },
          { status: 404 },
        );
      }
      if (folder.deletedAt) {
        return NextResponse.json(
          { error: "Cannot upload into a trashed folder." },
          { status: 400 },
        );
      }
    }

    const contentType = file.type || "application/octet-stream";
    const originalName = file.name || "upload.bin";
    const safeName = sanitizeFileName(originalName.toLowerCase());

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    if (buffer.length === 0) {
      return NextResponse.json(
        { error: "File cannot be empty." },
        { status: 400 },
      );
    }

    const checksum = createHash("sha256").update(buffer).digest("hex");
    const randomSuffix = randomBytes(8).toString("hex");
    const storageKey = `users/${userId}/${folderId}/${Date.now()}-${randomSuffix}-${safeName}`;

    await uploadToSpaces({
      key: storageKey,
      body: buffer,
      contentType,
    });

    const nameCiphertext =
      typeof formData.get("nameCiphertext") === "string"
        ? (formData.get("nameCiphertext") as string)
        : Buffer.from(originalName).toString("base64");

    const iv =
      typeof formData.get("iv") === "string"
        ? (formData.get("iv") as string)
        : "";
    const keyEnvelope =
      typeof formData.get("keyEnvelope") === "string"
        ? (formData.get("keyEnvelope") as string)
        : "";

    const fileDoc = await createFileDoc({
      userId,
      folderId,
      nameCiphertext,
      contentType,
      size: buffer.length,
      storageKey,
      checksum,
      iv,
      keyEnvelope,
    });

    const url = await getSpacesSignedUrl(storageKey);

    return NextResponse.json({ file: { ...fileDoc, url } }, { status: 201 });
  } catch (error) {
    console.error("File upload failed:", error);
    const message =
      error instanceof Error ? error.message : "Failed to upload file";
    const status = message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(request: Request) {
  try {
    const userId = await authenticate(request);
    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get("fileId");

    if (!fileId) {
      return NextResponse.json(
        { error: "fileId is required." },
        { status: 400 },
      );
    }

    const file = await getFileById(userId, fileId);
    if (!file) {
      return NextResponse.json({ error: "File not found." }, { status: 404 });
    }

    await deleteFromSpaces(file.storageKey);
    await deleteFileDoc(userId, fileId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("File delete failed:", error);
    const message =
      error instanceof Error ? error.message : "Failed to delete file";
    const status = message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

