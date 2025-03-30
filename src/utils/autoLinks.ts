// utils/autoLinks.ts
import fs from "fs/promises";
import path from "path";
import matter from "gray-matter";
import { parseDocument } from "htmlparser2";
import { DomUtils } from "htmlparser2";
import { Element, Text, isTag, Node as DomNode } from "domhandler";

export type PalavraChave = {
  termo: string;
  slug: string;
};

function extrairPalavrasProprias(texto: string): string[] {
  const palavras = texto.match(/\b([A-ZÀ-Ú][a-zà-ú]{2,}(?:\s+[A-ZÀ-Ú][a-zà-ú]{2,})*)\b/g);
  if (!palavras) return [];

  const frequencia: Record<string, number> = {};
  for (const palavra of palavras) {
    const normalizada = palavra.trim();
    frequencia[normalizada] = (frequencia[normalizada] || 0) + 1;
  }

  return Object.entries(frequencia)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([termo]) => termo);
}

export async function gerarPalavrasChave(slugAtual: string): Promise<PalavraChave[]> {
  const pasta = path.join(process.cwd(), "content");
  const arquivos = await fs.readdir(pasta);

  const palavras: PalavraChave[] = [];

  for (const nomeArquivo of arquivos) {
    if (!nomeArquivo.endsWith(".md")) continue;

    const slug = nomeArquivo.replace(".md", "");
    if (slug === slugAtual) continue;

    const arquivo = await fs.readFile(path.join(pasta, nomeArquivo), "utf-8");
    const { data, content } = matter(arquivo);

    const termos: string[] = [];
    if (data.title) termos.push(...extrairPalavrasProprias(data.title));
    if (data.categoria) termos.push(...extrairPalavrasProprias(data.categoria));
    termos.push(...extrairPalavrasProprias(content));

    termos.forEach((termo) => {
      palavras.push({ termo, slug: data.slug || slug });
    });
  }

  return palavras;
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function aplicarLinksInternosInteligente(html: string, slugAtual: string): Promise<string> {
  const palavrasChave = await gerarPalavrasChave(slugAtual);
  const slugsInseridos = new Set<string>();
  let totalLinks = 0;
  const MAX_LINKS = 5;

  const doc = parseDocument(`<body>${html}</body>`);
  const body = DomUtils.getElementsByTagName("body", doc.children, true)[0];

  const walker = (nodes: DomNode[]) => {
    for (const node of nodes) {
      if (totalLinks >= MAX_LINKS) break;

      if (node.type === "text") {
        for (const { termo, slug } of palavrasChave) {
          if (totalLinks >= MAX_LINKS) break;
          if (slugsInseridos.has(slug)) continue;

          const termoEscapado = escapeRegExp(termo);
          const regex = new RegExp(`\\b(${termoEscapado})\\b`, "g");

          if (regex.test((node as Text).data)) {
            const partes = (node as Text).data.split(regex);
            const novos: DomNode[] = [];

            for (let i = 0; i < partes.length; i++) {
              if (i % 2 === 0) {
                novos.push(new Text(partes[i]));
              } else {
                const el = new Element("a", {
                  href: `/noticia/${slug}`,
                  class: "text-orange-500 hover:underline",
                });
                el.children = [new Text(partes[i])];
                novos.push(el);
                slugsInseridos.add(slug);
                totalLinks++;
              }
            }

            const parent = node.parent as Element;
            if (parent && Array.isArray(parent.children)) {
              const index = parent.children.indexOf(node);
              if (index !== -1) {
                parent.children.splice(index, 1, ...novos);
              }
            }
            break;
          }
        }
      } else if (isTag(node) && Array.isArray(node.children)) {
        walker(node.children);
      }
    }
  };

  walker([body]);

  const allParagraphs = DomUtils.getElementsByTagName("p", [body], true);
  allParagraphs.forEach((p) => {
    if (p instanceof Element) {
      const existing = p.attribs.class || "";
      p.attribs.class = existing.includes("mb-") ? existing : `${existing} mb-5`.trim();
    }
  });

  return DomUtils.getInnerHTML(body);
}
