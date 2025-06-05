// scripts/ping-indexnow.js
const fs = require("fs");
const path = require("path");
const fetch = require("node-fetch");

const BASE_URL = "https://www.geeknews.com.br";
const TOKEN = "geeknews-indexnow-verification";

// Caminho para o JSON com os slugs
const postsPath = path.join(__dirname, "..", "public", "posts.json");

// Carrega os slugs e monta as URLs
function getRecentPostUrls() {
  try {
    const posts = JSON.parse(fs.readFileSync(postsPath, "utf-8"));
    return posts.slice(-20).reverse().map((post) => `${BASE_URL}/noticia/${post.slug}`);
  } catch (error) {
    console.error("Erro ao carregar posts.json:", error);
    return [];
  }
}

async function pingIndexNow(url) {
  const pingUrl = `https://api.indexnow.org/indexnow?url=${encodeURIComponent(url)}&key=${TOKEN}`;
  try {
    const res = await fetch(pingUrl);
    const body = await res.text();
    console.log(`✔️ Ping enviado para: ${url} | Código: ${res.status}`);
  } catch (err) {
    console.error(`❌ Erro ao pingar ${url}`, err);
  }
}

(async () => {
  const urls = getRecentPostUrls();
  for (const url of urls) {
    await pingIndexNow(url);
  }
})();
