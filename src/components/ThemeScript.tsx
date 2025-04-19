// src/components/ThemeScript.tsx
"use client";

import { useEffect } from "react";

export default function ThemeScript() {
  useEffect(() => {
    try {
      const theme = localStorage.getItem("theme");
      if (theme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    } catch (_) {}
  }, []);

  return null;
}
