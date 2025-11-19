"use client";

import { 
  HardDrive, 
  Clock, 
  Star, 
  Trash2, 
  Plus, 
  Cloud,
  X
} from "lucide-react";
import { useFolders } from "@/contexts/folder-context";
import { AuthButtons } from "@/components/auth/auth-buttons";
import { FolderTree } from "@/components/folders/folder-tree";

type NavItem = {
  label: string;
  icon: React.ElementType;
};

const navItems: NavItem[] = [
  { label: "My Drive", icon: HardDrive },
  { label: "Recent", icon: Clock },
  { label: "Starred", icon: Star },
  { label: "Trash", icon: Trash2 },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeNav: string;
  onNavChange: (nav: string) => void;
  onNewFolder: () => void;
}

export function Sidebar({ 
  isOpen, 
  onClose, 
  activeNav, 
  onNavChange,
  onNewFolder
}: SidebarProps) {
  const { rootId, setCurrentFolderId, refreshTrash } = useFolders();

  const handleNavClick = (label: string) => {
    onNavChange(label);
    onClose();
    if (label === "Trash") {
      refreshTrash();
    } else if (label === "My Drive") {
      setCurrentFolderId(rootId);
    }
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-zinc-200 bg-white transition-transform lg:relative lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-6 py-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-sm">
              <Cloud className="h-5 w-5" />
            </div>
            <span className="text-lg font-semibold text-zinc-800 tracking-tight">
              ZeCrypt
            </span>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden rounded-lg p-2 text-zinc-500 hover:bg-zinc-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* New Button */}
        {activeNav !== "Trash" && (
          <div className="px-4 pb-2">
            <button
              onClick={onNewFolder}
              className="flex items-center gap-3 rounded-2xl bg-white pl-4 pr-6 py-4 text-sm font-medium text-zinc-700 shadow-[0_1px_3px_0_rgba(60,64,67,0.3),0_4px_8px_3px_rgba(60,64,67,0.15)] transition hover:bg-zinc-50 active:bg-zinc-100"
            >
              <Plus className="h-6 w-6 text-emerald-600" strokeWidth={2.5} />
              <span className="text-base">New</span>
            </button>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-2">
          <div className="space-y-0.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeNav === item.label;
              return (
                <button
                  key={item.label}
                  onClick={() => handleNavClick(item.label)}
                  className={`flex w-full items-center gap-3.5 rounded-r-full px-4 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-emerald-50 text-emerald-700"
                      : "text-zinc-700 hover:bg-zinc-100"
                  }`}
                >
                  <Icon className={`h-5 w-5 ${isActive ? "fill-emerald-700/10" : ""}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Folder Tree */}
          <div className="mt-6 pt-4">
            <div className="flex items-center justify-between px-4 mb-2">
              <span className="text-xs font-semibold text-zinc-500">Folders</span>
            </div>
            <FolderTree />
          </div>
        </nav>

        {/* Storage & Account */}
        <div className="border-t border-zinc-200 bg-zinc-50/50 p-4 space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-zinc-600">
              <span>Storage</span>
              <span className="font-medium">12 GB of 30 GB</span>
            </div>
            <div className="h-1 w-full overflow-hidden rounded-full bg-zinc-200">
              <div className="h-full w-[40%] rounded-full bg-emerald-500" />
            </div>
            <button className="text-xs text-emerald-600 hover:underline">
              Buy storage
            </button>
          </div>
          <AuthButtons />
        </div>
      </aside>
    </>
  );
}

