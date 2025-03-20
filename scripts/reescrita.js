const OpenAI = require("openai");
const fs = require("fs");

const openai = new OpenAI({ apiKey: "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" });

async function reescreverNoticias() {
  let noticias = JSON.parse(fs.readFileSync("public/posts.json"));

  for (let noticia of noticias) {
    let prompt = `Reescreva esta notícia de forma original: ${noticia.titulo}`;
    let resposta = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
    });

    noticia.texto = resposta.choices[0].message.content;
  }

  fs.writeFileSync("public/posts.json", JSON.stringify(noticias, null, 2));
  console.log("✅ Notícias reescritas e salvas!");
}

reescreverNoticias();