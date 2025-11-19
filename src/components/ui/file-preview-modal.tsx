"use client";

import Image from "next/image";
import { X } from "lucide-react";
import type { DriveFile } from "@/types/files";

interface FilePreviewModalProps {
  isOpen: boolean;
  file: DriveFile | null;
  onClose: () => void;
}

export function FilePreviewModal({ isOpen, file, onClose }: FilePreviewModalProps) {
  if (!isOpen || !file) {
    return null;
  }

  const isImage = file.contentType.startsWith("image/");
  const isVideo = file.contentType.startsWith("video/");
  let displayName = "Encrypted file";
  if (file.nameCiphertext) {
    try {
      displayName = atob(file.nameCiphertext);
    } catch {
      displayName = "Encrypted file";
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      role="dialog"
      aria-modal="true"
    >
      <button
        className="absolute inset-0 h-full w-full cursor-default focus:outline-none"
        onClick={onClose}
        aria-label="Close preview backdrop"
      />
      <div className="relative z-10 w-full max-w-4xl rounded-2xl bg-white p-4 shadow-2xl">
        <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
          <div>
            <p className="text-sm text-zinc-500">Previewing</p>
            <p className="text-base font-semibold text-zinc-900 truncate">
              {displayName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-800"
            aria-label="Close preview"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 flex items-center justify-center rounded-xl border border-zinc-100 bg-zinc-50 p-4">
          {isImage ? (
            <div className="relative h-[50vh] max-h-[70vh] w-full">
              <Image
                src={file.url}
                alt="Preview"
                fill
                className="object-contain"
                sizes="(min-width: 1024px) 60vw, 80vw"
              />
            </div>
          ) : isVideo ? (
            <video
              src={file.url}
              className="max-h-[70vh] w-full rounded-lg bg-black"
              controls
              autoPlay
              playsInline
            />
          ) : (
            <div className="text-center text-zinc-500">
              <p className="text-lg font-semibold">Preview unavailable</p>
              <p className="text-sm mt-2">
                This file type can&apos;t be previewed, but you can download it below.
              </p>
            </div>
          )}
        </div>

        <div className="mt-4 flex flex-col gap-3 border-t border-zinc-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-zinc-500">
            <p>Type: {file.contentType || "Unknown"}</p>
            <p>Uploaded: {new Date(file.createdAt).toLocaleString()}</p>
          </div>
          <div className="flex gap-3">
            <a
              href={file.url}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100"
            >
              Open in new tab
            </a>
            <button
              onClick={onClose}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-500"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


