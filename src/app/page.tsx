// src/app/page.tsx
import fs from "fs/promises";
import path from "path";
import Link from "@/components/SmartLink"; // usa o seu link customizado
import Header from "@/components/Header";
import React from "react";
import ProdutosAmazon from "@/components/ProdutosAmazon";
import WebStories from "@/components/WebStories";
import Especiais from "@/components/Especiais";
import UltimasNoticias from "@/components/UltimasNoticias";
import matter from "gray-matter";
import Image from "next/image";
import SecaoCriticasRecentes from "@/components/SecaoCriticasRecentes";
import { PostResumo } from "@/types/post";


type Banner = {
  slug: string;
  titulo: string;
  thumb: string;
  categoria: string;
};

type BannerCache = {
  data: string;
  [categoria: string]: Banner[] | string;
};

async function carregarCacheBanners(): Promise<BannerCache> {
  try {
    const data = await fs.readFile(path.join(process.cwd(), "public/cache-banners.json"), "utf-8");
    return JSON.parse(data);
  } catch {
    return {
      data: "",
      filmes: [],
      games: [],
      series: [],
    };
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
  autor: string;
  reescrito?: boolean;
  tipo?: string;
  textoLength: number;
  capaObra?: string;
  tituloPortugues?: string;
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

  // 📥 Carrega posts.json apenas para "Últimas Notícias"
  const postsJsonRaw = await fs.readFile(path.join(process.cwd(), "public/posts.json"), "utf-8");
  const jsonPosts: Post[] = (JSON.parse(postsJsonRaw) as Post[])
  .filter((p) =>
    typeof p.slug === "string" &&
    typeof p.titulo === "string" &&
    typeof p.thumb === "string" &&
    typeof p.categoria === "string"
  )
  .map((p) => ({
    ...p,
    tempoLeitura: Math.ceil((p.texto || "").split(/\s+/).length / 200),
  }))
  .sort((a, b) => new Date(b.data || "").getTime() - new Date(a.data || "").getTime());


  const postsPorPagina = 9;
  const paginaAtual = parseInt(page || "1", 10);
  const totalPaginas = Math.ceil(jsonPosts.length / postsPorPagina);
  const exibidos = jsonPosts.slice((paginaAtual - 1) * postsPorPagina, paginaAtual * postsPorPagina);

  // 📂 Carrega arquivos .md para usar em stories, especiais e mais lidas
  const contentDir = path.join(process.cwd(), "content");
  const arquivos = await fs.readdir(contentDir);
  const posts: Post[] = [];

  for (const nomeArquivo of arquivos) {
    const arquivo = await fs.readFile(path.join(contentDir, nomeArquivo), "utf-8");
    const { data, content } = matter(arquivo);
    const tempoLeitura = Math.ceil(content.split(/\s+/).length / 200);

    if (
      data.slug &&
      data.title &&
      data.thumb &&
      data.categoria &&
      data.midia &&
      data.tipoMidia &&
      data.data &&
      !isNaN(new Date(data.data).getTime())
    ) {
      posts.push({
        slug: data.slug,
        titulo: data.title,
        thumb: data.thumb,
        categoria: data.categoria,
        data: data.data,
        texto: content,
        tempoLeitura,
        resumo: data.resumo || "",
        story: data.story === true,
        tags: data.tags || [],
        autor: data.author || "Equipe GeekNews",
        tipo: data.tipo || "",
        textoLength: content.length,
        capaObra: data.capaObra || "",
        tituloPortugues: data.tituloPortugues || "",
      });                  
    }
  }

  posts.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());

  const stories = posts.filter((p) => p.story);
  const maisLidas = [...posts].sort((a, b) => b.texto.length - a.texto.length).slice(0, 3);

  // 🔖 Mapeia posts com tags "especial-"
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

  // 🧊 Carrega cache de banners
  const cache = await carregarCacheBanners();
  const bannerFilmes = Array.isArray(cache["filmes"]) ? cache["filmes"][0] : undefined;
  const bannerGames = Array.isArray(cache["games"]) ? cache["games"][0] : undefined;
  const bannerSeries = Array.isArray(cache["series-e-tv"]) ? cache["series-e-tv"][0] : undefined;

  const criticasRecentes: PostResumo[] = posts
  .filter((p) => p.tipo === "critica")
  .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
  .slice(0, 6);


  return (
    <>
      <Header />
      {stories.length > 0 && <WebStories stories={stories} />}
      {/* BANNERS PRINCIPAIS */}
      <section className="max-w-6xl mx-auto px-6 pt-2 pb-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        {bannerFilmes && (
          <Link
            href={`/noticia/${bannerFilmes.slug}`}
            className="md:col-span-2 relative aspect-[5/3.33] rounded-xl overflow-hidden shadow-lg group"
          >
            <Image
              src={bannerFilmes.thumb}
              alt={bannerFilmes.titulo}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300 rounded-xl"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-black/20" />
            <div className="relative z-10 p-6 text-white flex flex-col justify-end h-full transition-opacity duration-300 group-hover:opacity-95">
              <span className="text-sm uppercase text-orange-400 font-bold">{bannerFilmes.categoria}</span>
              <h2 className="text-2xl md:text-3xl font-extrabold leading-tight mt-1">{bannerFilmes.titulo}</h2>
            </div>
          </Link>
        )}

        <div className="flex flex-col gap-4">
          {bannerSeries && (
            <Link
              href={`/noticia/${bannerSeries.slug}`}
              className="relative aspect-[3/2] rounded-xl overflow-hidden shadow-md group"
            >
              <Image
                src={bannerSeries.thumb}
                alt={bannerSeries.titulo}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300 rounded-xl"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-black/10 rounded-xl" />
              <div className="relative z-10 p-4 text-white flex flex-col justify-end h-full transition-opacity duration-300 group-hover:opacity-95">
                <span className="text-xs uppercase text-orange-400 font-bold">{bannerSeries.categoria}</span>
                <h3 className="text-md font-semibold leading-tight mt-1 line-clamp-2">{bannerSeries.titulo}</h3>
              </div>
            </Link>
          )}

          {bannerGames && (
            <Link
              href={`/noticia/${bannerGames.slug}`}
              className="relative aspect-[3/2] rounded-xl overflow-hidden shadow-md group"
            >
              <Image
                src={bannerGames.thumb}
                alt={bannerGames.titulo}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300 rounded-xl"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-black/10 rounded-xl" />
              <div className="relative z-10 p-4 text-white flex flex-col justify-end h-full transition-opacity duration-300 group-hover:opacity-95">
                <span className="text-xs uppercase text-orange-400 font-bold">{bannerGames.categoria}</span>
                <h3 className="text-md font-semibold leading-tight mt-1 line-clamp-2">{bannerGames.titulo}</h3>
              </div>
            </Link>
          )}
        </div>
      </section>

      <Especiais especiais={especiaisMapeadoPorTag} />

      <SecaoCriticasRecentes posts={criticasRecentes} />


      <main className="max-w-6xl mx-auto px-6 py-10">
        {/* Seção principal com duas colunas */}
        <div className="flex flex-col lg:flex-row gap-10">
          <div className="flex-1">
            <div className="h-32 mb-6 flex items-center justify-center">
            <Link href="https://amzn.to/44tCLGl" target="_blank" rel="noopener noreferrer">
              <Image
                src="/images/banners/banner-amazon-gamer.jpg"
                alt="Banner Amazon"
                width={764}
                height={128}
                priority={false}
              />
            </Link>
            </div>
            <UltimasNoticias
              posts={exibidos}
              paginaAtual={paginaAtual}
              totalPaginas={totalPaginas}
            />
          </div>

          <aside className="w-full lg:w-[300px] flex-shrink-0 space-y-10">
            <div className="h-32 flex items-center justify-center">
            <Link href="https://amzn.to/3GquJ76" target="_blank" rel="noopener noreferrer">
              <Image
                src="/images/banners/banner-amazon-livros.jpg"
                alt="Banner Amazon"
                width={300}
                height={128}
                priority={false}
                unoptimized
              />
            </Link>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 italic mt-8">
              Esta página pode conter links afiliados. Ao comprar por eles, você apoia o GeekNews sem pagar nada a mais por isso.
            </p>

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
                  Guias
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
                    href={`/noticia/criar-servidor-minecraft-de-graca`}
                    className="flex items-start gap-4 bg-orange-100 dark:bg-orange-400 p-4 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                  >
                    <span className="text-3xl font-light text-gray-400 dark:text-gray-800 w-6">6</span>
                    <p className="text-sm text-gray-800 hover:text-gray-900 dark:text-gray-800 hover:dark:text-gray-200 leading-snug">
                    <b>Criar servidor Minecraft de graça:</b> guia completo
                    </p>
                  </Link>
                  <Link
                    href={`/noticia/jogos-multiplayer-local-sofa`}
                    className="flex items-start gap-4 bg-orange-100 dark:bg-orange-400 p-4 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                  >
                    <span className="text-3xl font-light text-gray-400 dark:text-gray-800 w-6">7</span>
                    <p className="text-sm text-gray-800 hover:text-gray-900 dark:text-gray-800 hover:dark:text-gray-200 leading-snug">
                    <b>Multiplayer local:</b> 15 jogos incríveis para jogar com amigos no sofá
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
          {/*<div className="bg-gray-200 dark:bg-gray-800 h-40 rounded-lg flex items-center justify-center text-sm text-gray-500 dark:text-gray-400">
            Espaço reservado para publicidade
          </div> */}
        </div>
      </main>
    </>
  );
}
