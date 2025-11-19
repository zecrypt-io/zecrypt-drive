"use client";

import Image from "next/image";
import { Menu, Search, Settings, HelpCircle, X } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";

interface HeaderProps {
  onSidebarOpen: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function Header({ onSidebarOpen, searchQuery, onSearchChange }: HeaderProps) {
  const { user } = useAuth();

  return (
    <header className="flex items-center gap-4 border-b border-zinc-200 bg-white px-4 py-2.5 lg:px-6 lg:py-3">
      {/* Mobile Menu Button */}
      <button
        onClick={onSidebarOpen}
        className="lg:hidden flex h-10 w-10 items-center justify-center rounded-full text-zinc-600 hover:bg-zinc-100 active:bg-zinc-200"
      >
        <Menu className="h-6 w-6" />
      </button>

      {/* Search Bar */}
      <div className="flex flex-1 items-center max-w-3xl mx-auto">
        <div className="group relative flex w-full items-center rounded-full bg-zinc-100 px-4 py-2.5 transition-all focus-within:bg-white focus-within:shadow-md focus-within:ring-1 focus-within:ring-zinc-200">
          <Search className="h-5 w-5 text-zinc-500 group-focus-within:text-zinc-700" />
          <input
            type="search"
            placeholder="Search in Drive"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="flex-1 bg-transparent px-3 text-base text-zinc-900 placeholder:text-zinc-500 focus:outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange("")}
              className="rounded-full p-1 text-zinc-500 hover:bg-zinc-200 hover:text-zinc-700"
            >
              <X className="h-5 w-5" />
            </button>
          )}
          <button className="ml-1 rounded-full p-2 text-zinc-500 hover:bg-zinc-200 hover:text-zinc-700">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 4v16m-8-8h16" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="12" cy="12" r="9" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2 pl-2">
        <div className="hidden items-center gap-1 sm:flex">
          <button className="flex h-10 w-10 items-center justify-center rounded-full text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700">
            <HelpCircle className="h-6 w-6" />
          </button>
          <button className="flex h-10 w-10 items-center justify-center rounded-full text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700">
            <Settings className="h-6 w-6" />
          </button>
        </div>
        
        <div className="pl-2">
          {user?.photoURL ? (
            <button className="rounded-full ring-2 ring-white ring-offset-2 ring-offset-zinc-100 transition hover:opacity-90">
              <Image
                src={user.photoURL}
                alt={user.displayName || "User"}
                width={32}
                height={32}
                className="h-9 w-9 rounded-full"
              />
            </button>
          ) : (
            <button className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-600 text-sm font-semibold text-white ring-2 ring-white ring-offset-2 ring-offset-zinc-100">
              {user?.email?.[0]?.toUpperCase() || "U"}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

