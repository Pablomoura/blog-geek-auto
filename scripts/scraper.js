const fs = require("fs");
const axios = require("axios");
const cheerio = require("cheerio");
const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");

puppeteer.use(StealthPlugin());

const filePath = "public/posts.json";

let postsExistentes = [];
if (fs.existsSync(filePath)) {
  postsExistentes = JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

function slugify(text) {
  return text
    .toLowerCase()
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
        .map(p => p.innerText.trim())
        .filter(t =>
          t.length > 50 &&
          !t.includes("Política de Privacidade") &&
          !t.includes("Assine nossas notificações") &&
          !t.includes("tratamento dos dados")
        )
        .join("\n");
    });

    const midia = await page.evaluate(() => {
      const video = document.querySelector("iframe[src*='youtube']")?.getAttribute("src");
      let imagem = document.querySelector(".article__cover__image")?.getAttribute("src") ||
                   document.querySelector(".article__cover__image")?.getAttribute("data-lazy-src-mob");

      if (imagem && !imagem.startsWith("http")) {
        imagem = `https:${imagem}`;
      }

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

async function buscarNoticiasOmelete() {
  const browser = await puppeteer.launch({ headless: "new", args: ["--no-sandbox"] });
  const page = await browser.newPage();
  await page.setUserAgent("Mozilla/5.0");

  const url = "https://www.omelete.com.br/noticias";
  await page.goto(url, { waitUntil: "networkidle2" });

  // 🔄 Scroll automático
  await autoScroll(page);

  console.log("🔍 Buscando notícias com thumbs...");

  const noticias = await page.evaluate(() => {
    return Array.from(document.querySelectorAll(".featured__head")).map(el => {
      const aTag = el.querySelector("a");
      const linkRelativo = aTag?.getAttribute("href") || "";
      const titulo = el.querySelector(".mark__title h2")?.innerText.trim() || "";
      const categoria = el.querySelector(".tag p")?.innerText.trim() || "";
      const resumo = el.parentElement?.querySelector(".featured__subtitle h3")?.innerText.trim() || "";

      let thumb = el.querySelector("img")?.getAttribute("data-src") ||
                  el.querySelector("img")?.getAttribute("src");

      if (thumb && !thumb.startsWith("http")) {
        thumb = `https:${thumb}`;
      }

      if (!thumb || thumb.includes("loading.svg") || thumb.startsWith("data:image")) {
        thumb = null;
      }

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

  for (const noticia of noticias) {
    if (!noticia.titulo || postsExistentes.some(p => p.titulo === noticia.titulo)) {
      continue;
    }

    console.log(`📖 Capturando conteúdo de: ${noticia.titulo}`);
    const { texto, midia, tipoMidia } = await extrairConteudoNoticia(noticia.link);

    resultados.push({
      ...noticia,
      texto,
      midia: midia || noticia.thumb || "/images/default.jpg",
      tipoMidia: tipoMidia || "imagem",
      slug: slugify(noticia.titulo),
      fonte: "Omelete",
      reescrito: false
    });
  }

  return resultados;
}

(async () => {
  const force = process.argv.includes("--force");
  if (force) {
    console.log("⚠️ Rodando em modo FORÇADO (reescrevendo posts)");
    postsExistentes = [];
  }

  const novasNoticias = await buscarNoticiasOmelete();
  if (novasNoticias.length > 0) {
    const todas = force ? novasNoticias : [...postsExistentes, ...novasNoticias];
    fs.writeFileSync(filePath, JSON.stringify(todas, null, 2), "utf-8");
    console.log(`✅ ${novasNoticias.length} notícias salvas.`);
  } else {
    console.log("🔄 Nenhuma nova notícia encontrada.");
  }
})();