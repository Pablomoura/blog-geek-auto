// src/components/JsonLdBreadcrumb.tsx
import React from 'react';
import Script from 'next/script';

type Props = {
  categoria: string;
  categoriaSlug: string;
  titulo: string;
  slug: string;
};

export default function JsonLdBreadcrumb({ categoria, categoriaSlug, titulo, slug }: Props) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://www.geeknews.com.br/"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": categoria,
        "item": `https://www.geeknews.com.br/categoria/${categoriaSlug}`
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": titulo,
        "item": `https://www.geeknews.com.br/noticia/${slug}`
      }
    ]
  };

  return (
    <Script
      id={`jsonld-breadcrumb-${slug}`}
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
