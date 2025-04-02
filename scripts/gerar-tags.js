// gerar-tags.js
const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");
const axios = require("axios");
require("dotenv").config();

const contentDir = path.join(process.cwd(), "content");

async function gerarTagsComIA(titulo, resumo) {
  const prompt = `Gere de 3 a 6 palavras-chave (tags) separadas por vírgula para o seguinte artigo de blog.
Título: ${titulo}
Resumo: ${resumo}
Responda apenas com as tags, separadas por vírgula.`;

  try {
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4-turbo",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.5,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const texto = response.data.choices[0].message.content.trim();
    const tags = texto.split(",").map((t) => t.trim().toLowerCase());
    return tags.filter((tag) => tag.length > 1);
  } catch (err) {
    console.error("Erro ao gerar tags:", err.message);
    return [];
  }
}

(async () => {
  const arquivos = fs.readdirSync(contentDir).filter((f) => f.endsWith(".md"));

  for (const nomeArquivo of arquivos) {
    const filePath = path.join(contentDir, nomeArquivo);
    const raw = fs.readFileSync(filePath, "utf-8");
    const { data, content } = matter(raw);

    if (data.tags) {
      console.log(`✅ ${nomeArquivo} já tem tags.`);
      continue;
    }

    const titulo = data.title || "";
    const resumo = data.resumo || content.slice(0, 300);
    const tags = await gerarTagsComIA(titulo, resumo);

    if (!tags.length) continue;

    data.tags = tags;
    const novoConteudo = matter.stringify(content, data);
    fs.writeFileSync(filePath, novoConteudo, "utf-8");
    console.log(`✍️  Tags adicionadas a ${nomeArquivo}:`, tags);
  }
})();
