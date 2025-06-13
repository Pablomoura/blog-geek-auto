"use client";

import Script from "next/script";

type NoticiaData = {
  title: string;
  resumo?: string;
  thumb?: string;
  midia?: string;
  data?: string;
  author?: string;
  articleBody?: string;
  wordCount?: number;
  tags?: string[];
};

function slugifyAutor(nome?: string): string {
  if (!nome) return "";
  return nome
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function JsonLdNoticia({
  slug,
  data,
}: {
  slug: string;
  data: NoticiaData;
}) {
  const url = `https://www.geeknews.com.br/noticia/${slug}`;

  const rawImage = data.thumb || data.midia || "";
  const image = rawImage.startsWith("http")
    ? rawImage
    : `https://www.geeknews.com.br${rawImage}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "headline": data.title,
    "description": data.resumo || "",
    "image": [image],
    "datePublished": data.data || new Date().toISOString(),
    "dateModified": data.data || new Date().toISOString(),
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": url,
    },
    "author": {
      "@type": "Person",
      "name": data.author || "GeekNews",
      "url": data.author
        ? `https://www.geeknews.com.br/autor/${slugifyAutor(data.author)}`
        : "https://www.geeknews.com.br",
    },
    "publisher": {
      "@type": "Organization",
      "name": "GeekNews",
      "url": "https://www.geeknews.com.br",
      "logo": {
        "@type": "ImageObject",
        "url": "https://www.geeknews.com.br/logo.png",
        "width": 600,
        "height": 60,
      },
    },
    "articleBody": data.articleBody || "",
    "wordCount": data.wordCount || undefined,
    "isAccessibleForFree": true,
    "about": data.tags?.map((tag) => ({
      "@type": "Thing",
      "name": tag,
    })),
  };

  return (
    <Script id="json-ld-noticia" type="application/ld+json">
      {JSON.stringify(jsonLd)}
    </Script>
  );
}
