// scripts/gerar-cache-posts.js
import fs from "fs/promises";
import path from "path";
import matter from "gray-matter";

async function gerarCache() {
  const contentDir = path.join(process.cwd(), "content");
  const outputFile = path.join(process.cwd(), "public", "cache-posts.json");

  const arquivos = await fs.readdir(contentDir);
  const dados = [];

  for (const arquivo of arquivos) {
    if (!arquivo.endsWith(".md")) continue;
    const filePath = path.join(contentDir, arquivo);
    const raw = await fs.readFile(filePath, "utf-8");
    const { data, content } = matter(raw);
    const tempoLeitura = Math.ceil(content.split(/\s+/).length / 200);
    const slug = arquivo.replace(/\.md$/, "");

    dados.push({
      slug,
      titulo: data.title,
      categoria: data.categoria,
      resumo: data.resumo,
      thumb: data.thumb,
      data: data.data,
      tags: Array.isArray(data.tags) ? data.tags : [], // ✅ garante que tags seja array
      tempoLeitura,
      textoLength: content.length
    });        
  }

  await fs.writeFile(outputFile, JSON.stringify(dados, null, 2), "utf-8");
  console.log("✅ Cache de posts gerado com sucesso!");
}

gerarCache().catch(console.error);
