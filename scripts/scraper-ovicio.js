const fs = require("fs");
const path = require("path");
const axios = require("axios");
const { XMLParser } = require("fast-xml-parser");
const TurndownService = require("turndown");
const { JSDOM } = require("jsdom");
require("dotenv").config();

const turndownService = new TurndownService({ headingStyle: "atx" });

// Mantém embeds de Twitter e Instagram
turndownService.addRule("embedBlockquotes", {
  filter: (node) => {
    const isTwitter = node.nodeName === "BLOCKQUOTE" && node.className.includes("twitter-tweet");
    const isInstagram = node.nodeName === "BLOCKQUOTE" && node.className.includes("instagram-media");
    return isTwitter || isInstagram;
  },
  replacement: (_content, node) => {
    return `\n\n${node.outerHTML || node.innerHTML || ""}\n\n`;
  },
});

// Mantém iframes de vídeos (como YouTube)
turndownService.addRule("embedIframes", {
  filter: (node) => node.nodeName === "IFRAME" && node.src?.includes("youtube.com/embed"),
  replacement: (_content, node) => {
    return `\n\n${node.outerHTML || node.innerHTML || ""}\n\n`;
  },
});

// Mantém embeds do Reddit
turndownService.addRule("embedReddit", {
  filter: (node) =>
    node.nodeName === "BLOCKQUOTE" &&
    node.className.includes("reddit-embed-bq"),
  replacement: (_content, node) => {
    return `\n\n${node.outerHTML}\n\n`;
  },
});

// Mantém blocos de imagem com <figure> no HTML
turndownService.addRule("preserveImagesWithFigure", {
  filter: (node) =>
    node.nodeName === "FIGURE" && node.querySelector("img"),
  replacement: (_content, node) => {
    return `\n\n${node.outerHTML || node.innerHTML || ""}\n\n`;
  },
});

turndownService.addRule("image", {
  filter: "img",
  replacement: function (content, node) {
    const alt = node.getAttribute("alt") || "";
    const src = node.getAttribute("src") || "";
    return `![${alt}](${src})`;
  },
});

turndownService.addRule("preserveWpBlockImages", {
  filter: (node) =>
    node.nodeName === "DIV" &&
    node.className.includes("wp-block-image") &&
    node.querySelector("img"),
  replacement: (_content, node) => {
    return `\n\n${node.outerHTML || node.innerHTML || ""}\n\n`;
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

function extrairImagensCorpo(html) {
  const dom = new JSDOM(html);
  const document = dom.window.document;
  const imagens = Array.from(document.querySelectorAll("img"))
    .map(img => img.src)
    .filter(src => src && src.startsWith("http") && !src.includes("blank")); // remove imagens vazias ou placeholders
  return imagens;
}

function limparTag(tag) {
  return tag
    .replace(/[:]/g, "")  // remove dois-pontos
    .replace(/[^\w\s-]/g, "") // remove outros símbolos problemáticos
    .trim();
}

function slugify(text) {
  return text
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
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
      .replace(/\\(?!["\\/bfnrtu])/g, '\\\\')  // corrige barras não escapadas
      .replace(/\u0000/g, "")                  // remove caracteres nulos
      .replace(/[\u0001-\u001F\u007F]/g, "");  // remove outros caracteres de controle

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
function limparTexto(html) {
  const dom = new JSDOM(html);
  const document = dom.window.document;

  // Remove menções diretas ao site
  document.body.innerHTML = document.body.innerHTML
    .replace(/O Vício/gi, "");

  const imagens = extrairImagensCorpo(document.body.innerHTML);
  return { html: document.body.innerHTML, imagens };
}

function extrairThumb(contentEncoded) {
  const match = contentEncoded.match(/<img[^>]+src=["']([^"']+)["']/i);
  return match ? match[1] : null;
}

function gerarSlugUnico(base, existentes) {
  let slug = slugify(base);
  let i = 1;
  while (existentes.some((p) => p.slug === slug)) {
    slug = `${slugify(base)}-${i++}`;
  }
  return slug;
}

async function processarRSS() {
  const { data: xml } = await axios.get(FEED_URL);
  const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "" });
  const rss = parser.parse(xml);
  const items = rss.rss.channel.item.slice(0, MAX_POSTS);

  const novosPosts = [];

  for (const noticia of items) {
    const titulo = noticia.title;
    const resumo = turndownService.turndown(noticia.description || "");
    const categorias = Array.isArray(noticia.category) ? noticia.category : [noticia.category];
    const categoria = mapCategoria(categorias[0] || "");
    const dataISO = new Date(noticia.pubDate).toISOString();
    const slugBase = slugify(titulo);
    if (postsExistentes.some((p) => slugify(p.slug) === slugBase)) continue;

    const slug = gerarSlugUnico(titulo, postsExistentes);
    let midia = extrairThumb(noticia["content:encoded"] || "") || "/images/default.jpg";
    let tipoMidia = "imagem";
    let thumb = midia;

    // Verifica se tem media:content com vídeo do YouTube
    const mediaContent = noticia["media:content"];
    if (mediaContent?.url?.includes("youtube.com/embed")) {
      midia = mediaContent.url;
      tipoMidia = "video";
      if (mediaContent["media:thumbnail"]?.url) {
        thumb = mediaContent["media:thumbnail"].url;
      }
    }

    const { html, imagens } = limparTexto(noticia["content:encoded"] || "");
    const markdownOriginal = turndownService.turndown(html);

    let reescrito;
    try {
      reescrito = await reescreverComOpenAI(titulo, resumo, markdownOriginal);
    } catch (err) {
      console.error(`❌ Erro ao reescrever a matéria: ${titulo}`);
      console.error(err.message);
      continue;
    }

    if (!reescrito?.texto) continue;

    const autores = ["Pablo Moura", "Luana Souza", "Ana Luiza"];
    const autor = autores[Math.floor(Math.random() * autores.length)];
    const tags = (reescrito.keywords || "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

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
${tags.map((t) => `  - '${limparTag(t)}'`).join("\n")}
keywords: >-
  ${tags.join(", ")}
author: ${autor}
data: '${dataISO}'
resumo: >-
  ${reescrito.resumo}
---\n\n`;

    const textoFinal = inserirImagensNoTexto(reescrito.texto, imagens.slice(1)); // primeira imagem fica como capa
    const markdownCompleto = frontmatter + textoFinal;

    fs.writeFileSync(path.join(contentDir, `${slug}.md`), markdownCompleto, "utf-8");

    novosPosts.push({
      titulo: reescrito.titulo,
      categoria,
      resumo: reescrito.resumo,
      link: noticia.link,
      thumb,
      texto: reescrito.texto,
      midia,
      tipoMidia,
      slug,
      fonte: "O Vício",
      reescrito: true,
      data: dataISO,
    });
  }

  const atualizados = [...postsExistentes, ...novosPosts];
  fs.writeFileSync(jsonFilePath, JSON.stringify(atualizados, null, 2), "utf-8");
  console.log("✅ Notícias salvas:", novosPosts.length);
}

processarRSS();

function inserirImagensNoTexto(texto, imagens) {
  if (!imagens?.length) return texto;
  const paragrafos = texto.split("\n\n");
  const resultado = [];

  for (let i = 0; i < paragrafos.length; i++) {
    resultado.push(paragrafos[i]);
    if (i < imagens.length) {
      resultado.push(`![Imagem relacionada](${imagens[i]})`);
    }
  }

  return resultado.join("\n\n");
}
