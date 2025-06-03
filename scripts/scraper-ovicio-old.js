// scraper-ovicio.js
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const { XMLParser } = require("fast-xml-parser");
const TurndownService = require("turndown");
const { JSDOM } = require("jsdom");
require("dotenv").config();

const contentDir = path.join(process.cwd(), "content");
const jsonFilePath = "public/posts.json";
const FEED_URL = "https://ovicio.com.br/feed/";
const MAX_POSTS = 10;

const turndownService = new TurndownService({ headingStyle: "atx" });

// Mantém embeds
["twitter-tweet", "instagram-media", "reddit-embed-bq"].forEach((className) => {
  turndownService.addRule(`embed-${className}`, {
    filter: (node) =>
      node.nodeName === "BLOCKQUOTE" &&
      (node.getAttribute("class") || "").includes(className),
    replacement: (_c, node) => `\n\n${node.outerHTML || ""}\n\n`,
  });
});
turndownService.addRule("youtube-iframe", {
  filter: (node) =>
    node.nodeName === "IFRAME" &&
    (node.getAttribute("src") || "").includes("youtube.com/embed"),
  replacement: (_c, node) => `\n\n${node.outerHTML || ""}\n\n`,
});
turndownService.addRule("figure-img", {
  filter: (node) => node.nodeName === "FIGURE" && node.innerHTML.includes("<img"),
  replacement: (_c, node) => `\n\n${node.outerHTML}\n\n`,
});
turndownService.addRule("img", {
  filter: "img",
  replacement: (_c, node) => {
    const alt = node.getAttribute("alt") || "";
    const src = node.getAttribute("src") || "";
    return src ? `![${alt}](${src})` : "";
  },
});

if (!fs.existsSync(contentDir)) fs.mkdirSync(contentDir);
let postsExistentes = fs.existsSync(jsonFilePath)
  ? JSON.parse(fs.readFileSync(jsonFilePath, "utf-8"))
  : [];

function slugify(text) {
  return text
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

function gerarSlugUnico(base, existentes) {
  let slug = slugify(base);
  let i = 1;
  while (existentes.some((p) => p.slug === slug)) {
    slug = `${slugify(base)}-${i++}`;
  }
  return slug;
}

function limparTexto(html) {
  const dom = new JSDOM(html);
  const doc = dom.window.document;

  const imagens = [...doc.querySelectorAll("img")]
    .map((img) => img.getAttribute("src"))
    .filter((src) => src?.startsWith("http"));

  return {
    html: doc.body.innerHTML,
    imagens,
  };
}

async function reescrever(titulo, resumo, markdown) {
  const prompt = `Título: ${titulo}\nResumo: ${resumo}\nConteúdo:\n${markdown}`;
  const system = `Você é um redator geek. Reescreva com SEO, H2s, parágrafos curtos, naturalidade e profundidade. Responda com JSON:
{
  "titulo": "...",
  "resumo": "...",
  "texto": "...",
  "keywords": "..."
}`;

  const r = await axios.post("https://api.openai.com/v1/chat/completions", {
    model: "gpt-4o",
    messages: [
      { role: "system", content: system },
      { role: "user", content: prompt },
    ],
    temperature: 0.7,
  }, {
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
  });

  const raw = r.data.choices[0].message.content;
  const match = raw.match(/\{[\s\S]*\}/);
  return JSON.parse(match[0]);
}

function inserirImagens(texto, imagens = []) {
  const p = texto.split(/\n{2,}/).filter(Boolean);
  const final = [];
  let i = 0;
  for (const par of p) {
    final.push(par);
    if (!par.includes("<") && imagens[i]) {
      final.push(`![imagem ilustrativa](${imagens[i++]})`);
    }
  }
  return final.join("\n\n");
}

function mapCategoria(c) {
  const mapa = {
    "Animes & Mangás": "Mangás e Animes",
    "Games": "Games",
    "Filmes": "Filmes",
    "Séries & TV": "Séries e TV",
    "Quadrinhos": "HQ/Livros",
  };
  return mapa[c] || "Séries e TV";
}

async function processar() {
  const xml = (await axios.get(FEED_URL)).data;
  const rss = new XMLParser({ ignoreAttributes: false }).parse(xml);
  const items = rss.rss.channel.item.slice(0, MAX_POSTS);

  for (const item of items) {
    const titulo = item.title;
    const slug = gerarSlugUnico(titulo, postsExistentes);
    const categoria = mapCategoria(item.category);
    const resumo = item.description;
    const dataISO = new Date(item.pubDate).toISOString();

    if (postsExistentes.some((p) => p.slug === slug)) continue;

    const media = item["media:content"]?.url;
    const thumb = item["media:thumbnail"]?.url || media || "";
    const tipoMidia = media?.includes("youtube.com") ? "video" : "imagem";
    const midia = media || thumb;

    const { html, imagens } = limparTexto(item["content:encoded"] || "");
    const markdown = turndownService.turndown(html);

    let texto;
    try {
      texto = await reescrever(titulo, resumo, markdown);
    } catch (e) {
      console.error("Erro na IA:", e.message);
      continue;
    }

    const tags = texto.keywords
      .split(",")
      .map((t) => `  - '${t.trim().replace(/[:]/g, "")}'`)
      .join("\n");

    const md = `---
title: >-
  ${texto.titulo}
slug: ${slug}
categoria: ${categoria}
midia: >-
  ${midia}
tipoMidia: ${tipoMidia}
thumb: >-
  ${thumb}
tags:
${tags}
keywords: >-
  ${texto.keywords}
author: Pablo Moura
data: '${dataISO}'
resumo: >-
  ${texto.resumo}
---

${inserirImagens(texto.texto, imagens.slice(1))}`;

    fs.writeFileSync(path.join(contentDir, `${slug}.md`), md, "utf-8");
    postsExistentes.push({ slug, titulo: texto.titulo, thumb, categoria, midia, tipoMidia, resumo: texto.resumo, data: dataISO });
  }

  fs.writeFileSync(jsonFilePath, JSON.stringify(postsExistentes, null, 2), "utf-8");
  console.log("✅ Concluído.");
}

processar();