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
Crie um artigo evergreen otimizado para SEO com título, resumo e corpo do texto em Markdown (com ## para H2, ### para H3 e listas com "-").
Use linguagem clara, parágrafos curtos (2-3 frases), com no mínimo 2000 palavras.
Baseie a categoria no tema.
Gere também até 8 tags curtas e relevantes.

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
    const res = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4-turbo",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
      },
      {
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    let raw = res.data.choices[0].message.content.trim();

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
