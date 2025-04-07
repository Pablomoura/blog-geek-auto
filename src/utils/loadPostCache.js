import fs from "fs/promises";
import path from "path";

export async function loadPostCache() {
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
