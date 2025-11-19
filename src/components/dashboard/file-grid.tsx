"use client";

import Image from "next/image";
import { Folder as FolderIcon, MoreVertical, Star, File as FileIcon } from "lucide-react";
import type { Folder } from "@/contexts/folder-context";
import type { DriveFile } from "@/types/files";
import { useState, useEffect, useRef, useMemo } from "react";

interface FileGridProps {
  folders: Folder[];
  files?: DriveFile[];
  onFolderClick: (id: string) => void;
  onFileClick?: (file: DriveFile) => void;
  onFileDetails?: (file: DriveFile) => void;
  onFileDelete?: (file: DriveFile) => void;
  onToggleStar: (id: string, isStarred: boolean) => void;
  onDelete: (folder: Folder) => void;
  getFileDisplayName?: (file: DriveFile) => string;
  getFileTooltip?: (file: DriveFile) => string;
  deletingFileId?: string | null;
}

export function FileGrid({
  folders,
  files = [],
  onFolderClick,
  onFileClick,
  onFileDetails,
  onFileDelete,
  onToggleStar,
  onDelete,
  getFileDisplayName,
  getFileTooltip,
  deletingFileId,
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

  const items = useMemo(
    () => [
      ...folders.map((folder) => ({ type: "folder" as const, folder })),
      ...files.map((file) => ({ type: "file" as const, file })),
    ],
    [folders, files],
  );

  const toggleMenu = (id: string) => {
    setActiveMenu((prev) => (prev === id ? null : id));
  };

  if (items.length === 0) {
    return null; // Parent handles empty state
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {items.map((item) =>
        item.type === "folder" ? (
        <div
          key={item.folder.id}
          onClick={() => onFolderClick(item.folder.id)}
          className="group relative flex flex-col justify-between rounded-xl border border-zinc-200 bg-white p-3 transition-all hover:shadow-md cursor-pointer active:scale-[0.98] hover:border-emerald-200"
        >
          <div className="flex items-start justify-between mb-2">
            <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
              <FolderIcon className="h-6 w-6 fill-emerald-600/20" />
            </div>
            <div className="relative" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => toggleMenu(`folder-${item.folder.id}`)}
                className={`rounded-full p-1 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 ${
                  activeMenu === `folder-${item.folder.id}` ? "opacity-100 bg-zinc-100" : "opacity-0 group-hover:opacity-100"
                }`}
              >
                <MoreVertical className="h-4 w-4" />
              </button>
              
              {/* Dropdown Menu */}
              {activeMenu === `folder-${item.folder.id}` && (
                <div 
                  ref={menuRef}
                  className="absolute right-0 top-full z-10 mt-1 w-40 rounded-lg border border-zinc-100 bg-white shadow-lg py-1 animate-in fade-in zoom-in-95 duration-100"
                >
                  <button
                    onClick={() => {
                      onToggleStar(item.folder.id, !item.folder.isStarred);
                      setActiveMenu(null);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
                  >
                    <Star className={`h-4 w-4 ${item.folder.isStarred ? "fill-amber-400 text-amber-400" : ""}`} />
                    {item.folder.isStarred ? "Remove from Starred" : "Add to Starred"}
                  </button>
                  <div className="my-1 border-t border-zinc-100" />
                  <button
                    onClick={() => {
                      onDelete(item.folder);
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
            <h3 className="truncate text-sm font-medium text-zinc-900" title={item.folder.name}>
              {item.folder.name}
            </h3>
          </div>

          {/* Star Indicator (if starred) */}
          {item.folder.isStarred && (
             <div className="absolute bottom-3 right-3 text-amber-400">
                <Star className="h-3 w-3 fill-amber-400" />
             </div>
          )}
        </div>
        ) : (
          <button
            key={item.file.id}
            type="button"
            onClick={() => onFileClick?.(item.file)}
            className="group flex flex-col rounded-xl border border-zinc-200 bg-white p-3 text-left transition-all hover:shadow-md active:scale-[0.98] hover:border-emerald-200"
          >
            <div className="relative mb-3 h-28 w-full overflow-hidden rounded-lg bg-zinc-50">
              {item.file.contentType.startsWith("image/") ? (
                <Image
                  src={item.file.url}
                  alt={
                    getFileTooltip
                      ? getFileTooltip(item.file)
                      : getFileDisplayName
                        ? getFileDisplayName(item.file)
                        : item.file.nameCiphertext
                  }
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 40vw, 200px"
                />
              ) : item.file.contentType.startsWith("video/") ? (
                <video
                  src={item.file.url}
                  className="h-full w-full object-cover"
                  muted
                  loop
                  playsInline
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-zinc-400">
                  <FileIcon className="h-10 w-10" />
                </div>
              )}
            </div>
            <div className="flex items-start justify-between gap-2">
              <div className="flex flex-1 flex-col">
                <p
                  className="truncate text-sm font-medium text-zinc-900"
                  title={
                    getFileTooltip
                      ? getFileTooltip(item.file)
                      : getFileDisplayName
                        ? getFileDisplayName(item.file)
                        : item.file.nameCiphertext
                  }
                >
                  {getFileDisplayName
                    ? getFileDisplayName(item.file)
                    : item.file.nameCiphertext}
                </p>
              </div>
              <div className="relative" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => toggleMenu(`file-${item.file.id}`)}
                  className={`rounded-full p-1 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 ${
                    activeMenu === `file-${item.file.id}` ? "opacity-100 bg-zinc-100" : "opacity-0 group-hover:opacity-100"
                  }`}
                  aria-label="File actions"
                >
                  <MoreVertical className="h-4 w-4" />
                </button>
                {activeMenu === `file-${item.file.id}` && (
                  <div
                    ref={menuRef}
                    className="absolute right-0 top-full z-10 mt-1 w-44 rounded-lg border border-zinc-100 bg-white shadow-lg py-1 animate-in fade-in zoom-in-95 duration-100"
                  >
                    <button
                      onClick={() => {
                        onFileDetails?.(item.file);
                        setActiveMenu(null);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
                    >
                      Show details
                    </button>
                    <div className="my-1 border-t border-zinc-100" />
                    <button
                      onClick={() => {
                        onFileDelete?.(item.file);
                        setActiveMenu(null);
                      }}
                      disabled={!!deletingFileId && deletingFileId === item.file.id}
                      className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {deletingFileId === item.file.id ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </button>
        )
      )}
    </div>
  );
}

