const fs = require("fs/promises");
const path = require("path");
const matter = require("gray-matter");

const contentDir = path.join(process.cwd(), "content");

const palavrasChave = [
  "testei", "joguei", "assisti", "minha opinião",
  "review", "análise pessoal", "primeiras impressões"
];

const tagsExperiencia = [
  "review", "analise", "primeiras-impressoes"
];

function temIndicioDeExperiencia(titulo, tags) {
  const tituloLower = titulo.toLowerCase();
  const tagsLower = (tags || []).map(t => t.toLowerCase());

  return (
    palavrasChave.some(p => tituloLower.includes(p)) ||
    tagsLower.some(t => tagsExperiencia.includes(t))
  );
}

async function marcarExperiencia() {
  const arquivos = await fs.readdir(contentDir);

  for (const nome of arquivos) {
    if (!nome.endsWith(".md")) continue;

    const caminho = path.join(contentDir, nome);
    const conteudo = await fs.readFile(caminho, "utf-8");
    const { data, content } = matter(conteudo);

    if (data.experiencia) continue; // já marcado

    const deveMarcar = temIndicioDeExperiencia(data.title || "", data.tags || []);

    if (deveMarcar) {
      data.experiencia = true;
      const novoMd = matter.stringify(content, data);
      await fs.writeFile(caminho, novoMd, "utf-8");
      console.log(`✅ Marcado como experiência: ${data.title}`);
    }
  }

  console.log("🧠 Finalizado.");
}

marcarExperiencia();
