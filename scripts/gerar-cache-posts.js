// scripts/gerar-cache-posts.js
import fs from "fs/promises";
import path from "path";
import matter from "gray-matter";

async function gerarCache() {
  const contentDir = path.join(process.cwd(), "content");
  const outputFile = path.join(process.cwd(), "public", "cache-posts.json");

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

    const autor = data.author || autores[i % autores.length]; // usa o autor do .md ou distribui

    dados.push({
      slug,
      titulo: data.title,
      categoria: data.categoria,
      resumo: data.resumo,
      thumb: data.thumb,
      data: data.data,
      tags: Array.isArray(data.tags) ? data.tags : [],
      author: autor,
      tempoLeitura,
      textoLength: content.length,
    });
  }

  await fs.writeFile(outputFile, JSON.stringify(dados, null, 2), "utf-8");
  console.log("✅ Cache de posts gerado com sucesso!");
}

gerarCache().catch(console.error);
