// evergreen.js
import fs from "fs/promises";
import path from "path";
import axios from "axios";
import readline from "readline";
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import slugify from "slugify";
import dotenv from "dotenv";
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const rootDir = path.join(__dirname, "../");
const contentDir = path.join(rootDir, "content");
const temasPath = path.join(rootDir, "public", "temas.txt");

console.log("\uD83D\uDCC1 Salvando artigos em:", contentDir);

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

async function gerarEvergreen(tema) {
  const prompt = `
Você é um especialista em SEO, GEO (Generative Engine Optimization) e AEO (Answer Engine Optimization). Escreva um artigo completo, evergreen e otimizado para o Google e IAs como ChatGPT e Gemini de 1200 a 2000 palavras.
Estrutura do artigo:
- Introdução com a palavra-chave principal na primeira frase. Use parágrafos curtos, com linguagem fluida, didática e convidativa.
- H2: Blocos principais com conteúdo profundo, escaneável e informativo. Inicie o primeiro parágrafo de cada H2 com a palavra-chave principal sempre que possível.
- H3: Subtópicos e perguntas diretas (AEO), respondidas de forma clara e objetiva, com até 2 parágrafos curtos.
- H2 Final: “Dúvidas Frequentes” com respostas rápidas em bullet points (250–300 caracteres).
- Conclusão: 1 ou 2 parágrafos curtos com CTA convidando o leitor a continuar navegando no site.

Regras de repetição:
- Repita a palavra-chave principal a cada 125 palavras aproximadamente.
- Cada palavra-chave secundária deve aparecer pelo menos 2 vezes em blocos diferentes.
- Use variações naturais e semânticas para evitar repetições robóticas.

Estilo e tom:
- Use linguagem informacional, natural, fluida e humanizada.
- Seja claro, direto e gentil, como um especialista explicando para um amigo.
- Evite jargões técnicos, repetições mecânicas ou linguagem artificial.
- Use exemplos, provas sociais ou comparações quando fizer sentido.

Regras de SEO semântico:
- Extraia palavras semânticas relevantes e aplique de forma natural no texto.
- Respeite a originalidade: todo o conteúdo deve ser único e parecer escrito por um humano com domínio do assunto.

- Não copie frases de outros sites. Gere tudo de forma original.
- Gere em HTML estruturado com tags <h1>, <h2>, <h3>, <p>, <ul> etc.
- Gere também até 8 tags curtas e relevantes para serem usadas como palavras-chave.

Tema: ${tema}

Responda em JSON válido (sem markdown ou quebras extras):

{
  "titulo": "...",
  "resumo": "...",
  "texto": "...",
  "tags": ["tag1", "tag2", "tag3"],
  "categoria": "..."
}`;
  try {
      const response = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
          model: "gpt-4o",
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.5,
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            "Content-Type": "application/json",
            "OpenAI-Service-Tier": "flex", // Especifica o uso do tier flexível
          },
        }
      );

    let raw = response.data.choices[0].message.content.trim();

    // Corrigir caso venha com bloco markdown ```json ... ```
    raw = raw.replace(/^```json[\r\n]+/, "").replace(/```$/, "").trim();

    let json;
    try {
      json = JSON.parse(raw);
    } catch (err) {
      console.error("❌ Erro ao converter JSON:", err.message);
      console.log("🧪 Conteúdo bruto recebido:", raw);
      return;
    }

    const slug = slugify(json.titulo, { lower: true, strict: true });
    const data = new Date().toISOString();
    const midia = "/images/evergreen.jpg";

    const frontMatter = `---
title: "${json.titulo.replace(/\"/g, "'")}"
slug: "${slug}"
resumo: "${json.resumo}"
categoria: "${json.categoria}"
midia: "${midia}"
tipoMidia: "imagem"
thumb: "${midia}"
keywords: "${json.tags.join(", ")}"
tags: [${json.tags.map((t) => `"${t}"`).join(", ")}]
data: "${data}"
---

`;

    const mdPath = path.join(contentDir, `${slug}.md`);
    await fs.writeFile(mdPath, frontMatter + json.texto, "utf-8");

    console.log("✅ Artigo criado:", slug);
  } catch (err) {
    console.error("❌ Erro ao gerar artigo:", err.message);
  }
}

async function modoInterativo() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  rl.question("Digite o tema do artigo: ", async (tema) => {
    await gerarEvergreen(tema);
    rl.close();
  });
}

async function modoLista() {
  try {
    const raw = await fs.readFile(temasPath, "utf-8");
    const temas = raw
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    for (const tema of temas) {
      await gerarEvergreen(tema);
    }
  } catch (err) {
    console.log("❌ Erro ao ler temas.txt:", err.message);
  }
}

(async () => {
  if (process.argv.includes("--lista")) await modoLista();
  else await modoInterativo();
})();
