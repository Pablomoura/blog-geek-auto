const fs = require("fs/promises");
const path = require("path");

async function loadPostCache() {
  const cachePath = path.join(process.cwd(), "public", "cache-posts.json");
  try {
    const raw = await fs.readFile(cachePath, "utf-8");
    const posts = JSON.parse(raw);
    return posts;
  } catch {
    console.warn("⚠️ Cache de posts não encontrado. Retornando array vazio.");
    return [];
  }
}

module.exports = { loadPostCache };
