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
};

type FolderContextValue = {
  folders: Record<string, Folder>;
  rootId: string;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  createFolder: (input: { name: string; parentId?: string }) => Promise<Folder>;
  deleteFolder: (folderId: string) => Promise<void>;
  getChildren: (parentId: string) => Folder[];
};

const rootFolderId = "root";

const rootFolder: Folder = {
  id: rootFolderId,
  name: "My Drive",
  parentId: null,
  createdAt: 0,
};

const FolderContext = createContext<FolderContextValue | undefined>(undefined);

export function FolderProvider({ children }: PropsWithChildren) {
  const { user } = useAuth();
  const [folders, setFolders] = useState<Record<string, Folder>>({
    [rootFolderId]: rootFolder,
  });
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

  useEffect(() => {
    void refresh();
  }, [refresh]);

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

      // Remove from local state
      setFolders((prev) => {
        const updated = { ...prev };
        delete updated[folderId];
        return updated;
      });
      // Refresh to ensure consistency
      await refresh();
    },
    [folders, user, refresh],
  );

  const getChildren = useCallback(
    (parentId: string) =>
      Object.values(folders)
        .filter((folder) => folder.parentId === parentId)
        .sort((a, b) => a.name.localeCompare(b.name)),
    [folders],
  );

  const value = useMemo(
    () => ({
      folders,
      rootId: rootFolderId,
      loading,
      error,
      refresh,
      createFolder,
      deleteFolder,
      getChildren,
    }),
    [folders, loading, error, refresh, createFolder, deleteFolder, getChildren],
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


