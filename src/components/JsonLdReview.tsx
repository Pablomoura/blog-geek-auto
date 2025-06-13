"use client";

import Script from "next/script";

type ReviewData = {
  title: string;
  resumo?: string;
  url: string;
  author?: string;
  notaCritico: number;
  publisherName?: string;
  publisherLogo?: string;
  reviewBody?: string;
  itemReviewed?: {
    name: string;
    type?: string;
    image?: string;
  };
};

export default function JsonLdReview({
  data,
}: {
  data: ReviewData;
}) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Review",
    "headline": data.title,
    "description": data.resumo || "",
    "url": data.url,
    "author": {
      "@type": "Person",
      "name": data.author || "GeekNews",
    },
    "publisher": {
      "@type": "Organization",
      "name": data.publisherName || "GeekNews",
      "logo": {
        "@type": "ImageObject",
        "url": data.publisherLogo || "https://www.geeknews.com.br/logo.png",
        "width": 600,
        "height": 60,
      },
    },
    "reviewBody": data.reviewBody || data.resumo || "",
    "reviewRating": {
      "@type": "Rating",
      "ratingValue": data.notaCritico,
      "bestRating": 10,
      "worstRating": 0,
    },
    ...(data.itemReviewed && {
      itemReviewed: {
        "@type": data.itemReviewed.type || "CreativeWork",
        "name": data.itemReviewed.name,
        ...(data.itemReviewed.image && {
          image: data.itemReviewed.image,
        }),
      },
    }),
  };

  return (
    <Script id="json-ld-review" type="application/ld+json">
      {JSON.stringify(jsonLd)}
    </Script>
  );
}
