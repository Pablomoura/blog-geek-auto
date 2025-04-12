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
let serviceAccount;
try {
  const decoded = Buffer.from(process.env.GOOGLE_CREDENTIALS, "base64").toString("utf-8");
  serviceAccount = JSON.parse(decoded);
} catch (error) {
  throw new Error("❌ GOOGLE_CREDENTIALS inválida. Certifique-se de que está em base64 e contém JSON válido.");
}


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

// Função auxiliar para gerar tags com IA
async function gerarTagsComIA(titulo, texto) {
  const prompt = `Gere até 8 tags curtas e relevantes separadas por vírgula com base no título e texto:

  Título: ${titulo}
  Texto: ${texto}

  Responda apenas com as tags.`;

  try {
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4-turbo",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.5,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const content = response.data.choices[0].message.content.trim();
    return content.split(",").map((tag) => tag.trim());
  } catch (err) {
    console.error("❌ Erro ao gerar tags com IA:", err.message);
    return [];
  }
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
    await page.waitForSelector("p", { timeout: 10000 });

    // 🎯 Extrair imagens internas
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
          !src.includes("omelete_logo.svg") &&
          /\.(jpg|jpeg|png|webp)$/i.test(src)
        );
    });

    // ✅ NOVO: extrair embeds do Instagram
    const instagrams = await page.evaluate(() => {
      return Array.from(document.querySelectorAll("iframe[src*='instagram.com']"))
        .map((iframe) => {
          const src = iframe.getAttribute("src");
          return src
            ? `<blockquote class="instagram-media"><a href="${src.replace("/embed/", "/")}"></a></blockquote>`
            : null;
        })
        .filter(Boolean);
    });

    // ✅ NOVO: extrair tweets a partir dos iframes
    const tweets = await page.evaluate(() => {
      return Array.from(document.querySelectorAll("iframe[src*='twitter.com']"))
        .map((iframe) => {
          const tweetId = iframe.getAttribute("data-tweet-id") || iframe.src.match(/status\/(\d{10,25})/)?.[1];
          return tweetId
            ? `<blockquote class="twitter-tweet"><a href="https://twitter.com/user/status/${tweetId}"></a></blockquote>`
            : null;
        })
        .filter(Boolean);
    });       

    // 🎯 Extrair parágrafos de texto
    const texto = await page.evaluate(() => {
      return Array.from(document.querySelectorAll("p"))
        .map((p) => p.innerText.trim())
        .filter((t) =>
          t.length > 50 &&
          !/Omelete|Política|Privacidade|Assine|comentários/i.test(t)
        )
        .join("\\n");
    });

    // 🎯 Extrair mídia principal (vídeo ou imagem)
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
    return { texto, midia, tipoMidia, imagensInternas, tweets };

  } catch (err) {
    await browser.close();
    console.error("❌ Erro ao extrair notícia:", err.message);
    return { texto: "", midia: null, tipoMidia: "imagem", imagensInternas: [], tweets: [] };
  }
}

async function reescreverNoticia(titulo, resumo, texto) {
  const systemPrompt = `Você é um redator profissional. Reescreva notícias em português do Brasil com tom jornalístico, direto e informativo.
Corrija ortografia e gramática. Não resuma nem omita informações.
Mantenha a estrutura original. Use parágrafos curtos com duas quebras de linha para Markdown.
Ignore comentários e chamadas ao Omelete. Garanta que o texto seja autêntico e não pareça plágio.`;

  const userPrompt = `Reescreva o seguinte conteúdo:

Título: ${titulo}
Resumo: ${resumo}
Texto: ${texto}

Responda em JSON com:
{
  "titulo": "...",
  "resumo": "...",
  "texto": "...",
  "keywords": "..."
}`;

  try {
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4-turbo",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    let raw = response.data.choices[0].message.content.trim();
    raw = raw.replace(/^[^{]+/, "{").replace(/}[^}]*$/, "}");

    const reescrito = JSON.parse(raw);
    reescrito.texto = reescrito.texto.replace(/\\n/g, "\n").replace(/(?<!\n)\n(?!\n)/g, "\n\n");

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
    const { texto, midia, tipoMidia, imagensInternas, tweets, instagrams } = await extrairConteudoNoticia(noticia.link);
    console.log("🐦 Tweets encontrados:", tweets);

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
    const embeds = [...tweets, ...instagrams];
    novaNoticia.texto = inserirTweetsNoTexto(
      inserirImagensNoTexto(reescrito.texto, imagensInternas),
      embeds
    );
       
    novaNoticia.reescrito = true;

    const tags = reescrito.keywords
  ? reescrito.keywords.split(",").map((t) => t.trim()).filter(Boolean)
  : [];

    const keywords = tags.join(", ");

    const mdPath = path.join(contentDir, `${slug}.md`);
    // Distribui autores automaticamente
    const autores = ["Pablo Moura", "Luana Souza", "Ana Luiza"];
    const autorEscolhido = autores[Math.floor(Math.random() * autores.length)];
    const frontMatter = `---
title: "${reescrito.titulo.replace(/"/g, "'")}"
slug: "${slug}"
categoria: "${novaNoticia.categoria}"
midia: "${novaNoticia.midia}"
tipoMidia: "${novaNoticia.tipoMidia}"
thumb: "${novaNoticia.thumb || ""}"
tags: ["${tags.join('", "')}"]
keywords: "${keywords}"
author: "${autorEscolhido}"
data: "${new Date().toISOString()}"
---\n\n`;

    const markdown = frontMatter + novaNoticia.texto;
    fs.writeFileSync(mdPath, markdown, "utf-8");

    novaNoticia.data = new Date().toISOString();
    
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
