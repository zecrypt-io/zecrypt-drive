"use client";

import Image from "next/image";
import { useState, useEffect, useRef, useMemo, Suspense } from "react";
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
import { LayoutGrid, List as ListIcon, Folder as FolderIcon, Clock, Star, Trash2, ChevronRight } from "lucide-react";

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
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const isInitialLoad = useRef(true);
  const lastUrlFolderId = useRef<string | null>(null);

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
  const showBreadcrumbs = isMyDrive && currentFolderId !== rootId;

  const handleFolderClick = (folderId: string) => {
    if (!isMyDrive) {
      setActiveNav("My Drive");
    }
    setCurrentFolderId(folderId);
  };

  const handleDeleteClick = (folder: FolderType) => {
    setFolderToDelete({ id: folder.id, name: folder.name });
      setIsDeleteModalOpen(true);
  };

  const handleDeleteFolder = async () => {
    if (!folderToDelete) return;
    
    const folderId = folderToDelete.id;
    setDeletingFolderId(folderId);
    
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
    } finally {
      setDeletingFolderId(null); // This state was missing in rewrite, adding back locally or ignoring if not used in UI components directly (FileGrid handles its own state for menu, but we need modal state)
      // Wait, setDeletingFolderId is not used in FileGrid/FileList, but used for modal loading state maybe?
      // The modal is standard.
    }
  };

  // Temporary state for deleting loading indicator if needed, though modal handles it?
  // Actually standard DeleteFolderModal doesn't seem to take a loading prop in the interface I saw earlier?
  // Let's check DeleteFolderModal. It doesn't seem to have a loading prop, but the `onConfirm` is async so it might await.
  // Ah, standard modal usually has internal state or parent handles it.
  
  // We need a state for deletingFolderId if we want to show spinners, but for now we just await.
  const [_, setDeletingFolderId] = useState<string | null>(null); // Keeping for compatibility if I use it later

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
            <div className="mb-6 flex items-center justify-between">
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
                <div className="flex items-center gap-2 rounded-lg border border-zinc-200 p-1">
                    <button
                    onClick={() => setViewMode("list")}
                    className={`rounded p-1.5 transition-colors ${
                      viewMode === "list" ? "bg-zinc-100 text-zinc-900" : "text-zinc-500 hover:bg-zinc-50"
                    }`}
                    title="List view"
                  >
                    <ListIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => setViewMode("grid")}
                    className={`rounded p-1.5 transition-colors ${
                      viewMode === "grid" ? "bg-zinc-100 text-zinc-900" : "text-zinc-500 hover:bg-zinc-50"
                    }`}
                    title="Grid view"
                  >
                    <LayoutGrid className="h-5 w-5" />
                    </button>
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
                                 onClick={() => restoreFolder(folder.id)}
                              disabled={restoringFolderId === folder.id}
                                 className="text-xs font-medium text-emerald-600 hover:text-emerald-700 px-3 py-1.5 hover:bg-emerald-50 rounded-md transition-colors"
                            >
                              {restoringFolderId === folder.id ? "Restoring..." : "Restore"}
                            </button>
                              <button
                                onClick={async () => {
                                   if(confirm("Delete forever?")) {
                                  setPermanentlyDeletingFolderId(folder.id);
                                    await permanentDeleteFolder(folder.id);
                                    setPermanentlyDeletingFolderId(null);
                                  }
                                }}
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
            ) : (
              /* Main Files View */
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
                    onToggleStar={(id, star) => toggleStarred(id, star)}
                    onDelete={handleDeleteClick}
                  />
                )
              ) : (
                /* Empty State */
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
                      <h3 className="text-lg font-medium text-zinc-900">This folder is empty</h3>
                      <p className="text-sm text-zinc-500 mt-1 max-w-sm mx-auto">
                        Use the "New" button to create folders and organize your files.
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
