"use client";

import { useEffect } from "react";

export default function TwitterLoader() {
  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).twttr?.widgets?.load) {
      (window as any).twttr.widgets.load();
    }
  }, []);

  return null;
}
