// src/app/api/scrape/route.ts
import fs from "fs/promises";
import path from "path";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import type { Page } from "puppeteer";

puppeteer.use(StealthPlugin());

type NoticiaBruta = {
  titulo: string;
  resumo: string;
  categoria: string;
  link: string;
  thumb?: string;
};

type NoticiaCompleta = NoticiaBruta & {
  texto: string;
  slug: string;
  midia: string | null;
  tipoMidia: "imagem" | "video";
  fonte: string;
  reescrito: boolean;
};

type PostExistente = {
  slug: string;
};

export async function GET() {
  const jsonFilePath = "public/posts.json";
  const contentDir = path.join(process.cwd(), "content");
  const MAX_POSTS = 10;

  await fs.mkdir(contentDir, { recursive: true });

  let postsExistentes: PostExistente[] = [];
  try {
    const existing = await fs.readFile(jsonFilePath, "utf-8");
    postsExistentes = JSON.parse(existing);
  } catch {
    postsExistentes = [];
  }

  function slugify(text: string) {
    return text
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^\w\-]+/g, "")
      .replace(/\-\-+/g, "-")
      .replace(/^-+/, "")
      .replace(/-+$/, "");
  }

  async function autoScroll(page: Page) {
    await page.evaluate(async () => {
      await new Promise((resolve) => {
        let totalHeight = 0;
        const distance = 500;
        const timer = setInterval(() => {
          window.scrollBy(0, distance);
          totalHeight += distance;
          if (totalHeight >= document.body.scrollHeight - window.innerHeight) {
            clearInterval(timer);
            resolve(true);
          }
        }, 300);
      });
    });
  }

  async function extrairConteudoNoticia(url: string): Promise<{
    texto: string;
    midia: string | null;
    tipoMidia: "imagem" | "video";
  }> {
    const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox"] });
    const page = await browser.newPage();

    try {
      await page.setUserAgent("Mozilla/5.0");
      await page.goto(url, { waitUntil: "networkidle2" });

      const texto = await page.evaluate(() => {
        return Array.from(document.querySelectorAll("p"))
          .map((p) => (p as HTMLElement).innerText.trim())
          .filter((t) => t.length > 50 && !t.includes("Política") && !t.includes("notificações"))
          .join("\n");
      });

      const midia = await page.evaluate(() => {
        const video = document.querySelector("iframe[src*='youtube']")?.getAttribute("src");
        let imagem =
          document.querySelector(".article__cover__image")?.getAttribute("src") ||
          document.querySelector(".article__cover__image")?.getAttribute("data-lazy-src-mob");

        if (imagem && !imagem.startsWith("http")) imagem = `https:${imagem}`;
        return video || imagem || null;
      });

      const tipoMidia: "imagem" | "video" = midia?.includes("youtube") ? "video" : "imagem";

      await browser.close();
      return { texto, midia, tipoMidia };
    } catch {
      await browser.close();
      return { texto: "", midia: null, tipoMidia: "imagem" };
    }
  }

  async function buscarNoticiasOmelete(): Promise<NoticiaBruta[]> {
    const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox"] });
    const page = await browser.newPage();
    await page.setUserAgent("Mozilla/5.0");
    await page.goto("https://www.omelete.com.br/noticias", { waitUntil: "networkidle2" });
    await autoScroll(page);

    const noticias: NoticiaBruta[] = await page.evaluate(() => {
      return Array.from(document.querySelectorAll(".featured__head")).map((el) => {
        const aTag = el.querySelector("a");
        const linkRelativo = aTag?.getAttribute("href") || "";
        const titulo = (el.querySelector(".mark__title h2") as HTMLElement)?.innerText.trim() || "";
        const categoria = (el.querySelector(".tag p") as HTMLElement)?.innerText.trim() || "";
        const resumo = (el.parentElement?.querySelector(".featured__subtitle h3") as HTMLElement)?.innerText.trim() || "";

        let thumb =
          el.querySelector("img")?.getAttribute("data-src") ||
          el.querySelector("img")?.getAttribute("src");

        if (thumb && !thumb.startsWith("http")) thumb = `https:${thumb}`;
        if (!thumb || thumb.includes("loading.svg") || thumb.startsWith("data:image")) thumb = undefined;

        return {
          titulo,
          categoria,
          resumo,
          link: `https://www.omelete.com.br${linkRelativo}`,
          thumb,
        };
      });
    });

    await browser.close();
    return noticias;
  }

  const noticias = await buscarNoticiasOmelete();
  const novas: NoticiaCompleta[] = [];

  for (const noticia of noticias.slice(0, MAX_POSTS)) {
    const slug = slugify(noticia.titulo);
    if (!noticia.titulo || postsExistentes.some((p) => slugify(p.slug) === slug)) continue;

    const { texto, midia, tipoMidia } = await extrairConteudoNoticia(noticia.link);

    novas.push({
      ...noticia,
      texto,
      slug,
      midia,
      tipoMidia,
      fonte: "Omelete",
      reescrito: false,
    });
  }

  await fs.writeFile(jsonFilePath, JSON.stringify([...postsExistentes, ...novas], null, 2), "utf-8");

  return new Response(JSON.stringify({ ok: true, posts: novas.length }), { status: 200 });
}