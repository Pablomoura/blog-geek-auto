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

// 1️⃣ lê todos os arquivos
const arquivos = fs.readdirSync(contentDir);

// 2️⃣ carrega os dados com data
const posts = arquivos
  .filter((nomeArquivo) => nomeArquivo.endsWith(".md"))
  .map((nomeArquivo) => {
    const filePath = path.join(contentDir, nomeArquivo);
    const fileContent = fs.readFileSync(filePath, "utf-8");
    const { data, content } = matter(fileContent);

    return {
      title: data.title,
      slug: data.slug,
      data: data.data,
      resumo: data.resumo,
      author: data.author || "Equipe GeekNews",
    };
  })
  // 3️⃣ filtra só os que têm os campos obrigatórios
  .filter((post) => post.title && post.slug && post.data && post.resumo)
  // 4️⃣ ordena por data DESC
  .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
  // 5️⃣ limita a 20 posts mais recentes
  .slice(0, 20);

// 6️⃣ adiciona no feed
for (const post of posts) {
  const url = `https://www.geeknews.com.br/noticia/${post.slug}`;
  const pubDate = new Date(post.data);

  const contentEncoded = `
    <![CDATA[
      <p>${post.resumo}</p>
      <p>Leia mais em <a href="${url}">${url}</a></p>
    ]]>
  `;

  feed.item({
    title: post.title,
    description: post.resumo,
    url,
    guid: url,
    date: pubDate,
    author: post.author,
    custom_elements: [
      { "content:encoded": contentEncoded },
    ],
  });
}

fs.writeFileSync(outputFile, feed.xml({ indent: true }));
console.log("✅ RSS gerado com sucesso em: public/rss.xml");
