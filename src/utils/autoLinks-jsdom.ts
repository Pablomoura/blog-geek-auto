import fs from "fs/promises";
import path from "path";
import { JSDOM } from "jsdom";

// Configuração
const MAX_LINKS_TOTAL = 5;
const MAX_LINKS_POR_PARAGRAFO = 1;

export async function aplicarLinksInternosInteligente(html: string): Promise<string> {
  const glossaryPath = path.join(process.cwd(), "src/data/glossary.json");
  const glossary: { termo: string; slug: string }[] = JSON.parse(await fs.readFile(glossaryPath, "utf-8"));

  const usados = new Set<string>();
  const dom = new JSDOM(html);
  const document = dom.window.document;

  let linksAplicados = 0;

  // 1️⃣ Frases compostas
  const frases = glossary
    .filter((link) => link.termo.trim().includes(" "))
    .sort((a, b) => b.termo.length - a.termo.length);

  for (const link of frases) {
    if (linksAplicados >= MAX_LINKS_TOTAL) break;

    const termoNorm = normalizeToken(link.termo);
    if (usados.has(termoNorm)) continue;

    const regex = gerarRegexFrase(link.termo);

    const paragrafos = Array.from(document.querySelectorAll("p")) as HTMLParagraphElement[];

    for (const p of paragrafos) {
      if (linksAplicados >= MAX_LINKS_TOTAL) break;

      const linksNoParagrafo = p.querySelectorAll("a").length;
      if (linksNoParagrafo >= MAX_LINKS_POR_PARAGRAFO) continue;

      if (regex.test(p.textContent || "")) {
        p.innerHTML = p.innerHTML.replace(regex, (match: string) => {
          usados.add(termoNorm);
          linksAplicados++;
          return `<a href="/noticia/${link.slug}" class="underline text-orange-600 hover:text-orange-800">${match}</a>`;
        });
      }
    }
  }

  // 2️⃣ Tokens simples
  for (const link of glossary) {
    if (linksAplicados >= MAX_LINKS_TOTAL) break;

    const termoNorm = normalizeToken(link.termo);
    if (usados.has(termoNorm)) continue;

    if (link.termo.trim().includes(" ")) continue; // frases já tratadas

    const paragrafos = Array.from(document.querySelectorAll("p")) as HTMLParagraphElement[];

    for (const p of paragrafos) {
      if (linksAplicados >= MAX_LINKS_TOTAL) break;

      const linksNoParagrafo = p.querySelectorAll("a").length;
      if (linksNoParagrafo >= MAX_LINKS_POR_PARAGRAFO) continue;

      const tokens = (p.textContent || "").split(/(\W+)/);
      let modified = false;

      const newContent = tokens.map((token: string) => {
        const tokenNorm = normalizeToken(token);

        if (tokenNorm === termoNorm && !usados.has(termoNorm)) {
          usados.add(termoNorm);
          linksAplicados++;
          modified = true;
          return `<a href="/noticia/${link.slug}" class="underline text-orange-600 hover:text-orange-800">${token}</a>`;
        }

        return token;
      });

      if (modified) {
        p.innerHTML = newContent.join("");
      }
    }
  }

  return dom.serialize();
}

function gerarRegexFrase(termo: string): RegExp {
  const termoEscapado = escapeRegex(termo).replace(/\s+/g, "\\s+");
  return new RegExp(`(?:^|\\s|[>\\(\\["])(${termoEscapado})(?=\\s|[<.,;!?)"\\]]|$)`, "gi");
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
