"use client";

import { FormEvent, useMemo, useState, useEffect } from "react";
import { useFolders } from "@/contexts/folder-context";

type CreateFolderModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function CreateFolderModal({ isOpen, onClose }: CreateFolderModalProps) {
  const { createFolder, rootId, folders, getChildren, loading } = useFolders();
  const [name, setName] = useState("");
  const [parentId, setParentId] = useState(rootId);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setName("");
      setParentId(rootId);
      setStatus("idle");
      setMessage(null);
    }
  }, [isOpen, rootId]);

  // Close modal on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  const options = useMemo(() => {
    const ordered: Array<{ id: string; label: string }> = [];
    const rootFolder = folders[rootId];
    if (rootFolder) {
      ordered.push({ id: rootId, label: rootFolder.name });
      const walk = (id: string, depth: number) => {
        const children = getChildren(id);
        children.forEach((child) => {
          ordered.push({
            id: child.id,
            label: `${"— ".repeat(depth + 1)}${child.name}`,
          });
          walk(child.id, depth + 1);
        });
      };
      walk(rootId, 0);
    }
    return ordered;
  }, [folders, getChildren, rootId]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setStatus("idle");
    setMessage(null);
    setSubmitting(true);

    try {
      const folder = await createFolder({ name, parentId });
      setStatus("success");
      setMessage(`Folder "${folder.name}" created successfully!`);
      setName("");
      setParentId(rootId);
      
      // Close modal after a short delay
      setTimeout(() => {
        onClose();
        setMessage(null);
        setStatus("idle");
      }, 1500);
    } catch (err) {
      setStatus("error");
      setMessage(
        err instanceof Error ? err.message : "Unable to create folder right now.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

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
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
              <span className="text-xl">📁</span>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-zinc-900">
                Create New Folder
              </h2>
              <p className="text-xs text-zinc-500">Add a folder to organize your files</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-600"
          >
            <span className="text-xl">✕</span>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">
              Folder Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter folder name"
              className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              autoFocus
              disabled={submitting}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">
              Location
            </label>
            <select
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              disabled={submitting || loading}
            >
              {options.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {message && (
            <div
              className={`rounded-lg border px-4 py-3 text-sm ${
                status === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-red-200 bg-red-50 text-red-700"
              }`}
              role="alert"
            >
              {message}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || submitting || loading}
              className="rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "Creating…" : "Create Folder"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

