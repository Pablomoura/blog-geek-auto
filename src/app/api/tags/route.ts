import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import matter from "gray-matter";

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]/g, "");
}

export async function GET() {
  const dir = path.join(process.cwd(), "content");
  const files = await fs.readdir(dir);
  const tagsMap = new Map<string, { tag: string; count: number }>();

  for (const file of files) {
    const raw = await fs.readFile(path.join(dir, file), "utf-8");
    const { data } = matter(raw);

    let tags: string[] = [];

    if (Array.isArray(data.tags)) {
      tags = data.tags.map((t: string) => t.trim());
    } else if (typeof data.tags === "string") {
      tags = data.tags.split(",").map((t: string) => t.trim());
    }

    for (const tag of tags) {
      const slug = slugify(tag);
      if (!tagsMap.has(slug)) {
        tagsMap.set(slug, { tag, count: 1 });
      } else {
        const atual = tagsMap.get(slug)!;
        atual.count += 1;
      }
    }
  }

  const lista = Array.from(tagsMap.entries()).map(([slug, { tag, count }]) => ({
    tag,
    slug,
    count,
  }));

  return NextResponse.json(lista);
}
