"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";

type DeleteFolderModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  folderName: string;
  folderId: string;
  childrenCount?: { folders: number; files: number };
};

export function DeleteFolderModal({
  isOpen,
  onClose,
  onConfirm,
  folderName,
  folderId,
  childrenCount,
}: DeleteFolderModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [counts, setCounts] = useState<{ folders: number; files: number } | null>(
    childrenCount || null
  );
  const [loadingCounts, setLoadingCounts] = useState(false);

  // Fetch children count when modal opens
  useEffect(() => {
    if (isOpen && !childrenCount && user) {
      setLoadingCounts(true);
      user
        .getIdToken()
        .then((token) =>
          fetch(`/api/folders?folderId=${encodeURIComponent(folderId)}&count=true`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          })
        )
        .then((res) => res.json())
        .then((data) => {
          if (data.counts) {
            setCounts(data.counts);
          }
        })
        .catch((err) => {
          console.error("Error fetching children count:", err);
        })
        .finally(() => {
          setLoadingCounts(false);
        });
    }
  }, [isOpen, folderId, user, childrenCount]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setLoading(false);
      setCounts(childrenCount || null);
    }
  }, [isOpen, childrenCount]);

  // Close modal on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !loading) {
        onClose();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, loading, onClose]);

  if (!isOpen) return null;

  const hasContents = counts && (counts.folders > 0 || counts.files > 0);
  const totalItems = counts ? counts.folders + counts.files : 0;

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      console.error("Error deleting folder:", error);
      alert(error instanceof Error ? error.message : "Failed to delete folder");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative z-10 w-full max-w-md rounded-2xl border border-zinc-200 bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 text-red-600">
              <span className="text-xl">⚠️</span>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-zinc-900">
                Delete Folder
              </h2>
              <p className="text-xs text-zinc-500">This action cannot be undone</p>
            </div>
          </div>
          {!loading && (
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-600"
            >
              <span className="text-xl">✕</span>
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div>
            <p className="text-sm text-zinc-700">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-zinc-900">{folderName}</span>?
            </p>
          </div>

          {/* Warning about contents */}
          {loadingCounts ? (
            <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
              <p className="text-xs text-zinc-500">Checking folder contents...</p>
            </div>
          ) : hasContents ? (
            <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
              <div className="flex items-start gap-3">
                <span className="text-lg">⚠️</span>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium text-orange-900">
                    This folder contains:
                  </p>
                  <ul className="text-xs text-orange-800 space-y-1">
                    {counts.folders > 0 && (
                      <li>• {counts.folders} {counts.folders === 1 ? "subfolder" : "subfolders"}</li>
                    )}
                    {counts.files > 0 && (
                      <li>• {counts.files} {counts.files === 1 ? "file" : "files"}</li>
                    )}
                  </ul>
                  <p className="text-xs font-medium text-orange-900 mt-2">
                    All {totalItems} {totalItems === 1 ? "item" : "items"} will be moved to trash.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
              <p className="text-xs text-zinc-600">This folder is empty.</p>
            </div>
          )}

          <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
            <p className="text-xs text-zinc-600">
              The folder will be moved to trash and can be restored within 30 days.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 border-t border-zinc-200 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading || loadingCounts}
            className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Deleting..." : "Delete Folder"}
          </button>
        </div>
      </div>
    </div>
  );
}

