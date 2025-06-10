// src/app/categoria/[slug]/page.tsx
import fs from "fs/promises";
import path from "path";
import matter from "gray-matter";
import { notFound } from "next/navigation";
import Link from "@/components/SmartLink";
import Header from "@/components/Header";
import UltimasNoticias from "@/components/UltimasNoticias";
import ProdutosAmazon from "@/components/ProdutosAmazon";
import { Metadata } from "next";
import Image from "next/image";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const categoria = decodeURIComponent(slug).replace(/-/g, " ").toUpperCase();

  return {
    title: `${categoria} - GeekNews`,
    description: `As últimas notícias sobre ${categoria} no GeekNews. Fique por dentro de lançamentos, análises e guias atualizados.`,
    alternates: {
      canonical: `https://www.geeknews.com.br/categoria/${slug}`,
    },
  };
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove acentos
    .replace(/[^a-z0-9]+/g, "-")     // Substitui por hífen
    .replace(/^-+|-+$/g, "");        // Remove hífens extras no início/fim
}

type Banner = {
  slug: string;
  titulo: string;
  thumb: string;
  categoria: string;
};

type BannerCache = {
  animes?: Banner[];
  games?: Banner[];
  [key: string]: Banner[] | undefined;
};

async function carregarCacheBanners(categoriaSlug: string): Promise<Banner[]> {
  try {
    const raw = await fs.readFile(path.join(process.cwd(), "public/cache-banners.json"), "utf-8");
    const cache: BannerCache = JSON.parse(raw);
    return cache[categoriaSlug] || [];
  } catch {
    return [];
  }
}

export default async function CategoriaPage(props: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { slug } = await props.params;
  const { page } = await props.searchParams;

  const categoriaSlug = slug;
  const categoriaNome = decodeURIComponent(categoriaSlug).replace(/-/g, " ").toUpperCase();
  const paginaAtual = parseInt(page || "1", 10);
  const postsPorPagina = 9;

  const contentDir = path.join(process.cwd(), "content");
  const arquivos = await fs.readdir(contentDir);
  const banners = await carregarCacheBanners(categoriaSlug);

  const posts = [];

  for (const nomeArquivo of arquivos) {
    const raw = await fs.readFile(path.join(contentDir, nomeArquivo), "utf-8");
    const { data, content } = matter(raw);
    const tempoLeitura = Math.ceil(content.split(/\s+/).length / 200);

    if (
      data.slug &&
      data.title &&
      data.thumb &&
      slugify(data.categoria || "") === categoriaSlug &&
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
        tags: data.tags || [],
        autor: data.author || "Equipe GeekNews",
        tipo: data.tipo || "",
        textoLength: content.length,
      });
    }
  }

  if (posts.length === 0) return notFound();

  posts.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
  const totalPaginas = Math.ceil(posts.length / postsPorPagina);
  const exibidos = posts.slice((paginaAtual - 1) * postsPorPagina, paginaAtual * postsPorPagina);

  return (
    <>
      <Header />
      <div className="max-w-6xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-extrabold mb-4 text-orange-600">{categoriaNome}</h1>

        {banners.length > 0 && (
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <Link
              href={`/noticia/${banners[0].slug}`}
              className="relative md:col-span-2 h-[320px] md:h-[400px] rounded-xl overflow-hidden shadow-lg group"
            >
              <Image
                src={banners[0].thumb}
                alt={banners[0].titulo}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                sizes="(max-width: 768px) 100vw, 66vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-black/20" />
              <div className="relative z-10 p-6 text-white flex flex-col justify-end h-full">
                <span className="text-sm uppercase text-orange-400 font-bold">{banners[0].categoria}</span>
                <h2 className="text-2xl md:text-3xl font-extrabold leading-tight mt-1">{banners[0].titulo}</h2>
              </div>
            </Link>

            <div className="flex flex-col gap-4">
              {banners.slice(1, 3).map((banner) => (
                <Link
                  key={banner.slug}
                  href={`/noticia/${banner.slug}`}
                  className="relative h-[190px] rounded-xl overflow-hidden shadow-md group"
                >
                  <Image
                    src={banner.thumb}
                    alt={banner.titulo}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-black/10 rounded-xl" />
                  <div className="relative z-10 p-4 text-white">
                    <span className="text-xs uppercase text-orange-400 font-bold">{banner.categoria}</span>
                    <h3 className="text-md font-semibold leading-tight mt-1 line-clamp-2">{banner.titulo}</h3>
                  </div>
                </Link>
              ))}

            </div>
          </section>
        )}

        <div className="flex flex-col lg:flex-row gap-10">
          <div className="flex-1">
            <UltimasNoticias
              posts={exibidos}
              paginaAtual={paginaAtual}
              totalPaginas={totalPaginas}
              baseUrl={`/categoria/${categoriaSlug}`}
            />

          </div>

          <aside className="w-full lg:w-[300px] flex-shrink-0 space-y-10">
            <ProdutosAmazon categoria={categoriaNome} />

            <section className="mb-8">
              <div className="flex items-center justify-between mb-4 border-b pb-2">
                <h2 className="text-sm uppercase tracking-widest font-semibold text-gray-600 dark:text-gray-300">
                  Mais lidas
                </h2>
              </div>
              <div className="space-y-3">
                {posts
                  .sort((a, b) => b.textoLength - a.textoLength)
                  .slice(0, 3)
                  .map((post, index) => (
                    <Link
                      key={post.slug}
                      href={`/noticia/${post.slug}`}
                      className="flex items-start gap-4 bg-gray-100 dark:bg-gray-800 p-4 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                    >
                      <span className="text-3xl font-light text-gray-400 dark:text-gray-500 w-6">{index + 1}</span>
                      <p className="text-sm text-gray-900 dark:text-gray-200 leading-snug">{post.titulo}</p>
                    </Link>
                  ))}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </>
  );
}
