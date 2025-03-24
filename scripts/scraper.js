const fs = require("fs");
const path = require("path");
const axios = require("axios");
const cheerio = require("cheerio");
const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const OpenAI = require("openai");
const MAX_POSTS = 1; // ← Limite de notícias por execuçã

require("dotenv").config();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

puppeteer.use(StealthPlugin());

const jsonFilePath = "public/posts.json";
const contentDir = path.join(process.cwd(), "content");

// Garante que a pasta content existe
if (!fs.existsSync(contentDir)) fs.mkdirSync(contentDir);

// Carrega posts existentes
let postsExistentes = [];
if (fs.existsSync(jsonFilePath)) {
  postsExistentes = JSON.parse(fs.readFileSync(jsonFilePath, "utf-8"));
}

// Slugify
function slugify(text) {
  return text
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
}

async function autoScroll(page) {
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let totalHeight = 0;
      const distance = 500;
      const timer = setInterval(() => {
        const scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;
        if (totalHeight >= scrollHeight - window.innerHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 300);
    });
  });
}

async function extrairConteudoNoticia(url) {
  const browser = await puppeteer.launch({ headless: "new", args: ["--no-sandbox"] });
  const page = await browser.newPage();

  try {
    await page.setUserAgent("Mozilla/5.0");
    await page.goto(url, { waitUntil: "networkidle2" });

    const texto = await page.evaluate(() => {
      return Array.from(document.querySelectorAll("p"))
        .map((p) => p.innerText.trim())
        .filter((t) =>
          t.length > 50 &&
          !t.includes("Política de Privacidade") &&
          !t.includes("Assine nossas notificações") &&
          !t.includes("tratamento dos dados")
        )
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

    const tipoMidia = midia?.includes("youtube") ? "video" : "imagem";

    await browser.close();
    return { texto, midia, tipoMidia };
  } catch (err) {
    await browser.close();
    console.error("❌ Erro ao extrair notícia:", err.message);
    return { texto: "", midia: null, tipoMidia: "imagem" };
  }
}

async function reescreverNoticia(titulo, resumo, textoOriginal) {
  try {
    const prompt = `Reescreva de forma criativa e otimizada para SEO:\nTítulo: ${titulo}\nResumo: ${resumo}\nTexto:\n${textoOriginal}`;
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
    });

    const output = completion.choices[0].message.content;
    const matchTitle = output.match(/t[ií]tulo[:\-]?\s*(.+)/i);
    const matchResumo = output.match(/resumo[:\-]?\s*(.+)/i);
    const matchTexto = output.match(/texto[:\-]?\s*([\s\S]+)/i);

    return {
      titulo: matchTitle?.[1]?.trim() || titulo,
      resumo: matchResumo?.[1]?.trim() || resumo,
      texto: matchTexto?.[1]?.trim() || textoOriginal,
    };
  } catch (error) {
    console.error("❌ Erro ao reescrever notícia:", error.message);
    return { titulo, resumo, texto: textoOriginal };
  }
}

async function buscarNoticiasOmelete(limite = 5) {
  const browser = await puppeteer.launch({ headless: "new", args: ["--no-sandbox"] });
  const page = await browser.newPage();
  await page.setUserAgent("Mozilla/5.0");

  const url = "https://www.omelete.com.br/noticias";
  await page.goto(url, { waitUntil: "networkidle2" });
  await autoScroll(page);

  console.log("🔍 Buscando notícias...");

  const noticias = await page.evaluate(() => {
    return Array.from(document.querySelectorAll(".featured__head")).map((el) => {
      const aTag = el.querySelector("a");
      const linkRelativo = aTag?.getAttribute("href") || "";
      const titulo = el.querySelector(".mark__title h2")?.innerText.trim() || "";
      const categoria = el.querySelector(".tag p")?.innerText.trim() || "";
      const resumo = el.parentElement?.querySelector(".featured__subtitle h3")?.innerText.trim() || "";

      let thumb = el.querySelector("img")?.getAttribute("data-src") || el.querySelector("img")?.getAttribute("src");
      if (thumb && !thumb.startsWith("http")) thumb = `https:${thumb}`;
      if (!thumb || thumb.includes("loading.svg") || thumb.startsWith("data:image")) thumb = null;

      return {
        titulo,
        categoria,
        resumo,
        link: `https://www.omelete.com.br${linkRelativo}`,
        thumb
      };
    });
  });

  await browser.close();

  const resultados = [];

  for (const noticia of noticias.slice(0, limite)) {
    if (!noticia.titulo || postsExistentes.some((p) => p.titulo === noticia.titulo)) continue;

    console.log(`📖 Capturando conteúdo de: ${noticia.titulo}`);
    const { texto, midia, tipoMidia } = await extrairConteudoNoticia(noticia.link);

    const reescrita = await reescreverNoticia(noticia.titulo, noticia.resumo, texto);
    const slug = slugify(reescrita.titulo);

    const novaNoticia = {
      ...noticia,
      ...reescrita,
      texto: reescrita.texto,
      midia: midia || noticia.thumb || "/images/default.jpg",
      tipoMidia: tipoMidia || "imagem",
      slug,
      fonte: "Omelete",
      reescrito: true
    };

    resultados.push(novaNoticia);

    // Salva em arquivo Markdown
    const mdPath = path.join(contentDir, `${slug}.md`);
    const frontMatter = `---
title: "${reescrita.titulo.replace(/"/g, "'")}"
slug: "${slug}"
categoria: "${noticia.categoria}"
midia: "${novaNoticia.midia}"
tipoMidia: "${novaNoticia.tipoMidia}"
thumb: "${noticia.thumb || ""}"
---\n\n`;

    const markdown = frontMatter + reescrita.texto;
    fs.writeFileSync(mdPath, markdown, "utf-8");
  }

  return resultados;
}

// Execução principal
(async () => {
  const force = process.argv.includes("--force");
  if (force) {
    console.log("⚠️ Modo FORÇADO: limpando posts existentes...");
    postsExistentes = [];
  }

  const novasNoticias = await buscarNoticiasOmelete(5);
  if (novasNoticias.length > 0) {
    const todas = force ? novasNoticias : [...postsExistentes, ...novasNoticias];
    fs.writeFileSync(jsonFilePath, JSON.stringify(todas, null, 2), "utf-8");
    console.log(`✅ ${novasNoticias.length} notícias salvas.`);
  } else {
    console.log("🔄 Nenhuma nova notícia encontrada.");
  }
})();