const fs = require("fs");
const path = require("path");
const axios = require("axios");
const { XMLParser } = require("fast-xml-parser");
const TurndownService = require("turndown");
require("dotenv").config();
const buscarFontesGoogle = require("./buscarFontesGoogle");
const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
puppeteer.use(StealthPlugin());

const turndownService = new TurndownService();

const jsonFilePath = "public/posts.json";
const contentDir = path.join(process.cwd(), "content");
const MAX_POSTS = 2;

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
async function buscarNoticiasBoardGameGeekRSS() {
  console.log("🔍 Buscando RSS do BoardGameGeek...");

  const response = await axios.get("https://boardgamegeek.com/rss/blog/1");
  const parser = new XMLParser({ ignoreAttributes: false });
  const rss = parser.parse(response.data);

  const items = rss.rss.channel.item;

  const noticias = items.map(item => ({
    titulo: item.title,
    resumo: "", // O resumo pode ser gerado depois via turndown, ou no reescrito
    link: item.link,
    pubDate: item.pubDate,
    autor: item["dc:creator"] || "BoardGameGeek",
    descricaoHtml: item.description
  }));

  console.log(`✅ ${noticias.length} notícias encontradas.`);

  return noticias;
}

async function processarConteudoNoticia(descricaoHtml) {
  const hrefRegex = /<a href="([^"]+)"><img/g;
  const imagensGrandes = [];

  let match;
  while ((match = hrefRegex.exec(descricaoHtml)) !== null) {
    const linkPaginaImagem = match[1];
    const imagemGrande = await obterImagemGrande(linkPaginaImagem);
    if (imagemGrande) {
      imagensGrandes.push(imagemGrande);
    }
  }

  const textoMarkdown = turndownService.turndown(descricaoHtml);

  return { textoMarkdown, imagens: imagensGrandes };
}

async function reescreverNoticia(titulo, resumo, texto) {
  console.log(`✍️ Enviando para reescrita:`);
  console.log(`➡️ Título: ${titulo}`);
  console.log(`➡️ Resumo: ${resumo}`);
  console.log(`➡️ Texto capturado (início): ${texto.slice(0, 300)}...\n`);

  const systemPrompt = `Você é um redator de notícias especializado em cultura pop, cinema, séries, animes e board games. Seu papel é reescrever matérias de forma original, clara, profunda e atrativa, com foco em SEO e alto desempenho no Google Discover.

Siga estas diretrizes obrigatórias:
- Escreva um título impactante, direto e único, evitando clickbait genérico. Priorize palavras com potencial de busca.
- Crie um resumo cativante com até 2 frases, destacando o gancho principal da matéria.
- Reescreva o conteúdo de forma autêntica sempre com pelos menos 200 palavras a mais que o original, com parágrafos curtos e informativos (máximo 3 linhas por parágrafo), usando duas quebras de linha (\\n\\n) entre eles.
- Utilize **sem exceção** subtítulos em Markdown (##, ###) para estruturar o conteúdo — obrigatoriamente ao menos um H2 e, se possível, H3.
- Em matérias com vários tópicos ou lançamentos, crie uma seção por tema, com subtítulo, nome do jogo, editora, mecânicas e outros detalhes relevantes.
- Em notícias únicas, aprofunde o contexto com histórico, dados, comparações, impactos, nomes importantes e curiosidades.
- Use listas quando adequado, destaques em **negrito**, e perguntas estratégicas para engajar o leitor.
- Nunca omita informações importantes. Corrija erros, remova redundâncias e entregue um conteúdo que pareça inédito.
- Este conteúdo será publicado em um site de notícias geek. Pense como um editor de destaque do Google News.
- Se houver referências a valores em moedas estrangeiras, adapte para reais, com indicação "aproximadamente".  
- Se mencionar locais ou contextos estrangeiros, explique ou contextualize para o público brasileiro.
- Traduza nomes de obras ou termos, se forem comuns no Brasil.

Exemplo de estrutura ideal:

# Título impactante

**Resumo direto com gancho e contexto.**

## Subtítulo com nome do jogo (se aplicável)

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

    console.log(`✅ Reescrita concluída:`);
    console.log(`➡️ Novo Título: ${reescrito.titulo}`);
    console.log(`➡️ Novo Resumo: ${reescrito.resumo}`);
    console.log(`➡️ Texto reescrito (início): ${reescrito.texto.slice(0, 300)}...\n`);

    return reescrito;
  } catch (err) {
    console.error("❌ Erro ao reescrever notícia:", err.message);
    return null;
  }
}

function salvarNoticia(novaNoticia, reescrito, imagens) {
  const slug = slugify(reescrito.titulo);
  const capa = imagens.length ? imagens[0] : '/images/default.jpg';
  const dataAtual = new Date().toISOString();

  const post = {
    titulo: reescrito.titulo,
    categoria: "Board Games",
    resumo: reescrito.resumo,
    link: novaNoticia.link,
    thumb: capa,
    texto: novaNoticia.texto,
    midia: capa,
    tipoMidia: "imagem",
    slug: slug,
    fonte: "BoardGameGeek",
    reescrito: true,
    data: dataAtual
  };

  postsExistentes.push(post);
  console.log(`✅ Post salvo no formato correto: ${slug}`);
}

async function obterImagemGrande(linkImagem) {
  const browser = await puppeteer.launch({ headless: "new", args: ["--no-sandbox"] });
  const page = await browser.newPage();

  try {
    await page.setUserAgent("Mozilla/5.0");
    console.log(`🌐 Acessando página da imagem: ${linkImagem}`);
    await page.goto(linkImagem, { waitUntil: "networkidle2" });

    // Aguarda a imagem carregar
    await page.waitForSelector("img", { timeout: 5000 });

    const src = await page.evaluate(() => {
      const imgs = Array.from(document.querySelectorAll("img"));
      for (const img of imgs) {
        if (img.src.includes("geekdo-images")) {
          return img.src;
        }
      }
      return null;
    });

    if (src) {
      console.log(`✅ Imagem grande encontrada: ${src}`);
      return src;
    } else {
      console.warn(`⚠️ Nenhuma imagem correspondente encontrada em ${linkImagem}`);
      return null;
    }

  } catch (err) {
    console.error(`❌ Erro ao obter imagem grande de ${linkImagem}: ${err.message}`);
    return null;
  } finally {
    await browser.close();
  }
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

async function executarScraper() {
  const force = process.argv.includes("--force");

  if (force) {
    console.log("⚠️ Modo FORÇADO: limpando posts existentes...");
    postsExistentes = [];
  }

  const noticias = await buscarNoticiasBoardGameGeekRSS();

  let novosPosts = [];

  for (const noticia of noticias.slice(0, MAX_POSTS)) {
    const slug = slugify(noticia.titulo);

    if (postsExistentes.some((p) => slugify(p.slug) === slug)) {
      console.log(`⚠️ Post já existente, pulando: ${slug}`);
      continue;
    }

    const { textoMarkdown, imagens } = await processarConteudoNoticia(noticia.descricaoHtml);

    const capa = imagens.length ? imagens[0] : "/images/default.jpg";
    const imagensSemCapa = imagens.slice(1);

    const novaNoticia = {
      titulo: noticia.titulo,
      categoria: "Board Games",
      resumo: "",
      link: noticia.link,
      thumb: capa,
      texto: textoMarkdown,
      midia: capa,
      tipoMidia: "imagem",
      slug,
      fonte: "BoardGameGeek",
      reescrito: false,
      data: noticia.pubDate
    };

    const reescrito = await retry(() => reescreverNoticia(novaNoticia.titulo, novaNoticia.resumo, novaNoticia.texto));
    if (!reescrito) continue;

    novaNoticia.titulo = reescrito.titulo;
    novaNoticia.resumo = reescrito.resumo;
    novaNoticia.texto = inserirImagensNoTexto(reescrito.texto, imagensSemCapa);

    const blocoFontes = await buscarFontesGoogle(novaNoticia.titulo);
    novaNoticia.texto += blocoFontes;

    novaNoticia.reescrito = true;

    const tags = reescrito.keywords
      ? reescrito.keywords.split(",").map(t => t.trim()).filter(Boolean)
      : [];
    const keywords = tags.join(", ");

    const mdPath = path.join(contentDir, `${slug}.md`);
    const autores = ["Pablo Moura", "Luana Souza", "Ana Luiza"];
    const autorEscolhido = autores[Math.floor(Math.random() * autores.length)];

    const frontMatter = `---
title: "${reescrito.titulo.replace(/"/g, "'")}"
slug: "${slug}"
categoria: "Board Games"
midia: "${novaNoticia.midia}"
tipoMidia: "${novaNoticia.tipoMidia}"
thumb: "${novaNoticia.thumb}"
tags: ["${tags.join('", "')}"]
keywords: "${keywords}"
author: "${autorEscolhido}"
data: "${new Date().toISOString()}"
---\n\n`;

    const markdown = frontMatter + novaNoticia.texto;
    fs.writeFileSync(mdPath, markdown, "utf-8");
    console.log(`📝 Markdown salvo em: ${mdPath}`);

    const postParaJson = {
      titulo: novaNoticia.titulo,
      categoria: novaNoticia.categoria,
      resumo: novaNoticia.resumo,
      link: novaNoticia.link,
      thumb: novaNoticia.thumb,
      texto: novaNoticia.texto,
      midia: novaNoticia.midia,
      tipoMidia: novaNoticia.tipoMidia,
      slug: novaNoticia.slug,
      fonte: novaNoticia.fonte,
      reescrito: novaNoticia.reescrito,
      data: new Date().toISOString()
    };

    postsExistentes.push(postParaJson);
    novosPosts.push(postParaJson);

    console.log(`✅ Post adicionado: ${slug}`);
  }

  if (novosPosts.length > 0) {
    fs.writeFileSync(jsonFilePath, JSON.stringify(postsExistentes, null, 2), "utf-8");
    console.log(`✅ ${novosPosts.length} novos posts salvos do BoardGameGeek.`);
  } else {
    console.log("🔄 Nenhuma nova notícia do BoardGameGeek encontrada.");
  }

  console.log(`🎯 Finalizado: ${novosPosts.length} novos posts adicionados.`);
}

executarScraper();

async function retry(fn, retries = 3, delay = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      console.warn(`⚠️ Tentativa ${i + 1} falhou: ${err.message}`);
      if (i < retries - 1) {
        await new Promise((res) => setTimeout(res, delay));
      } else {
        throw err;
      }
    }
  }
}

