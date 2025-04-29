const fs = require("fs");
const path = require("path");
const axios = require("axios");
const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
require("dotenv").config();
const { google } = require("googleapis");
const buscarFontesGoogle = require("./buscarFontesGoogle");

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

    // 🟡 Extrair ficha técnica se for crítica
    let notaCritico = null;
    let direcao = "";
    let elenco = [];
    let ficha = {
      tituloOriginal: "",
      tituloObra: "",
      tituloPortugues: "",
      ano: "",
      pais: "",
      classificacao: "",
      duracao: "",
      capaObra: ""
    };

    try {
      const jsonLdRaw = await page.$eval('script[type="application/ld+json"]', el => el.innerText);
      const jsonLd = JSON.parse(jsonLdRaw);
      notaCritico = Number(jsonLd.aggregateRating?.ratingValue || null);
      direcao = jsonLd.director?.map(d => d.name).join(", ") || "";
      elenco = jsonLd.actor?.map(a => a.name) || [];
    } catch {
      console.warn("⚠️ JSON-LD não encontrado ou inválido");
    }

    const fichaExtra = await page.evaluate(() => {
      const pegaTexto = (label) => {
        const el = Array.from(document.querySelectorAll(".overview .item"))
          .find(p => p.innerText.includes(label));
        return el ? el.innerText.replace(label, "").trim() : "";
      };

      const capaObra = document.querySelector(".overview__content .list__picture img")?.getAttribute("src") || "";
      const tituloOriginal = document.querySelector(".overview h3.subtitle")?.innerText || "";
      const tituloObra = document.querySelector(".overview h2.title")?.innerText || "";
      const tituloPortugues = document.querySelector(".overview .title")?.textContent?.trim() || "";

      return {
        tituloOriginal,
        tituloObra,
        tituloPortugues,
        ano: pegaTexto("Ano:"),
        pais: pegaTexto("País:"),
        classificacao: pegaTexto("Classificação:"),
        duracao: pegaTexto("Duração:"),
        capaObra: capaObra.startsWith("//") ? "https:" + capaObra : capaObra
      };
    });

    Object.assign(ficha, fichaExtra);

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

    // ✅ Embeds do Instagram via iframe
    let instagramIframes = await page.evaluate(() => {
      return Array.from(document.querySelectorAll("iframe[src*='instagram.com']"))
        .map((iframe) => iframe.getAttribute("src") || "")
        .filter(Boolean);
    });
    instagramIframes = instagramIframes.map((src) => {
      const url = limparUrlInstagram(src);
      return `<blockquote class="instagram-media" data-instgrm-permalink="${url}" data-instgrm-version="14" style="width:100%; max-width:540px; margin:1rem auto;"><a href="${url}">Ver post no Instagram</a></blockquote>`;
    });

    let instagramLinks = await page.evaluate(() => {
      return Array.from(document.querySelectorAll("a[href*='instagram.com/p/']"))
        .map((a) => a.getAttribute("href"))
        .filter(Boolean);
    });
    instagramLinks = instagramLinks.map((href) => {
      const url = limparUrlInstagram(href);
      return `<blockquote class="instagram-media" data-instgrm-permalink="${url}" data-instgrm-version="14" style="width:100%; max-width:540px; margin:1rem auto;"><a href="${url}">Ver post no Instagram</a></blockquote>`;
    });

    const instagrams = [...instagramIframes, ...instagramLinks];

    const tweets = await page.evaluate(() => {
      return Array.from(document.querySelectorAll("iframe[src*='twitter.com']"))
        .map((iframe) => {
          const tweetId = iframe.getAttribute("data-tweet-id") || (iframe.src.match(/status\/(\d{10,25})/) || [])[1];
          return tweetId
            ? `<blockquote class="twitter-tweet"><a href="https://twitter.com/user/status/${tweetId}"></a></blockquote>`
            : null;
        })
        .filter(Boolean);
    });

    const texto = await page.evaluate(() => {
      const elementos = Array.from(document.querySelectorAll("h2, h3, h4, p, li"));
      return elementos
        .map((el) => {
          let tag = el.tagName.toLowerCase();
          let texto = el.innerText.trim();
    
          if (!texto || texto.length < 30) return null;
          if (/Omelete|Política|Privacidade|Assine|comentários/i.test(texto)) return null;
    
          if (tag === "h2") return `## ${texto}`; // título principal
          if (tag === "h3") return `### ${texto}`; // subtítulo
          if (tag === "h4") return `### ${texto}`; // subtítulo menor
          if (tag === "li") return `- ${texto}`;   // item de lista
    
          return texto; // parágrafo normal
        })
        .filter(Boolean)
        .join("\n\n"); // quebra dupla para separar melhor os blocos
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
    return {
      texto,
      midia,
      tipoMidia,
      imagensInternas,
      tweets,
      instagrams,
      notaCritico,
      tituloOriginal: ficha.tituloOriginal,
      tituloObra: ficha.tituloObra,
      tituloPortugues: ficha.tituloPortugues,
      ano: ficha.ano,
      pais: ficha.pais,
      classificacao: ficha.classificacao,
      duracao: ficha.duracao,
      direcao,
      elenco,
      capaObra: ficha.capaObra
    };
  } catch (err) {
    await browser.close();
    console.error("❌ Erro ao extrair notícia:", err.message);
    return {
      texto: "",
      midia: null,
      tipoMidia: "imagem",
      imagensInternas: [],
      tweets: [],
      instagrams: []
    };
  }
}

async function reescreverNoticia(titulo, resumo, texto) {
  const systemPrompt = `Você é um redator de notícias especializado em cultura pop, cinema, séries, animes e games. Seu papel é reescrever matérias de forma original, clara, profunda e atrativa, com foco em SEO e alto desempenho no Google Discover.

Siga estas diretrizes obrigatórias:
- Escreva um título impactante, direto e único, evitando clickbait genérico. Priorize palavras com potencial de busca.
- Crie um resumo cativante com até 2 frases, destacando o gancho principal da matéria.
- Reescreva o conteúdo de forma autêntica, com parágrafos curtos e informativos (máximo 3 linhas por parágrafo), usando duas quebras de linha (\n\n) entre eles.
- Utilize **sem exceção** subtítulos em Markdown (##, ###) para estruturar o conteúdo — obrigatoriamente ao menos um H2 e, se possível, H3.
- Em matérias com vários tópicos ou lançamentos, crie uma seção por tema, com subtítulo, nome da obra, data de estreia, plataforma e detalhes relevantes.
- Em notícias únicas, aprofunde o contexto com histórico, dados, comparações, impactos, nomes importantes e curiosidades.
- Use listas quando adequado, destaques em **negrito**, e perguntas estratégicas para engajar o leitor.
- Nunca omita informações importantes. Corrija erros, remova redundâncias e entregue um conteúdo que pareça inédito.
- Seu objetivo final é produzir um artigo que tenha alta escaneabilidade, originalidade, clareza, profundidade e estrutura perfeita para SEO.
- Este conteúdo será publicado em um site de notícias geek. Pense como um editor de destaque do Google News.

Exemplo de estrutura ideal:

# Título impactante

**Resumo direto com gancho e contexto.**

## Subtítulo com nome da obra (se aplicável)

Conteúdo dividido em blocos, com dados, contexto e estrutura de leitura leve.`;

  const userPrompt = `Reescreva a notícia abaixo conforme as instruções acima.

Título original: ${titulo}
Resumo original: ${resumo}

Texto original:
${texto}

Responda apenas com o JSON, sem explicações ou texto extra antes ou depois. Formato:
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
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("JSON inválido: nenhum bloco JSON encontrado");

    const reescrito = JSON.parse(match[0]);

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
    const embeds = [...(tweets || []), ...(instagrams || [])];
    novaNoticia.texto = inserirTweetsNoTexto(
      inserirImagensNoTexto(reescrito.texto, imagensInternas),
      embeds
    );

    // 🔎 Buscar fontes internacionais com base no título
    const blocoFontes = await buscarFontesGoogle(novaNoticia.titulo);
    novaNoticia.texto += blocoFontes;

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

function limparUrlInstagram(url) {
  try {
    const parsed = new URL(url, "https://www.instagram.com");
    let pathname = parsed.pathname;

    // Remove qualquer sufixo "/embed", "/captioned", ou strings coladas tipo "captioned" no final
    pathname = pathname
      .replace(/\/?(embed|captioned)\/?$/, "")        // remove /embed ou /captioned
      .replace(/(embed|captioned)$/i, "")             // remove se vier colado ao ID
      .replace(/\/+$/, "");                           // remove barras finais duplicadas

    return `https://www.instagram.com${pathname}/`;   // adiciona barra final padrão
  } catch {
    return url;
  }
}

(async () => {
  const force = process.argv.includes("--force");

  if (force) {
    console.log("⚠️ Modo FORÇADO: limpando posts existentes...");
    postsExistentes = [];
  }

  const novasNoticias = await buscarNoticiasOmelete();
  const novasCriticas = await buscarCriticasOmelete();

  const novosPosts = [...novasNoticias, ...novasCriticas];

  if (novosPosts.length > 0) {
    const todas = force ? novosPosts : [...postsExistentes, ...novosPosts];
    fs.writeFileSync(jsonFilePath, JSON.stringify(todas, null, 2), "utf-8");
    console.log(`✅ ${novosPosts.length} posts salvos (notícias + críticas).`);
  } else {
    console.log("🔄 Nenhuma nova notícia ou crítica encontrada.");
  }
})();

async function buscarCriticasOmelete() {
  const browser = await puppeteer.launch({ headless: "new", args: ["--no-sandbox"] });
  const page = await browser.newPage();
  await page.setUserAgent("Mozilla/5.0");

  await page.goto("https://www.omelete.com.br/criticas", { waitUntil: "networkidle2" });
  await autoScroll(page);

  console.log("🔍 Buscando críticas...");

  const criticas = await page.evaluate(() => {
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

  for (const critica of criticas.slice(0, MAX_POSTS)) {
    const slug = slugify(critica.titulo);
    if (!critica.titulo || postsExistentes.some((p) => slugify(p.slug) === slug)) continue;

    try {
      console.log(`🎬 Capturando crítica: ${critica.titulo}`);
      const dados = await extrairConteudoNoticia(critica.link);

      const novaCritica = {
        ...critica,
        ...dados,
        texto: dados.texto,
        midia: dados.midia || critica.thumb || "/images/default.jpg",
        tipoMidia: dados.tipoMidia || "imagem",
        slug,
        fonte: "Omelete",
        reescrito: false,
      };

      const reescrito = await reescreverNoticia(novaCritica.titulo, novaCritica.resumo, novaCritica.texto);
      if (!reescrito) continue;

      novaCritica.titulo = reescrito.titulo;
      novaCritica.resumo = reescrito.resumo;
      const embeds = [...(dados.tweets || []), ...(dados.instagrams || [])];
      novaCritica.texto = inserirTweetsNoTexto(
        inserirImagensNoTexto(reescrito.texto, dados.imagensInternas),
        embeds
      );

      const blocoFontes = await buscarFontesGoogle(novaCritica.titulo);
      novaCritica.texto += blocoFontes;

      novaCritica.reescrito = true;

      const tags = reescrito.keywords ? reescrito.keywords.split(",").map((t) => t.trim()).filter(Boolean) : [];
      const keywords = tags.join(", ");

      const mdPath = path.join(contentDir, `${slug}.md`);
      const autores = ["Pablo Moura", "Luana Souza", "Ana Luiza"];
      const autorEscolhido = autores[Math.floor(Math.random() * autores.length)];

      const frontMatter = `---
title: "${reescrito.titulo.replace(/"/g, "'")}"
slug: "${slug}"
categoria: "${novaCritica.categoria}"
tipo: "critica"
resumo: "${novaCritica.resumo.replace(/"/g, "'")}"
midia: "${novaCritica.midia}"
tipoMidia: "${novaCritica.tipoMidia}"
thumb: "${novaCritica.thumb || ""}"
tags: ["${tags.join('", "')}"]
keywords: "${keywords}"
author: "${autorEscolhido}"
data: "${new Date().toISOString()}"
tituloPortugues: "${novaCritica.tituloPortugues || ""}"
capaObra: "${novaCritica.capaObra || ""}"
notaCritico: ${novaCritica.notaCritico || "null"}
tituloOriginal: "${novaCritica.tituloOriginal || ""}"
ano: "${novaCritica.ano || ""}"
pais: "${novaCritica.pais || ""}"
classificacao: "${novaCritica.classificacao || ""}"
duracao: "${novaCritica.duracao || ""}"
direcao: "${novaCritica.direcao || ""}"
elenco: ["${(Array.isArray(novaCritica.elenco) ? novaCritica.elenco : []).join('", "')}"]
---\n\n`;

      const markdown = frontMatter + novaCritica.texto;
      fs.writeFileSync(mdPath, markdown, "utf-8");

      novaCritica.data = new Date().toISOString();

      resultados.push(novaCritica);
      await enviarParaIndexingAPI(`https://www.geeknews.com.br/noticia/${slug}`);
    } catch (err) {
      console.warn("⚠️ Falha ao capturar crítica:", critica.titulo, err.message);
      continue;
    }
  }

  return resultados;
}
