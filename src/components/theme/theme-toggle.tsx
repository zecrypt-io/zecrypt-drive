"use client";

import { useMemo } from "react";
import { useThemeAnimation } from "@space-man/react-theme-animation";

type ThemeToggleProps = {
  className?: string;
};

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { theme, toggleTheme, ref } = useThemeAnimation();
  const isLight = theme === "light";
  const combinedClassName = useMemo(() => {
    const palette = isLight
      ? "bg-zinc-900/90 text-white border-zinc-800 hover:bg-zinc-900"
      : "bg-white/90 text-zinc-900 border-white/60 hover:bg-white";
    const base =
      "theme-toggle-btn inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400";
    const classes = `${base} ${palette}`;
    return className ? `${classes} ${className}` : classes;
  }, [className, isLight]);

  return (
    <button
      ref={ref}
      onClick={toggleTheme}
      className={combinedClassName}
      aria-label={`Switch to ${isLight ? "dark" : "light"} mode`}
      type="button"
    >
      <span className="text-base">{isLight ? "🌙" : "🌞"}</span>
      <span className="capitalize">{theme} mode</span>
    </button>
  );
}

