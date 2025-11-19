"use client";

import type { DriveFile } from "@/types/files";
import { X } from "lucide-react";

interface FileDetailsModalProps {
  isOpen: boolean;
  file: DriveFile | null;
  onClose: () => void;
  decodeFileName: (ciphertext: string) => string;
  formatFileSize: (bytes: number) => string;
  formatFileDate: (timestamp: number) => string;
}

const metadataFields: Array<{
  label: string;
  accessor: (file: DriveFile) => string | number;
  copy?: boolean;
}> = [
  { label: "Content type", accessor: (file) => file.contentType || "Unknown" },
  { label: "Size", accessor: (file) => file.size },
  { label: "Checksum", accessor: (file) => file.checksum },
  { label: "Storage key", accessor: (file) => file.storageKey },
  { label: "IV", accessor: (file) => file.iv || "—" },
  { label: "Key envelope", accessor: (file) => file.keyEnvelope || "—" },
  { label: "Uploaded", accessor: (file) => file.createdAt },
  { label: "Updated", accessor: (file) => file.updatedAt },
];

export function FileDetailsModal({
  isOpen,
  file,
  onClose,
  decodeFileName,
  formatFileSize,
  formatFileDate,
}: FileDetailsModalProps) {
  if (!isOpen || !file) {
    return null;
  }

  const friendlyName = decodeFileName(file.nameCiphertext);

  const renderValue = (label: string, value: string | number) => {
    if (label === "Size" && typeof value === "number") {
      return formatFileSize(value);
    }
    if ((label === "Uploaded" || label === "Updated") && typeof value === "number") {
      return formatFileDate(value);
    }
    return value || "—";
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4">
      <button
        className="absolute inset-0 h-full w-full cursor-default focus:outline-none"
        onClick={onClose}
        aria-label="Close details backdrop"
      />
      <div className="relative z-10 w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4">
          <div>
            <p className="text-sm text-zinc-500">File details</p>
            <h2 className="text-lg font-semibold text-zinc-900 truncate" title={friendlyName}>
              {friendlyName}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-800"
            aria-label="Close details"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto px-6 py-5">
          <dl className="space-y-4">
            {metadataFields.map(({ label, accessor }) => (
              <div key={label} className="rounded-lg border border-zinc-200 px-4 py-3">
                <dt className="text-xs uppercase tracking-wide text-zinc-500">{label}</dt>
                <dd className="mt-1 break-words text-sm font-medium text-zinc-900">
                  {renderValue(label, accessor(file))}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="flex justify-end border-t border-zinc-200 px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-500"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}


