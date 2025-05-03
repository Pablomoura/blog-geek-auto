"use client";
import Script from "next/script";

type NoticiaData = {
  title: string;
  resumo?: string;
  thumb?: string;
  midia?: string;
  data?: string;
  author?: string;
};

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
    },
    "publisher": {
      "@type": "Organization",
      "name": "GeekNews",
      "logo": {
        "@type": "ImageObject",
        "url": "https://www.geeknews.com.br/logo.png",
        "width": 600,
        "height": 60,
      },
    },
  };

  return (
    <Script id="json-ld-noticia" type="application/ld+json">
      {JSON.stringify(jsonLd)}
    </Script>
  );
}
