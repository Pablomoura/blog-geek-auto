import fs from "fs/promises";
import path from "path";
import matter from "gray-matter";
import removeAccents from "remove-accents";

const BASE_URL = "https://www.geeknews.com.br";

function slugifyTag(tag: string): string {
  return removeAccents(tag.toLowerCase())
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function gerarSitemapsSeparados() {
  const contentDir = path.join(process.cwd(), "content");
  const files = await fs.readdir(contentDir);

  const tagMap: Record<string, number> = {};
  const urlsPosts: string[] = [];

  for (const file of files) {
    if (!file.endsWith(".md")) continue;

    const filePath = path.join(contentDir, file);
    const content = await fs.readFile(filePath, "utf-8");
    const { data } = matter(content);

    if (data.slug && data.data) {
      let lastmod = new Date().toISOString().split("T")[0]; // default
      if (data.data && !isNaN(new Date(data.data).getTime())) {
        lastmod = new Date(data.data).toISOString().split("T")[0];
      }

      urlsPosts.push(`<url>
  <loc>${BASE_URL}/noticia/${data.slug}</loc>
  <lastmod>${lastmod}</lastmod>
</url>`);
    }

    const tags = data.tags || [];
    if (Array.isArray(tags)) {
      for (const tag of tags) {
        const slug = slugifyTag(tag);
        tagMap[slug] = (tagMap[slug] || 0) + 1;
      }
    }
  }

  const tagsValidas = Object.entries(tagMap)
    .filter(([, count]) => count >= 2)
    .map(([slug]) => slug);

  const urlsTags = tagsValidas.map((slug) => {
    return `<url>
  <loc>${BASE_URL}/tag/${slug}</loc>
</url>`;
  });

  // Grava os arquivos XML individuais
  await fs.writeFile("public/sitemap-posts.xml", `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlsPosts.join("\n")}
</urlset>`, "utf-8");

  await fs.writeFile("public/sitemap-tags.xml", `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlsTags.join("\n")}
</urlset>`, "utf-8");

  // Sitemap índice (principal)
  await fs.writeFile("public/sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${BASE_URL}/sitemap-posts.xml</loc>
  </sitemap>
  <sitemap>
    <loc>${BASE_URL}/sitemap-tags.xml</loc>
  </sitemap>
</sitemapindex>`, "utf-8");

  console.log(`✅ Sitemaps gerados com sucesso:
- sitemap-posts.xml (${urlsPosts.length} posts)
- sitemap-tags.xml (${tagsValidas.length} tags)
- sitemap.xml (índice com os dois)`);
}

gerarSitemapsSeparados();
