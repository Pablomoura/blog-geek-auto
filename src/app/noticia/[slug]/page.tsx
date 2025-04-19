import fs from "fs/promises";
import path from "path";
import matter from "gray-matter";
import { notFound } from "next/navigation";
import fsExtra from "fs-extra";
import Header from "@/components/Header";
import Link from "@/components/SmartLink";
import Script from "next/script";
import React from "react";
import DOMPurify from "isomorphic-dompurify";
import ProdutosAmazon from "@/components/ProdutosAmazon";
import { aplicarLinksInternosInteligente } from "@utils/autoLinks";
import { marked } from "marked";
import { markedHighlight } from "marked-highlight";
import { gfmHeadingId } from "marked-gfm-heading-id";
import hljs from "highlight.js";
import "highlight.js/styles/github-dark.css";
import TwitterLoader from "@/components/TwitterLoader";
import Image from "next/image";
import { PostResumo } from "@/types/post";
import { loadPostCache } from "@/utils/loadPostCache";
import LazyDisqus from "@/components/LazyDisqus";
import { otimizarImagensHtml } from "@/utils/otimizarImagensHtml";
import type { Metadata } from "next";
import JsonLdNoticia from "@/components/JsonLdNoticia";
import InstagramLoader from "@/components/InstagramLoader";
import autores from "@/data/autores.json";
import CompartilharNoticia from "@/components/CompartilharNoticia";
import FichaTecnica from "@/components/FichaTecnica";
import PostsRelacionados, { getPostsRelacionados } from "@/components/PostsRelacionados";

marked.use(
  gfmHeadingId({ prefix: "heading-" }),
  markedHighlight({
    langPrefix: "hljs language-",
    highlight(code: string) {
      return hljs.highlightAuto(code).value;
    },
  })
);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const filePath = path.join(process.cwd(), "content", `${slug}.md`);

  try {
    const file = await fs.readFile(filePath, "utf-8");
    const { data } = matter(file);

    const imageUrl =
      data.thumb?.startsWith("http") || data.midia?.startsWith("http")
        ? data.thumb || data.midia
        : `https://www.geeknews.com.br${data.thumb || data.midia || ""}`;

    const canonicalUrl = `https://www.geeknews.com.br/noticia/${slug}`;

    return {
      title: data.title,
      description: data.resumo,
      keywords: data.tags || [],
      alternates: {
        canonical: canonicalUrl, 
      },
      openGraph: {
        title: data.title,
        description: data.resumo,
        type: "article",
        url: canonicalUrl,
        images: [
          {
            url: imageUrl,
            width: 800,
            height: 450,
            alt: data.title,
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title: data.title,
        description: data.resumo,
        images: [imageUrl],
        site: "@SiteGeekNews",
      },
    };
  } catch {
    return {
      title: "Notícia não encontrada",
      description: "Este artigo pode ter sido removido ou ainda não foi publicado.",
    };
  }
}

async function inserirLinksRelacionados(content: string, slugAtual: string) {
  const todosPosts = await loadPostCache();
  const atual = todosPosts.find((p) => p.slug === slugAtual);
  if (!atual || !atual.tags) return content;

  const tagsAtuais = atual.tags.map((t) => t.toLowerCase());
  const links = [];

  for (const post of todosPosts) {
    if (post.slug === slugAtual) continue;
    const tagsComparar = (post.tags || []).map((t) => t.toLowerCase());
    const temMatch = tagsAtuais.some((tag) => tagsComparar.includes(tag));
    if (temMatch) links.push({ title: post.titulo, slug: post.slug });
    if (links.length === 2) break;
  }

  if (links.length === 0) return content;

  const bloco = `
    <ul class="pl-5 mb-6 space-y-2">
      ${links
        .map(
          (link) =>
            `<li class="list-disc text-sm text-orange-700 dark:text-orange-400">
              <a href="/noticia/${link.slug}" class="hover:underline italic">${link.title}</a>
            </li>`
        )
        .join("\n")}
    </ul>
  `;

  const paragrafos = content.split("</p>");
  if (paragrafos.length > 2) {
    paragrafos.splice(2, 0, bloco);
  } else {
    paragrafos.push(bloco);
  }

  return paragrafos.join("</p>");
}

export default async function NoticiaPage(props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params;
  const filePath = path.join(process.cwd(), "content", `${slug}.md`);

  try {
    const file = await fs.readFile(filePath, "utf-8");
    const { data, content } = matter(file);
    const tempoLeitura = Math.ceil(content.split(" ").length / 200);
    const publicadoEm = new Date(data.data).toLocaleDateString("pt-BR");
    const atualizadoEm = data.atualizado_em
    ? new Date(data.atualizado_em).toLocaleDateString("pt-BR")
    : null;

    // Verifica se já existe HTML no cache
    const cacheDir = path.join(process.cwd(), "public", "cache", "html");
    const htmlPath = path.join(cacheDir, `${slug}.html`);

    let htmlContent: string;

    if (await fsExtra.pathExists(htmlPath)) {
      htmlContent = await fs.readFile(htmlPath, "utf-8");
    } else {
      let textoFinal = await inserirLinksRelacionados(content, slug);

      // YouTube embed antes de converter para HTML
      textoFinal = textoFinal.replace(/\[youtube\]:\s*(https:\/\/www\.youtube\.com\/watch\?v=([a-zA-Z0-9_-]+))/g, (_match, url, videoId) => {
        return `
          <div class="relative pb-[56.25%] h-0 overflow-hidden rounded-lg shadow-lg my-8">
            <iframe
              src="https://www.youtube.com/embed/${videoId}"
              title="YouTube video"
              class="absolute top-0 left-0 w-full h-full"
              frameborder="0"
              allowfullscreen
              loading="lazy"
            ></iframe>
          </div>
        `;
      });

      // ✅ converte o markdown para HTML
      const htmlConvertido = await marked.parse(textoFinal);

      // ✅ aplica os links internos no HTML (agora sim no ponto certo)
      const htmlComLinksInternos = await aplicarLinksInternosInteligente(htmlConvertido, slug);

      // Link externo target blank
      const htmlComTargetBlank = htmlComLinksInternos.replace(
        /<a\s+(?![^>]*target=)[^>]*href="([^"]+)"([^>]*)>/g,
        '<a href="$1"$2 target="_blank" rel="noopener noreferrer">'
      );

      // Sanitiza e otimiza
      const htmlSanitizado = DOMPurify.sanitize(htmlComTargetBlank, {
        ADD_TAGS: ["iframe"],
        ADD_ATTR: [
          "allow",
          "allowfullscreen",
          "frameborder",
          "scrolling",
          "src",
          "title",
          "loading",
          "class",
          "target",
          "rel",
        ],
      });

      htmlContent = otimizarImagensHtml(htmlSanitizado);

      // ✅ Agora salva o HTML com os links aplicados no cache
      await fsExtra.ensureDir(cacheDir);
      await fs.writeFile(htmlPath, htmlContent);

    }

    const todosPosts: PostResumo[] = await loadPostCache();
    const relacionados = getPostsRelacionados(slug, data.tags || [], data.categoria, todosPosts);
    const maisLidas = [...todosPosts].sort((a, b) => b.textoLength - a.textoLength).slice(0, 3);

    return (
        <>
          <Header />
          <JsonLdNoticia
            slug={slug}
            data={{
              title: data.title,
              resumo: data.resumo,
              thumb: data.thumb,
              midia: data.midia,
              data: data.data,
              author: data.author,
            }}
          />

          <Script src="https://platform.twitter.com/widgets.js" strategy="afterInteractive" />
          <Script src="https://www.instagram.com/embed.js" strategy="afterInteractive" />
  
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

            {/* Banner reservado para publicidade
            <div className="w-full bg-gray-200 dark:bg-gray-800 h-32 mt-8 mb-8 rounded-lg flex items-center justify-center text-sm text-gray-500 dark:text-gray-400">
            Reservado Para Publicidade
            </div> */}
  
            <div className="flex flex-col lg:flex-row gap-14">
              <main className="flex-1 w-full lg:pr-10 py-10 text-neutral-900 dark:text-white">
                <span className="text-orange-500 uppercase text-sm font-bold tracking-wide">{data.categoria}</span>
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mt-2 mb-6">{data.title}</h1>
                {data.experiencia && (
                  <div className="mb-4">
                    <span className="inline-block bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 text-xs font-bold px-3 py-1 rounded-full">
                      Experiência Real 🔥
                    </span>
                  </div>
                )}

                <CompartilharNoticia titulo={data.title} />
                <p className="text-neutral-600 dark:text-gray-400 text-sm mb-6">
                  Por{" "}
                  <Link
                    href={`/autor/${data.author
                      .toLowerCase()
                      .normalize("NFD")
                      .replace(/[\u0300-\u036f]/g, "")
                      .replace(/[^a-z0-9]+/g, "-")
                      .replace(/^-+|-+$/g, "")}`}
                    className="font-medium text-black dark:text-white hover:underline"
                  >
                    {data.author}
                  </Link>{" "}
                  • Publicado em {publicadoEm}
                  {atualizadoEm && <> • Atualizado em {atualizadoEm}</>} • {tempoLeitura} min de leitura
                </p>
  
                {data.tipoMidia === "imagem" && (
                  <Image
                  src={data.midia}
                  alt={data.title}
                  width={800}
                  height={450}
                  sizes="(max-width: 768px) 100vw, 800px"
                  className="w-full rounded-lg shadow-lg mb-6"
                  priority
                  />
                )}
  
                {data.tipoMidia === "video" && (
                  <div className="relative pb-[56.25%] mb-6 h-0 overflow-hidden rounded-lg shadow-lg">
                    <iframe
                      src={data.midia}
                      title={data.title}
                      className="absolute top-0 left-0 w-full h-full"
                      frameBorder="0"
                      allowFullScreen
                      loading="lazy"
                    />
                  </div>
                )}
  
                <div
                  className="prose dark:prose-invert max-w-none mb-16"
                  dangerouslySetInnerHTML={{ __html: htmlContent }}
                />
                <TwitterLoader />
                <InstagramLoader />

                {data.tipo === "critica" && data.notaCritico && (
                    <FichaTecnica
                      capa={data.capaObra || data.thumb}
                      tituloPortugues={data.tituloPortugues || data.title}
                      tituloOriginal={data.tituloOriginal}
                      nota={data.notaCritico}
                      ano={data.ano}
                      pais={data.pais}
                      classificacao={data.classificacao}
                      duracao={data.duracao}
                      direcao={data.direcao}
                      elenco={data.elenco}
                    />
                  )}

                <CompartilharNoticia titulo={data.title} />
                  {/* ✅ Links internos */}

                {/* ✅ Tags clicáveis */}
                {Array.isArray(data.tags) && data.tags.length > 0 && (
                  <div className="mt-10 border-t border-gray-700 pt-6">
                    <h3 className="text-sm uppercase font-bold text-neutral-800 dark:text-white mb-3">Tags:</h3>
                    <div className="flex flex-wrap gap-2">
                      {data.tags.map((tag: string) => (
                        <Link
                          key={tag}
                          href={`/tag/${tag
                            .toLowerCase()
                            .normalize("NFD")
                            .replace(/[\u0300-\u036f]/g, "")  // remove acentos
                            .replace(/[^a-z0-9]+/g, "-")      // remove tudo que não for letra/número e troca por "-"
                            .replace(/^-+|-+$/g, "")}`}       // remove traços no início/fim                                                    
                          className="bg-orange-100 dark:bg-gray-800 text-orange-600 dark:text-orange-400 text-xs px-3 py-1 rounded-full hover:bg-orange-200 dark:hover:bg-gray-700 transition"
                        >
                          #{tag}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
                
                {data.author && (
                  <div className="mt-12 border-t border-gray-700 pt-8 flex items-start gap-6 bg-orange-50 dark:bg-gray-900 p-6 rounded-lg shadow">
                    <Image
                      src={
                        autores.find((a) => a.nome === data.author)?.imagem ||
                        "https://www.geeknews.com.br/images/autores/default.jpg"
                      }
                      alt={data.author}
                      width={80}
                      height={80}
                      className="rounded-full border-2 border-orange-400"
                    />
                    <div>
                    <Link
                      href={`/autor/${data.author
                        .toLowerCase()
                        .normalize("NFD")
                        .replace(/[\u0300-\u036f]/g, "")
                        .replace(/[^a-z0-9]+/g, "-")
                        .replace(/^-+|-+$/g, "")}`}
                      className="text-lg font-bold text-neutral-900 dark:text-white hover:underline"
                    >
                      {data.author}
                    </Link>
                      <p className="text-sm text-gray-700 dark:text-gray-400 mt-1">
                        {autores.find((a) => a.nome === data.author)?.bio}
                      </p>
                    </div>
                  </div>
                )}
                
                <PostsRelacionados posts={relacionados} />

              <div id="disqus_thread" className="mt-12" />
              <LazyDisqus slug={slug} />
              <Script
                id="twitter-widgets"
                strategy="afterInteractive"
                src="https://platform.twitter.com/widgets.js"
              />
              <noscript>
                Por favor, habilite o JavaScript para visualizar os{" "}
                <a href="https://disqus.com/?ref_noscript">comentários fornecidos pelo Disqus</a>.
              </noscript>
            </main>
            <aside className="w-full lg:w-[320px] flex-shrink-0 space-y-10 mt-10">
              <div className="h-32 flex items-center justify-center">
                          <Link href="https://amzn.to/3GquJ76" target="_blank" rel="noopener noreferrer">
                            <Image
                              src="/images/banners/banner-amazon-livros.jpg"
                              alt="Banner Amazon"
                              width={300}
                              height={128}
                              priority={false}
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
                  <span className="text-yellow-500 text-xl">★</span>
                </div>
                <div className="space-y-3">
                  {maisLidas.map((post, index) => (
                    <Link
                      key={index}
                      href={`/noticia/${post.slug}`}
                      className="flex items-start gap-4 bg-gray-100 dark:bg-gray-800 p-4 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                    >
                      <span className="text-3xl font-light text-gray-400 dark:text-gray-500 w-6">{index + 1}</span>
                      <p className="text-sm text-gray-900 dark:text-gray-200 leading-snug">{post.titulo}</p>
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

              <div>
                
                {todosPosts[0] && <ProdutosAmazon categoria={data.categoria} />}
              </div>
            </aside>
          </div>
        </div>
                  
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
           {/* Banner reservado para publicidade
          <div className="bg-gray-200 dark:bg-gray-800 h-40 rounded-lg flex items-center justify-center text-sm text-gray-500 dark:text-gray-400">
            Publicidade
          </div>  */}
        </div>
      </>
    );
  } catch {
    return notFound();
  }
}
  