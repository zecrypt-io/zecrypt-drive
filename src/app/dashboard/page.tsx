"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthGuard } from "@/components/auth/auth-guard";
import { AuthButtons } from "@/components/auth/auth-buttons";
import { FolderProvider, useFolders } from "@/contexts/folder-context";
import { FolderTree } from "@/components/folders/folder-tree";
import { CreateFolderModal } from "@/components/folders/create-folder-modal";
import { DeleteFolderModal } from "@/components/folders/delete-folder-modal";
import { useAuth } from "@/contexts/auth-context";

const navItems = [
  { label: "My Drive", icon: "📁", active: true },
  { label: "Recent", icon: "🕘" },
  { label: "Starred", icon: "⭐" },
  { label: "Trash", icon: "🗑️" },
];

function DashboardShell() {
  const { rootId, getChildren, loading, deleteFolder, restoreFolder, permanentDeleteFolder, folders, trashFolders, refreshTrash } = useFolders();
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentFolderId, setCurrentFolderId] = useState(rootId);
  const currentFolders = getChildren(currentFolderId);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeNav, setActiveNav] = useState("My Drive");
  const [restoringFolderId, setRestoringFolderId] = useState<string | null>(null);
  const [permanentlyDeletingFolderId, setPermanentlyDeletingFolderId] = useState<string | null>(null);
  const [deletingFolderId, setDeletingFolderId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [isCreateFolderModalOpen, setIsCreateFolderModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [folderToDelete, setFolderToDelete] = useState<{ id: string; name: string } | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const isInitialLoad = useRef(true);
  const lastUrlFolderId = useRef<string | null>(null);

  // Load folder from URL on initial mount only
  useEffect(() => {
    if (!loading && Object.keys(folders).length > 0 && isInitialLoad.current) {
      const folderIdFromUrl = searchParams.get("folder");
      lastUrlFolderId.current = folderIdFromUrl;
      
      if (folderIdFromUrl && folders[folderIdFromUrl]) {
        // Validate that the folder exists and set it
        setCurrentFolderId(folderIdFromUrl);
      } else if (folderIdFromUrl && !folders[folderIdFromUrl]) {
        // Folder doesn't exist, navigate to root
        router.replace("/dashboard", { scroll: false });
        setCurrentFolderId(rootId);
      }
      isInitialLoad.current = false;
    }
  }, [loading, folders, searchParams, router, rootId]);

  // Update URL when folder changes (but not on initial load)
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

  // Build breadcrumb path
  const getBreadcrumbs = () => {
    const breadcrumbs: Array<{ id: string; name: string }> = [];
    let currentId: string | null = currentFolderId;
    
    while (currentId && currentId !== rootId) {
      const folder = folders[currentId];
      if (folder) {
        breadcrumbs.unshift({ id: folder.id, name: folder.name });
        currentId = folder.parentId;
      } else {
        break;
      }
    }
    
    // Add root at the beginning
    breadcrumbs.unshift({ id: rootId, name: "My Drive" });
    return breadcrumbs;
  };

  const handleFolderClick = (folderId: string) => {
    setCurrentFolderId(folderId);
  };

  const handleBreadcrumbClick = (folderId: string) => {
    setCurrentFolderId(folderId);
  };

  const handleDeleteClick = (folderId: string) => {
    const folder = folders[folderId];
    if (folder) {
      setFolderToDelete({ id: folderId, name: folder.name });
      setIsDeleteModalOpen(true);
      setShowDeleteConfirm(null);
    }
  };

  const handleDeleteFolder = async () => {
    if (!folderToDelete) return;
    
    const folderId = folderToDelete.id;
    setDeletingFolderId(folderId);
    
    // Get folder info before deletion
    const folder = folders[folderId];
    const parentId = folder?.parentId || rootId;
    const isCurrentFolder = folderId === currentFolderId;
    
    try {
      await deleteFolder(folderId);
      setIsDeleteModalOpen(false);
      setFolderToDelete(null);
      
      // If we deleted the current folder, navigate to its parent or root
      if (isCurrentFolder) {
        setCurrentFolderId(parentId);
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to delete folder");
    } finally {
      setDeletingFolderId(null);
    }
  };

  // Close delete menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (showDeleteConfirm) {
        setShowDeleteConfirm(null);
      }
    };
    if (showDeleteConfirm) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [showDeleteConfirm]);

  return (
    <div className="flex h-screen overflow-hidden bg-white">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Hidden on mobile, drawer on mobile */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-zinc-200 bg-white transition-transform lg:relative lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Branding */}
        <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-sm">
              <span className="text-xl">☁️</span>
            </div>
            <div>
              <h1 className="text-base font-semibold text-zinc-900">
                ZeCrypt Drive
              </h1>
              <p className="text-xs text-zinc-500">Secure Storage</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden rounded-lg p-2 text-zinc-500 hover:bg-zinc-100"
          >
            <span className="text-xl">✕</span>
          </button>
        </div>


        {/* New Button - Hidden in Trash */}
        {activeNav !== "Trash" && (
          <div className="border-b border-zinc-200 px-4 py-3">
            <button
              onClick={() => setIsCreateFolderModalOpen(true)}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-3 text-sm font-medium text-white shadow-sm transition active:scale-[0.98] active:bg-emerald-700"
            >
              <span className="text-lg">+</span>
              <span>New</span>
            </button>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-2 py-2">
          <div className="space-y-1">
            {navItems.map((item) => (
              <button
                key={item.label}
                onClick={() => {
                  setActiveNav(item.label);
                  setSidebarOpen(false);
                  if (item.label === "Trash") {
                    refreshTrash();
                  } else if (item.label === "My Drive") {
                    setCurrentFolderId(rootId);
                  }
                }}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition active:scale-[0.98] ${
                  activeNav === item.label
                    ? "bg-emerald-50 text-emerald-700"
                    : "text-zinc-700 active:bg-zinc-100"
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>

          {/* Folder Tree */}
          <div className="mt-4 border-t border-zinc-200 pt-4">
            <p className="px-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Folders
            </p>
            <div className="mt-2">
              <FolderTree />
            </div>
          </div>
        </nav>

        {/* Storage & Account */}
        <div className="border-t border-zinc-200 bg-zinc-50 p-4">
          <div className="mb-4 rounded-lg bg-gradient-to-br from-zinc-900 to-zinc-800 p-4 text-white">
            <p className="text-xs font-medium text-white/80">Storage</p>
            <p className="mt-1 text-sm font-semibold">12 GB of 30 GB used</p>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/20">
              <div className="h-full w-[40%] rounded-full bg-emerald-400" />
            </div>
          </div>
          <AuthButtons />
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile-Optimized Header */}
        <header className="flex items-center gap-3 border-b border-zinc-200 bg-white px-4 py-3 lg:px-6">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden flex h-11 w-11 items-center justify-center rounded-lg text-zinc-600 active:bg-zinc-100"
          >
            <span className="text-xl">☰</span>
          </button>

          {/* Search Bar - Full width on mobile */}
          <div className="flex flex-1 items-center gap-2 rounded-full border border-zinc-300 bg-zinc-50 px-4 py-2.5 transition focus-within:border-emerald-500 focus-within:bg-white focus-within:shadow-sm">
            <span className="text-zinc-400 text-lg">🔍</span>
            <input
              type="search"
              placeholder="Search in Drive"
              className="flex-1 bg-transparent text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none"
            />
          </div>

          {/* Right Actions - Hidden on mobile */}
          <div className="hidden items-center gap-2 lg:flex">
            <button className="flex h-10 w-10 items-center justify-center rounded-full text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-700">
              <span className="text-lg">❓</span>
            </button>
            <button className="flex h-10 w-10 items-center justify-center rounded-full text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-700">
              <span className="text-lg">⚙️</span>
            </button>
            {user?.photoURL ? (
              <Image
                src={user.photoURL}
                alt={user.displayName || "User"}
                width={32}
                height={32}
                className="h-8 w-8 rounded-full border-2 border-zinc-200"
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-xs font-semibold text-white">
                {user?.email?.[0]?.toUpperCase() || "U"}
              </div>
            )}
          </div>

          {/* Mobile Profile Button */}
          {user?.photoURL && (
            <button className="lg:hidden">
              <Image
                src={user.photoURL}
                alt={user.displayName || "User"}
                width={32}
                height={32}
                className="h-8 w-8 rounded-full border-2 border-zinc-200"
              />
            </button>
          )}
        </header>

        {/* Scrollable Content - Mobile Optimized */}
        <div className="flex-1 overflow-y-auto bg-zinc-50 pb-20 lg:pb-6">
          <div className="mx-auto w-full max-w-7xl p-4 lg:p-6">
            {/* Breadcrumbs */}
            {currentFolderId !== rootId && (
              <div className="mb-4 flex items-center gap-2 overflow-x-auto">
                {getBreadcrumbs().map((crumb, index) => (
                  <div key={crumb.id} className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleBreadcrumbClick(crumb.id)}
                      className={`text-sm transition ${
                        index === getBreadcrumbs().length - 1
                          ? "font-semibold text-zinc-900"
                          : "text-zinc-600 hover:text-emerald-600"
                      }`}
                    >
                      {crumb.name}
                    </button>
                    {index < getBreadcrumbs().length - 1 && (
                      <span className="text-zinc-400">/</span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-zinc-900 lg:text-2xl">
                {activeNav === "Trash" 
                  ? "Trash" 
                  : currentFolderId === rootId 
                    ? "My Drive" 
                    : folders[currentFolderId]?.name || "Folder"}
              </h2>
              
              {/* Actions - New Folder Button and View Mode Toggle */}
              {activeNav !== "Trash" && (
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setIsCreateFolderModalOpen(true)}
                    className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-700 active:scale-[0.98]"
                  >
                    <span className="text-lg">+</span>
                    <span>New Folder</span>
                  </button>
                  <div className="flex items-center gap-1 rounded-lg border border-zinc-200 bg-white p-1">
                    <button
                      onClick={() => setViewMode("grid")}
                      className={`rounded px-3 py-1.5 text-xs font-medium transition ${
                        viewMode === "grid"
                          ? "bg-emerald-600 text-white"
                          : "text-zinc-600 hover:bg-zinc-50"
                      }`}
                    >
                      Grid
                    </button>
                    <button
                      onClick={() => setViewMode("list")}
                      className={`rounded px-3 py-1.5 text-xs font-medium transition ${
                        viewMode === "list"
                          ? "bg-emerald-600 text-white"
                          : "text-zinc-600 hover:bg-zinc-50"
                      }`}
                    >
                      List
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Trash View */}
            {activeNav === "Trash" ? (
              <div className="rounded-xl border border-zinc-200 bg-white shadow-sm">
                <div className="border-b border-zinc-200 p-4">
                  <p className="text-sm text-zinc-600">
                    Items in trash will be permanently deleted after 30 days.
                  </p>
                </div>
                <div className="divide-y divide-zinc-100">
                  {trashFolders.length > 0 ? (
                    trashFolders.map((folder) => {
                      const daysSinceDeletion = folder.deletedAt
                        ? Math.floor((Date.now() - folder.deletedAt) / (1000 * 60 * 60 * 24))
                        : 0;
                      const daysRemaining = Math.max(0, 30 - daysSinceDeletion);
                      const canPermanentDelete = daysSinceDeletion >= 30;

                      return (
                        <div
                          key={folder.id}
                          className="group relative flex items-center gap-4 p-4 transition hover:bg-zinc-50"
                        >
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-600">
                            <span className="text-2xl">📁</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="truncate text-sm font-medium text-zinc-900">
                              {folder.name}
                            </p>
                            <p className="text-xs text-zinc-500">
                              Deleted {daysSinceDeletion === 0 
                                ? "today" 
                                : daysSinceDeletion === 1 
                                  ? "yesterday" 
                                  : `${daysSinceDeletion} days ago`}
                              {daysRemaining > 0 && (
                                <span className="ml-2 text-orange-600">
                                  • {daysRemaining} days until permanent deletion
                                </span>
                              )}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={async () => {
                                setRestoringFolderId(folder.id);
                                try {
                                  await restoreFolder(folder.id);
                                } catch (error) {
                                  alert(error instanceof Error ? error.message : "Failed to restore folder");
                                } finally {
                                  setRestoringFolderId(null);
                                }
                              }}
                              disabled={restoringFolderId === folder.id}
                              className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-50"
                            >
                              {restoringFolderId === folder.id ? "Restoring..." : "Restore"}
                            </button>
                            {canPermanentDelete && (
                              <button
                                onClick={async () => {
                                  if (!confirm(`Permanently delete "${folder.name}"? This action cannot be undone.`)) {
                                    return;
                                  }
                                  setPermanentlyDeletingFolderId(folder.id);
                                  try {
                                    await permanentDeleteFolder(folder.id);
                                  } catch (error) {
                                    alert(error instanceof Error ? error.message : "Failed to permanently delete folder");
                                  } finally {
                                    setPermanentlyDeletingFolderId(null);
                                  }
                                }}
                                disabled={permanentlyDeletingFolderId === folder.id}
                                className="rounded-lg border border-red-300 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-100 disabled:opacity-50"
                              >
                                {permanentlyDeletingFolderId === folder.id ? "Deleting..." : "Delete Forever"}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="py-12 text-center">
                      <p className="text-sm text-zinc-500">Trash is empty</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <>
                {loading ? (
              <div className={viewMode === "grid" ? "grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5" : "space-y-2"}>
                {[0, 1, 2, 3, 4].map((idx) => (
                  <div
                    key={idx}
                    className={`animate-pulse rounded-xl bg-zinc-100 ${
                      viewMode === "grid" ? "h-24" : "h-16"
                    }`}
                  />
                ))}
              </div>
            ) : viewMode === "grid" ? (
              /* Grid View */
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {/* Folders */}
                {currentFolders.length > 0 ? (
                  currentFolders.map((folder) => (
                    <button
                      key={folder.id}
                      onClick={() => handleFolderClick(folder.id)}
                      className="group relative flex flex-col items-center gap-2 rounded-xl border border-zinc-200 bg-white p-4 transition active:scale-[0.98] active:border-emerald-300 active:bg-emerald-50/50 hover:border-emerald-300 hover:bg-emerald-50/30"
                    >
                      <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                        <span className="text-3xl">📁</span>
                      </div>
                      <p className="w-full truncate text-center text-xs font-medium text-zinc-900">
                        {folder.name}
                      </p>
                      <div className="absolute right-2 top-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowDeleteConfirm(
                              showDeleteConfirm === folder.id ? null : folder.id,
                            );
                          }}
                          className="rounded-lg p-1.5 text-zinc-400 opacity-0 transition hover:bg-zinc-100 group-hover:opacity-100 active:opacity-100"
                          disabled={deletingFolderId === folder.id}
                        >
                          <span className="text-sm">⋯</span>
                        </button>
                        {showDeleteConfirm === folder.id && (
                          <div className="absolute right-0 top-full z-10 mt-1 w-32 rounded-lg border border-zinc-200 bg-white shadow-lg">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteClick(folder.id);
                              }}
                              disabled={deletingFolderId === folder.id}
                              className="w-full rounded-lg px-3 py-2 text-left text-xs text-red-600 transition hover:bg-red-50 active:bg-red-100 disabled:opacity-50"
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="col-span-full py-12 text-center">
                    <p className="text-sm text-zinc-500">
                      {currentFolderId === rootId
                        ? "No folders yet. Create your first folder to get started."
                        : "This folder is empty."}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              /* List View */
              <div className="rounded-xl border border-zinc-200 bg-white shadow-sm">
                <div className="divide-y divide-zinc-100">
                  {/* Folders */}
                  {currentFolders.length > 0 ? (
                    currentFolders.map((folder) => (
                      <button
                        key={folder.id}
                        onClick={() => handleFolderClick(folder.id)}
                        className="group relative flex w-full items-center gap-4 p-4 text-left transition hover:bg-zinc-50 active:bg-emerald-50/30"
                      >
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                          <span className="text-2xl">📁</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="truncate text-sm font-medium text-zinc-900">
                            {folder.name}
                          </p>
                          <p className="text-xs text-zinc-500">Updated just now</p>
                        </div>
                        <div className="relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowDeleteConfirm(
                                showDeleteConfirm === folder.id ? null : folder.id,
                              );
                            }}
                            className="rounded-lg p-2 text-zinc-400 opacity-0 transition hover:bg-zinc-100 group-hover:opacity-100 active:opacity-100"
                            disabled={deletingFolderId === folder.id}
                          >
                            <span className="text-lg">⋯</span>
                          </button>
                          {showDeleteConfirm === folder.id && (
                            <div className="absolute right-0 top-full z-10 mt-1 w-32 rounded-lg border border-zinc-200 bg-white shadow-lg">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteClick(folder.id);
                                }}
                                disabled={deletingFolderId === folder.id}
                                className="w-full rounded-lg px-3 py-2 text-left text-xs text-red-600 transition hover:bg-red-50 active:bg-red-100 disabled:opacity-50"
                              >
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="py-12 text-center">
                      <p className="text-sm text-zinc-500">
                        {currentFolderId === rootId
                          ? "No folders yet. Create your first folder to get started."
                          : "This folder is empty."}
                      </p>
                    </div>
                  )}
                </div>
              </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Bottom Navigation Bar - Mobile Only */}
        <nav className="fixed bottom-0 left-0 right-0 z-30 flex items-center justify-around border-t border-zinc-200 bg-white px-2 py-2 shadow-[0_-4px_6px_-1px_rgb(0_0_0_/0.1)] lg:hidden">
          {navItems.map((item) => (
            <button
              key={item.label}
              onClick={() => {
                setActiveNav(item.label);
                if (item.label === "Trash") {
                  refreshTrash();
                } else if (item.label === "My Drive") {
                  setCurrentFolderId(rootId);
                }
              }}
              className={`flex flex-col items-center gap-1 rounded-lg px-3 py-2 transition active:scale-95 ${
                activeNav === item.label
                  ? "text-emerald-600"
                  : "text-zinc-500 active:text-zinc-700"
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          ))}
          <button
            onClick={() => setSidebarOpen(true)}
            className="flex flex-col items-center gap-1 rounded-lg px-3 py-2 text-zinc-500 transition active:scale-95 active:text-zinc-700"
          >
            <span className="text-xl">☰</span>
            <span className="text-[10px] font-medium">More</span>
          </button>
        </nav>
      </main>

      {/* Create Folder Modal */}
      <CreateFolderModal
        isOpen={isCreateFolderModalOpen}
        onClose={() => setIsCreateFolderModalOpen(false)}
        defaultParentId={currentFolderId}
      />

      {/* Delete Folder Modal */}
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
      <main className="flex h-screen items-center justify-center">
        <p className="text-base text-zinc-600">Loading...</p>
      </main>
    }>
      <DashboardPageContent />
    </Suspense>
  );
}
