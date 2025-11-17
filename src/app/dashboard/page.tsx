"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { AuthGuard } from "@/components/auth/auth-guard";
import { AuthButtons } from "@/components/auth/auth-buttons";
import { FolderProvider, useFolders } from "@/contexts/folder-context";
import { NewFolderCard } from "@/components/folders/new-folder-card";
import { FolderTree } from "@/components/folders/folder-tree";
import { CreateFolderModal } from "@/components/folders/create-folder-modal";
import { useAuth } from "@/contexts/auth-context";

const navItems = [
  { label: "My Drive", icon: "📁", active: true },
  { label: "Recent", icon: "🕘" },
  { label: "Starred", icon: "⭐" },
  { label: "Trash", icon: "🗑️" },
];

const quickAccessItems = [
  {
    title: "Q3 Report.pptx",
    timestamp: "2h ago",
    icon: "📊",
    color: "bg-orange-100",
    iconColor: "text-orange-600",
  },
  {
    title: "Project Plan.docx",
    timestamp: "1d ago",
    icon: "📄",
    color: "bg-blue-100",
    iconColor: "text-blue-600",
  },
  {
    title: "Budget_2024.xlsx",
    timestamp: "3d ago",
    icon: "📈",
    color: "bg-green-100",
    iconColor: "text-green-600",
  },
  {
    title: "Onboarding Guide.pdf",
    timestamp: "1w ago",
    icon: "📕",
    color: "bg-red-100",
    iconColor: "text-red-600",
  },
];

const filePlaceholders = [
  {
    name: "Meeting Notes.docx",
    owner: "me",
    modified: "Jan 22",
    size: "2.1 MB",
    icon: "📄",
  },
  {
    name: "Vacation_01.jpg",
    owner: "me",
    modified: "Jan 15",
    size: "4.5 MB",
    icon: "🖼️",
  },
  {
    name: "Strategy.v2.key",
    owner: "me",
    modified: "Jan 10",
    size: "12 MB",
    icon: "📊",
  },
];

function DashboardShell() {
  const { rootId, getChildren, loading, deleteFolder } = useFolders();
  const { user } = useAuth();
  const topFolders = getChildren(rootId);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeNav, setActiveNav] = useState("My Drive");
  const [deletingFolderId, setDeletingFolderId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [isCreateFolderModalOpen, setIsCreateFolderModalOpen] = useState(false);

  const handleDeleteFolder = async (folderId: string) => {
    setDeletingFolderId(folderId);
    try {
      await deleteFolder(folderId);
      setShowDeleteConfirm(null);
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

        {/* New Button */}
        <div className="border-b border-zinc-200 px-4 py-3">
          <button
            onClick={() => setIsCreateFolderModalOpen(true)}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-3 text-sm font-medium text-white shadow-sm transition active:scale-[0.98] active:bg-emerald-700"
          >
            <span className="text-lg">+</span>
            <span>New</span>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-2 py-2">
          <div className="space-y-1">
            {navItems.map((item) => (
              <button
                key={item.label}
                onClick={() => {
                  setActiveNav(item.label);
                  setSidebarOpen(false);
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
          <div className="mx-auto w-full max-w-7xl space-y-6 p-4 lg:space-y-8 lg:p-6">
            {/* My Drive Title */}
            <div>
              <h2 className="text-xl font-semibold text-zinc-900 lg:text-2xl">
                My Drive
              </h2>
            </div>

            {/* Quick Access Section - Mobile Grid */}
            <section>
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-zinc-700">
                  Quick Access
                </h3>
                <div className="hidden items-center gap-1 rounded-lg border border-zinc-200 bg-white p-1 lg:flex">
                  <button className="rounded px-2 py-1 text-xs text-emerald-600">
                    Grid
                  </button>
                  <button className="rounded px-2 py-1 text-xs text-zinc-500 hover:bg-zinc-50">
                    List
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {quickAccessItems.map((item) => (
                  <button
                    key={item.title}
                    className="group rounded-xl border border-zinc-200 bg-white p-3 shadow-sm transition active:scale-[0.98] active:shadow-md lg:p-4"
                  >
                    <div
                      className={`mb-2 flex h-20 items-center justify-center rounded-lg lg:h-32 ${item.color}`}
                    >
                      <span className={`text-3xl lg:text-4xl ${item.iconColor}`}>
                        {item.icon}
                      </span>
                    </div>
                    <p className="truncate text-xs font-medium text-zinc-900 lg:text-sm">
                      {item.title}
                    </p>
                    <p className="mt-0.5 text-[10px] text-zinc-500 lg:text-xs">
                      {item.timestamp}
                    </p>
                  </button>
                ))}
              </div>
            </section>

            {/* Folders Section - Mobile Cards */}
            <section className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm lg:p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-zinc-700">Folders</h3>
                <button className="text-xs font-medium text-emerald-600 active:text-emerald-700">
                  View all
                </button>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <NewFolderCard />
                {loading ? (
                  [0, 1, 2].map((idx) => (
                    <div
                      key={idx}
                      className="h-20 animate-pulse rounded-xl bg-zinc-100 lg:h-24"
                    />
                  ))
                ) : topFolders.length > 0 ? (
                  topFolders.map((folder) => (
                    <div
                      key={folder.id}
                      className="group relative flex items-center gap-3 rounded-xl border border-zinc-200 p-3 transition active:scale-[0.98] active:border-emerald-300 active:bg-emerald-50/50 lg:p-4"
                    >
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                        <span className="text-xl lg:text-2xl">📁</span>
                      </div>
                      <div className="flex-1 min-w-0 text-left">
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
                          className="shrink-0 rounded-lg p-1.5 text-zinc-400 active:bg-zinc-100 lg:opacity-0 lg:group-hover:opacity-100"
                          disabled={deletingFolderId === folder.id}
                        >
                          <span className="text-lg">⋯</span>
                        </button>
                        {showDeleteConfirm === folder.id && (
                          <div className="absolute right-0 top-full z-10 mt-1 w-32 rounded-lg border border-zinc-200 bg-white shadow-lg">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteFolder(folder.id);
                              }}
                              disabled={deletingFolderId === folder.id}
                              className="w-full rounded-lg px-3 py-2 text-left text-xs text-red-600 transition hover:bg-red-50 active:bg-red-100 disabled:opacity-50"
                            >
                              {deletingFolderId === folder.id
                                ? "Deleting..."
                                : "Delete"}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="col-span-full text-center text-sm text-zinc-500">
                    Create your first folder to see it here.
                  </p>
                )}
              </div>
            </section>

            {/* Files Section - Mobile Card View */}
            <section className="rounded-xl border border-zinc-200 bg-white shadow-sm">
              <div className="border-b border-zinc-200 p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-zinc-700">Files</h3>
                  <button className="text-xs font-medium text-emerald-600 active:text-emerald-700">
                    Manage
                  </button>
                </div>
              </div>

              {/* Mobile Card View */}
              <div className="divide-y divide-zinc-100 lg:hidden">
                {filePlaceholders.map((file) => (
                  <button
                    key={file.name}
                    className="flex w-full items-center gap-3 p-4 text-left transition active:bg-zinc-50"
                  >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-zinc-100">
                      <span className="text-2xl">{file.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-medium text-zinc-900">
                        {file.name}
                      </p>
                      <div className="mt-1 flex items-center gap-2 text-xs text-zinc-500">
                        <span>{file.modified}</span>
                        <span>•</span>
                        <span>{file.size}</span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                      className="shrink-0 rounded-lg p-2 text-zinc-400 active:bg-zinc-100"
                    >
                      <span className="text-lg">⋯</span>
                    </button>
                  </button>
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-zinc-200 bg-zinc-50">
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-600">
                        Name
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-600">
                        Owner
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-600">
                        Last Modified
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-600">
                        File Size
                      </th>
                      <th className="w-12"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {filePlaceholders.map((file) => (
                      <tr
                        key={file.name}
                        className="group cursor-pointer transition hover:bg-zinc-50"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <span className="text-lg">{file.icon}</span>
                            <span className="text-sm font-medium text-zinc-900">
                              {file.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-zinc-600">
                          {file.owner}
                        </td>
                        <td className="px-4 py-3 text-sm text-zinc-600">
                          {file.modified}
                        </td>
                        <td className="px-4 py-3 text-sm text-zinc-600">
                          {file.size}
                        </td>
                        <td className="px-4 py-3">
                          <button className="opacity-0 text-zinc-400 transition group-hover:opacity-100">
                            <span className="text-lg">⋯</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </div>

        {/* Bottom Navigation Bar - Mobile Only */}
        <nav className="fixed bottom-0 left-0 right-0 z-30 flex items-center justify-around border-t border-zinc-200 bg-white px-2 py-2 shadow-[0_-4px_6px_-1px_rgb(0_0_0_/0.1)] lg:hidden">
          {navItems.map((item) => (
            <button
              key={item.label}
              onClick={() => {
                setActiveNav(item.label);
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
      />
    </div>
  );
}

export default function DashboardPage() {
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
