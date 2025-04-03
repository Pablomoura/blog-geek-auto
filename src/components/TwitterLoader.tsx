"use client";
import { useEffect } from "react";

declare global {
  interface Window {
    twttr?: {
      widgets: {
        load: () => void;
      };
    };
  }
}

export default function TwitterLoader() {
  useEffect(() => {
    if (typeof window !== "undefined" && window.twttr?.widgets?.load) {
      window.twttr.widgets.load();
    }
  }, []);

  return null;
}
