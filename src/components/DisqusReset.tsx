'use client';

import { useEffect } from "react";

export default function DisqusReset({ slug }: { slug: string }) {
  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).DISQUS) {
      (window as any).DISQUS.reset({
        reload: true,
        config: function () {
          this.page.url = `https://www.geeknews.com.br/noticia/${slug}`;
          this.page.identifier = slug;
        },
      });
    }
  }, [slug]);

  return null;
}