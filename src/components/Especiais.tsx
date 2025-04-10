// src/components/Especiais.tsx
"use client";

import React, { useState } from "react";
import Link from "@/components/SmartLink";
import Image from "next/image";

interface Post {
  slug: string;
  titulo: string;
  thumb: string;
  categoria: string;
  data: string;
  tempoLeitura: number;
  resumo: string;
}

interface EspeciaisProps {
  especiais: Record<string, Post[]>; // ex: { "especial-thelastofus": [...], "especial-nintendo": [...] }
}

const formatarNome = (slug: string) => {
  return slug.replace("especial-", "").replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase());
};

export default function Especiais({ especiais }: EspeciaisProps) {
  const tags = Object.keys(especiais);
  const [ativa, setAtiva] = useState(tags[0]);

  return (
    <section className="max-w-6xl mx-auto px-6 py-12">
      <h2 className="text-2xl font-bold mb-6 text-orange-500">Especiais GeekNews</h2>

      <div className="flex gap-6 border-b border-gray-600 mb-6 overflow-x-auto">
        {tags.map((tag) => (
          <button
            key={tag}
            onClick={() => setAtiva(tag)}
            className={`pb-2 border-b-4 text-sm font-semibold whitespace-nowrap ${
              tag === ativa ? "border-orange-400 text-white" : "border-transparent text-gray-400 hover:text-white"
            }`}
          >
            {formatarNome(tag)}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {especiais[ativa]?.slice(0, 3).map((post) => (
          <Link
            key={post.slug}
            href={`/noticia/${post.slug}`}
            className="bg-gray-900 rounded-lg overflow-hidden shadow hover:shadow-lg transition"
          >
            {post.thumb && (
              <Image
                src={post.thumb}
                alt={post.titulo}
                width={500}
                height={300}
                className="w-full h-48 object-cover"
              />
            )}
            <div className="p-4">
              <p className="text-orange-400 text-xs uppercase font-bold mb-1">{post.categoria}</p>
              <h3 className="text-white font-semibold mb-2 leading-tight">{post.titulo}</h3>
              <p className="text-sm text-gray-400 line-clamp-3">{post.resumo}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
