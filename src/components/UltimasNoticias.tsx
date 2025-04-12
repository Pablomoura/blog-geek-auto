"use client";

import Link from "@/components/SmartLink";
import React from "react";

export default function UltimasNoticias({
  posts,
  paginaAtual,
  totalPaginas,
}: {
  posts: Post[];
  paginaAtual: number;
  totalPaginas: number;
}) {
  return (
    <section className="mt-10">
      <h1 className="text-3xl font-extrabold capitalize mb-8 text-neutral-900 dark:text-white">
        Últimas Notícias
      </h1>

      <div className="space-y-8">
        {posts.map((post) => (
          <Link
            key={post.slug}
            href={`/noticia/${post.slug}`}
            className="flex flex-col sm:flex-row gap-5 bg-white dark:bg-gray-900 p-5 rounded-xl shadow hover:shadow-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition overflow-hidden"
          >
            {post.thumb && (
              <img
              src={post.thumb}
              alt={post.titulo}
              className="w-full sm:w-60 h-36 object-cover rounded-lg aspect-video"
            />
            
            )}
            <div className="flex flex-col justify-between">
              <div>
                <p className="text-orange-500 text-xs font-bold uppercase mb-1">{post.categoria}</p>
                <h2 className="text-lg font-semibold text-neutral-900 dark:text-white leading-snug">
                  {post.titulo}
                </h2>
                {post.resumo && (
                  <p className="text-sm text-gray-700 dark:text-gray-400 mt-1 line-clamp-2">
                    {post.resumo}
                  </p>
                )}
              </div>
              <div className="text-xs text-gray-400 dark:text-gray-500 mt-2 flex gap-2 items-center">
                <span>{new Date(post.data).toLocaleDateString("pt-BR")}</span>
                {post.tempoLeitura && (
                    <>
                    <span>•</span>
                    <span>{post.tempoLeitura} min de leitura</span>
                    </>
                )}
              </div>

            </div>
          </Link>
        ))}
      </div>

      {totalPaginas > 1 && (
        <div className="mt-10 flex justify-center items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          {paginaAtual > 1 && (
            <Link
              href={`/?page=${paginaAtual - 1}`}
              className="px-3 py-1 rounded bg-gray-300 dark:bg-gray-700 hover:bg-gray-400 dark:hover:bg-gray-600 transition"
            >
              Anterior
            </Link>
          )}

          {Array.from({ length: totalPaginas }, (_, i) => i + 1)
            .filter((n) => n === 1 || n === totalPaginas || Math.abs(n - paginaAtual) <= 2)
            .map((n, idx, arr) => {
              const anterior = arr[idx - 1];
              return (
                <React.Fragment key={n}>
                  {anterior && n - anterior > 1 && <span className="px-2">...</span>}
                  <Link
                    href={`/?page=${n}`}
                    className={`px-3 py-1 rounded ${
                      n === paginaAtual
                        ? "bg-orange-500 text-white font-bold"
                        : "bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700"
                    }`}
                  >
                    {n}
                  </Link>
                </React.Fragment>
              );
            })}

          {paginaAtual < totalPaginas && (
            <Link
              href={`/?page=${paginaAtual + 1}`}
              className="px-3 py-1 rounded bg-gray-300 dark:bg-gray-700 hover:bg-gray-400 dark:hover:bg-gray-600 transition"
            >
              Próximo
            </Link>
          )}
        </div>
      )}
    </section>
  );
}

type Post = {
    slug: string;
    titulo: string;
    thumb: string;
    categoria: string;
    resumo?: string;
    tempoLeitura?: number;
    data: string; 
  };
