// src/app/games/page.tsx
import fs from "fs/promises";
import path from "path";
import matter from "gray-matter";
import Link from "@/components/SmartLink";
import Header from "@/components/Header";
import ProdutosAmazon from "@/components/ProdutosAmazon";
import UltimasNoticias from "@/components/UltimasNoticias";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Games - GeekNews",
  description: "As últimas notícias e novidades do mundo dos games. Descubra lançamentos, análises e guias no GeekNews.",
  keywords: ["games", "notícias de games", "lançamentos de jogos", "análises de games", "guia de jogos"],
  alternates: {
    canonical: "https://www.geeknews.com.br/games",
  },
};

type Banner = {
  slug: string;
  titulo: string;
  thumb: string;
  categoria: string;
};

type BannerCache = {
  data: string;
  animes?: Banner[];
  games?: Banner[];
};

async function carregarCacheBanners(tipo: "animes" | "games"): Promise<Banner[]> {
  try {
    const raw = await fs.readFile(path.join(process.cwd(), "public/cache-banners.json"), "utf-8");
    const cache: BannerCache = JSON.parse(raw);
    return Array.isArray(cache[tipo]) ? cache[tipo]! : [];
  } catch {
    return [];
  }
}

export default async function PaginaGames({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const { page } = await searchParams;
  const paginaAtual = parseInt(page || "1", 10);
  const postsPorPagina = 9;

  const contentDir = path.join(process.cwd(), "content");
  const arquivos = await fs.readdir(contentDir);
  const banners = await carregarCacheBanners("games");

  const posts = [];

  for (const nomeArquivo of arquivos) {
    const arquivo = await fs.readFile(path.join(contentDir, nomeArquivo), "utf-8");
    const { data, content } = matter(arquivo);
    const tempoLeitura = Math.ceil(content.split(/\s+/).length / 200);

    if (
      data.slug &&
      data.title &&
      data.thumb &&
      data.categoria === "GAMES" &&
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

  posts.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
  const totalPaginas = Math.ceil(posts.length / postsPorPagina);
  const exibidos = posts.slice((paginaAtual - 1) * postsPorPagina, paginaAtual * postsPorPagina);

  return (
    <>
      <Header />
      <div className="max-w-6xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-extrabold mb-4 text-orange-600">🎮 Games</h1>
        <p className="mb-8 text-gray-700 dark:text-gray-300">
          Fique por dentro dos lançamentos, análises e guias completos sobre os melhores jogos para PC e consoles.
        </p>

        {banners.length > 0 && (
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <Link
              href={`/noticia/${banners[0].slug}`}
              className="md:col-span-2 h-[320px] md:h-[400px] bg-cover bg-center rounded-xl flex items-end p-6 text-white relative shadow-lg"
              style={{ backgroundImage: `url(${banners[0].thumb})` }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-black/20 rounded-xl" />
              <div className="relative z-10">
                <span className="text-sm uppercase text-orange-400 font-bold">{banners[0].categoria}</span>
                <h2 className="text-2xl md:text-3xl font-extrabold leading-tight mt-1">{banners[0].titulo}</h2>
              </div>
            </Link>

            <div className="flex flex-col gap-4">
              {banners.slice(1, 3).map((banner) => (
                <Link
                  key={banner.slug}
                  href={`/noticia/${banner.slug}`}
                  className="h-[190px] bg-cover bg-center rounded-xl flex items-end p-4 text-white relative shadow-md"
                  style={{ backgroundImage: `url(${banner.thumb})` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-black/10 rounded-xl" />
                  <div className="relative z-10">
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
            <UltimasNoticias posts={exibidos} paginaAtual={paginaAtual} totalPaginas={totalPaginas} />
          </div>

          <aside className="w-full lg:w-[300px] flex-shrink-0 space-y-10">
            <ProdutosAmazon categoria="GAMES" />

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

        <div className="mt-10">
          <p className="text-xs text-gray-500 dark:text-gray-400 italic">
            Esta página pode conter links afiliados. Ao comprar por eles, você apoia o GeekNews sem pagar nada a mais por isso.
          </p>
        </div>
      </div>
    </>
  );
}
