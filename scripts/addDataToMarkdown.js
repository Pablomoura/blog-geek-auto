const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");

const contentDir = path.join(process.cwd(), "content");

async function atualizarDatas() {
  const arquivos = fs.readdirSync(contentDir).filter((f) => f.endsWith(".md"));

  for (const nome of arquivos) {
    const filePath = path.join(contentDir, nome);
    const conteudo = fs.readFileSync(filePath, "utf-8");
    const { data, content } = matter(conteudo);

    // Se já tem "data", pula
    if (data.data) continue;

    // Usa data de modificação do arquivo como fallback
    const stats = fs.statSync(filePath);
    const ultimaModificacao = stats.mtime.toISOString();

    const novoFrontmatter = {
      ...data,
      data: ultimaModificacao,
    };

    const novoConteudo = matter.stringify(content, novoFrontmatter);
    fs.writeFileSync(filePath, novoConteudo, "utf-8");

    console.log(`✅ Atualizado: ${nome}`);
  }
}

atualizarDatas();