import fs from "fs/promises";
import path from "path";
import matter from "gray-matter";
import { parse, HTMLElement, Node, TextNode } from "node-html-parser";

// Configuração
const MAX_LINKS_TOTAL = 5;
const MAX_LINKS_POR_PARAGRAFO = 1;

export async function aplicarLinksInternosInteligente(
  html: string,
  slugAtual: string
): Promise<string> {
  // 1️⃣ Carrega o glossary
  const glossaryPath = path.join(process.cwd(), "src/data/glossary.json");
  const glossary: { termo: string; slug: string }[] = JSON.parse(await fs.readFile(glossaryPath, "utf-8"));

  // 2️⃣ Carrega fallback de tags
  const fallbackLinks = await carregarLinksDeTags(slugAtual);

  const usados = new Set<string>();
  const root = parse(`<body>${html}</body>`);
  const body = root.querySelector("body");

  if (!body) return html;

  // 3️⃣ Aplica frases compostas com limitação
  aplicarLinksFrases(body, glossary, usados);

  // 4️⃣ Aplica tokens com limitação
  aplicarLinksTokens(body, fallbackLinks, usados);

  // 5️⃣ Ajusta espaçamento de parágrafos
  body.querySelectorAll("p").forEach((p: HTMLElement) => {
    const existing = p.getAttribute("class") || "";
    if (!existing.includes("mb-")) {
      p.setAttribute("class", `${existing} mb-5`.trim());
    }
  });

  return body.innerHTML;
}

// ➤ Aplica frases compostas com limitação
function aplicarLinksFrases(
  body: HTMLElement,
  links: { termo: string; slug: string }[],
  usados: Set<string>
): number {
  let novosAplicados = 0;

  const frases = links
    .filter((link) => link.termo.trim().includes(" "))
    .sort((a, b) => b.termo.length - a.termo.length);

  frases.forEach((link) => {
    if (novosAplicados >= MAX_LINKS_TOTAL) return;

    const termoNorm = normalizeToken(link.termo);
    if (usados.has(termoNorm)) return;

    const regex = gerarRegexFrase(link.termo);

    body.querySelectorAll("p").forEach((p: HTMLElement) => {
      if (novosAplicados >= MAX_LINKS_TOTAL) return;

      const linksNoParagrafo = p.querySelectorAll("a").length;
      if (linksNoParagrafo >= MAX_LINKS_POR_PARAGRAFO) return;

      if (regex.test(p.innerHTML)) {
        p.innerHTML = p.innerHTML.replace(regex, (match: string) => {
          usados.add(termoNorm);
          novosAplicados++;
          return `<a href="/noticia/${link.slug}" class="underline text-orange-600 hover:text-orange-800">${match}</a>`;
        });
      }
    });
  });

  return novosAplicados;
}

// ➤ Aplica tokens com limitação
function aplicarLinksTokens(
  body: HTMLElement,
  links: { termo: string; slug: string }[],
  usados: Set<string>
): number {
  let novosAplicados = 0;

  body.querySelectorAll("p").forEach((p: HTMLElement) => {
    if (novosAplicados >= MAX_LINKS_TOTAL) return;

    const linksNoParagrafo = p.querySelectorAll("a").length;
    if (linksNoParagrafo >= MAX_LINKS_POR_PARAGRAFO) return;

    p.childNodes.forEach((child: Node) => {
      if (child.nodeType !== 3) return; // só texto puro

      const textNode = child as TextNode;

      if (novosAplicados >= MAX_LINKS_TOTAL) return;

      let modified = false;

      const tokens = textNode.rawText.split(/(\W+)/);
      const newTokens = tokens.map((token: string) => {
        for (const link of links) {
          const termoNorm = normalizeToken(link.termo);
          const tokenNorm = normalizeToken(token);

          if (tokenNorm === termoNorm && !usados.has(termoNorm)) {
            usados.add(termoNorm);
            novosAplicados++;
            modified = true;
            return `<a href="/noticia/${link.slug}" class="underline text-orange-600 hover:text-orange-800">${token}</a>`;
          }
        }
        return token;
      });

      if (modified) {
        p.innerHTML = p.innerHTML.replace(textNode.rawText, newTokens.join(""));
      }
    });
  });

  return novosAplicados;
}

// ➤ Regex para frases compostas
function gerarRegexFrase(termo: string): RegExp {
  const termoEscapado = escapeRegex(termo);
  return new RegExp(`\\b${termoEscapado}\\b`, "gi");
}

// ➤ Carrega fallback de tags
async function carregarLinksDeTags(slugAtual: string): Promise<{ termo: string; slug: string }[]> {
  const dir = path.join(process.cwd(), "content");
  const files = await fs.readdir(dir);
  const links: { termo: string; slug: string }[] = [];

  for (const file of files) {
    const slug = file.replace(/\.md$/, "");
    if (slug === slugAtual) continue;

    const filePath = path.join(dir, file);
    const raw = await fs.readFile(filePath, "utf-8");
    const { data } = matter(raw);

    if (!data.title || !data.tags) continue;

    const tagsNormalizadas = data.tags.map((t: string) => t.trim());

    for (const tag of tagsNormalizadas) {
      links.push({ termo: tag, slug });
    }
  }

  return links;
}

// ➤ Escapa regex
function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// ➤ Normaliza texto
function normalizeToken(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove acentos
    .toLowerCase()
    .trim();
}
