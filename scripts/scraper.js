const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");

async function buscarNoticias() {
  const url = "https://www.omelete.com.br/noticias";
  const { data } = await axios.get(url);
  const $ = cheerio.load(data);

  let noticias = [];

  $("h2").each((i, el) => {
    let titulo = $(el).text();
    let link = $(el).parent().attr("href");
    noticias.push({ titulo, link });
  });

  fs.writeFileSync("public/posts.json", JSON.stringify(noticias, null, 2));
  console.log("✅ Notícias coletadas com sucesso!");
}

buscarNoticias();