// reescrita.js
require("dotenv").config();
const OpenAI = require("openai");
const fs = require("fs");

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const filePath = "public/posts.json";

async function reescreverNoticias() {
  let posts = [];
  if (fs.existsSync(filePath)) {
    const rawData = fs.readFileSync(filePath, "utf-8");
    posts = JSON.parse(rawData);
  }

  for (let post of posts) {
    if (!post.reescrito) {
      console.log(`🔄 Reescrevendo: ${post.titulo}`);

      const resposta = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{
          role: "user",
          content: `Reescreva este título e texto de forma original e atrativa para SEO:\nTítulo: ${post.titulo}\nTexto: ${post.texto}`,
        }],
      });

      const textoReescrito = resposta.choices[0].message.content.split("\n");

      post.titulo = textoReescrito[0].replace("Título: ", "").trim();
      post.texto = textoReescrito.slice(1).join("\n").replace("Texto: ", "").trim();
      post.reescrito = true;
    }
  }

  fs.writeFileSync(filePath, JSON.stringify(posts, null, 2));
  console.log("✅ Notícias reescritas e salvas!");
}

module.exports = { reescreverNoticias };