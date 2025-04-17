// scripts/buscarFontesGoogle.js
const axios = require("axios");

async function buscarFontesGoogle(titulo) {
  const query = encodeURIComponent(titulo);
  const cx = process.env.GOOGLE_CSE_ID;
  const apiKey = process.env.GOOGLE_API_KEY;

  const url = `https://www.googleapis.com/customsearch/v1?q=${query}&cx=${cx}&key=${apiKey}&num=3`;

  try {
    const { data } = await axios.get(url);
    const links = (data.items || []).map((item) => {
      const dominio = new URL(item.link).hostname.replace("www.", "");
      return `- [${item.title} - ${dominio}](${item.link})`;
    });

    return links.length > 0
      ? `\n\n---\n\n## Fontes e Referências\n\n${links.join("\n")}`
      : "";
  } catch (err) {
    console.error("❌ Erro ao buscar fontes Google:", err.message);
    return "";
  }
}

module.exports = buscarFontesGoogle;
