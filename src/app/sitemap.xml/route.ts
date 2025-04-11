import fs from "fs/promises";
import path from "path";

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]/g, "");
}

export async function GET() {
  const baseUrl = "https://www.geeknews.com.br";
  const contentDir = path.join(process.cwd(), "content");
  const files = await fs.readdir(contentDir);

  const urls: string[] = [];
  const tagsSet = new Set<string>();

  for (const file of files) {
    if (!file.endsWith(".md")) continue;

    const slug = file.replace(".md", "");
    const filePath = path.join(contentDir, file);
    const content = await fs.readFile(filePath, "utf-8");
    const stats = await fs.stat(filePath);
    const lastmod = stats.mtime.toISOString().split("T")[0];

    urls.push(`<url>
      <loc>${baseUrl}/noticia/${slug}</loc>
      <lastmod>${lastmod}</lastmod>
    </url>`);

    // Extrai tags do frontmatter
    const frontmatter = content.split("---")[1];
    const tagMatch = frontmatter.match(/tags:\s*(\[[^\]]+\]|(?:\n\s*- .+)+)/i);
    if (tagMatch) {
      const tagList = tagMatch[1].includes("[")
        ? JSON.parse(tagMatch[1]) // tags: ["a", "b"]
        : tagMatch[1].split("\n").map((line) => line.replace(/[-\s]/g, "").trim()); // tags: - a

      for (const tag of tagList) {
        if (tag) tagsSet.add(slugify(tag));
      }
    }
  }

  // Adiciona URLs de tags
  for (const tag of tagsSet) {
    urls.push(`<url><loc>${baseUrl}/tag/${tag}</loc></url>`);
  }

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${baseUrl}</loc></url>
  ${urls.join("\n")}
</urlset>`;

  return new Response(sitemap, {
    headers: {
      "Content-Type": "application/xml",
    },
  });
}
