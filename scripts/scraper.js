const fs = require("fs");
const path = require("path");
const axios = require("axios");
const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
require("dotenv").config();
const { google } = require("googleapis");
const serviceAccount = require("./google-service-account.json");

const auth = new google.auth.GoogleAuth({
  credentials: serviceAccount,
  scopes: ["https://www.googleapis.com/auth/indexing"],
});

const indexingClient = google.indexing({ version: "v3", auth });

async function enviarParaIndexingAPI(url) {
  try {
    await indexingClient.urlNotifications.publish({
      requestBody: {
        url,
        type: "URL_UPDATED",
      },
    });
    console.log("📬 Enviado para indexação:", url);
  } catch (error) {
    console.error("❌ Erro ao enviar para indexação:", url, error.response?.data || error.message);
  }
}

puppeteer.use(StealthPlugin());

const jsonFilePath = "public/posts.json";
const contentDir = path.join(process.cwd(), "content");
const MAX_POSTS = 5;

// Garante que a pasta content exista
if (!fs.existsSync(contentDir)) {
  fs.mkdirSync(contentDir);
}

// Carrega os posts existentes
let postsExistentes = [];
if (fs.existsSync(jsonFilePath)) {
  postsExistentes = JSON.parse(fs.readFileSync(jsonFilePath, "utf-8"));
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
        window.scrollBy(0, distance);
        totalHeight += distance;
        if (totalHeight >= document.body.scrollHeight - window.innerHeight) {
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

async function reescreverNoticia(titulo, resumo, texto) {
  const prompt = `
Reescreva a seguinte notícia com boa ortografia, gramática e foco em SEO. Use um tom jornalístico, direto e informativo, mantendo os fatos.
Separe cada parágrafo com duas quebras de linha para garantir leitura adequada em Markdown. Evite blocos grandes: limite a 2-3 frases por parágrafo.

Título:
${titulo}

Resumo:
${resumo}

Texto:
${texto}

Responda em JSON neste formato:
{
  "titulo": "...",
  "resumo": "...",
  "texto": "..."
}
`;

  try {
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4-turbo",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    let raw = response.data.choices[0].message.content;

    // Limpa caracteres problemáticos
    raw = raw.replace(/[\u0000-\u001F\u007F]/g, "");
    raw = raw.replace(/\t/g, " ");

    console.log("\n🧪 RAW recebido da IA:\n", raw);

    // Faz parse da resposta e garante parágrafos duplos
    const reescrito = JSON.parse(raw);
    reescrito.texto = reescrito.texto.replace(/(?<!\n)\n(?!\n)/g, "\n\n");

    return reescrito;
  } catch (err) {
    console.error("❌ Erro ao reescrever notícia:", err.message);
    return null;
  }
}

async function buscarNoticiasOmelete() {
  const browser = await puppeteer.launch({ headless: "new", args: ["--no-sandbox"] });
  const page = await browser.newPage();
  await page.setUserAgent("Mozilla/5.0");

  await page.goto("https://www.omelete.com.br/noticias", { waitUntil: "networkidle2" });
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
        thumb,
      };
    });
  });

  await browser.close();

  const resultados = [];

  for (const noticia of noticias.slice(0, MAX_POSTS)) {
    const slug = slugify(noticia.titulo);

    if (!noticia.titulo || postsExistentes.some((p) => slugify(p.slug) === slug)) continue;

    console.log(`📖 Capturando conteúdo de: ${noticia.titulo}`);
    const { texto, midia, tipoMidia } = await extrairConteudoNoticia(noticia.link);

    const novaNoticia = {
      ...noticia,
      texto,
      midia: midia || noticia.thumb || "/images/default.jpg",
      tipoMidia: tipoMidia || "imagem",
      slug,
      fonte: "Omelete",
      reescrito: false,
    };

    const reescrito = await reescreverNoticia(novaNoticia.titulo, novaNoticia.resumo, novaNoticia.texto);
    if (!reescrito) continue;

    novaNoticia.titulo = reescrito.titulo;
    novaNoticia.resumo = reescrito.resumo;
    novaNoticia.texto = reescrito.texto;
    novaNoticia.reescrito = true;

    // Salva como .md
    const mdPath = path.join(contentDir, `${slug}.md`);
    const frontMatter = `---
title: "${reescrito.titulo.replace(/"/g, "'")}"
slug: "${slug}"
categoria: "${novaNoticia.categoria}"
midia: "${novaNoticia.midia}"
tipoMidia: "${novaNoticia.tipoMidia}"
thumb: "${novaNoticia.thumb || ""}"
data: "${new Date().toISOString()}"
---\n\n`;

    const markdown = frontMatter + reescrito.texto;
    fs.writeFileSync(mdPath, markdown, "utf-8");

    resultados.push(novaNoticia);
    await enviarParaIndexingAPI(`https://www.geeknews.com.br/noticia/${slug}`);
  }

  return resultados;
}

(async () => {
  const force = process.argv.includes("--force");

  if (force) {
    console.log("⚠️ Modo FORÇADO: limpando posts existentes...");
    postsExistentes = [];
  }

  const novasNoticias = await buscarNoticiasOmelete();

  if (novasNoticias.length > 0) {
    const todas = force ? novasNoticias : [...postsExistentes, ...novasNoticias];
    fs.writeFileSync(jsonFilePath, JSON.stringify(todas, null, 2), "utf-8");
    console.log(`✅ ${novasNoticias.length} notícias salvas.`);
  } else {
    console.log("🔄 Nenhuma nova notícia encontrada.");
  }
})();
