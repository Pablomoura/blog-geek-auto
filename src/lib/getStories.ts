// lib/getStories.ts
import fs from "fs/promises";
import path from "path";
import matter from "gray-matter";

export interface Story {
  slug: string;
  titulo: string;
  thumb: string;
}

export async function getAllStories(): Promise<Story[]> {
  const arquivos = await fs.readdir(path.join(process.cwd(), "content"));
  const stories: Story[] = [];

  for (const nome of arquivos) {
    const arquivo = await fs.readFile(path.join(process.cwd(), "content", nome), "utf-8");
    const { data } = matter(arquivo);

    if (data.story === true) {
      stories.push({ slug: data.slug, titulo: data.title, thumb: data.thumb });
    }
  }

  return stories;
}
