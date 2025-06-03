const fs = require("fs");
const path = require("path");
const axios = require("axios");
const { XMLParser } = require("fast-xml-parser");
const TurndownService = require("turndown");
const { JSDOM } = require("jsdom");
require("dotenv").config();

const turndownService = new TurndownService({ headingStyle: "atx" });

// Mantém embeds (Twitter, Instagram, YouTube, Reddit)
turndownService.addRule("embedBlockquotes", {
  filter: (node) => {
    const className = node.getAttribute?.("class") || "";
    return (
      node.nodeName === "BLOCKQUOTE" &&
      (className.includes("twitter-tweet") ||
        className.includes("instagram-media") ||
        className.includes("reddit-embed-bq"))
    );
  },
  replacement: (_content, node) => `\n\n${node.outerHTML || ""}\n\n`,
});
turndownService.addRule("embedIframes", {
  filter: (node) => {
    const src = node.getAttribute("src") || "";
    return node.nodeName === "IFRAME" && src.includes("youtube.com/embed");
  },
  replacement: (_content, node) => `\n\n${node.outerHTML || ""}\n\n`,
});

// Mantém figuras e imagens
turndownService.addRule("preserveFigure", {
  filter: (node) => node.nodeName === "FIGURE" && node.innerHTML.includes("<img"),
  replacement: (_content, node) => `\n\n${node.outerHTML || ""}\n\n`,
});
turndownService.addRule("image", {
  filter: "img",
  replacement: (content, node) => {
    const alt = node.getAttribute("alt") || "";
    const src = node.getAttribute("src") || "";
    return src ? `![${alt}](${src})` : "";
  },
});

const FEED_URL = "https://ovicio.com.br/feed/";
const contentDir = path.join(process.cwd(), "content");
const jsonFilePath = "public/posts.json";
const MAX_POSTS = 10;
if (!fs.existsSync(contentDir)) fs.mkdirSync(contentDir);

let postsExistentes = [];
if (fs.existsSync(jsonFilePath)) {
  postsExistentes = JSON.parse(fs.readFileSync(jsonFilePath, "utf-8"));
}

function slugify(text) {
  return text
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

function limparTag(tag) {
  return tag
    .replace(/[:]/g, "")
    .replace(/[^\w\s-]/g, "")
    .trim();
}

function mapCategoria(original) {
  const mapa = {
    "Animes & Mangás": "Mangás e Animes",
    "Games": "Games",
    "Filmes": "Filmes",
    "Séries & TV": "Séries e TV",
    "Quadrinhos": "HQ/Livros",
    "Música": "Musica",
    "Board Games": "Board Games",
    "Streaming": "Streaming"
  };
  return mapa[original.trim()] || "Séries e TV";
}

function limparTexto(html) {
  const dom = new JSDOM(html);
  const document = dom.window.document;
  const imagens = [];

  document.querySelectorAll("p, li").forEach((el) => {
    const texto = el.textContent;
    if (
      texto.includes("apareceu primeiro em") ||
      texto.includes("Siga o") ||
      texto.includes("Google Notícias")
    ) {
      el.remove();
    }
  });

  document.querySelectorAll("img").forEach((img) => {
    const src = img.getAttribute("src");
    if (src && !imagens.includes(src)) imagens.push(src);
  });

  // preserva embeds válidos, remove o resto
  document.querySelectorAll("blockquote, iframe").forEach((el) => {
    const className = el.getAttribute("class") || "";
    const src = el.getAttribute("src") || "";
    const isValido =
      className.includes("twitter-tweet") ||
      className.includes("instagram-media") ||
      className.includes("reddit-embed-bq") ||
      src.includes("youtube.com/embed");
    if (!isValido) el.remove();
  });

  return {
    html: document.body.innerHTML.trim(),
    imagens,
  };
}
function extrairThumb(mediaContent, fallback) {
  if (mediaContent?.url) return mediaContent.url;
  if (mediaContent?.thumbnail?.url) return mediaContent.thumbnail.url;
  return fallback || "/images/default.jpg";
}

function gerarSlugUnico(base, existentes) {
  let slug = slugify(base);
  let i = 1;
  while (existentes.some((p) => p.slug === slug)) {
    slug = `${slugify(base)}-${i++}`;
  }
  return slug;
}

function inserirImagensNoTexto(texto, imagens = []) {
  const paragrafos = texto.split(/\n{2,}/).filter(Boolean);
  const resultado = [];
  let iImg = 0;
  for (let i = 0; i < paragrafos.length; i++) {
    resultado.push(paragrafos[i]);
    if (
      iImg < imagens.length &&
      !paragrafos[i].includes("<iframe") &&
      !paragrafos[i].includes("<blockquote")
    ) {
      const src = imagens[iImg];
      if (/\.(jpg|jpeg|png|webp|gif)$/i.test(src)) {
        resultado.push(`![imagem ilustrativa](${src})`);
        iImg++;
      }
    }
  }
  return resultado.join("\n\n").trim();
}

function inserirBlocosPreservados(markdown, htmlOriginal) {
  const dom = new JSDOM(htmlOriginal);
  const doc = dom.window.document;
  const blocos = [];

  doc.querySelectorAll("iframe, blockquote.twitter-tweet, blockquote.instagram-media, blockquote.reddit-embed-bq").forEach((el) => {
    blocos.push(el.outerHTML.trim());
  });

  const paragrafos = markdown.split(/\n{2,}/).filter(Boolean);
  const resultado = [];
  let i = 0;

  for (const p of paragrafos) {
    resultado.push(p);
    if (i < blocos.length && !p.includes("<iframe") && !p.includes("<blockquote")) {
      resultado.push(blocos[i]);
      i++;
    }
  }

  while (i < blocos.length) {
    resultado.push(blocos[i]);
    i++;
  }

  return resultado.join("\n\n").trim();
}

async function reescreverComOpenAI(titulo, resumo, markdownOriginal) {
  const systemPrompt = `Você é um redator de notícias geek. Reescreva conteúdos com foco em SEO e profundidade jornalística. Siga estas diretrizes:

- Escreva um título impactante, direto e único, com potencial de busca.
- Crie um resumo com até 2 frases destacando o gancho da matéria.
- Reescreva o conteúdo com linguagem natural, clara e envolvente, sempre com parágrafos curtos (máximo 3 linhas cada).
- Use **obrigatoriamente** subtítulos em Markdown (##, ###) para estruturar o texto — ao menos um H2 é obrigatório.
- O texto reescrito deve ter pelo menos 200 palavras a mais que o original.
- Use listas, destaques em **negrito**, e perguntas estratégicas quando fizer sentido.
- Traduza nomes de obras ou termos, se forem conhecidos no Brasil.
- Não converta valores em moeda estrangeira.
- Não use clickbait barato. Entregue valor real com contexto, curiosidades, dados, comparações e explicações.
- Não reescreva a sessão de Leia Mais...
- Entregue um texto que pareça inédito, autoral e digno de destaque no Google Discover e agregadores de notícia.
IMPORTANTE: certifique-se de que a resposta seja um JSON válido com aspas corretamente escapadas (sem aspas não fechadas, sem caracteres especiais inválidos).

Formato de resposta obrigatório:
{
  "titulo": "...",
  "resumo": "...",
  "texto": "...",
  "keywords": "..."
}`;

  const userPrompt = `Título original: ${titulo}\nResumo: ${resumo}\nTexto original:\n${markdownOriginal}`;

  const response = await axios.post(
    "https://api.openai.com/v1/chat/completions",
    {
      model: "gpt-4o",
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

  const raw = response.data.choices[0].message.content.trim();
  const jsonMatch = raw.match(/\{[\s\S]*\}/);

  if (!jsonMatch) {
    console.error("❌ JSON não encontrado. Resposta bruta da IA:");
    console.error(raw);
    throw new Error("JSON inválido retornado pela IA");
  }

  let jsonString = jsonMatch[0];

  // Corrige caracteres comuns que quebram o JSON
  jsonString = jsonString
    .replace(/\\(?!["\\/bfnrtu])/g, '\\\\')
    .replace(/\u0000/g, "")
    .replace(/[\u0001-\u001F\u007F]/g, "");

  let resposta;
  try {
    resposta = JSON.parse(jsonString);
  } catch (e) {
    console.error("❌ Erro ao fazer parse do JSON:");
    console.error(jsonString);
    throw e;
  }

  if (!resposta.keywords || !resposta.texto || !resposta.titulo || !resposta.resumo) {
    throw new Error("❌ Resposta incompleta da IA: falta algum campo obrigatório.");
  }

  return resposta;
}

async function processarRSS() {
  const xml = (await axios.get(FEED_URL)).data;
  const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "" });
  const rss = parser.parse(xml);
  const items = rss.rss.channel.item.slice(0, MAX_POSTS);

  const novosPosts = [];

  for (const noticia of items) {
    const titulo = noticia.title;
    console.log(`\n📥 Processando: ${titulo}`);
    const resumo = turndownService.turndown(noticia.description || "");
    const categorias = Array.isArray(noticia.category) ? noticia.category : [noticia.category];
    const categoria = mapCategoria(categorias[0] || "");
    const dataISO = new Date(noticia.pubDate).toISOString();
    const slug = gerarSlugUnico(titulo, postsExistentes);

    if (postsExistentes.some((p) => p.slug === slug)) {
      console.log("⏭️ Já existe, pulando...");
      continue;
    }

    const mediaContent = noticia["media:content"] || {};
    const midia = extrairThumb(mediaContent);
    const thumb = mediaContent?.thumbnail?.url || midia;
    const tipoMidia = midia.includes("youtube.com/embed") ? "video" : "imagem";

    console.log(`🖼️ Capa detectada: ${midia}`);
    console.log(`🖼️ Thumb detectada: ${thumb}`);

    const { html, imagens } = limparTexto(noticia["content:encoded"] || "");
    console.log(`📸 Imagens no corpo: ${imagens.length}`);

    const markdownBase = turndownService.turndown(html);
    const markdownComEmbeds = inserirBlocosPreservados(markdownBase, html);

    let reescrito;
    try {
      reescrito = await reescreverComOpenAI(titulo, resumo, markdownComEmbeds);
    } catch (e) {
      console.error("❌ Erro IA:", e.message);
      continue;
    }

    if (!reescrito?.texto) {
      console.warn("⚠️ Texto reescrito vazio, pulando...");
      continue;
    }

    const autor = ["Pablo Moura", "Luana Souza", "Ana Luiza"][Math.floor(Math.random() * 3)];
    const tags = (reescrito.keywords || "").split(",").map(t => `'${limparTag(t.trim())}'`).filter(Boolean);

    const frontmatter = `---
title: >-
  ${reescrito.titulo}
slug: ${slug}
categoria: ${categoria}
midia: >-
  ${midia}
tipoMidia: ${tipoMidia}
thumb: >-
  ${thumb}
tags:
${tags.map((t) => `  - ${t}`).join("\n")}
keywords: >-
  ${tags.map(t => t.replace(/'/g, "")).join(", ")}
author: ${autor}
data: '${dataISO}'
resumo: >-
  ${reescrito.resumo}
---\n\n`;

    const markdownFinal = frontmatter + inserirImagensNoTexto(reescrito.texto, imagens.slice(1));
    const filePath = path.join(contentDir, `${slug}.md`);
    fs.writeFileSync(filePath, markdownFinal, "utf-8");

    console.log(`✅ .md salvo: ${filePath}`);

    novosPosts.push({
      titulo: reescrito.titulo,
      slug,
      categoria,
      midia,
      tipoMidia,
      thumb,
      resumo: reescrito.resumo,
      data: dataISO,
    });
  }

  fs.writeFileSync(jsonFilePath, JSON.stringify([...postsExistentes, ...novosPosts], null, 2), "utf-8");
  console.log(`\n📦 Total de novos posts salvos: ${novosPosts.length}`);
}

processarRSS();
