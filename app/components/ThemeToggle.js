"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

const STORAGE_KEY = "pl-theme";

function getCurrentTheme() {
  if (typeof document === "undefined") return "dark";
  return document.documentElement.getAttribute("data-theme") === "light"
    ? "light"
    : "dark";
}

export function ThemeToggle({ className = "" }) {
  const [theme, setTheme] = useState("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setTheme(getCurrentTheme());
    setMounted(true);
  }, []);

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    const root = document.documentElement;
    root.setAttribute("data-theme", next);
    root.style.colorScheme = next;
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* storage unavailable; theme persists for the session only */
    }
  }

  const showSun = mounted && theme === "dark";
  const nextLabel = showSun ? "light" : "dark";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={`Switch to ${nextLabel} mode`}
      title={`Switch to ${nextLabel} mode`}
      className={`inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 text-zinc-300 transition hover:bg-white/[0.04] hover:text-white ${className}`}
    >
      {/* Render both icons for SSR; toggle visibility after mount to avoid
          a mismatched icon flash before hydration. */}
      <Sun
        className={`h-4 w-4 ${mounted ? (showSun ? "block" : "hidden") : "block"}`}
        aria-hidden
      />
      <Moon
        className={`h-4 w-4 ${mounted ? (showSun ? "hidden" : "block") : "hidden"}`}
        aria-hidden
      />
    </button>
  );
}
