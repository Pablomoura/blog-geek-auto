const fs = require("fs");
const path = require("path");
const axios = require("axios");
const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
require("dotenv").config();
const { google } = require("googleapis");
if (!process.env.GOOGLE_CREDENTIALS) {
  throw new Error("❌ GOOGLE_CREDENTIALS não definida. Verifique suas variáveis de ambiente no GitHub.");
}
const serviceAccount = JSON.parse(process.env.GOOGLE_CREDENTIALS);

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
const MAX_POSTS = 8;

if (!fs.existsSync(contentDir)) {
  fs.mkdirSync(contentDir);
}

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

function inserirImagensNoTexto(texto, imagens) {
  if (!imagens?.length) return texto;
  const paragrafos = texto.split("\n\n");
  const resultado = [];

  for (let i = 0; i < paragrafos.length; i++) {
    resultado.push(paragrafos[i]);
    if (i < imagens.length) {
      resultado.push(`![Imagem da notícia](${imagens[i]})`);
    }
  }

  return resultado.join("\n\n");
}

function inserirTweetsNoTexto(texto, tweets) {
  if (!tweets?.length) return texto;
  const paragrafos = texto.split("\n\n");
  const resultado = [];
  let tweetIndex = 0;

  for (let i = 0; i < paragrafos.length; i++) {
    resultado.push(paragrafos[i]);
    if (tweetIndex < tweets.length) {
      resultado.push(tweets[tweetIndex]);
      tweetIndex++;
    }
  }

  return resultado.join("\n\n");
}

async function extrairConteudoNoticia(url) {
  const browser = await puppeteer.launch({ headless: "new", args: ["--no-sandbox"] });
  const page = await browser.newPage();

  try {
    await page.setUserAgent("Mozilla/5.0");
    await page.goto(url, { waitUntil: "networkidle2" });
    await autoScroll(page);
    await page.waitForSelector("img", { timeout: 10000 });

    const imagensInternas = await page.evaluate(() => {
      return Array.from(document.querySelectorAll("div.media__wrapper__image img"))
        .map((img) => {
          let src = img.getAttribute("data-src") || img.getAttribute("src") || "";
    
          if (src.startsWith("//")) src = "https:" + src;
          if (src && !src.startsWith("http")) src = "https:" + src;
    
          return src;
        })
        .filter((src) =>
          src &&
          !src.includes("loading.svg") &&
          !src.includes("data:image") &&
          !src.includes("pixel.mathtag.com") &&
          !src.includes("analytics.yahoo.com") &&
          !src.includes("omelete_logo.svg") &&
          !src.includes("icons/search") &&
          !src.includes("navdmp.com") &&
          /\.(jpg|jpeg|png|webp)$/i.test(src) // só formatos de imagem válidos
        );
    });
    

    const tweets = await page.evaluate(() => {
      return Array.from(document.querySelectorAll("iframe[data-tweet-id]"))
        .map((iframe) => {
          const tweetId = iframe.getAttribute("data-tweet-id");
          return tweetId ? `\n<blockquote class="twitter-tweet"><a href="https://twitter.com/user/status/${tweetId}"></a></blockquote>\n` : null;
        })
        .filter(Boolean);
    });

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
    return { texto, midia, tipoMidia, imagensInternas, tweets };
  } catch (err) {
    await browser.close();
    console.error("❌ Erro ao extrair notícia:", err.message);
    return { texto: "", midia: null, tipoMidia: "imagem", imagensInternas: [], tweets: [] };
  }
}

async function reescreverNoticia(titulo, resumo, texto) {
  const prompt = `
Reescreva a seguinte notícia com ortografia e gramática corretas, em um tom jornalístico, direto e informativo.
Mantenha todos os fatos e detalhes relevantes da matéria original, sem omitir informações importantes e sem parecer plagio. Utilize uma quantidade semelhante ou superior de palavras, garantindo no mínimo 500 palavras, e não resuma o conteúdo original.
Se houver listas, cronogramas, tópicos organizados ou conteúdos segmentados, recrie-os com fidelidade e clareza.
Separe cada parágrafo com duas quebras de linha para garantir leitura adequada em Markdown.
Evite parágrafos longos: limite cada bloco a 2 ou 3 frases para facilitar a leitura.

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
+  "keywords": "palavra1, palavra2, palavra3
}`;

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

    raw = raw.trim();
    raw = raw.replace(/^[^]*?{/, '{');
    raw = raw.replace(/}[^}]*$/, '}');
    raw = raw.replace(/[\u0000-\u001F\u007F]/g, "");
    raw = raw.replace(/\t/g, " ");

    let reescrito;
    try {
      reescrito = JSON.parse(raw);
    } catch (err) {
      console.error("❌ Erro ao fazer JSON.parse:", err.message);
      console.log("🧪 Conteúdo recebido:\n", raw);
      return null;
    }

    console.log("\n🧪 RAW recebido da IA:\n", raw);

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
    const { texto, midia, tipoMidia, imagensInternas } = await extrairConteudoNoticia(noticia.link);

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
    novaNoticia.texto = inserirImagensNoTexto(reescrito.texto, imagensInternas);
    novaNoticia.reescrito = true;

    const mdPath = path.join(contentDir, `${slug}.md`);
    const frontMatter = `---
title: "${reescrito.titulo.replace(/"/g, "'")}"
slug: "${slug}"
categoria: "${novaNoticia.categoria}"
midia: "${novaNoticia.midia}"
tipoMidia: "${novaNoticia.tipoMidia}"
thumb: "${novaNoticia.thumb || ""}"
keywords: "${reescrito.keywords || ""}"
data: "${new Date().toISOString()}"
---\n\n`;

    const markdown = frontMatter + novaNoticia.texto;
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
