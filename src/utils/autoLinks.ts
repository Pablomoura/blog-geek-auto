import fs from "fs/promises";
import path from "path";
import matter from "gray-matter";
import { parse } from "node-html-parser";

export async function aplicarLinksInternosInteligente(
  html: string,
  slugAtual: string
): Promise<string> {
  const dir = path.join(process.cwd(), "content");
  const files = await fs.readdir(dir);
  const links: { title: string; slug: string; tags: string[] }[] = [];

  for (const file of files) {
    const slug = file.replace(/\.md$/, "");
    if (slug === slugAtual) continue;

    const filePath = path.join(dir, file);
    const raw = await fs.readFile(filePath, "utf-8");
    const { data } = matter(raw);

    if (!data.title || !data.tags) continue;

    const tagsNormalizadas = data.tags.map((t: string) => normalizeTag(t));
    links.push({ title: data.title, slug, tags: tagsNormalizadas });
  }

  const usados = new Set<string>();
  const root = parse(`<body>${html}</body>`);
  const body = root.querySelector("body");

  if (!body) return html;

  body.querySelectorAll("*:not(a):not(h1):not(h2):not(h3):not(h4):not(h5):not(h6)").forEach((el) => {
    el.childNodes.forEach((child) => {
      if (child.nodeType !== 3) return; // texto puro
      let modified = false;
      let content = child.rawText;

      for (const link of links) {
        for (const tag of link.tags) {
          if (usados.has(tag)) continue;
          const termoEscapado = escapeRegex(tag);
          const regex = new RegExp(`\\b(${termoEscapado})\\b`, "i");

          if (regex.test(content)) {
            content = content.replace(regex, `<a href="/noticia/${link.slug}" class="underline text-orange-600 hover:text-orange-800">$1</a>`);
            usados.add(tag);
            modified = true;
            break;
          }
        }
        if (modified) break;
      }

      if (modified) {
        el.set_content(el.innerHTML.replace(child.rawText, content));
      }
    });
  });

  // Garante espaçamento entre parágrafos
  body.querySelectorAll("p").forEach((p) => {
    const existing = p.getAttribute("class") || "";
    if (!existing.includes("mb-")) {
      p.setAttribute("class", `${existing} mb-5`.trim());
    }
  });

  return body.innerHTML;
}

function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeTag(text: string): string {
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}
