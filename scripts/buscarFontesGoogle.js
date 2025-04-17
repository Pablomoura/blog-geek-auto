const axios = require("axios");

async function traduzirTitulo(titulo) {
  const prompt = `Traduza o título abaixo para o inglês. Responda apenas com o título traduzido, sem explicações.

"${titulo}"`;

  try {
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4-turbo",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.2,
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
    console.error("❌ Erro ao traduzir título:", err.message);
    return titulo; // fallback: usa o original em PT
  }
}

async function buscarFontesGoogle(tituloOriginal) {
  const tituloTraduzido = await traduzirTitulo(tituloOriginal);
  const query = encodeURIComponent(tituloTraduzido);
  const cx = process.env.GOOGLE_CSE_ID;
  const apiKey = process.env.GOOGLE_API_KEY;

  const url = `https://www.googleapis.com/customsearch/v1?q=${query}&cx=${cx}&key=${apiKey}&num=3&lr=en`;

  try {
    const { data } = await axios.get(url);
    const links = (data.items || []).map((item) => {
      const dominio = new URL(item.link).hostname.replace("www.", "");
      return `- [${item.title} - ${dominio}](${item.link})`;
    });

    return links.length > 0
      ? `\n\n---\n\n#### Fontes e Referências\n\n${links.join("\n")}`
      : "";
  } catch (err) {
    console.error("❌ Erro ao buscar fontes Google:", err.message);
    return "";
  }
}

module.exports = buscarFontesGoogle;
