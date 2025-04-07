import fs from "fs/promises";
import path from "path";
import matter from "gray-matter";

export async function aplicarLinksInternosInteligente(html, slugAtual) {
  const contentDir = path.join(process.cwd(), "content");
  const files = await fs.readdir(contentDir);
  const links = [];

  for (const file of files) {
    const filePath = path.join(contentDir, file);
    const raw = await fs.readFile(filePath, "utf-8");
    const { data } = matter(raw);
    if (!data.tags || data.slug === slugAtual) continue;
    links.push({ titulo: data.title, slug: data.slug, tags: data.tags });
  }

  for (const link of links) {
    for (const tag of link.tags) {
      const regex = new RegExp(`(?<!<a[^>]*?>)\\b(${tag})\\b(?![^<]*?</a>)`, "gi");
      html = html.replace(regex, (match) => {
        return `<a href="/noticia/${link.slug}" class="underline hover:text-orange-500 transition">${match}</a>`;
      });
    }
  }

  return html;
}