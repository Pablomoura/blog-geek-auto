"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    instgrm?: {
      Embeds: {
        process: () => void;
      };
    };
  }
}

export default function InstagramLoader() {
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (window.instgrm?.Embeds?.process) {
        window.instgrm.Embeds.process();
      }
    }, 1000); // tempo suficiente para o dangerouslySetInnerHTML renderizar o conteúdo

    return () => clearTimeout(timeout);
  }, []);

  return null;
}
