"use client";

import React, { useState } from "react";
import Link from "@/components/SmartLink";
import Image from "next/image";

interface PostEspecial {
  slug: string;
  titulo: string;
  thumb: string;
  categoria: string;
  data: string;
  tempoLeitura: number;
  resumo: string;
  autor: string;
}

interface EspeciaisProps {
  especiais: Record<string, PostEspecial[]>;
}

function slugify(text?: string) {
  if (!text) return "";
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]/g, "");
}

const formatarNome = (slug?: string) => {
  if (!slug) return "";
  return slug
    .replace("especial-", "")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase());
};

export default function Especiais({ especiais }: EspeciaisProps) {
  const tags = Object.keys(especiais).filter(Boolean);
  const [ativa, setAtiva] = useState(tags[0] || "");

  return (
    <section className="max-w-6xl mx-auto px-6 py-12">
      <h2 className="text-2xl font-bold mb-6 text-orange-500">Especiais GeekNews</h2>

      <div className="flex gap-6 border-b border-gray-300 dark:border-gray-600 mb-6 overflow-x-auto">
        {tags.map((tag) => (
          <button
            key={tag}
            onClick={() => setAtiva(tag)}
            className={`pb-2 border-b-4 text-sm font-semibold whitespace-nowrap transition-colors ${
              tag === ativa
                ? "border-orange-500 text-orange-600 dark:text-white"
                : "border-transparent text-gray-600 hover:text-orange-500 dark:text-gray-400 dark:hover:text-white"
            }`}
          >
            {formatarNome(tag)}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {especiais[ativa]?.slice(0, 3).map((post: PostEspecial) => (
          <Link
            key={post.slug}
            href={`/noticia/${post.slug}`}
            className="bg-white dark:bg-gray-900 rounded-lg overflow-hidden shadow hover:shadow-lg transition"
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
              <p className="text-orange-700 dark:text-white text-xs uppercase font-bold mb-1 bg-orange-100 dark:bg-orange-600 inline-block px-2 py-0.5 rounded">
                {post.categoria}
              </p>
              <h3 className="text-neutral-900 dark:text-white font-semibold leading-tight mb-1">
                {post.titulo}
              </h3>
              <p className="text-sm text-gray-700 dark:text-gray-400 line-clamp-3 mb-2">{post.resumo}</p>
              <p className="text-xs text-gray-500 dark:text-gray-500">
                Por {post.autor} • {new Date(post.data).toLocaleDateString("pt-BR")}
              </p>
            </div>
          </Link>
        ))}
      </div>

      {ativa && (
        <div className="mt-6 text-center">
          <Link
            href={`/tag/${slugify(ativa)}`}
            className="inline-block bg-orange-500 text-white px-5 py-2 rounded-full text-sm font-medium hover:bg-orange-600 transition"
          >
            Ver tudo de {formatarNome(ativa)}
          </Link>
        </div>
      )}
    </section>
  );
}
