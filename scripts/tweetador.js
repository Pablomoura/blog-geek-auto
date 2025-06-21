const fs = require("fs");
const path = require("path");
const axios = require("axios");
const { execSync } = require("child_process");
require("dotenv").config();
const { TwitterApi } = require("twitter-api-v2");

const logDir = path.join(process.cwd(), "data");
const logPath = path.join(logDir, "tweet-log.json");
const postsPath = path.join(process.cwd(), "public/posts.json");

// Garante que a pasta exista
fs.mkdirSync(logDir, { recursive: true });

// Twitter client
const client = new TwitterApi({
  appKey: process.env.TWITTER_APP_KEY,
  appSecret: process.env.TWITTER_APP_SECRET,
  accessToken: process.env.TWITTER_ACCESS_TOKEN,
  accessSecret: process.env.TWITTER_ACCESS_SECRET,
});

function carregarLogTweets() {
  if (!fs.existsSync(logPath)) {
    fs.writeFileSync(logPath, JSON.stringify({}, null, 2), "utf-8");
    return {};
  }
  return JSON.parse(fs.readFileSync(logPath, "utf-8"));
}

function salvarLogTweets(log) {
  fs.writeFileSync(logPath, JSON.stringify(log, null, 2), "utf-8");
}

function podeTweetarHoje(log, limite = 3) {
  const hoje = new Date().toISOString().split("T")[0];
  return (log[hoje]?.count || 0) < limite;
}

function registrarTweetFeito(log, url) {
  const hoje = new Date().toISOString().split("T")[0];
  log[hoje] = log[hoje] || { count: 0, urls: [] };
  log[hoje].count += 1;
  log[hoje].urls.push(url);
  salvarLogTweets(log);
}

async function gerarTweetCriativo(titulo, resumo, tags = []) {
  const prompt = `Crie um tweet curto, empolgante e informal com base no título e resumo abaixo. Use no máximo 1 emoji e até 2 hashtags populares.

Título: ${titulo}
Resumo: ${resumo}
Tags: ${tags.join(", ")}

Responda com apenas o tweet, sem aspas.`;

  try {
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4-turbo",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.9,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data.choices[0].message.content.trim();
  } catch (err) {
    console.error("❌ Erro ao gerar tweet criativo:", err.message);
    return titulo;
  }
}

async function postarNoTwitter({ titulo, slug, resumo, tags }) {
  const url = `https://www.geeknews.com.br/noticia/${slug}`;
  const tweet = await gerarTweetCriativo(titulo, resumo, tags);
  const status = `${tweet}\n\n${url}`;

  try {
    await client.v2.tweet(status);
    console.log("✅ Tweet postado:", titulo);
    return url;
  } catch (err) {
    console.error("❌ Erro ao postar no Twitter:", err.message);
    return null;
  }
}

async function run() {
  const posts = JSON.parse(fs.readFileSync(postsPath, "utf-8"));
  const log = carregarLogTweets();

  if (!podeTweetarHoje(log)) {
    console.log("⏸️ Limite de tweets atingido hoje.");
    return;
  }

  posts.sort((a, b) => new Date(b.data) - new Date(a.data));
  const hoje = new Date().toISOString().split("T")[0];
  const urlsHoje = new Set(log[hoje]?.urls || []);

  for (const post of posts) {
    const slug = post.slug;
    const url = `https://www.geeknews.com.br/noticia/${slug}`;

    if (urlsHoje.has(url)) {
      console.log("🔁 Já tuitado hoje:", url);
      continue;
    }

    const tweetado = await postarNoTwitter({
      titulo: post.titulo,
      slug: post.slug,
      resumo: post.resumo || post.descricao || "",
      tags: post.tags || [],
    });

    if (tweetado) {
      registrarTweetFeito(log, url);
      break; // Só um por execução
    }
  }
  return logPath;
}

if (require.main === module) {
  run();
}

module.exports = { run };
