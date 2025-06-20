// scripts/ping-indexnow.js
const fs = require("fs/promises");
const path = require("path");
const fetch = require("node-fetch");

const BASE_URL = "https://www.geeknews.com.br";
const TOKEN = "geeknews-indexnow-verification";

const postsPath = path.join(__dirname, "..", "public", "posts.json");
const logPath = path.join(__dirname, "..", "public", "indexnow-log.json");

async function loadJson(filePath, fallback = []) {
  try {
    const raw = await fs.readFile(filePath, "utf-8");
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

async function saveJson(filePath, data) {
  await fs.writeFile(filePath, JSON.stringify(data, null, 2));
}

async function urlIsPublished(url) {
  try {
    const res = await fetch(url, { method: "HEAD" });
    return res.ok;
  } catch {
    return false;
  }
}

async function pingBatch(urls) {
  const body = {
    host: "www.geeknews.com.br",
    key: TOKEN,
    keyLocation: `${BASE_URL}/${TOKEN}.txt`,
    urlList: urls,
  };

  const res = await fetch("https://api.indexnow.org/indexnow", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  console.log(`✔️ Batch enviado (${urls.length} URLs) | Código: ${res.status}`);
  if (!res.ok) {
    console.error(text);
  }
}

(async () => {
  const posts = await loadJson(postsPath);
  const log = await loadJson(logPath);

  const recent = posts
    .sort((a, b) => new Date(b.data) - new Date(a.data))
    .slice(0, 20);

  const slugsToCheck = recent.map((p) => p.slug).filter((slug) => !log.includes(slug));
  const urlsToPing = [];

  for (const slug of slugsToCheck) {
    const url = `${BASE_URL}/noticia/${slug}`;
    if (await urlIsPublished(url)) {
      urlsToPing.push(url);
      log.push(slug);
    } else {
      console.log(`🔄 URL ainda não disponível: ${url}`);
    }
  }

  if (urlsToPing.length === 0) {
    console.log("✅ Nenhuma URL nova para pingar.");
    return;
  }

  for (let i = 0; i < urlsToPing.length; i += 100) {
    const chunk = urlsToPing.slice(i, i + 100);
    await pingBatch(chunk);
  }

  await saveJson(logPath, log);
})();
