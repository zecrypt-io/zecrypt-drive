"use client";

import { Folder as FolderIcon, MoreVertical, Star } from "lucide-react";
import type { Folder } from "@/contexts/folder-context";
import { useState, useEffect, useRef } from "react";

interface FileListProps {
  folders: Folder[];
  onFolderClick: (id: string) => void;
  onToggleStar: (id: string, isStarred: boolean) => void;
  onDelete: (folder: Folder) => void;
}

export function FileList({ 
  folders, 
  onFolderClick,
  onToggleStar,
  onDelete 
}: FileListProps) {
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
    return null;
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="min-w-full rounded-lg border border-zinc-200 bg-white">
      <table className="min-w-full text-left text-sm">
        <thead>
          <tr className="border-b border-zinc-200 text-zinc-500">
            <th className="px-4 py-3 font-medium w-1/2">Name</th>
            <th className="px-4 py-3 font-medium">Owner</th>
            <th className="px-4 py-3 font-medium">Last modified</th>
            <th className="px-4 py-3 font-medium">File size</th>
            <th className="px-4 py-3 font-medium w-10"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {folders.map((folder) => (
            <tr
              key={folder.id}
              onClick={() => onFolderClick(folder.id)}
              className="group cursor-pointer transition-colors hover:bg-zinc-50"
            >
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center rounded bg-emerald-100 p-1.5 text-emerald-600">
                    <FolderIcon className="h-4 w-4 fill-emerald-600/20" />
                  </div>
                  <span className="font-medium text-zinc-900">{folder.name}</span>
                  {folder.isStarred && (
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                  )}
                </div>
              </td>
              <td className="px-4 py-3 text-zinc-600">Me</td>
              <td className="px-4 py-3 text-zinc-600">{formatDate(folder.createdAt)}</td>
              <td className="px-4 py-3 text-zinc-600">—</td>
              <td className="px-4 py-3">
                <div className="relative" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => setActiveMenu(activeMenu === folder.id ? null : folder.id)}
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-zinc-200 hover:text-zinc-600 ${
                      activeMenu === folder.id ? "bg-zinc-200 text-zinc-600" : "opacity-0 group-hover:opacity-100"
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
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

