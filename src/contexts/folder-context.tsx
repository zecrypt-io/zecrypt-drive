"use client";

import {
  PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useEffect,
} from "react";
import { useAuth } from "@/contexts/auth-context";

export type Folder = {
  id: string;
  name: string;
  parentId: string | null;
  createdAt: number;
  userId?: string;
  deletedAt?: number;
  isStarred?: boolean;
};

type FolderContextValue = {
  folders: Record<string, Folder>;
  trashFolders: Folder[];
  starredFolders: Folder[];
  rootId: string;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  refreshTrash: () => Promise<void>;
  createFolder: (input: { name: string; parentId?: string }) => Promise<Folder>;
  deleteFolder: (folderId: string) => Promise<void>;
  restoreFolder: (folderId: string) => Promise<void>;
  permanentDeleteFolder: (folderId: string) => Promise<void>;
  toggleStarred: (folderId: string, isStarred: boolean) => Promise<void>;
  getChildren: (parentId: string) => Folder[];
};

const rootFolderId = "root";

const rootFolder: Folder = {
  id: rootFolderId,
  name: "My Drive",
  parentId: null,
  createdAt: 0,
  isStarred: false,
};

const FolderContext = createContext<FolderContextValue | undefined>(undefined);

export function FolderProvider({ children }: PropsWithChildren) {
  const { user } = useAuth();
  const [folders, setFolders] = useState<Record<string, Folder>>({
    [rootFolderId]: rootFolder,
  });
  const [trashFolders, setTrashFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user) {
      setFolders({ [rootFolderId]: rootFolder });
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const token = await user.getIdToken();
      const response = await fetch("/api/folders", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error("Unable to load folders.");
      }
      const data = await response.json();
      const map: Record<string, Folder> = { [rootFolderId]: rootFolder };
      (data.folders as Folder[]).forEach((folder) => {
        map[folder.id] = folder;
      });
      setFolders(map);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load folders.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  const refreshTrash = useCallback(async () => {
    if (!user) {
      setTrashFolders([]);
      return;
    }
    try {
      const token = await user.getIdToken();
      const response = await fetch("/api/folders?trash=true", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error("Unable to load trash.");
      }
      const data = await response.json();
      setTrashFolders(data.folders as Folder[]);
    } catch (err) {
      console.error("Error loading trash:", err);
      setTrashFolders([]);
    }
  }, [user]);

  useEffect(() => {
    void refresh();
    void refreshTrash();
  }, [refresh, refreshTrash]);

  const createFolder = useCallback(
    async ({ name, parentId = rootFolderId }: { name: string; parentId?: string }) => {
      const trimmedName = name.trim();
      if (!trimmedName) {
        throw new Error("Folder name is required.");
      }
      if (!folders[parentId]) {
        throw new Error("Parent folder does not exist.");
      }
      if (!user) {
        throw new Error("You must be signed in.");
      }

      const token = await user.getIdToken();
      const response = await fetch("/api/folders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: trimmedName, parentId }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error ?? "Unable to create folder.");
      }

      const data = await response.json();
      const folder = data.folder as Folder;
      setFolders((prev) => ({
        ...prev,
        [folder.id]: folder,
      }));
      // Refresh to ensure consistency
      await refresh();
      return folder;
    },
    [folders, user, refresh],
  );

  const deleteFolder = useCallback(
    async (folderId: string) => {
      if (folderId === rootFolderId) {
        throw new Error("Cannot delete root folder.");
      }
      if (!folders[folderId]) {
        throw new Error("Folder not found.");
      }
      if (!user) {
        throw new Error("You must be signed in.");
      }

      const token = await user.getIdToken();
      const response = await fetch(`/api/folders?id=${encodeURIComponent(folderId)}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error ?? "Unable to delete folder.");
      }

      // Update folder to mark as deleted (soft delete)
      setFolders((prev) => {
        const updated = { ...prev };
        if (updated[folderId]) {
          updated[folderId] = { ...updated[folderId], deletedAt: Date.now() };
        }
        return updated;
      });
      // Refresh to ensure consistency
      await refresh();
      await refreshTrash();
    },
    [folders, user, refresh, refreshTrash],
  );

  const findFolderLocally = useCallback(
    (folderId: string) =>
      folders[folderId] ?? trashFolders.find((folder) => folder.id === folderId),
    [folders, trashFolders],
  );

  const restoreFolder = useCallback(
    async (folderId: string) => {
      const folder = findFolderLocally(folderId);
      if (!folder) {
        throw new Error("Folder not found.");
      }
      if (!user) {
        throw new Error("You must be signed in.");
      }

      const token = await user.getIdToken();
      const response = await fetch("/api/folders", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ folderId, action: "restore" }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error ?? "Unable to restore folder.");
      }

      // Remove deletedAt from local state
      setFolders((prev) => {
        const updated = { ...prev };
        if (updated[folderId]) {
          const refreshed = { ...updated[folderId] };
          delete refreshed.deletedAt;
          updated[folderId] = refreshed;
        }
        return updated;
      });
      // Refresh to ensure consistency
      await Promise.all([refresh(), refreshTrash()]);
    },
    [findFolderLocally, user, refresh, refreshTrash],
  );

  const permanentDeleteFolder = useCallback(
    async (folderId: string) => {
      const folder = findFolderLocally(folderId);
      if (!folder) {
        throw new Error("Folder not found.");
      }
      if (!user) {
        throw new Error("You must be signed in.");
      }

      const token = await user.getIdToken();
      const response = await fetch(
        `/api/folders?id=${encodeURIComponent(folderId)}&permanent=true`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error ?? "Unable to permanently delete folder.");
      }

      // Remove from local state
      setFolders((prev) => {
        const updated = { ...prev };
        delete updated[folderId];
        return updated;
      });
      // Refresh to ensure consistency
      await refreshTrash();
    },
    [findFolderLocally, user, refreshTrash],
  );

  const getChildren = useCallback(
    (parentId: string) =>
      Object.values(folders)
        .filter((folder) => folder.parentId === parentId && !folder.deletedAt)
        .sort((a, b) => a.name.localeCompare(b.name)),
    [folders],
  );

  const starredFolders = useMemo(
    () =>
      Object.values(folders)
        .filter(
          (folder) =>
            folder.isStarred &&
            !folder.deletedAt &&
            folder.id !== rootFolderId,
        )
        .sort((a, b) => a.name.localeCompare(b.name)),
    [folders],
  );

  const toggleStarred = useCallback(
    async (folderId: string, isStarred: boolean) => {
      const folder = folders[folderId];
      if (!folder) {
        throw new Error("Folder not found.");
      }
      if (!user) {
        throw new Error("You must be signed in.");
      }

      const token = await user.getIdToken();
      const response = await fetch("/api/folders", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ folderId, action: "star", isStarred }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error ?? "Unable to update favorite.");
      }

      setFolders((prev) => ({
        ...prev,
        [folderId]: { ...prev[folderId], isStarred },
      }));
    },
    [folders, user],
  );

  const value = useMemo(
    () => ({
      folders,
      trashFolders,
      starredFolders,
      rootId: rootFolderId,
      loading,
      error,
      refresh,
      refreshTrash,
      createFolder,
      deleteFolder,
      restoreFolder,
      permanentDeleteFolder,
      toggleStarred,
      getChildren,
    }),
    [
      folders,
      trashFolders,
      starredFolders,
      loading,
      error,
      refresh,
      refreshTrash,
      createFolder,
      deleteFolder,
      restoreFolder,
      permanentDeleteFolder,
      toggleStarred,
      getChildren,
    ],
  );

  return (
    <FolderContext.Provider value={value}>{children}</FolderContext.Provider>
  );
}

export function useFolders() {
  const context = useContext(FolderContext);
  if (!context) {
    throw new Error("useFolders must be used within a FolderProvider");
  }
  return context;
}


