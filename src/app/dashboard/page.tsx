"use client";

import Image from "next/image";
import {
  useState,
  useEffect,
  useRef,
  useMemo,
  Suspense,
  useCallback,
  type ChangeEvent,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthGuard } from "@/components/auth/auth-guard";
import { FolderProvider, useFolders } from "@/contexts/folder-context";
import type { Folder as FolderType } from "@/contexts/folder-context";
import { CreateFolderModal } from "@/components/folders/create-folder-modal";
import { DeleteFolderModal } from "@/components/folders/delete-folder-modal";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Header } from "@/components/dashboard/header";
import { FileGrid } from "@/components/dashboard/file-grid";
import { FileList } from "@/components/dashboard/file-list";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { FilePreviewModal } from "@/components/ui/file-preview-modal";
import { FileDetailsModal } from "@/components/ui/file-details-modal";
import { LayoutGrid, List as ListIcon, Folder as FolderIcon, Star, Trash2, ChevronRight } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import type { DriveFile } from "@/types/files";

function DashboardShell() {
  const {
    rootId,
    getChildren,
    loading,
    deleteFolder,
    restoreFolder,
    permanentDeleteFolder,
    folders,
    trashFolders,
    starredFolders,
    refreshTrash,
    toggleStarred,
  } = useFolders();
  const { user } = useAuth();
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentFolderId, setCurrentFolderId] = useState(rootId);
  const currentFolders = getChildren(currentFolderId);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeNav, setActiveNav] = useState("My Drive");
  const [restoringFolderId, setRestoringFolderId] = useState<string | null>(null);
  const [permanentlyDeletingFolderId, setPermanentlyDeletingFolderId] = useState<string | null>(null);
  const [isCreateFolderModalOpen, setIsCreateFolderModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [folderToDelete, setFolderToDelete] = useState<{ id: string; name: string } | null>(null);
  const [folderToDeleteForever, setFolderToDeleteForever] = useState<FolderType | null>(null);
  const [isPermanentModalOpen, setIsPermanentModalOpen] = useState(false);
  const [permanentDeleteLoading, setPermanentDeleteLoading] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [filesLoading, setFilesLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewFile, setPreviewFile] = useState<DriveFile | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [detailsFile, setDetailsFile] = useState<DriveFile | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [deletingFileId, setDeletingFileId] = useState<string | null>(null);
  const isInitialLoad = useRef(true);
  const lastUrlFolderId = useRef<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Load folder from URL on initial mount only
  useEffect(() => {
    if (!loading && Object.keys(folders).length > 0 && isInitialLoad.current) {
      const folderIdFromUrl = searchParams.get("folder");
      lastUrlFolderId.current = folderIdFromUrl;
      
      if (folderIdFromUrl && folders[folderIdFromUrl]) {
        setCurrentFolderId(folderIdFromUrl);
      } else if (folderIdFromUrl && !folders[folderIdFromUrl]) {
        router.replace("/dashboard", { scroll: false });
        setCurrentFolderId(rootId);
      }
      isInitialLoad.current = false;
    }
  }, [loading, folders, searchParams, router, rootId]);

  // Update URL when folder changes
  useEffect(() => {
    if (isInitialLoad.current) return;
    
    const currentUrlFolder = searchParams.get("folder");
    const shouldUpdateUrl = 
      (currentFolderId !== rootId && currentUrlFolder !== currentFolderId) ||
      (currentFolderId === rootId && currentUrlFolder !== null);

    if (shouldUpdateUrl) {
      if (currentFolderId && currentFolderId !== rootId) {
        router.replace(`/dashboard?folder=${currentFolderId}`, { scroll: false });
      } else {
        router.replace("/dashboard", { scroll: false });
      }
    }
  }, [currentFolderId, rootId, router, searchParams]);

  const fetchFiles = useCallback(async () => {
    if (!user || activeNav !== "My Drive") {
      setFiles([]);
      setFilesLoading(false);
      return;
    }
    setFilesLoading(true);
    try {
      const token = await user.getIdToken();
      const response = await fetch(
        `/api/files?folderId=${encodeURIComponent(currentFolderId)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error ?? "Unable to load files.");
      }
      const data = await response.json();
      setFiles((data.files as DriveFile[]) ?? []);
    } catch (error) {
      console.error("Failed to fetch files:", error);
      setFiles([]);
    } finally {
      setFilesLoading(false);
    }
  }, [user, activeNav, currentFolderId]);

  useEffect(() => {
    void fetchFiles();
  }, [fetchFiles]);

  const getBreadcrumbs = () => {
    const breadcrumbs: Array<{ id: string; name: string }> = [];
    let currentId: string | null = currentFolderId;
    
    while (currentId && currentId !== rootId) {
      const folderId: string = currentId;
      const folder = folders[folderId] as FolderType | undefined;
      if (folder) {
        breadcrumbs.unshift({ id: folder.id, name: folder.name });
        currentId = folder.parentId;
      } else {
        break;
      }
    }
    
    breadcrumbs.unshift({ id: rootId, name: "My Drive" });
    return breadcrumbs;
  };

  const decodeFileName = useCallback((ciphertext: string) => {
    if (!ciphertext) {
      return "Encrypted file";
    }
    try {
      return atob(ciphertext);
    } catch {
      return "Encrypted file";
    }
  }, []);

  const formatFileSize = useCallback((bytes: number) => {
    if (!Number.isFinite(bytes)) {
      return "—";
    }
    if (bytes === 0) {
      return "0 B";
    }
    const units = ["B", "KB", "MB", "GB", "TB"];
    const exponent = Math.min(
      Math.floor(Math.log(bytes) / Math.log(1024)),
      units.length - 1,
    );
    const value = bytes / Math.pow(1024, exponent);
    return `${value.toFixed(exponent === 0 ? 0 : 1)} ${units[exponent]}`;
  }, []);

  const formatFileDate = useCallback((timestamp: number) => {
    if (!timestamp) {
      return "—";
    }
    return new Date(timestamp).toLocaleString();
  }, []);

  const isMyDrive = activeNav === "My Drive";
  const isTrash = activeNav === "Trash";
  const isStarredView = activeNav === "Starred";
  const displayedFolders = isStarredView ? starredFolders : currentFolders;
  const normalizedSearch = searchQuery.trim().toLowerCase();
  const hasSearchQuery = normalizedSearch.length > 0;

  const allVisibleFolders = useMemo(
    () =>
      Object.values(folders)
        .filter(
          (folder) =>
            folder.id !== rootId &&
            !folder.deletedAt &&
            folder.parentId !== null
        )
        .sort((a, b) => a.name.localeCompare(b.name)),
    [folders, rootId]
  );

  const filteredTrashFolders = hasSearchQuery
    ? trashFolders.filter((folder) =>
        folder.name.toLowerCase().includes(normalizedSearch),
      )
    : trashFolders;

  const searchResults = useMemo(() => {
    if (!hasSearchQuery) return [];
    const baseCollection = isTrash
      ? filteredTrashFolders
      : isStarredView
        ? starredFolders
        : allVisibleFolders;
    return baseCollection.filter((folder) =>
      folder.name.toLowerCase().includes(normalizedSearch),
    );
  }, [
    hasSearchQuery,
    normalizedSearch,
    isTrash,
    isStarredView,
    filteredTrashFolders,
    starredFolders,
    allVisibleFolders,
  ]);

  const shouldShowSearchResults = hasSearchQuery && !isTrash;
  const foldersToRender = shouldShowSearchResults ? searchResults : displayedFolders;

  const filesToRender = useMemo(() => {
    if (!isMyDrive) {
      return [] as DriveFile[];
    }
    if (!hasSearchQuery) {
      return files;
    }
    return files.filter((file) =>
      decodeFileName(file.nameCiphertext)
        .toLowerCase()
        .includes(normalizedSearch),
    );
  }, [files, isMyDrive, hasSearchQuery, normalizedSearch, decodeFileName]);

  const shouldUseCombinedView = isMyDrive && !isTrash;
  const hasCombinedItems = shouldUseCombinedView
    ? foldersToRender.length + filesToRender.length > 0
    : foldersToRender.length > 0;
  const showFilesSpinner =
    shouldUseCombinedView &&
    filesLoading &&
    foldersToRender.length === 0 &&
    filesToRender.length === 0;
  const showBreadcrumbs = isMyDrive && currentFolderId !== rootId;

  const handleFolderClick = (folderId: string) => {
    if (!isMyDrive) {
      setActiveNav("My Drive");
    }
    setCurrentFolderId(folderId);
  };

  const handleFileClick = (file: DriveFile) => {
    if (file.contentType.startsWith("image/") || file.contentType.startsWith("video/")) {
      setPreviewFile(file);
      setIsPreviewOpen(true);
      return;
    }
    if (typeof window !== "undefined") {
      window.open(file.url, "_blank", "noopener,noreferrer");
    }
  };

  const handleShowDetails = (file: DriveFile) => {
    setDetailsFile(file);
    setIsDetailsOpen(true);
  };

  const closeDetails = () => {
    setIsDetailsOpen(false);
    setDetailsFile(null);
  };

  const handleDeleteFile = async (file: DriveFile) => {
    if (!user) return;
    const confirmed =
      typeof window === "undefined" ? true : window.confirm("Delete this file permanently?");
    if (!confirmed) {
      return;
    }
    try {
      setDeletingFileId(file.id);
      const token = await user.getIdToken();
      const response = await fetch(`/api/files?fileId=${encodeURIComponent(file.id)}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to delete file.");
      }
      await fetchFiles();
    } catch (error) {
      console.error("Delete file failed:", error);
      alert(error instanceof Error ? error.message : "Failed to delete file.");
    } finally {
      setDeletingFileId(null);
    }
  };

  const handleUploadClick = () => {
    if (activeNav !== "My Drive") {
      setActiveNav("My Drive");
      return;
    }
    fileInputRef.current?.click();
  };

  const handleFileInputChange = async (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    if (!user) {
      event.target.value = "";
      return;
    }
    if (activeNav !== "My Drive") {
      event.target.value = "";
      return;
    }
    const selectedFiles = event.target.files
      ? Array.from(event.target.files)
      : [];
    if (selectedFiles.length === 0) {
      return;
    }
    setUploading(true);
    try {
      const token = await user.getIdToken();
      for (const file of selectedFiles) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("folderId", currentFolderId);
        const response = await fetch("/api/files", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });
        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(
            data.error ?? `Failed to upload "${file.name}".`,
          );
        }
      }
      await fetchFiles();
    } catch (error) {
      console.error("Upload failed:", error);
      alert(error instanceof Error ? error.message : "Failed to upload file.");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const handleDeleteClick = (folder: FolderType) => {
    setFolderToDelete({ id: folder.id, name: folder.name });
      setIsDeleteModalOpen(true);
  };

  const handleRestoreClick = async (folderId: string) => {
    try {
      setRestoringFolderId(folderId);
      await restoreFolder(folderId);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to restore folder");
    } finally {
      setRestoringFolderId(null);
    }
  };

  const handleDeleteFolder = async () => {
    if (!folderToDelete) return;
    
    const folderId = folderToDelete.id;
    const folder = folders[folderId];
    const parentId = folder?.parentId || rootId;
    const isCurrentFolder = folderId === currentFolderId;
    
    try {
      await deleteFolder(folderId);
      setIsDeleteModalOpen(false);
      setFolderToDelete(null);
      
      if (isCurrentFolder) {
        setCurrentFolderId(parentId);
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to delete folder");
    }
  };

  const openPermanentDeleteModal = (folder: FolderType) => {
    setFolderToDeleteForever(folder);
    setIsPermanentModalOpen(true);
  };

  const handlePermanentDelete = async () => {
    if (!folderToDeleteForever) return;
    const folderId = folderToDeleteForever.id;
    setPermanentDeleteLoading(true);
    setPermanentlyDeletingFolderId(folderId);
    try {
      await permanentDeleteFolder(folderId);
      setIsPermanentModalOpen(false);
      setFolderToDeleteForever(null);
      await refreshTrash();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to permanently delete folder");
    } finally {
      setPermanentDeleteLoading(false);
      setPermanentlyDeletingFolderId(null);
    }
  };

  const closePreview = () => {
    if (isPreviewOpen) {
      setIsPreviewOpen(false);
    }
    setPreviewFile(null);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-white">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        activeNav={activeNav}
        onNavChange={setActiveNav}
        onNewFolder={() => setIsCreateFolderModalOpen(true)}
      />

      <div className="flex flex-1 flex-col min-w-0">
        <Header
          onSidebarOpen={() => setSidebarOpen(true)}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        <main className="flex-1 overflow-y-auto bg-white">
          <div className="mx-auto w-full max-w-[1200px] p-4 lg:p-6">
            {/* Breadcrumbs */}
            {showBreadcrumbs && (
              <div className="mb-4 flex items-center gap-2 text-sm text-zinc-500 overflow-x-auto">
                {getBreadcrumbs().map((crumb, index) => (
                  <div key={crumb.id} className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleFolderClick(crumb.id)}
                      className={`hover:bg-zinc-100 rounded px-1.5 py-0.5 transition-colors ${
                        index === getBreadcrumbs().length - 1
                          ? "font-medium text-zinc-900 pointer-events-none"
                          : "hover:text-zinc-800"
                      }`}
                    >
                      {crumb.name}
                    </button>
                    {index < getBreadcrumbs().length - 1 && (
                      <ChevronRight className="h-4 w-4 text-zinc-400" />
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* View Header */}
            <div className="mb-6 flex items-center justify-between gap-3 flex-wrap">
              <h2 className="text-xl font-medium text-zinc-800">
                {activeNav === "Trash"
                  ? "Trash"
                  : activeNav === "Starred"
                    ? "Starred"
                    : currentFolderId === rootId
                      ? "My Drive"
                      : folders[currentFolderId]?.name || "Folder"}
              </h2>

              {!isTrash && (
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <button
                      onClick={handleUploadClick}
                      disabled={uploading || activeNav !== "My Drive"}
                      className={`rounded-lg border border-emerald-200 px-4 py-2 text-sm font-medium transition ${
                        uploading || activeNav !== "My Drive"
                          ? "cursor-not-allowed bg-zinc-100 text-zinc-400"
                          : "bg-emerald-600 text-white hover:bg-emerald-500"
                      }`}
                    >
                      {uploading ? "Uploading..." : "Upload file"}
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      onChange={handleFileInputChange}
                      className="hidden"
                    />
                  </div>
                  <div className="flex items-center gap-2 rounded-lg border border-zinc-200 p-1">
                    <button
                      onClick={() => setViewMode("list")}
                      className={`rounded p-1.5 transition-colors ${
                        viewMode === "list"
                          ? "bg-zinc-100 text-zinc-900"
                          : "text-zinc-500 hover:bg-zinc-50"
                      }`}
                      title="List view"
                    >
                      <ListIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => setViewMode("grid")}
                      className={`rounded p-1.5 transition-colors ${
                        viewMode === "grid"
                          ? "bg-zinc-100 text-zinc-900"
                          : "text-zinc-500 hover:bg-zinc-50"
                      }`}
                      title="Grid view"
                    >
                      <LayoutGrid className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Content */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
              </div>
            ) : isTrash ? (
              /* Trash View Custom Implementation */
               <div className="space-y-1">
                 {filteredTrashFolders.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                      <div className="mb-4 rounded-full bg-zinc-100 p-4">
                        <Trash2 className="h-8 w-8 text-zinc-400" />
                      </div>
                      <h3 className="text-lg font-medium text-zinc-900">Trash is empty</h3>
                      <p className="text-sm text-zinc-500 mt-1">Items moved to trash will appear here</p>
                    </div>
                 ) : (
                    <div className="rounded-lg border border-zinc-200">
                      <div className="bg-zinc-50 px-4 py-3 border-b border-zinc-200">
                  <p className="text-sm text-zinc-600">
                          Items in trash are deleted forever after 30 days
                  </p>
                </div>
                <div className="divide-y divide-zinc-100">
                        {filteredTrashFolders.map((folder) => (
                          <div key={folder.id} className="flex items-center justify-between px-4 py-3 hover:bg-zinc-50 transition-colors group">
                             <div className="flex items-center gap-3">
                               <div className="p-2 bg-zinc-100 rounded text-zinc-500">
                                 <FolderIcon className="h-5 w-5" />
                          </div>
                               <div>
                                 <p className="text-sm font-medium text-zinc-900">{folder.name}</p>
                            <p className="text-xs text-zinc-500">
                                   Deleted {new Date(folder.deletedAt || 0).toLocaleDateString()}
                            </p>
                          </div>
                             </div>
                             <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                                 onClick={() => void handleRestoreClick(folder.id)}
                              disabled={restoringFolderId === folder.id}
                                 className="text-xs font-medium text-emerald-600 hover:text-emerald-700 px-3 py-1.5 hover:bg-emerald-50 rounded-md transition-colors"
                            >
                              {restoringFolderId === folder.id ? "Restoring..." : "Restore"}
                            </button>
                              <button
                                onClick={() => openPermanentDeleteModal(folder)}
                                disabled={permanentlyDeletingFolderId === folder.id}
                                 className="text-xs font-medium text-red-600 hover:text-red-700 px-3 py-1.5 hover:bg-red-50 rounded-md transition-colors"
                              >
                                {permanentlyDeletingFolderId === folder.id ? "Deleting..." : "Delete Forever"}
                              </button>
                             </div>
                          </div>
                        ))}
                        </div>
                    </div>
                  )}
              </div>
            ) : shouldUseCombinedView ? (
              hasCombinedItems ? (
                viewMode === "grid" ? (
                  <FileGrid
                    folders={foldersToRender}
                    files={filesToRender}
                    onFolderClick={handleFolderClick}
                    onFileClick={handleFileClick}
                    onFileDetails={handleShowDetails}
                    onFileDelete={handleDeleteFile}
                    onToggleStar={(id, star) => toggleStarred(id, star)}
                    onDelete={handleDeleteClick}
                    getFileName={(file) => decodeFileName(file.nameCiphertext)}
                    deletingFileId={deletingFileId}
                  />
                ) : (
                  <FileList
                    folders={foldersToRender}
                    files={filesToRender}
                    onFolderClick={handleFolderClick}
                    onFileClick={handleFileClick}
                    onFileDetails={handleShowDetails}
                    onFileDelete={handleDeleteFile}
                    onToggleStar={(id, star) => toggleStarred(id, star)}
                    onDelete={handleDeleteClick}
                    getFileName={(file) => decodeFileName(file.nameCiphertext)}
                    formatFileDate={formatFileDate}
                    formatFileSize={formatFileSize}
                    deletingFileId={deletingFileId}
                  />
                )
              ) : showFilesSpinner ? (
                <div className="flex items-center justify-center py-12">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                  {hasSearchQuery ? (
                    <>
                      <div className="mb-4 rounded-full bg-zinc-100 p-4">
                        <span className="text-3xl">🔍</span>
                      </div>
                      <p className="text-lg font-medium text-zinc-900">No results found</p>
                      <p className="text-zinc-500">Try different keywords</p>
                    </>
                  ) : (
                    <>
                      <div className="mb-6 relative">
                        <div className="absolute -inset-4 bg-emerald-100/50 rounded-full blur-xl" />
                        <Image
                          src="/file.svg"
                          alt="Empty"
                          width={120}
                          height={120}
                          className="relative opacity-50"
                        />
                      </div>
                      <h3 className="text-lg font-medium text-zinc-900">No folders or files here yet</h3>
                      <p className="text-sm text-zinc-500 mt-1 max-w-sm mx-auto">
                        Use the New or Upload buttons to add content to this folder.
                      </p>
                    </>
                  )}
                </div>
              )
            ) : (
              foldersToRender.length > 0 ? (
                viewMode === "grid" ? (
                  <FileGrid
                    folders={foldersToRender}
                    onFolderClick={handleFolderClick}
                    onToggleStar={(id, star) => toggleStarred(id, star)}
                    onDelete={handleDeleteClick}
                  />
                ) : (
                  <FileList
                    folders={foldersToRender}
                    onFolderClick={handleFolderClick}
                    onFileDetails={handleShowDetails}
                    onFileDelete={handleDeleteFile}
                    onToggleStar={(id, star) => toggleStarred(id, star)}
                    onDelete={handleDeleteClick}
                  />
                )
              ) : (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                  {hasSearchQuery ? (
                    <>
                      <div className="mb-4 rounded-full bg-zinc-100 p-4">
                        <span className="text-3xl">🔍</span>
                      </div>
                      <p className="text-lg font-medium text-zinc-900">No results found</p>
                      <p className="text-zinc-500">Try different keywords</p>
                    </>
                  ) : isStarredView ? (
                    <>
                      <div className="mb-4 rounded-full bg-amber-50 p-4">
                        <Star className="h-8 w-8 text-amber-400 fill-amber-400" />
                      </div>
                      <p className="text-lg font-medium text-zinc-900">No starred folders</p>
                      <p className="text-zinc-500">Add folders to starred for quick access</p>
                    </>
                  ) : (
                    <>
                      <div className="mb-6 relative">
                        <div className="absolute -inset-4 bg-emerald-100/50 rounded-full blur-xl" />
                        <Image
                          src="/file.svg"
                          alt="Empty"
                          width={120}
                          height={120}
                          className="relative opacity-50"
                        />
                      </div>
                      <h3 className="text-lg font-medium text-zinc-900">This section is empty</h3>
                      <p className="text-sm text-zinc-500 mt-1 max-w-sm mx-auto">
                        Use the New button to create folders and organize your files.
                      </p>
                    </>
                  )}
                </div>
              )
            )}

          </div>
        </main>
        </div>

      {/* Modals */}
      <CreateFolderModal
        isOpen={isCreateFolderModalOpen}
        onClose={() => setIsCreateFolderModalOpen(false)}
        defaultParentId={currentFolderId}
      />

      {folderToDelete && (
        <DeleteFolderModal
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setFolderToDelete(null);
          }}
          onConfirm={handleDeleteFolder}
          folderName={folderToDelete.name}
          folderId={folderToDelete.id}
        />
      )}

      <ConfirmModal
        isOpen={isPermanentModalOpen}
        onClose={() => {
          if (permanentDeleteLoading) return;
          setIsPermanentModalOpen(false);
          setFolderToDeleteForever(null);
        }}
        onConfirm={handlePermanentDelete}
        title="Delete forever?"
        description={`${folderToDeleteForever?.name ?? "This folder"} and all of its contents will be permanently removed.`}
        confirmLabel="Delete Forever"
        destructive
        loading={permanentDeleteLoading}
      />
      <FilePreviewModal
        isOpen={isPreviewOpen && !!previewFile}
        file={previewFile}
        onClose={closePreview}
      />
      <FileDetailsModal
        isOpen={isDetailsOpen && !!detailsFile}
        file={detailsFile}
        onClose={closeDetails}
        decodeFileName={decodeFileName}
        formatFileSize={formatFileSize}
        formatFileDate={formatFileDate}
      />
    </div>
  );
}

function DashboardPageContent() {
  return (
    <main className="h-screen overflow-hidden">
      <AuthGuard>
        <FolderProvider>
          <DashboardShell />
        </FolderProvider>
      </AuthGuard>
    </main>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center bg-white">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
      </div>
    }>
      <DashboardPageContent />
    </Suspense>
  );
}
