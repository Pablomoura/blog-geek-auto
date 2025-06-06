const fs = require("fs");
const path = require("path");
const axios = require("axios");
const { XMLParser } = require("fast-xml-parser");
const TurndownService = require("turndown");
const https = require("https");
const { createWriteStream } = require("fs");
require("dotenv").config();
const buscarFontesGoogle = require("./buscarFontesGoogle");

const turndownService = new TurndownService();

const jsonFilePath = "public/posts.json";
const contentDir = path.join(process.cwd(), "content");
const uploadsDir = path.join(process.cwd(), "public", "uploads");
const MAX_POSTS = 15;

if (!fs.existsSync(contentDir)) fs.mkdirSync(contentDir);
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);

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

async function buscarNoticiasGameSpotRSS() {
  console.log("🔍 Buscando RSS do GameSpot...");

  const response = await axios.get("https://www.gamespot.com/feeds/game-news/");
  const parser = new XMLParser({ ignoreAttributes: false });
  const rss = parser.parse(response.data);
  const items = rss.rss.channel.item;

  return items.map(item => ({
    titulo: item.title,
    resumo: "",
    link: item.link,
    pubDate: item.pubDate,
    descricaoHtml: item.description,
    thumb: item["media:content"]?.["@_url"] || "/images/default.jpg"
  }));
}

function extrairImagensDoHtml(html) {
  const imagens = [];
  const regexImageTag = /<img[^>]+src=["']([^"'>]+)["']/gi;
  let match;
  while ((match = regexImageTag.exec(html)) !== null) {
    imagens.push(match[1]);
  }
  return imagens;
}

async function baixarImagem(url, slug, tipo = "thumb") {
  if (!url || !url.startsWith("http")) return null;
  const extensao = path.extname(new URL(url).pathname).split("?")[0] || ".jpg";
  const nomeArquivo = `${slug}-${tipo}${extensao}`;
  const caminho = path.join(uploadsDir, nomeArquivo);

  return new Promise((resolve) => {
    https.get(url, (res) => {
      if (res.statusCode !== 200) return resolve(null);
      const stream = createWriteStream(caminho);
      res.pipe(stream);
      stream.on("finish", () => resolve(`/uploads/${nomeArquivo}`));
    }).on("error", () => resolve(null));
  });
}

async function reescreverNoticia(titulo, resumo, texto) {
  const systemPrompt = `Você é um redator de notícias geek. Reescreva conteúdos com foco em SEO e profundidade jornalística. Siga estas diretrizes:

  - Escreva um título impactante, direto e único, com potencial de busca.
  - Crie um resumo com até 2 frases destacando o gancho da matéria.
  - Reescreva o conteúdo com linguagem natural, clara e envolvente, sempre com parágrafos curtos (máximo 3 linhas cada).
  - Use **obrigatoriamente** subtítulos em Markdown (##, ###) para estruturar o texto — ao menos um H2 é obrigatório.
  - O texto reescrito deve ter pelo menos 200 palavras a mais que o original.
  - Use listas, destaques em **negrito**, e perguntas estratégicas quando fizer sentido.
  - Traduza nomes de obras ou termos, se forem conhecidos no Brasil (ex: "The Boys" permanece, mas "Stranger Things" pode ganhar explicação contextual).
  - Não converta valores em moeda estrangeira.
  - Não use clickbait barato. Entregue valor real com contexto, curiosidades, dados, comparações e explicações.
  - Se for uma matéria sobre vários tópicos, separe por seção com subtítulos claros.
  - Entregue um texto que pareça inédito, autoral e digno de destaque no Google Discover e agregadores de notícia.
  - O ano atual é 2025, use isso para contextualizar eventos recentes.

  Formato de resposta obrigatório:
  {
    "titulo": "...",
    "resumo": "...",
    "texto": "...",
    "keywords": "..."
  }`;

  const userPrompt = `Título original: ${titulo}\nResumo: ${resumo}\nTexto original:\n${texto}`;

  const response = await axios.post("https://api.openai.com/v1/chat/completions", {
    model: "gpt-4o",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ],
    temperature: 0.7,
  }, {
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
      "OpenAI-Service-Tier": "flex", // Especifica o uso do tier flexível
    },
  });

  const raw = response.data.choices[0].message.content.trim();
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("Resposta inválida da IA");

  const reescrito = JSON.parse(match[0]);
  reescrito.texto = reescrito.texto.replace(/\\n/g, "\n").replace(/(?<!\n)\n(?!\n)/g, "\n\n");
  return reescrito;
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

function substituirLinksAmazon(texto, codigoAfiliado) {
  return texto.replace(/https:\/\/(www\.)?amazon\.com(\.br)?\/[^"]+/gi, (url) => {
    const temTag = url.includes("tag=");
    const conector = url.includes("?") ? "&" : "?";
    if (temTag) return url.replace(/tag=[^&]+/, `tag=${codigoAfiliado}`);
    return `${url}${conector}tag=${codigoAfiliado}`;
  });
}

async function executarScraper() {
  const noticias = await buscarNoticiasGameSpotRSS();
  const autores = ["Pablo Moura"];
  let novosPosts = [];

  for (const noticia of noticias.slice(0, MAX_POSTS)) {
    if (postsExistentes.some((p) => p.link === noticia.link)) continue;

    const markdownOriginal = turndownService.turndown(noticia.descricaoHtml);
    const imagensOriginais = extrairImagensDoHtml(noticia.descricaoHtml);
    const imagensParaInserir = imagensOriginais.filter((img) => img !== noticia.thumb);

    const reescrito = await retry(() => reescreverNoticia(noticia.titulo, noticia.resumo, markdownOriginal));
    if (!reescrito) continue;

    const slug = slugify(reescrito.titulo);
    if (postsExistentes.some((p) => slugify(p.slug) === slug)) continue;

    const imagemThumbLocal = await baixarImagem(noticia.thumb, slug, "thumb");
    const midia = imagemThumbLocal || noticia.thumb;

    const imagensBaixadas = [];
    for (let i = 0; i < imagensParaInserir.length; i++) {
      const local = await baixarImagem(imagensParaInserir[i], slug, `img${i}`);
      imagensBaixadas.push(local || imagensParaInserir[i]);
    }

    const textoComImagens = inserirImagensNoTexto(reescrito.texto, imagensBaixadas);
    const blocoFontes = await buscarFontesGoogle(reescrito.titulo);
    const textoComAfiliado = substituirLinksAmazon(textoComImagens, "geeknews06-20");
    const markdownFinal = textoComAfiliado + blocoFontes;

    const tags = reescrito.keywords ? reescrito.keywords.split(",").map(t => t.trim()).filter(Boolean) : [];
    const autor = autores[Math.floor(Math.random() * autores.length)];

    const frontmatter = `---\ntitle: "${reescrito.titulo.replace(/"/g, "'")}"\nslug: "${slug}"\ncategoria: "Games"\nmidia: "${midia}"\ntipoMidia: "imagem"\nthumb: "${midia}"\ntags: [${tags.map(tag => `"${tag}"`).join(", ")}]\nkeywords: "${tags.join(", ")}"\nauthor: "${autor}"\nfonte: "GameSpot"\ndata: "${new Date(noticia.pubDate).toISOString()}"\n---\n\n`;

    const caminho = path.join(contentDir, `${slug}.md`);
    fs.writeFileSync(caminho, frontmatter + markdownFinal, "utf-8");
    console.log(`📝 Post salvo: ${slug}.md`);

    postsExistentes.push({
      titulo: reescrito.titulo,
      categoria: "Games",
      resumo: reescrito.resumo,
      link: noticia.link,
      thumb: midia,
      texto: markdownFinal,
      midia,
      tipoMidia: "imagem",
      slug,
      fonte: "GameSpot",
      reescrito: true,
      data: new Date(noticia.pubDate).toISOString(),
    });

    novosPosts.push(slug);
  }

  if (novosPosts.length > 0) {
    fs.writeFileSync(jsonFilePath, JSON.stringify(postsExistentes, null, 2));
    console.log(`✅ ${novosPosts.length} posts do GameSpot adicionados.`);
  } else {
    console.log("🔄 Nenhuma nova notícia do GameSpot adicionada.");
  }
}

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

executarScraper().catch(console.error);
