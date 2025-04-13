// scripts/tweetador.js

const fs = require("fs");
const path = require("path");
const axios = require("axios");
require("dotenv").config();
const { TwitterApi } = require("twitter-api-v2");

const logPath = path.join(process.cwd(), "public/tweet-log.json");
const postsPath = path.join(process.cwd(), "public/posts.json");

const client = new TwitterApi({
  appKey: process.env.TWITTER_APP_KEY,
  appSecret: process.env.TWITTER_APP_SECRET,
  accessToken: process.env.TWITTER_ACCESS_TOKEN,
  accessSecret: process.env.TWITTER_ACCESS_SECRET,
});

function carregarLogTweets() {
  if (!fs.existsSync(logPath)) return {};
  return JSON.parse(fs.readFileSync(logPath, "utf-8"));
}

function salvarLogTweets(log) {
  fs.writeFileSync(logPath, JSON.stringify(log, null, 2), "utf-8");
}

function podeTweetarHoje(log, limite = 3) {
  const hoje = new Date().toISOString().split("T")[0];
  return (log[hoje] || 0) < limite;
}

function registrarTweetFeito(log) {
  const hoje = new Date().toISOString().split("T")[0];
  log[hoje] = (log[hoje] || 0) + 1;
  salvarLogTweets(log);
}

async function gerarTweetCriativo(titulo, resumo, tags = []) {
  const prompt = `Crie um tweet curto, empolgante e informal com base no título e resumo abaixo. Use no máximo 1 emojis e até 2 hashtags populares.

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
  } catch (err) {
    console.error("❌ Erro ao postar no Twitter:", err.message);
  }
}

(async () => {
  const posts = JSON.parse(fs.readFileSync(postsPath, "utf-8"));
  const log = carregarLogTweets();

  if (!podeTweetarHoje(log)) {
    console.log("⏸️ Limite de tweets atingido hoje.");
    return;
  }

  posts.sort((a, b) => new Date(b.data) - new Date(a.data));
  for (const post of posts) {
    const slug = post.slug;
    const url = `https://www.geeknews.com.br/noticia/${slug}`;

    if (log[url]) {
      console.log("🔁 Já tuitado:", url);
      continue;
    }

    await postarNoTwitter({
      titulo: post.titulo,
      slug: post.slug,
      resumo: post.resumo || post.descricao || "",
      tags: post.tags || [],
    });

    log[url] = true;
    registrarTweetFeito(log);
    break; // só 1 por execução (você pode remover isso se quiser fazer até o limite diário)
  }
})();
