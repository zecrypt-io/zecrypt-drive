"use client";

import { FormEvent, useMemo, useState } from "react";
import { useFolders } from "@/contexts/folder-context";

export function NewFolderCard() {
  const { createFolder, rootId, folders, getChildren, loading } = useFolders();
  const [name, setName] = useState("");
  const [parentId, setParentId] = useState(rootId);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

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
      setMessage(`Folder "${folder.name}" created.`);
      setName("");
      setParentId(parentId);
      setIsExpanded(false);
      setTimeout(() => {
        setMessage(null);
        setStatus("idle");
      }, 2000);
    } catch (err) {
      setStatus("error");
      setMessage(
        err instanceof Error ? err.message : "Unable to create folder right now.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className="group flex min-h-[80px] cursor-pointer items-center gap-3 rounded-xl border-2 border-dashed border-zinc-300 p-3 transition active:scale-[0.98] active:border-emerald-400 active:bg-emerald-50/30 lg:p-4"
      >
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-400 group-active:bg-emerald-100 group-active:text-emerald-600">
          <span className="text-2xl">+</span>
        </div>
        <div className="flex-1 text-left">
          <p className="text-sm font-medium text-zinc-700 group-active:text-emerald-700">
            New Folder
          </p>
          <p className="text-xs text-zinc-500">Create a new folder</p>
        </div>
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="group flex flex-col gap-3 rounded-xl border border-emerald-200 bg-emerald-50/50 p-3 lg:p-4"
    >
      <div className="flex items-center gap-2 lg:gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 lg:h-12 lg:w-12">
          <span className="text-xl lg:text-2xl">📁</span>
        </div>
        <div className="flex-1 min-w-0">
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Folder name"
            className="w-full rounded-lg border border-emerald-200 bg-white px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none"
            autoFocus
          />
        </div>
        <button
          type="button"
          onClick={() => {
            setIsExpanded(false);
            setName("");
            setMessage(null);
            setStatus("idle");
          }}
          className="shrink-0 rounded-lg px-3 py-2 text-xs font-medium text-zinc-600 active:bg-white active:text-zinc-800"
        >
          Cancel
        </button>
      </div>
      <label className="text-xs font-medium text-zinc-600">
        Parent folder
        <select
          value={parentId}
          onChange={(event) => setParentId(event.target.value)}
          className="mt-1 w-full rounded-lg border border-emerald-200 bg-white px-3 py-2.5 text-xs focus:border-emerald-500 focus:outline-none"
        >
          {options.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <button
        type="submit"
        className="rounded-lg bg-emerald-600 px-4 py-3 text-xs font-semibold text-white transition active:scale-[0.98] active:bg-emerald-700 disabled:opacity-50"
        disabled={!name.trim() || submitting || loading}
      >
        {submitting ? "Creating…" : "Create Folder"}
      </button>
      {message && (
        <p
          className={`text-xs ${
            status === "success" ? "text-emerald-600" : "text-red-600"
          }`}
          role="status"
        >
          {message}
        </p>
      )}
    </form>
  );
}
