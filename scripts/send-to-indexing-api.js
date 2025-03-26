const { google } = require("googleapis");
const fs = require("fs");

const key = require("./google-service-account.json"); // JSON da conta de serviço

const auth = new google.auth.GoogleAuth({
  credentials: key,
  scopes: ["https://www.googleapis.com/auth/indexing"],
});

async function sendUrlToIndexingAPI(url) {
  const client = await auth.getClient();
  const index = google.indexing({ version: "v3", auth: client });

  try {
    const res = await index.urlNotifications.publish({
      requestBody: {
        url,
        type: "URL_UPDATED", // ou "URL_DELETED"
      },
    });
    console.log("✅ Enviado para indexação:", url, res.data);
  } catch (error) {
    console.error("❌ Erro ao enviar:", url, error.response?.data || error.message);
  }
}

// Exemplo de uso
const urls = [
  "https://www.geeknews.com.br/noticia/the-witcher-novo-jogo",
  "https://www.geeknews.com.br/noticia/duna-3-confirmado"
];

urls.forEach(sendUrlToIndexingAPI);