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
import { aplicarLinksInternosInteligente } from "@utils/autoLinks-jsdom";
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
import { inserirAnunciosNoTexto } from "@/utils/inserirAnunciosNoTexto";
import JsonLdBreadcrumb from "@/components/JsonLdBreadcrumb";
import Breadcrumb from "@/components/Breadcrumb";
import JsonLdReview from "@/components/JsonLdReview";
import YoutubeLite from "@/components/YoutubeLite";
import { sendErrorAlert } from "@/utils/sendErrorAlert";


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
      data.tipoMidia === "imagem"
        ? (data.midia?.startsWith("http") ? data.midia : `https://www.geeknews.com.br${data.midia}`)
        : (data.thumb?.startsWith("http") ? data.thumb : `https://www.geeknews.com.br${data.thumb}`);

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
    if (
        !data.title ||
        !data.slug ||
        !data.data ||
        !data.midia ||
        !content ||
        content.trim().length < 100
      ) {
        console.warn(`❌ Arquivo inválido ou incompleto: ${slug}`);
        await sendErrorAlert(slug, `Markdown inválido. Campos obrigatórios ausentes ou conteúdo vazio.`);
        return notFound();
      }
    const articleBody = content
      .replace(/[#>*_`-]/g, "") // remove markdown básico
      .replace(/\s+/g, " ")     // normaliza espaços
      .trim()
      .slice(0, 200);           // pega os primeiros 200 caracteres

    const wordCount = content.split(/\s+/).length;
    // Gera um reviewBody limpo com ~500 caracteres
    const reviewBody = content
      .replace(/[#>*_`-]/g, "") // remove markdown básico
      .replace(/\[.*?\]\(.*?\)/g, "") // remove links em markdown [texto](url)
      .replace(/!\[.*?\]\(.*?\)/g, "") // remove imagens em markdown ![alt](url)
      .replace(/<\/?[^>]+(>|$)/g, "") // remove HTML (se tiver)
      .replace(/\s+/g, " ") // normaliza espaços
      .trim()
      .slice(0, 500);
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
      if (!htmlContent || htmlContent.trim().length < 100) {
        console.warn(`❌ HTML cache inválido ou vazio para ${slug}`);
        await sendErrorAlert(slug, `HTML cache inválido ou vazio para o artigo.`);
        return notFound();
      }
    } else {
      let textoFinal = await inserirLinksRelacionados(content, slug);

      // YouTube embed antes de converter para HTML
      textoFinal = textoFinal.replace(
        /\[youtube\]:\s*(https:\/\/www\.youtube\.com\/watch\?v=([a-zA-Z0-9_-]+))/g,
        (_match, url, videoId) => {
          return `
            <div class="youtube-lite" data-videoid="${videoId}">
              <img src="https://i.ytimg.com/vi/${videoId}/hqdefault.jpg" alt="YouTube video thumbnail"/>
            </div>
          `;
        }
      );

      textoFinal = inserirAnunciosNoTexto(textoFinal);

      // ✅ converte o markdown para HTML
      let htmlConvertido = await marked.parse(textoFinal);

      // aplicar links internos no HTML convertido
      htmlConvertido = await aplicarLinksInternosInteligente(htmlConvertido);

      htmlConvertido = await inserirLinksRelacionados(htmlConvertido, slug);

      // Link externo target blank
      const htmlComTargetBlank = htmlConvertido.replace(
        /<a\s+(?![^>]*target=)[^>]*href="([^"]+)"([^>]*)>/g,
        '<a href="$1"$2 target="_blank" rel="noopener noreferrer">'
      );

      // Sanitiza e otimiza
      const htmlSanitizado = DOMPurify.sanitize(htmlComTargetBlank, {
        ADD_TAGS: ["iframe", "script"], // <-- adicionar script aqui
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
          "data-ad-client",
          "data-ad-slot",
          "data-ad-layout",
          "data-ad-format",
          "style",
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
              articleBody: articleBody,
              wordCount: wordCount,
              tags: data.tags,
            }}
          />
          <JsonLdBreadcrumb
            categoria={data.categoria}
            categoriaSlug={data.categoria.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-")}
            titulo={data.title}
            slug={slug}
          />
          <Breadcrumb
            categoria={data.categoria}
            categoriaSlug={data.categoria
              .toLowerCase()
              .normalize("NFD")
              .replace(/[\u0300-\u036f]/g, "")
              .replace(/[^a-z0-9]+/g, "-")}
            titulo={data.title}
          />

          <Script src="https://platform.twitter.com/widgets.js" strategy="afterInteractive" />
          <Script src="https://www.instagram.com/embed.js" strategy="afterInteractive" />
          <Script id="youtube-lite-init" strategy="afterInteractive">
            {`
              document.addEventListener("DOMContentLoaded", function () {
                document.querySelectorAll(".youtube-lite").forEach(function (el) {
                  el.addEventListener("click", function () {
                    const videoId = el.getAttribute("data-videoid");
                    const iframe = document.createElement("iframe");
                    iframe.setAttribute("src", "https://www.youtube.com/embed/" + videoId + "?autoplay=1");
                    iframe.setAttribute("frameborder", "0");
                    iframe.setAttribute("allowfullscreen", "true");
                    iframe.setAttribute("allow", "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture");
                    iframe.style.position = "absolute";
                    iframe.style.top = "0";
                    iframe.style.left = "0";
                    iframe.style.width = "100%";
                    iframe.style.height = "100%";
                    el.innerHTML = "";
                    el.appendChild(iframe);
                  });
                });
              });
            `}
          </Script>
  
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
  
                {data.tipoMidia === "imagem" && (() => {
                  try {
                    const isExternal = data.midia?.startsWith("http");
                    const isYoutube = data.midia?.includes("youtube.com") || data.midia?.includes("youtu.be");

                    // se for vídeo (embed de youtube) → não renderiza como imagem
                    if (isYoutube) return null;

                    // fallback se a midia estiver vazia
                    const imageUrl = data.midia
                      ? (isExternal ? data.midia : `https://www.geeknews.com.br${data.midia}`)
                      : "/images/default.jpg";

                    return (
                      <Image
                        src={imageUrl}
                        alt={data.title}
                        width={800}
                        height={450}
                        sizes="(max-width: 768px) 100vw, 800px"
                        className="w-full rounded-lg shadow-lg mb-6"
                        priority
                      />
                    );
                  } catch {
                    return null;
                  }
                })()}
  
                {data.tipoMidia === "video" && data.midia?.includes("youtube.com") && (
                  (() => {
                    try {
                      const urlObj = new URL(data.midia);
                      let videoId = urlObj.searchParams.get("v") || "";

                      if (!videoId && urlObj.pathname.startsWith("/embed/")) {
                        videoId = urlObj.pathname.split("/embed/")[1].split(/[?&]/)[0];
                      }

                      if (!videoId) return null;
                      return <YoutubeLite videoId={videoId} />;
                    } catch {
                      return null;
                    }
                  })()
                )}
  
                <div
                  className="prose dark:prose-invert max-w-none mb-16"
                  dangerouslySetInnerHTML={{ __html: htmlContent }}
                />
                <TwitterLoader />
                <InstagramLoader />

                {data.tipo === "critica" && data.notaCritico && (
                  <>
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
                    <JsonLdReview
                      data={{
                        title: data.title,
                        resumo: data.resumo,
                        url: `https://www.geeknews.com.br/noticia/${slug}`,
                        author: data.author,
                        notaCritico: data.notaCritico,
                        publisherName: "GeekNews",
                        publisherLogo: "https://www.geeknews.com.br/logo.png",
                        reviewBody: reviewBody, // snippet que te passei
                        itemReviewed: {
                          name: data.tituloPortugues || data.title,
                          type: "Movie", // ou TVSeries, VideoGame, Book, etc.
                          image: data.capaObra || data.thumb,
                        },
                      }}
                    />
                  </>
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
                      unoptimized
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
                
                {/* Anúncio antes dos relacionados */}
                <div className="my-8">
                  <ins className="adsbygoogle"
                      style={{ display: 'block', textAlign: 'center' }}
                      data-ad-layout="in-article"
                      data-ad-format="fluid"
                      data-ad-client="ca-pub-9111051074987830"
                      data-ad-slot="6194213530"></ins>
                      <Script id="ad-reload" strategy="afterInteractive">
                        {`
                          try {
                            (adsbygoogle = window.adsbygoogle || []).push({});
                          } catch (e) {}
                        `}
                      </Script>
                </div>

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

              <ins className="adsbygoogle"
                  style={{ display: 'block' }}
                  data-ad-client="ca-pub-9111051074987830"
                  data-ad-slot="3961133566" // substitua pelo slot do seu bloco
                  data-ad-format="auto"
                  data-full-width-responsive="true"></ins>
              <Script id="ad-reload" strategy="afterInteractive">
                {`
                  try {
                    (adsbygoogle = window.adsbygoogle || []).push({});
                  } catch (e) {}
                `}
              </Script>

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
    await sendErrorAlert(slug, `Erro inesperado ao renderizar o artigo.`);
    return notFound();
  }
}
  