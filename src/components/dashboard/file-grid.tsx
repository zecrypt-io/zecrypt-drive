"use client";

import { Folder as FolderIcon, MoreVertical, Star } from "lucide-react";
import type { Folder } from "@/contexts/folder-context";
import { useState, useEffect, useRef } from "react";

interface FileGridProps {
  folders: Folder[];
  onFolderClick: (id: string) => void;
  onToggleStar: (id: string, isStarred: boolean) => void;
  onDelete: (folder: Folder) => void;
}

export function FileGrid({ 
  folders, 
  onFolderClick,
  onToggleStar,
  onDelete 
}: FileGridProps) {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenu(null);
      }
    };

    if (activeMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [activeMenu]);

  if (folders.length === 0) {
    return null; // Parent handles empty state
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {folders.map((folder) => (
        <div
          key={folder.id}
          onClick={() => onFolderClick(folder.id)}
          className="group relative flex flex-col justify-between rounded-xl border border-zinc-200 bg-white p-3 transition-all hover:shadow-md cursor-pointer active:scale-[0.98] hover:border-emerald-200"
        >
          <div className="flex items-start justify-between mb-2">
            <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
              <FolderIcon className="h-6 w-6 fill-emerald-600/20" />
            </div>
            <div className="relative" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => setActiveMenu(activeMenu === folder.id ? null : folder.id)}
                className={`rounded-full p-1 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 ${
                  activeMenu === folder.id ? "opacity-100 bg-zinc-100" : "opacity-0 group-hover:opacity-100"
                }`}
              >
                <MoreVertical className="h-4 w-4" />
              </button>
              
              {/* Dropdown Menu */}
              {activeMenu === folder.id && (
                <div 
                  ref={menuRef}
                  className="absolute right-0 top-full z-10 mt-1 w-40 rounded-lg border border-zinc-100 bg-white shadow-lg py-1 animate-in fade-in zoom-in-95 duration-100"
                >
                  <button
                    onClick={() => {
                      onToggleStar(folder.id, !folder.isStarred);
                      setActiveMenu(null);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
                  >
                    <Star className={`h-4 w-4 ${folder.isStarred ? "fill-amber-400 text-amber-400" : ""}`} />
                    {folder.isStarred ? "Remove from Starred" : "Add to Starred"}
                  </button>
                  <div className="my-1 border-t border-zinc-100" />
                  <button
                    onClick={() => {
                      onDelete(folder);
                      setActiveMenu(null);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <span className="h-4 w-4 flex items-center justify-center">🗑️</span>
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>

          <div>
            <h3 className="truncate text-sm font-medium text-zinc-900" title={folder.name}>
              {folder.name}
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">Folder</p>
          </div>

          {/* Star Indicator (if starred) */}
          {folder.isStarred && (
             <div className="absolute bottom-3 right-3 text-amber-400">
                <Star className="h-3 w-3 fill-amber-400" />
             </div>
          )}
        </div>
      ))}
    </div>
  );
}

