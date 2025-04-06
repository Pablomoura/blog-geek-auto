'use client';

import { useEffect, useRef, useState } from 'react';

type Props = {
  slug: string;
};

export default function LazyDisqus({ slug }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    if (!ref.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!shouldLoad) return;

    (window as any).disqus_config = function () {
      this.page.url = `https://www.geeknews.com.br/noticia/${slug}`;
      this.page.identifier = slug;
    };

    const script = document.createElement('script');
    script.src = 'https://geeknewsblog.disqus.com/embed.js';
    script.setAttribute('data-timestamp', `${+new Date()}`);
    document.body.appendChild(script);
  }, [shouldLoad, slug]);

  return <div id="disqus_thread" ref={ref} className="mt-12" />;
}
