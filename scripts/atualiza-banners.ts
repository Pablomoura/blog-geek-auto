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
  data: string;
};

async function gerarCacheBanners() {
  const hoje = new Date().toISOString().split("T")[0];

  try {
    const cacheAtual = JSON.parse(await fs.readFile(CACHE_PATH, "utf-8"));
    if (cacheAtual.data === hoje) {
      console.log("✅ Cache já está atualizado para hoje.");
      return;
    }
  } catch {
    // Ignora erro se não existir
  }

  const arquivos = await fs.readdir(path.join(process.cwd(), "content"));
  const posts: Banner[] = [];

  for (const nomeArquivo of arquivos) {
    const raw = await fs.readFile(path.join(process.cwd(), "content", nomeArquivo), "utf-8");
    const { data, content } = matter(raw);

    if (data?.slug && data?.title && data?.thumb && data?.categoria && data?.data) {
      posts.push({
        slug: data.slug,
        titulo: data.title,
        thumb: data.thumb,
        categoria: data.categoria,
        resumo: data.resumo || content.slice(0, 160),
        data: data.data,
      });
    }
  }

  posts.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());

  const categoriasDesejadas = [
    "Games",
    "Séries e TV",
    "Mangás e Animes",
    "Filmes",
    "Board Games",
    "Streaming",
    "HQ/Livros",
    "Musica",
  ];

  const cache: Record<string, any> = { data: hoje };

  for (const cat of categoriasDesejadas) {
    const slug = slugify(cat);
    const post = posts.find((p) => slugify(p.categoria) === slug);
    if (post) cache[slug] = post;
  }

  await fs.writeFile(CACHE_PATH, JSON.stringify(cache, null, 2), "utf-8");
  console.log("✅ Cache de banners atualizado com sucesso!");
}

gerarCacheBanners();
