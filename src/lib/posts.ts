import fs from "fs";
import path from "path";

export type Post = {
  titulo: string;
  texto: string;
  midia: string;
  tipoMidia: string;
  categoria: string;
  slug: string;
  thumb?: string;
};

function normalizeSlug(text: string) {
  return text
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
}

export function getAllPosts(): Post[] {
  const filePath = path.join(process.cwd(), "public", "posts.json");
  const file = fs.readFileSync(filePath, "utf-8");
  const posts = JSON.parse(file) as Post[];

  return posts.map((post) => ({
    ...post,
    slug: normalizeSlug(post.slug),
  }));
}

export function getPostBySlug(slug: string): Post | null {
  const posts = getAllPosts();
  return posts.find((post) => post.slug === normalizeSlug(slug)) || null;
}