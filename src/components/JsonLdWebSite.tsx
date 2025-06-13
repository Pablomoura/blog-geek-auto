"use client";

import Script from "next/script";

export default function JsonLdWebSite() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "GeekNews",
    "url": "https://www.geeknews.com.br",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://www.geeknews.com.br/search?q={search_term_string}",
      "query-input": "required name=search_term_string",
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
  };

  return (
    <Script id="json-ld-website" type="application/ld+json">
      {JSON.stringify(jsonLd)}
    </Script>
  );
}
