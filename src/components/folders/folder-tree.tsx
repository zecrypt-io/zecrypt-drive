"use client";

import { useFolders } from "@/contexts/folder-context";
import { ChevronRight, ChevronDown, Folder } from "lucide-react";
import { useState } from "react";

export function FolderTree() {
  const { rootId, loading, error } = useFolders();

  if (loading) {
    return (
      <div className="animate-pulse space-y-1 px-4">
        <div className="h-8 rounded-lg bg-zinc-100" />
        <div className="h-8 rounded-lg bg-zinc-100" />
        <div className="h-8 rounded-lg bg-zinc-100" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-4">
        <p className="rounded-lg bg-red-50 p-2 text-xs text-red-700" role="alert">
          {error}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-0.5">
      <TreeNode folderId={rootId} depth={0} />
    </div>
  );
}

function TreeNode({ folderId, depth }: { folderId: string; depth: number }) {
  const { folders, getChildren, setCurrentFolderId, currentFolderId } = useFolders();
  const [isExpanded, setIsExpanded] = useState(depth === 0); // Root expanded by default
  
  const folder = folders[folderId];
  const children = getChildren(folderId);
  const hasChildren = children.length > 0;
  
  if (!folder) return null;

  const isActive = currentFolderId === folderId;

  return (
    <div>
      <div 
        className={`group flex items-center gap-1 rounded-r-full py-1.5 pr-3 transition-colors ${
          isActive 
            ? "bg-emerald-50 text-emerald-700" 
            : "text-zinc-700 hover:bg-zinc-100"
        }`}
        style={{ paddingLeft: `${depth * 12 + 12}px` }}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
          className={`flex h-6 w-6 items-center justify-center rounded hover:bg-black/5 ${
            !hasChildren ? "invisible" : ""
          }`}
        >
          {isExpanded ? (
            <ChevronDown className="h-3 w-3 text-zinc-500" />
          ) : (
            <ChevronRight className="h-3 w-3 text-zinc-500" />
          )}
        </button>
        
        <button
          onClick={() => setCurrentFolderId(folderId)}
          className="flex flex-1 items-center gap-2 overflow-hidden"
        >
          <Folder className={`h-4 w-4 shrink-0 ${
            isActive ? "fill-emerald-700/10" : "text-zinc-500"
          }`} />
          <span className="truncate text-sm">{folder.name}</span>
        </button>
      </div>

      {isExpanded && hasChildren && (
        <div>
          {children.map((child) => (
            <TreeNode key={child.id} folderId={child.id} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}
