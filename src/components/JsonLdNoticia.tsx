"use client";
import Script from "next/script";

export default function JsonLdNoticia({ slug, data }: { slug: string; data: any }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: data.title,
    description: data.resumo || "",
    image: [data.thumb || data.midia || ""],
    datePublished: data.data || new Date().toISOString(),
    dateModified: data.data || new Date().toISOString(),
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://www.geeknews.com.br/noticia/${slug}`,
    },
    author: {
      "@type": "Person",
      name: data.author || "GeekNews",
    },
    publisher: {
      "@type": "Organization",
      name: "GeekNews",
      logo: {
        "@type": "ImageObject",
        url: "https://www.geeknews.com.br/logo.png",
      },
    },
  };

  return (
    <Script id="json-ld" type="application/ld+json">
      {JSON.stringify(jsonLd)}
    </Script>
  );
}
