const OpenAI = require("openai");
const fs = require("fs");

const openai = new OpenAI({ apiKey: "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" });

const filePath = "public/posts.json";

// 📌 1️⃣ Ler o JSON existente
let posts = [];
if (fs.existsSync(filePath)) {
  const rawData = fs.readFileSync(filePath, "utf-8");
  posts = JSON.parse(rawData);
}

async function reescreverNoticias() {
  for (let post of posts) {
    // 📌 2️⃣ Verifica se já foi reescrito
    if (!post.reescrito) {
      console.log(`🔄 Reescrevendo: ${post.titulo}`);

      // 📌 3️⃣ Gera um novo título e conteúdo usando IA
      const resposta = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: `Reescreva este título e texto de forma original e atrativa:\nTítulo: ${post.titulo}\nTexto: ${post.texto}` }],
      });

      const textoReescrito = resposta.choices[0].message.content.split("\n");

      // 📌 4️⃣ Atualiza o título e o texto no JSON
      post.titulo = textoReescrito[0].replace("Título: ", "").trim();
      post.texto = textoReescrito.slice(1).join("\n").replace("Texto: ", "").trim();
      post.reescrito = true;
    }
  }

  // 📌 5️⃣ Salva as mudanças no arquivo JSON
  fs.writeFileSync(filePath, JSON.stringify(posts, null, 2));
  console.log("✅ Notícias reescritas e salvas!");
}

reescreverNoticias();