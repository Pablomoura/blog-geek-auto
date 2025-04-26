import fs from "fs/promises";
import path from "path";
import matter from "gray-matter";
import { parseDocument } from "htmlparser2";
import { DomUtils } from "htmlparser2";
import { Element, Text, isTag, Node as DomNode, ParentNode, ChildNode } from "domhandler";

export async function aplicarLinksInternosInteligente(html: string, slugAtual: string): Promise<string> {
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
    links.push({ title: data.title, slug, tags: data.tags.map((t: string) => normalizeTag(t)) });
  }

  const usados = new Set<string>();
  const doc = parseDocument(`<body>${html}</body>`);
  const body = DomUtils.getElementsByTagName("body", doc.children, true)[0];

  const walker = (nodes: DomNode[], insideHeading = false) => {
    for (const node of nodes) {
      if (node.type === "text" && node.parent && !(node.parent as Element).name?.toLowerCase().includes("a") && !insideHeading) {
        for (const link of links) {
          for (const tag of link.tags) {
            if (usados.has(tag)) continue;

            const termoEscapado = escapeRegex(tag);
            const regex = new RegExp(`\\b(${termoEscapado})\\b`, "i");

            if (regex.test((node as Text).data)) {
              const partes = (node as Text).data.split(regex);
              const novos: DomNode[] = [];

              for (let i = 0; i < partes.length; i++) {
                if (i % 2 === 0) {
                  novos.push(new Text(partes[i]));
                } else {
                  const el = new Element("a", {
                    href: `/noticia/${link.slug}`,
                    class: "underline text-orange-600 hover:text-orange-800",
                  });
                  el.children = [new Text(partes[i])];
                  novos.push(el);
                  usados.add(tag);
                }
              }

              const parent = node.parent as ParentNode;
              if (parent && Array.isArray(parent.children)) {
                const childNode = node as ChildNode;
                const index = parent.children.indexOf(childNode);
                if (index !== -1) {
                  parent.children.splice(index, 1, ...novos as ChildNode[]);
                }
              }
              break;
            }
          }
        }
      } else if (isTag(node) && Array.isArray(node.children)) {
        const tagName = (node as Element).name?.toLowerCase();
        const isHeading = ["h1", "h2", "h3", "h4", "h5", "h6"].includes(tagName || "");
        walker(node.children, insideHeading || isHeading);
      }
    }
  };

  if (body && Array.isArray(body.children)) {
    walker(body.children);
  }

  const allParagraphs = DomUtils.getElementsByTagName("p", [body], true);
  allParagraphs.forEach((p) => {
    if (p instanceof Element) {
      const existing = p.attribs.class || "";
      p.attribs.class = existing.includes("mb-") ? existing : `${existing} mb-5`.trim();
    }
  });

  return DomUtils.getInnerHTML(body);
}

function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeTag(text: string): string {
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}
