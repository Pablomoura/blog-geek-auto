const fs = require("fs/promises");
const path = require("path");
const matter = require("gray-matter");

const POSTS_DIR = path.join(process.cwd(), "content");
const OUTPUT_FILE = path.join(process.cwd(), "public", "posts.json");

(async () => {
  const files = await fs.readdir(POSTS_DIR);
  const posts = [];

  for (const file of files) {
    if (!file.endsWith(".md")) continue;

    const filePath = path.join(POSTS_DIR, file);
    const raw = await fs.readFile(filePath, "utf-8");
    const { data } = matter(raw);

    // Validação mínima
    if (!data.slug || !data.title || !data.data || !data.categoria || !data.resumo || !data.thumb) {
      console.warn(`⚠️ Ignorado: ${file} está com frontmatter incompleto`);
      continue;
    }

    posts.push({
      slug: data.slug,
      titulo: data.title,
      thumb: data.thumb,
      categoria: data.categoria,
      data: data.data,
      resumo: data.resumo,
      tags: data.tags || [],
    });
  }

  // Ordena do mais novo pro mais antigo
  posts.sort((a, b) => new Date(b.data) - new Date(a.data));

  // Salva
  await fs.writeFile(OUTPUT_FILE, JSON.stringify(posts, null, 2));
  console.log(`✅ Atualizado: ${posts.length} posts salvos em posts.json`);

  // Dispara o ping para o Google
  const { exec } = require("child_process");
  exec("node scripts/send-to-indexing-api.js", (err, stdout, stderr) => {
    if (err) {
      console.error("❌ Erro ao notificar o Google:", stderr);
    } else {
      console.log(stdout);
    }
  });
})();
