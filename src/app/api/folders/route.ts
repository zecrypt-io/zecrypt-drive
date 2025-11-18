import { NextResponse } from "next/server";
import { verifySessionToken } from "@/lib/firebaseAdmin";
import {
  createFolder as createFolderDoc,
  getFolderById,
  listFoldersForUser,
  listTrashFolders,
  deleteFolder as deleteFolderDoc,
  restoreFolder,
  permanentDeleteFolder,
  getFolderChildrenCount,
  setFolderStarred,
} from "@/lib/db";

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

export async function GET(request: Request) {
  try {
    const userId = await authenticate(request);
    const { searchParams } = new URL(request.url);
    const trash = searchParams.get("trash") === "true";
    const folderId = searchParams.get("folderId");
    const count = searchParams.get("count") === "true";

    if (count && folderId) {
      const counts = await getFolderChildrenCount(folderId, userId);
      return NextResponse.json({ counts });
    }

    if (trash) {
      const folders = await listTrashFolders(userId);
      return NextResponse.json({ folders });
    }

    const folders = await listFoldersForUser(userId);
    return NextResponse.json({ folders });
  } catch (error) {
    console.error("Error fetching folders:", error);
    const message =
      error instanceof Error ? error.message : "Failed to fetch folders";
    const status = message === "Unauthorized" ? 401 : 500;
    return NextResponse.json(
      {
        error: message,
        details:
          error instanceof Error && message.includes("index")
            ? "Firestore index required. Check console for index creation link."
            : undefined,
      },
      { status },
    );
  }
}

export async function POST(request: Request) {
  try {
    const userId = await authenticate(request);
    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const parentId =
      typeof body.parentId === "string" && body.parentId.length > 0
        ? body.parentId
        : ROOT_ID;

    if (!name) {
      return NextResponse.json(
        { error: "Folder name is required." },
        { status: 400 },
      );
    }

    if (parentId !== ROOT_ID) {
      const parentDoc = await getFolderById(parentId);
      if (!parentDoc || parentDoc.userId !== userId) {
        return NextResponse.json(
          { error: "Parent folder not found." },
          { status: 400 },
        );
      }
    }

    const folder = await createFolderDoc({ name, parentId, userId });

    return NextResponse.json({ folder }, { status: 201 });
  } catch (error) {
    console.error("Error creating folder:", error);
    const message =
      error instanceof Error ? error.message : "Failed to create folder";
    const status = message === "Unauthorized" ? 401 : 500;
    return NextResponse.json(
      {
        error: message,
        details: error instanceof Error ? error.stack : undefined,
      },
      { status },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const userId = await authenticate(request);
    const { searchParams } = new URL(request.url);
    const folderId = searchParams.get("id");
    const permanent = searchParams.get("permanent") === "true";

    if (!folderId) {
      return NextResponse.json(
        { error: "Folder ID is required." },
        { status: 400 },
      );
    }

    if (folderId === ROOT_ID) {
      return NextResponse.json(
        { error: "Cannot delete root folder." },
        { status: 400 },
      );
    }

    if (permanent) {
      await permanentDeleteFolder(folderId, userId);
    } else {
      await deleteFolderDoc(folderId, userId);
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to delete folder";
    const status = message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PATCH(request: Request) {
  try {
    const userId = await authenticate(request);
    const body = await request.json();
    const folderId = body.folderId;
    const action = body.action; // "restore"

    if (!folderId) {
      return NextResponse.json(
        { error: "Folder ID is required." },
        { status: 400 },
      );
    }

    if (action === "restore") {
      await restoreFolder(folderId, userId);
      return NextResponse.json({ success: true }, { status: 200 });
    }

  if (action === "star") {
    if (typeof body.isStarred !== "boolean") {
      return NextResponse.json(
        { error: "isStarred boolean is required." },
        { status: 400 },
      );
    }
    await setFolderStarred(folderId, userId, body.isStarred);
    return NextResponse.json({ success: true }, { status: 200 });
  }

    return NextResponse.json(
      { error: "Invalid action." },
      { status: 400 },
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to restore folder";
    const status = message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}


