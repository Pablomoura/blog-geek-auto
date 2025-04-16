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
    let tentativas = 0;
    const maxTentativas = 10;

    const tentarProcessar = () => {
      if (window.instgrm?.Embeds?.process) {
        window.instgrm.Embeds.process();
        console.log("✅ Instagram embed processado");
      } else if (tentativas < maxTentativas) {
        tentativas++;
        setTimeout(tentarProcessar, 500);
      } else {
        console.warn("⚠️ Não foi possível processar o embed do Instagram.");
      }
    };

    tentarProcessar();
  }, []);

  return null;
}
