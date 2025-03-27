// src/app/page.tsx
import fs from "fs/promises";
import path from "path";
import matter from "gray-matter";
import Link from "next/link";
import Header from "@/components/Header";
import React from "react";

interface HomePageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const { page } = await searchParams;
  const arquivos = await fs.readdir(path.join(process.cwd(), "content"));
  const posts = [];

  for (const nomeArquivo of arquivos) {
    const arquivo = await fs.readFile(path.join(process.cwd(), "content", nomeArquivo), "utf-8");
    const { data, content } = matter(arquivo);
    const tempoLeitura = Math.ceil(content.split(/\s+/).length / 200);

    posts.push({
      slug: data.slug,
      titulo: data.title,
      thumb: data.thumb,
      resumo: data.resumo,
      categoria: data.categoria,
      data: data.data,
      texto: content,
      tempoLeitura,
    });
  }

  posts.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());

  const maisLidas = [...posts].sort((a, b) => b.texto.length - a.texto.length).slice(0, 3);

  const postsPorPagina = 9;
  const paginaAtual = parseInt(page || "1", 10);
  const totalPaginas = Math.ceil(posts.length / postsPorPagina);
  const exibidos = posts.slice((paginaAtual - 1) * postsPorPagina, paginaAtual * postsPorPagina);

  return (
    <>
      <Header />
      <main className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex flex-col lg:flex-row gap-10">
          <div className="flex-1">
            <div className="bg-gray-200 dark:bg-gray-800 h-32 mb-6 rounded-lg flex items-center justify-center text-sm text-gray-500 dark:text-gray-400">
              Espaço reservado para publicidade
            </div>
            <h1 className="text-4xl font-extrabold capitalize mb-8 text-neutral-900 dark:text-white">
              Últimas Notícias
            </h1>

            <div className="space-y-8">
              {exibidos.map((post) => (
                <Link
                  key={post.slug}
                  href={`/noticia/${post.slug}`}
                  className="flex gap-4 bg-white dark:bg-gray-900 p-4 rounded-lg shadow hover:shadow-md hover:bg-gray-100 dark:hover:bg-gray-800 transition overflow-hidden"
                >
                  {post.thumb && (
                    <img
                      src={post.thumb}
                      alt={post.titulo}
                      className="w-40 h-28 object-cover flex-shrink-0"
                    />
                  )}
                  <div className="py-2 pr-4 flex flex-col justify-center">
                    <p className="text-orange-500 text-xs font-bold uppercase mb-1">{post.categoria}</p>
                    <h2 className="text-md font-semibold text-neutral-900 dark:text-white leading-snug">
                      {post.titulo}
                    </h2>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      {new Date(post.data).toLocaleDateString("pt-BR")} • {post.tempoLeitura} min de leitura
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">{post.resumo}</p>
                  </div>
                </Link>
              ))}
            </div>

            {totalPaginas > 1 && (
              <div className="mt-10 flex justify-center items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                {/* Anterior */}
                {paginaAtual > 1 && (
                  <Link
                    href={`/?page=${paginaAtual - 1}`}
                    className="px-3 py-1 rounded bg-gray-300 dark:bg-gray-700 hover:bg-gray-400 dark:hover:bg-gray-600 transition"
                  >
                    Anterior
                  </Link>
                )}

                {/* Páginas com limite de exibição */}
                {Array.from({ length: totalPaginas }, (_, i) => i + 1)
                  .filter((n) =>
                    n === 1 ||
                    n === totalPaginas ||
                    Math.abs(n - paginaAtual) <= 2
                  )
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

                {/* Próximo */}
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
          </div>

          <aside className="w-full lg:w-[300px] flex-shrink-0 space-y-10">
            <div className="bg-gray-200 dark:bg-gray-800 h-32 rounded-lg flex items-center justify-center text-sm text-gray-500 dark:text-gray-400">
              Espaço reservado para publicidade
            </div>

            <section className="mb-8">
              <div className="flex items-center justify-between mb-4 border-b pb-2">
                <h2 className="text-sm uppercase tracking-widest font-semibold text-gray-600 dark:text-gray-300">
                  Mais lidas
                </h2>
              </div>
              <div className="space-y-3">
                {maisLidas.map((post, index) => (
                  <Link
                    key={index}
                    href={`/noticia/${post.slug}`}
                    className="flex items-start gap-4 bg-gray-100 dark:bg-gray-800 p-4 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                  >
                    <span className="text-3xl font-light text-gray-400 dark:text-gray-500 w-6">{index + 1}</span>
                    <p className="text-sm text-gray-900 dark:text-gray-200 leading-snug">
                      {post.titulo}
                    </p>
                  </Link>
                ))}
              </div>
            </section>

            <div className="bg-gray-200 dark:bg-gray-800 h-96 rounded-lg flex items-center justify-center text-sm text-gray-500 dark:text-gray-400">
              Espaço reservado para publicidade
            </div>
          </aside>
        </div>
      </main>

      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="bg-gray-200 dark:bg-gray-800 h-40 rounded-lg flex items-center justify-center text-sm text-gray-500 dark:text-gray-400">
          Espaço reservado para publicidade
        </div>
      </div>
    </>
  );
}
