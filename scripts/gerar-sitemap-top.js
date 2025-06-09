// scripts/gerar-sitemap-top.js
const fs = require("fs/promises");
const path = require("path");
const matter = require("gray-matter");

(async () => {
  const siteUrl = "https://www.geeknews.com.br";
  const contentDir = path.join(process.cwd(), "content");
  const outputPath = path.join(process.cwd(), "public", "sitemap-top.xml");

  const arquivos = (await fs.readdir(contentDir)).filter((f) => f.endsWith(".md"));

  const urls = [];

  for (const nomeArquivo of arquivos) {
    const filePath = path.join(contentDir, nomeArquivo);
    const fileContent = await fs.readFile(filePath, "utf-8");
    const { data } = matter(fileContent);

    const slug = data.slug;
    const dataPublicacao = data.data;
    const tags = data.tags || [];

    const temEvergreen = tags.includes("evergreen");

    if (slug && dataPublicacao && temEvergreen) {
      urls.push({
        loc: `${siteUrl}/noticia/${slug}`,
        lastmod: new Date(dataPublicacao).toISOString(),
      });
    }
  }

  // monta o XML do sitemap
  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (url) => `
  <url>
    <loc>${url.loc}</loc>
    <lastmod>${url.lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>`
  )
  .join("\n")}
</urlset>`;

  // salva o sitemap
  await fs.writeFile(outputPath, sitemapXml, "utf-8");

  console.log(`✅ sitemap-top.xml gerado com ${urls.length} URLs com tag evergreen.`);
})();
