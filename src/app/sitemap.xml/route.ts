import fs from "fs/promises";
import path from "path";
import matter from "gray-matter";
import autores from "@/data/autores.json";

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
  const autoresSet = new Set<string>();

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

    const { data } = matter(content);

    // Tags
    const tags = Array.isArray(data.tags) ? data.tags : [];
    tags.forEach((tag: string) => tagsSet.add(slugify(tag)));

    // Autor
    if (data.author) {
      autoresSet.add(slugify(data.author));
    }
  }

  // Tags
  for (const tag of tagsSet) {
    urls.push(`<url><loc>${baseUrl}/tag/${tag}</loc></url>`);
  }

  // Autores
  for (const autorSlug of autoresSet) {
    urls.push(`<url><loc>${baseUrl}/autor/${autorSlug}</loc></url>`);
  }

  // Páginas institucionais fixas
  const paginasEstaticas = [
    "sobre",
    "contato",
    "missao-e-valores",
    "politica-de-privacidade",
    "politica-editorial"
  ];
  paginasEstaticas.forEach((slug) => {
    urls.push(`<url><loc>${baseUrl}/${slug}</loc></url>`);
  });

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
