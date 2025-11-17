"use client";

import { useFolders } from "@/contexts/folder-context";

export function FolderTree() {
  const { rootId, loading, error } = useFolders();

  if (loading) {
    return (
      <div className="animate-pulse space-y-1">
        <div className="h-9 rounded-lg bg-zinc-100" />
        <div className="h-8 rounded-lg bg-zinc-100" />
        <div className="h-8 rounded-lg bg-zinc-100" />
      </div>
    );
  }

  if (error) {
    return (
      <p className="rounded-lg bg-red-50 p-2 text-xs text-red-700" role="alert">
        {error}
      </p>
    );
  }

  return (
    <div className="space-y-1">
      <TreeNode folderId={rootId} depth={0} />
    </div>
  );
}

function TreeNode({ folderId, depth }: { folderId: string; depth: number }) {
  const { folders, getChildren } = useFolders();
  const folder = folders[folderId];
  const children = getChildren(folderId);

  if (!folder) {
    return null;
  }

  const isRoot = depth === 0;

  return (
    <div>
      <button
        className={`flex w-full items-center gap-2 rounded-lg px-2 py-2 text-xs transition active:scale-[0.98] active:bg-zinc-100 ${
          isRoot
            ? "bg-emerald-50 font-medium text-emerald-700"
            : "text-zinc-600"
        }`}
      >
        <span className="text-sm">{isRoot ? "📁" : "└"}</span>
        <span className="truncate text-left">{folder.name}</span>
      </button>
      {children.length > 0 && (
        <div className="ml-3 mt-1 border-l border-zinc-200 pl-2">
          {children.map((child) => (
            <TreeNode key={child.id} folderId={child.id} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}
