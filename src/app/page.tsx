// src/app/page.tsx
import fs from "fs/promises";
import path from "path";
import matter from "gray-matter";
import Link from "@/components/SmartLink"; // usa o seu link customizado
import Header from "@/components/Header";
import React from "react";
import ProdutosAmazon from "@/components/ProdutosAmazon";
import WebStories from "@/components/WebStories";
import Especiais from "@/components/Especiais";

type Banner = {
  slug: string;
  titulo: string;
  thumb: string;
  categoria: string;
};

type BannerCache = {
  data: string;
  filmes?: Banner;
  games?: Banner;
  series?: Banner;
};

async function carregarCacheBanners(): Promise<BannerCache> {
  try {
    const data = await fs.readFile(path.join(process.cwd(), "public/cache-banners.json"), "utf-8");
    return JSON.parse(data);
  } catch {
    return { data: "", filmes: undefined, games: undefined, series: undefined };
  }
}

interface Post {
  slug: string;
  titulo: string;
  thumb: string;
  categoria: string;
  data: string;
  texto: string;
  tempoLeitura: number;
  resumo: string;
  story?: boolean; 
  tags?: string[];
}

export const metadata = {
  title: "GeekNews - As Melhores Notícias Geek do Brasil e do Mundo",
  keywords: "GeekNews, notícias, filmes, séries, games, mangás, animes",
  description: "Fique por dentro das novidades de filmes, séries, games, mangás e animes no GeekNews. Atualizações diárias com conteúdo relevante para os fãs da cultura pop.",
  alternates: {
    canonical: "https://www.geeknews.com.br",
  },
};

export default async function HomePage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const { page } = await searchParams;
  const arquivos = await fs.readdir(path.join(process.cwd(), "content"));
  const posts: Post[] = [];

  const postsJson = await fs.readFile(path.join(process.cwd(), "public/posts.json"), "utf-8");
  type ResumoItem = { slug: string; resumo: string };
  const resumoMap = Object.fromEntries((JSON.parse(postsJson) as ResumoItem[]).map((p) => [p.slug, p.resumo]));

  for (const nomeArquivo of arquivos) {
    const arquivo = await fs.readFile(path.join(process.cwd(), "content", nomeArquivo), "utf-8");
    const { data, content } = matter(arquivo);
    const tempoLeitura = Math.ceil(content.split(/\s+/).length / 200);

    if (
      data.slug &&
      data.title &&
      data.thumb &&
      data.categoria &&
      data.midia &&
      data.tipoMidia &&
      data.data
    ) {
      posts.push({
        slug: data.slug,
        titulo: data.title,
        thumb: data.thumb,
        categoria: data.categoria,
        data: data.data,
        texto: content,
        tempoLeitura,
        resumo: resumoMap[data.slug] || "",
        story: data.story === true,
        tags: data.tags || [], // ADICIONE ESTA LINHA
      });      
    } else {
      console.warn(`Post ignorado: ${nomeArquivo} está com campos faltando no frontmatter.`);
    }       
  }

  posts.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
  // Agrupar por tags especiais (que começam com "especial-")
  const especiaisMapeadoPorTag: Record<string, Post[]> = {};

  for (const post of posts) {
    const tags = post.tags || [];
    for (const tag of tags) {
      if (tag.startsWith("especial-")) {
        if (!especiaisMapeadoPorTag[tag]) {
          especiaisMapeadoPorTag[tag] = [];
        }
        if (especiaisMapeadoPorTag[tag].length < 3) {
          especiaisMapeadoPorTag[tag].push(post);
        }
      }
    }
  }
  const cache = await carregarCacheBanners();

  const stories = posts.filter((p) => p.story === true);

  const bannerFilmes = cache.filmes;
  const bannerGames = cache.games;
  const bannerSeries = cache.series;

  const maisLidas = [...posts].sort((a, b) => b.texto.length - a.texto.length).slice(0, 3);

  const postsPorPagina = 9;
  const paginaAtual = parseInt(page || "1", 10);
  const totalPaginas = Math.ceil(posts.length / postsPorPagina);
  const exibidos = posts.slice((paginaAtual - 1) * postsPorPagina, paginaAtual * postsPorPagina);

  return (
    <>
      <Header />
      {stories.length > 0 && <WebStories stories={stories} />}
      {/* BANNERS PRINCIPAIS */}
      <section className="max-w-6xl mx-auto px-6 pt-2 pb-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        {bannerFilmes && (
          <Link
            href={`/noticia/${bannerFilmes.slug}`}
            className="md:col-span-2 h-[320px] md:h-[400px] bg-cover bg-center rounded-xl flex items-end p-6 text-white relative shadow-lg"
            style={{ backgroundImage: `url(${bannerFilmes.thumb})` }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-black/20 rounded-xl" />
            <div className="relative z-10">
              <span className="text-sm uppercase text-orange-400 font-bold">{bannerFilmes.categoria}</span>
              <h2 className="text-2xl md:text-3xl font-extrabold leading-tight mt-1">{bannerFilmes.titulo}</h2>
            </div>
          </Link>
        )}

        <div className="flex flex-col gap-4">
          {bannerSeries && (
            <Link
            href={`/noticia/${bannerSeries.slug}`}
            className="h-[190px] bg-cover bg-center rounded-xl flex items-end p-4 text-white relative shadow-md"
            style={{ backgroundImage: `url(${bannerSeries.thumb})` }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-black/10 rounded-xl" />
            <div className="relative z-10">
              <span className="text-xs uppercase text-orange-400 font-bold">{bannerSeries.categoria}</span>
              <h3 className="text-md font-semibold leading-tight mt-1 line-clamp-2">{bannerSeries.titulo}</h3>
            </div>
          </Link>
          )}
          {bannerGames && (
            <Link
            href={`/noticia/${bannerGames.slug}`}
            className="h-[190px] bg-cover bg-center rounded-xl flex items-end p-4 text-white relative shadow-md"
            style={{ backgroundImage: `url(${bannerGames.thumb})` }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-black/10 rounded-xl" />
            <div className="relative z-10">
              <span className="text-xs uppercase text-orange-400 font-bold">{bannerGames.categoria}</span>
              <h3 className="text-md font-semibold leading-tight mt-1 line-clamp-2">{bannerGames.titulo}</h3>
            </div>
          </Link>
          )}
        </div>
      </section>
      <Especiais especiais={especiaisMapeadoPorTag} />
      <main className="max-w-6xl mx-auto px-6 py-10">
        {/* Seção principal com duas colunas */}
        <div className="flex flex-col lg:flex-row gap-10">
          <div className="flex-1">
            <div className="bg-gray-200 dark:bg-gray-800 h-32 mb-6 rounded-lg flex items-center justify-center text-sm text-gray-500 dark:text-gray-400">
              Espaço reservado para publicidade
            </div>
            <h1 className="text-3xl font-extrabold capitalize mb-8 text-neutral-900 dark:text-white">
              Últimas Notícias
            </h1>

            <div className="space-y-8">
              {exibidos.map((post) => (
                <Link
                  key={post.slug}
                  href={`/noticia/${post.slug}`}
                  className="flex flex-col sm:flex-row gap-5 bg-white dark:bg-gray-900 p-5 rounded-xl shadow hover:shadow-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition overflow-hidden"
                >
                  {post.thumb && (
                    <img
                      src={post.thumb}
                      alt={post.titulo}
                      className="w-full sm:w-60 h-40 sm:h-36 object-cover rounded-lg"
                    />
                  )}
                  <div className="flex flex-col justify-between">
                    <div>
                      <p className="text-orange-500 text-xs font-bold uppercase mb-1">{post.categoria}</p>
                      <h2 className="text-lg font-semibold text-neutral-900 dark:text-white leading-snug">
                        {post.titulo}
                      </h2>
                    </div>
                    <div className="text-xs text-gray-400 dark:text-gray-500 mt-2 flex items-center gap-2">
                      <span>{new Date(post.data).toLocaleDateString("pt-BR")}</span>
                      <span>•</span>
                      <span>{post.tempoLeitura} min de leitura</span>
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
            <section className="mb-8">
              <div className="flex items-center justify-between mb-4 border-b pb-2">
                <h2 className="text-sm uppercase tracking-widest font-semibold text-gray-600 dark:text-gray-300">
                  Recomendados
                </h2>
              </div>
              <div className="space-y-3">
                
                  <Link
                    href={`/noticia/como-jogar-rpg-de-mesa`}
                    className="flex items-start gap-4 bg-orange-100 dark:bg-orange-200 p-4 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                  >
                    <span className="text-3xl font-light text-gray-400 dark:text-gray-800 w-6">4</span>
                    <p className="text-sm text-gray-800 hover:text-gray-900 dark:text-gray-800 hover:dark:text-gray-200 leading-snug">
                    <b>Como Começar a Jogar RPG de Mesa:</b> Guia Passo a Passo para Iniciantes
                    </p>
                  </Link>
                  <Link
                    href={`/noticia/dicionario-geek-termos-nerds`}
                    className="flex items-start gap-4 bg-orange-100 dark:bg-orange-300 p-4 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                  >
                    <span className="text-3xl font-light text-gray-400 dark:text-gray-800 w-6">5</span>
                    <p className="text-sm text-gray-800 hover:text-gray-900 dark:text-gray-800 hover:dark:text-gray-200 leading-snug">
                    <b>Dicionário Geek:</b> 50 Termos que Todo Nerd Precisa Conhecer
                    </p>
                  </Link>
                  <Link
                    href={`/noticia/historia-dos-videogames`}
                    className="flex items-start gap-4 bg-orange-100 dark:bg-orange-400 p-4 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                  >
                    <span className="text-3xl font-light text-gray-400 dark:text-gray-800 w-6">6</span>
                    <p className="text-sm text-gray-800 hover:text-gray-900 dark:text-gray-800 hover:dark:text-gray-200 leading-snug">
                    <b>A História dos Videogames:</b> Da Era Atari à Geração Atual
                    </p>
                  </Link>
                
              </div>
            </section>

            <div className="">
              {posts[0] && <ProdutosAmazon categoria={posts[0].categoria} />}
            </div>
          </aside>
        </div>

        <div className="mt-10">
          <div className="bg-gray-200 dark:bg-gray-800 h-40 rounded-lg flex items-center justify-center text-sm text-gray-500 dark:text-gray-400">
            Espaço reservado para publicidade
          </div>
        </div>
      </main>
    </>
  );
}
