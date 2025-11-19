"use client";

import Image from "next/image";
import { Folder as FolderIcon, MoreVertical, Star, File as FileIcon } from "lucide-react";
import type { Folder } from "@/contexts/folder-context";
import type { DriveFile } from "@/types/files";
import { useState, useEffect, useRef, useMemo } from "react";

interface FileListProps {
  folders: Folder[];
  files?: DriveFile[];
  onFolderClick: (id: string) => void;
  onFileClick?: (file: DriveFile) => void;
  onFileDetails?: (file: DriveFile) => void;
  onFileDelete?: (file: DriveFile) => void;
  onToggleStar: (id: string, isStarred: boolean) => void;
  onDelete: (folder: Folder) => void;
  getFileName?: (file: DriveFile) => string;
  formatFileDate?: (timestamp: number) => string;
  formatFileSize?: (bytes: number) => string;
  deletingFileId?: string | null;
}

export function FileList({ 
  folders, 
  files = [],
  onFolderClick,
  onFileClick,
  onFileDetails,
  onFileDelete,
  onToggleStar,
  onDelete,
  getFileName,
  formatFileDate,
  formatFileSize,
  deletingFileId,
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

  const items = useMemo(
    () => [
      ...folders.map((folder) => ({ type: "folder" as const, folder })),
      ...files.map((file) => ({ type: "file" as const, file })),
    ],
    [folders, files],
  );

  if (items.length === 0) {
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
          {items.map((item) =>
            item.type === "folder" ? (
            <tr
              key={item.folder.id}
              onClick={() => onFolderClick(item.folder.id)}
              className="group cursor-pointer transition-colors hover:bg-zinc-50"
            >
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center rounded bg-emerald-100 p-1.5 text-emerald-600">
                    <FolderIcon className="h-4 w-4 fill-emerald-600/20" />
                  </div>
                  <span className="font-medium text-zinc-900">{item.folder.name}</span>
                  {item.folder.isStarred && (
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                  )}
                </div>
              </td>
              <td className="px-4 py-3 text-zinc-600">Me</td>
              <td className="px-4 py-3 text-zinc-600">{formatDate(item.folder.createdAt)}</td>
              <td className="px-4 py-3 text-zinc-600">—</td>
              <td className="px-4 py-3">
                <div className="relative" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => setActiveMenu(activeMenu === item.folder.id ? null : item.folder.id)}
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-zinc-200 hover:text-zinc-600 ${
                      activeMenu === item.folder.id ? "bg-zinc-200 text-zinc-600" : "opacity-0 group-hover:opacity-100"
                    }`}
                  >
                    <MoreVertical className="h-4 w-4" />
                  </button>

                  {/* Dropdown Menu */}
                  {activeMenu === item.folder.id && (
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
              </td>
            </tr>
            ) : (
              <tr
                key={item.file.id}
                onClick={() => onFileClick?.(item.file)}
                className="group cursor-pointer transition-colors hover:bg-zinc-50"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="relative h-10 w-10 overflow-hidden rounded-md bg-zinc-100">
                      {item.file.contentType.startsWith("image/") ? (
                        <Image
                          src={item.file.url}
                          alt={getFileName ? getFileName(item.file) : item.file.nameCiphertext}
                          fill
                          className="object-cover"
                          sizes="40px"
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
                          <FileIcon className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-zinc-900">
                        {getFileName ? getFileName(item.file) : item.file.nameCiphertext}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-zinc-600">Me</td>
                <td className="px-4 py-3 text-zinc-600">
                  {formatFileDate ? formatFileDate(item.file.createdAt) : formatDate(item.file.createdAt)}
                </td>
                <td className="px-4 py-3 text-zinc-600">
                  {formatFileSize ? formatFileSize(item.file.size) : `${item.file.size} B`}
                </td>
                <td className="px-4 py-3">
                  <div className="relative" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => setActiveMenu(`file-${item.file.id}`)}
                      className={`flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-zinc-200 hover:text-zinc-600 ${
                        activeMenu === `file-${item.file.id}` ? "bg-zinc-200 text-zinc-600" : "opacity-0 group-hover:opacity-100"
                      }`}
                      aria-label="File actions"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>
                    {activeMenu === `file-${item.file.id}` && (
                      <div
                        ref={menuRef}
                        className="absolute right-0 top-full z-10 mt-1 w-44 rounded-lg border border-zinc-100 bg-white shadow-lg py-1"
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
                </td>
              </tr>
            )
          )}
        </tbody>
      </table>
    </div>
  );
}

