const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");
const RSS = require("rss");

const contentDir = path.join(process.cwd(), "content");
const outputFile = path.join(process.cwd(), "public/rss.xml");

const feed = new RSS({
  title: "GeekNews - Últimas Notícias Geek",
  description: "As últimas notícias sobre filmes, séries, animes, games e cultura pop geek.",
  feed_url: "https://www.geeknews.com.br/rss.xml",
  site_url: "https://www.geeknews.com.br",
  language: "pt-br",
  ttl: 60,
});

const arquivos = fs.readdirSync(contentDir);

for (const nomeArquivo of arquivos) {
  if (!nomeArquivo.endsWith(".md")) continue;

  const filePath = path.join(contentDir, nomeArquivo);
  const fileContent = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(fileContent);

  if (!data.title || !data.slug || !data.data || !data.resumo) continue;

  const url = `https://www.geeknews.com.br/noticia/${data.slug}`;
  const pubDate = new Date(data.data);

  feed.item({
    title: data.title,
    description: data.resumo,
    url,
    guid: url,
    date: pubDate,
  });
}

fs.writeFileSync(outputFile, feed.xml({ indent: true }));
console.log("✅ RSS gerado com sucesso em: public/rss.xml");
