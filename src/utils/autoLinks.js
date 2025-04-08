/* eslint-disable @typescript-eslint/no-require-imports */

const fs = require("fs/promises");
const path = require("path");
const matter = require("gray-matter");

async function aplicarLinksInternosInteligente(html, slugAtual) {
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

  const palavras = html.split(/\s+/).length;
  const limiteTotal = Math.min(Math.floor(palavras / 100), 10); // 1 link a cada 100 palavras, máx 10
  let totalLinksInseridos = 0;

  for (const link of links) {
    for (const tag of link.tags) {
      if (totalLinksInseridos >= limiteTotal) break;
      const regex = new RegExp(`(?<!<a[^>]*?>)\\b(${tag})\\b(?![^<]*?</a>)`, "i"); // 1 por tag
      if (regex.test(html)) {
        html = html.replace(regex, (match) => {
          totalLinksInseridos++;
          return `<a href="/noticia/${link.slug}" class="underline hover:text-orange-500 transition">${match}</a>`;
        });
      }
    }
    if (totalLinksInseridos >= limiteTotal) break;
  }

  return html;
}

module.exports = { aplicarLinksInternosInteligente };
