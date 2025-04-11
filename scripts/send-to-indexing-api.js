const fs = require("fs");
const path = require("path");
const { google } = require("googleapis");

// Se o JSON da conta não existir, recria com base em variável de ambiente
const jsonPath = path.join(__dirname, "google-service-account.json");

if (!fs.existsSync(jsonPath)) {
  const jsonBase64 = process.env.GOOGLE_CREDENTIALS;
  if (!jsonBase64) {
    console.error("❌ GOOGLE_INDEXING_JSON não foi definido.");
    process.exit(1);
  }
  const jsonDecoded = Buffer.from(jsonBase64, "base64").toString("utf-8");
  fs.writeFileSync(jsonPath, jsonDecoded);
}

// Autenticação
const key = require(jsonPath);
const auth = new google.auth.GoogleAuth({
  credentials: key,
  scopes: ["https://www.googleapis.com/auth/indexing"],
});

// Função para enviar uma URL
async function sendUrlToIndexingAPI(url) {
  const client = await auth.getClient();
  const index = google.indexing({ version: "v3", auth: client });

  try {
    const res = await index.urlNotifications.publish({
      requestBody: {
        url,
        type: "URL_UPDATED",
      },
    });
    console.log("✅ Enviado para indexação:", url, res.data);
  } catch (error) {
    console.error("❌ Erro ao enviar:", url, error.response?.data || error.message);
  }
}

// Carrega os últimos slugs do posts.json
const postsPath = path.join(__dirname, "..", "public", "posts.json");
let urls = [];

try {
  const posts = JSON.parse(fs.readFileSync(postsPath, "utf-8"));
  urls = posts.slice(0, 10).map((post) => `https://www.geeknews.com.br/noticia/${post.slug}`);
} catch (err) {
  console.error("❌ Erro ao ler posts.json:", err.message);
  process.exit(1);
}

// Envia todas as URLs
(async () => {
  for (const url of urls) {
    await sendUrlToIndexingAPI(url);
  }
})();
