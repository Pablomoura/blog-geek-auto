"use client";

import Script from "next/script";

export default function JsonLdOrganization() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "GeekNews",
    "url": "https://www.geeknews.com.br",
    "logo": {
      "@type": "ImageObject",
      "url": "https://www.geeknews.com.br/logo.png",
      "width": 600,
      "height": 60,
    },
    "sameAs": [
      "https://www.facebook.com/GeekNews", // se tiver redes sociais oficiais, coloque aqui
      "https://twitter.com/SiteGeekNews",
      "https://www.instagram.com/GeekNews" // exemplo, ajuste conforme suas redes reais
    ]
  };

  return (
    <Script id="json-ld-organization" type="application/ld+json">
      {JSON.stringify(jsonLd)}
    </Script>
  );
}
