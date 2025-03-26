'use client';

import { useEffect } from "react";

export default function DisqusReset({ slug }: { slug: string }) {
  useEffect(() => {
    const disqus = (window as typeof window & { DISQUS?: { reset: (opts: { reload: boolean; config: () => void }) => void } }).DISQUS;
    if (typeof window !== "undefined" && disqus) {
      disqus.reset({
        reload: true,
        config: function (this: { page: { url: string; identifier: string } }) {
          this.page.url = `https://www.geeknews.com.br/noticia/${slug}`;
          this.page.identifier = slug;
        },
      });
    }
  }, [slug]);

  return null;
}