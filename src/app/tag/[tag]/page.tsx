// /app/tag/[slug]/page.tsx

import fs from "fs/promises";
import path from "path";
import matter from "gray-matter";
import Header from "@/components/Header";
import Link from "@/components/SmartLink";
import React from "react";
import { Metadata } from "next";

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

interface Post {
  slug: string;
  title: string;
  resumo: string;
  thumb: string;
  categoria: string;
  data: string;
  tags?: string[];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tag: string }>;
}): Promise<Metadata> {
  const { tag } = await params;
  const tagFormatada = tag.replace(/-/g, " ");
  const canonicalUrl = `https://www.geeknews.com.br/tag/${slugify(tag)}`;

  return {
    title: `${tagFormatada} - GeekNews`,
    description: `Confira todas as matérias marcadas com a tag ${tagFormatada} no GeekNews.`,
    alternates: {
      canonical: canonicalUrl, 
    },
    openGraph: {
      title: `Tag: ${tagFormatada} - GeekNews`,
      description: `Confira todas as matérias marcadas com a tag ${tagFormatada} no GeekNews.`,
      url: canonicalUrl,
      siteName: "GeekNews",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `Tag: ${tagFormatada} - GeekNews`,
      description: `Confira todas as matérias marcadas com a tag ${tagFormatada} no GeekNews.`,
    },
  };
}

export async function generateStaticParams() {
  const contentDir = path.join(process.cwd(), "content");
  const files = await fs.readdir(contentDir);
  const tagsSet = new Set<string>();

  for (const file of files) {
    if (!file.endsWith(".md")) continue;
    const filePath = path.join(contentDir, file);
    const raw = await fs.readFile(filePath, "utf-8");
    const { data } = matter(raw);

    let postTags: string[] = [];
    if (Array.isArray(data.tags)) {
      postTags = data.tags.map((t: string) => t.trim());
    } else if (typeof data.tags === "string") {
      postTags = data.tags.split(",").map((t: string) => t.trim());
    }

    for (const t of postTags) {
      const tagSlug = slugify(t);
      tagsSet.add(tagSlug);
    }
  }

  return Array.from(tagsSet).map((tag) => ({ tag }));
}

export default async function TagPage({
  params,
  searchParams,
}: {
  params: Promise<{ tag: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { tag } = await params;
  const { page } = await searchParams;

  const contentDir = path.join(process.cwd(), "content");
  const files = await fs.readdir(contentDir);
  const posts: Post[] = [];

  for (const file of files) {
    if (!file.endsWith(".md")) continue;
    const filePath = path.join(contentDir, file);
    const raw = await fs.readFile(filePath, "utf-8");
    const { data } = matter(raw);

    let postTags: string[] = [];
    if (Array.isArray(data.tags)) {
      postTags = data.tags.map((t: string) => t.trim());
    } else if (typeof data.tags === "string") {
      postTags = data.tags.split(",").map((t: string) => t.trim());
    }

    const tagSlugs = postTags.map(slugify);
    if (tagSlugs.includes(tag)) {
      posts.push({
        slug: data.slug || file.replace(/\.md$/, ""),
        title: data.title,
        resumo: data.resumo || "",
        thumb: data.thumb,
        categoria: data.categoria,
        data: data.data,
        tags: postTags,
      });
    }
  }

  posts.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
  const postsPorPagina = 9;
  const paginaAtual = parseInt(page || "1", 10);
  const totalPaginas = Math.ceil(posts.length / postsPorPagina);
  const exibidos = posts.slice((paginaAtual - 1) * postsPorPagina, paginaAtual * postsPorPagina);

  return (
    <>
      <Header />
      <main className="max-w-7xl mx-auto px-6 py-10">
        <div className="flex flex-col lg:flex-row gap-10">
          <div className="flex-1">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
              <Link href="/" className="hover:underline text-orange-500">Início</Link> / <span className="capitalize">{tag.replace(/-/g, " ")}</span>
            </p>
            <h1 className="text-4xl font-bold mb-6 flex items-center gap-2">
              🏷️ {tag.replace(/-/g, " ")} {" "}
              <span className="text-sm bg-orange-200 text-orange-700 px-2 py-1 rounded-full">
                {posts.length} post{posts.length !== 1 && "s"}
              </span>
            </h1>
            {posts.length > 0 ? (
              <div className="space-y-6">
                {exibidos.map((post) => (
                  <Link
                    key={post.slug}
                    href={`/noticia/${post.slug}`}
                    className="flex gap-4 bg-white dark:bg-gray-900 p-4 rounded-lg shadow hover:shadow-md hover:bg-gray-100 dark:hover:bg-gray-800 transition overflow-hidden"
                  >
                    {post.thumb && (
                      <img
                        src={post.thumb}
                        alt={post.title}
                        className="w-40 h-28 object-cover flex-shrink-0 rounded-md"
                      />
                    )}
                    <div className="py-2 pr-4 flex flex-col justify-center">
                      <p className="text-orange-500 text-xs font-bold uppercase mb-1">{post.categoria}</p>
                      <h2 className="text-md font-semibold text-neutral-900 dark:text-white leading-snug">
                        {post.title}
                      </h2>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        {new Date(post.data).toLocaleDateString("pt-BR")}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                        {post.resumo}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-gray-600 dark:text-gray-300">Nenhum post encontrado com esta tag.</p>
            )}
            {totalPaginas > 1 && (
              <div className="mt-10 text-center flex flex-wrap gap-2 justify-center text-sm text-gray-500">
                {paginaAtual > 1 && (
                  <Link href={`/tag/${tag}?page=${paginaAtual - 1}`} className="px-3 py-1 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 rounded">
                    ← Anterior
                  </Link>
                )}
                {Array.from({ length: totalPaginas }, (_, i) => (
                  <Link
                    key={i}
                    href={`/tag/${tag}?page=${i + 1}`}
                    className={`px-3 py-1 rounded ${
                      i + 1 === paginaAtual
                        ? "bg-orange-500 text-white font-bold"
                        : "bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700"
                    }`}
                  >
                    {i + 1}
                  </Link>
                ))}
                {paginaAtual < totalPaginas && (
                  <Link href={`/tag/${tag}?page=${paginaAtual + 1}`} className="px-3 py-1 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 rounded">
                    Próxima →
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
                  Mais lidas com essa tag
                </h2>
              </div>
              <div className="space-y-3">
                {posts.sort((a, b) => b.resumo.length - a.resumo.length).slice(0, 3).map((post, index) => (
                  <Link
                    key={post.slug}
                    href={`/noticia/${post.slug}`}
                    className="flex items-start gap-4 bg-gray-100 dark:bg-gray-800 p-4 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                  >
                    <span className="text-3xl font-light text-gray-400 dark:text-gray-500 w-6">{index + 1}</span>
                    <p className="text-sm text-gray-900 dark:text-gray-200 leading-snug">{post.title}</p>
                  </Link>
                ))}
              </div>
            </section>
            <div className="bg-gray-200 dark:bg-gray-800 h-96 rounded-lg flex items-center justify-center text-sm text-gray-500 dark:text-gray-400">
              Publicidade
            </div>
          </aside>
        </div>
      </main>
    </>
  );
}
