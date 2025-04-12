const fs = require("fs/promises");
const path = require("path");
const matter = require("gray-matter");

async function corrigirDatas() {
  const contentDir = path.join(process.cwd(), "content");
  const jsonPath = path.join(process.cwd(), "public/posts.json");

  const posts = JSON.parse(await fs.readFile(jsonPath, "utf-8"));

  for (const post of posts) {
    const slug = post.slug;
    const filePath = path.join(contentDir, `${slug}.md`);

    try {
      const raw = await fs.readFile(filePath, "utf-8");
      const { data } = matter(raw);
      if (data.data) {
        post.data = data.data;
      }
    } catch (err) {
      console.warn(`⚠️ Não foi possível encontrar ou ler o arquivo .md de ${slug}`);
    }
  }

  await fs.writeFile(jsonPath, JSON.stringify(posts, null, 2), "utf-8");
  console.log("✅ posts.json atualizado com data extraída dos arquivos .md");
}

corrigirDatas();
