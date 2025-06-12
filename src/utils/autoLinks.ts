import fs from "fs/promises";
import path from "path";
import { parse, HTMLElement, Node, TextNode } from "node-html-parser";

// Configuração
const MAX_LINKS_TOTAL = 5;
const MAX_LINKS_POR_PARAGRAFO = 1;

export async function aplicarLinksInternosInteligente(
  html: string
): Promise<string> {
  const glossaryPath = path.join(process.cwd(), "src/data/glossary.json");
  const glossary: { termo: string; slug: string }[] = JSON.parse(await fs.readFile(glossaryPath, "utf-8"));

  const usados = new Set<string>();
  const root = parse(`<body>${html}</body>`);
  const body = root.querySelector("body");

  if (!body) return html;

  aplicarLinksFrases(body, glossary, usados);
  aplicarLinksTokens(body, glossary, usados);

  body.querySelectorAll("p").forEach((p: HTMLElement) => {
    const existing = p.getAttribute("class") || "";
    if (!existing.includes("mb-")) {
      p.setAttribute("class", `${existing} mb-5`.trim());
    }
  });

  return body.innerHTML;
}

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
      if (child.nodeType !== 3) return;

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

function gerarRegexFrase(termo: string): RegExp {
  const termoEscapado = escapeRegex(termo);
  return new RegExp(`\\b${termoEscapado}\\b`, "gi");
}

function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeToken(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}
