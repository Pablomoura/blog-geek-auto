const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");
const axios = require("axios");
require("dotenv").config();

const jsonPath = path.join(process.cwd(), "public", "posts.json");
const contentDir = path.join(process.cwd(), "content");

const isDryRun = process.argv.includes("--dry-run");

async function gerarResumoComGPT(texto) {
  try {
    console.log("✏️  Gerando resumo com GPT...");
    const systemPrompt = "Você é um redator de SEO para um site de notícias geek. Seu objetivo é criar resumos concisos e atrativos para meta descrições no Google.";
    const userPrompt = `Gere um resumo com entre 150 e 160 caracteres, em tom jornalístico e atrativo, para ser usado como meta descrição no Google. Não comece com aspas, nem escreva 'Resumo:' antes.\n\nTexto:\n${texto}\n\nResumo:`;

    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4o", // ou "gpt-3.5-turbo"
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 100,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    let resumoGerado = response.data.choices[0].message.content.trim();

    // Remover aspas se vierem
    resumoGerado = resumoGerado.replace(/^["']|["']$/g, "");

    // Garantir no máximo 160 caracteres
    if (resumoGerado.length > 160) {
      resumoGerado = resumoGerado.slice(0, 157).trim() + "...";
    }

    console.log(`✅ Resumo gerado (${resumoGerado.length} caracteres): "${resumoGerado}"`);
    return resumoGerado;
  } catch (error) {
    console.error("❌ Erro ao gerar resumo com GPT:", error.response?.data || error.message);
    return null;
  }
}

async function atualizarResumos() {
  const postsJson = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
  const arquivosMd = fs.readdirSync(contentDir).filter((f) => f.endsWith(".md"));

  let atualizados = 0;

  for (const arquivo of arquivosMd) {
    const filePath = path.join(contentDir, arquivo);
    const slug = arquivo.replace(/\.md$/, "");

    const post = postsJson.find((p) => p.slug === slug);
    const content = fs.readFileSync(filePath, "utf-8");
    const { data, content: markdown } = matter(content);

    let resumoAtual = data.resumo;
    let resumoNovo = post?.resumo || resumoAtual;

    // Se não houver resumo nem no md nem no posts.json → gerar
    if (!resumoNovo || resumoNovo.trim() === "") {
      const textoParaGerar = markdown.slice(0, 1500); // usa no máx. os primeiros 1500 caracteres do post
      resumoNovo = await gerarResumoComGPT(textoParaGerar);

      // Se mesmo assim não gerou, pula este post
      if (!resumoNovo) {
        console.log(`⚠️  Não foi possível gerar resumo para: ${arquivo}`);
        continue;
      }
    }

    // Se o resumo é igual, não faz nada
    if (resumoAtual === resumoNovo) continue;

    console.log(`🔄 ${isDryRun ? "[Dry Run] " : ""}Resumo diferente/em falta em: ${arquivo}`);
    console.log(`👉 Atual: "${(resumoAtual || "").slice(0, 80)}"`);
    console.log(`👉 Novo:  "${resumoNovo.slice(0, 80)}"\n`);

    if (!isDryRun) {
      const novoMd = matter.stringify(markdown, {
        ...data,
        resumo: resumoNovo,
      });

      fs.writeFileSync(filePath, novoMd, "utf-8");
      atualizados++;
    }
  }

  if (!isDryRun) {
    console.log(`\n✅ Atualização concluída. ${atualizados} arquivos modificados.`);
  } else {
    console.log(`\n🚀 Dry run concluído. ${atualizados} arquivos *seriam* modificados.`);
  }
}

atualizarResumos();
