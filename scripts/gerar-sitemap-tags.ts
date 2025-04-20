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

async function gerarSitemapTags() {
  const contentDir = path.join(process.cwd(), "content");
  const files = await fs.readdir(contentDir);

  const tagMap: Record<string, number> = {};

  for (const file of files) {
    if (!file.endsWith(".md")) continue;

    const content = await fs.readFile(path.join(contentDir, file), "utf-8");
    const { data } = matter(content);
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

  const urls = tagsValidas.map((slug) => {
    return `<url>
  <loc>${BASE_URL}/tag/${slug}</loc>
</url>`;
  });

  const sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>`;

  await fs.writeFile("public/sitemap-tags.xml", sitemapContent, "utf-8");
  console.log(`✅ sitemap-tags.xml gerado com ${tagsValidas.length} tags.`);
}

gerarSitemapTags();
