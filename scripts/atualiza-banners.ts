// scripts/atualiza-banners.ts
import fs from "fs/promises";
import path from "path";
import matter from "gray-matter";

const CACHE_PATH = path.join(process.cwd(), "public", "cache-banners.json");

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^\w-]/g, "");
}

type Banner = {
    slug: string;
    titulo: string;
    thumb: string;
    categoria: string;
    resumo: string;
    data: string; // ✅ adiciona isso!
};

async function gerarCacheBanners() {
  const hoje = new Date().toISOString().split("T")[0];

  try {
    const cacheAtual = JSON.parse(await fs.readFile(CACHE_PATH, "utf-8"));
    if (
      cacheAtual.data === hoje &&
      cacheAtual.filmes &&
      cacheAtual.games &&
      cacheAtual.series
    ) {
      console.log("Cache já está atualizado para hoje.");
      return;
    }
  } catch {
    // Continua normalmente caso o cache não exista ainda
  }

  const arquivos = await fs.readdir(path.join(process.cwd(), "content"));
  const posts: Banner[] = [];

  for (const nomeArquivo of arquivos) {
    const arquivo = await fs.readFile(
      path.join(process.cwd(), "content", nomeArquivo),
      "utf-8"
    );
    const { data, content } = matter(arquivo);

    if (data?.slug && data?.title && data?.thumb && data?.categoria && data?.data) {
        posts.push({
            slug: data.slug,
            titulo: data.title,
            thumb: data.thumb,
            categoria: data.categoria,
            resumo: data.resumo || content.slice(0, 160),
            data: data.data 
        });
    }
  }

  posts.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());

  const getMaisRecente = (categoria: string) =>
    posts.find((p) => slugify(p.categoria) === slugify(categoria));

  const cache = {
    data: hoje,
    filmes: getMaisRecente("filmes"),
    games: getMaisRecente("games"),
    series: getMaisRecente("séries e tv"),
  };

  await fs.writeFile(CACHE_PATH, JSON.stringify(cache, null, 2), "utf-8");
  console.log("✅ Cache de banners atualizado!");
}

gerarCacheBanners();