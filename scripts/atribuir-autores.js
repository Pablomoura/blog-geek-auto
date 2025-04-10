// scripts/atribuir-autores.js
import fs from "fs/promises";
import path from "path";
import matter from "gray-matter";

const autores = ["Pablo Moura", "Luana Souza", "Ana Luiza"];

async function distribuirAutores() {
  const contentDir = path.join(process.cwd(), "content");
  const arquivos = await fs.readdir(contentDir);

  let indiceAutor = 0;
  let alterados = 0;

  for (const arquivo of arquivos) {
    if (!arquivo.endsWith(".md")) continue;

    const filePath = path.join(contentDir, arquivo);
    const raw = await fs.readFile(filePath, "utf-8");
    const parsed = matter(raw);

    if (!parsed.data.author) {
      parsed.data.author = autores[indiceAutor];
      indiceAutor = (indiceAutor + 1) % autores.length;

      const novoConteudo = matter.stringify(parsed.content, parsed.data);
      await fs.writeFile(filePath, novoConteudo, "utf-8");
      alterados++;
      console.log(`✅ Autor atribuído: ${parsed.data.author} → ${arquivo}`);
    } else {
      console.log(`⏩ Já possui autor: ${arquivo}`);
    }
  }

  console.log(`\n🚀 Finalizado! ${alterados} artigos atualizados com autores.`);
}

distribuirAutores().catch(console.error);