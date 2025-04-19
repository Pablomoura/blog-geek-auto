const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");

const jsonPath = path.join(process.cwd(), "public", "posts.json");
const contentDir = path.join(process.cwd(), "content");

async function atualizarResumos() {
  const postsJson = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
  const arquivosMd = fs.readdirSync(contentDir).filter((f) => f.endsWith(".md"));

  let atualizados = 0;

  for (const arquivo of arquivosMd) {
    const filePath = path.join(contentDir, arquivo);
    const slug = arquivo.replace(/\.md$/, "");

    const post = postsJson.find((p) => p.slug === slug);
    if (!post || !post.resumo) continue;

    const content = fs.readFileSync(filePath, "utf-8");
    const { data, content: markdown } = matter(content);

    if (data.resumo === post.resumo) continue;

    const novoMd = matter.stringify(markdown, {
      ...data,
      resumo: post.resumo,
    });

    fs.writeFileSync(filePath, novoMd, "utf-8");
    atualizados++;
    console.log(`✅ Resumo atualizado em: ${arquivo}`);
  }

  console.log(`\n🔄 Atualização concluída. ${atualizados} arquivos modificados.`);
}

atualizarResumos();
