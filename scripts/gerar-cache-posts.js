import fs from "fs/promises";
import path from "path";
import matter from "gray-matter";

function slugify(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function gerarCache() {
  const contentDir = path.join(process.cwd(), "content");
  const outputPosts = path.join(process.cwd(), "public", "cache-posts.json");
  const outputBanners = path.join(process.cwd(), "public", "cache-banners.json");

  const arquivos = (await fs.readdir(contentDir)).filter((f) => f.endsWith(".md"));
  const dados = [];

  const autores = ["Pablo Moura", "Luana Souza", "Ana Luiza"];

  for (let i = 0; i < arquivos.length; i++) {
    const arquivo = arquivos[i];
    const filePath = path.join(contentDir, arquivo);
    const raw = await fs.readFile(filePath, "utf-8");
    const { data, content } = matter(raw);

    const tempoLeitura = Math.ceil(content.split(/\s+/).length / 200);
    const slug = arquivo.replace(/\.md$/, "");
    const autor = data.author || autores[i % autores.length];

    if (
      data.title &&
      data.thumb &&
      data.categoria &&
      data.data &&
      !isNaN(new Date(data.data).getTime())
    ) {
      dados.push({
        slug,
        titulo: data.title,
        categoria: data.categoria,
        resumo: data.resumo || "",
        thumb: data.thumb,
        data: data.data,
        tags: Array.isArray(data.tags) ? data.tags : [],
        author: autor,
        tempoLeitura,
        textoLength: content.length,
        slugCategoria: slugify(data.categoria),
      });
    }
  }

  await fs.writeFile(outputPosts, JSON.stringify(dados, null, 2), "utf-8");

  // 🔖 Lista de categorias desejadas
  const categoriasPermitidas = [
    "Games",
    "Séries e TV",
    "Mangás e Animes",
    "Filmes",
    "Board Games",
    "Streaming",
    "HQ/Livros",
    "Musica"
  ];

  // ✅ Atualiza cache de banners apenas 1x por dia
  const hoje = new Date().toISOString().split("T")[0];
  let bannersAtuais = {};

  try {
    const existente = JSON.parse(await fs.readFile(outputBanners, "utf-8"));
    if (existente.data === hoje) {
      console.log("🕒 Cache de banners já está atualizado para hoje.");
      return; // encerra o script aqui
    }
  } catch {
    // Continua se o arquivo ainda não existir
  }

  dados.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());

  for (const categoriaOriginal of categoriasPermitidas) {
    const slugCategoria = slugify(categoriaOriginal);
    const postsDaCategoria = dados
      .filter((p) => slugify(p.categoria) === slugCategoria)
      .slice(0, 3)
      .map((p) => ({
        slug: p.slug,
        titulo: p.titulo,
        thumb: p.thumb,
        categoria: p.categoria,
      }));

    if (postsDaCategoria.length > 0) {
      bannersAtuais[slugCategoria] = postsDaCategoria;
    }
  }

  await fs.writeFile(outputBanners, JSON.stringify({ data: hoje, ...bannersAtuais }, null, 2), "utf-8");
  console.log("✅ Cache de banners atualizado com sucesso!");
}

gerarCache().catch(console.error);
