"use client";

import Script from "next/script";

export default function JsonLdProfilePage({ nome, bio, imagem, slug }: { nome: string; bio: string; imagem: string; slug: string }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    "mainEntity": {
      "@type": "Person",
      "name": nome,
      "description": bio,
      "url": `https://www.geeknews.com.br/autor/${slug}`,
      "image": imagem
    }
  };

  return (
    <Script
      id="jsonld-profile-page"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
