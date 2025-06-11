// scripts/gerar-glossary.js
const fs = require("fs/promises");
const path = require("path");
const matter = require("gray-matter");

const STOPWORDS = new Set([
  "de", "da", "do", "das", "dos",
  "a", "o", "as", "os",
  "em", "no", "na", "nos", "nas",
  "um", "uma", "uns", "umas",
  "e", "ou", "com", "por", "para", "como",
  "se", "que", "qual", "quais", "são", "ser", "sobre"
]);

async function gerarGlossario() {
  const contentDir = path.join(process.cwd(), "content");
  const outputPath = path.join(process.cwd(), "src/data/glossary.json");

  const files = (await fs.readdir(contentDir)).filter((f) => f.endsWith(".md"));
  const termos = new Map();

  console.log(`📂 Lendo ${files.length} arquivos de conteúdo...\n`);

  for (const file of files) {
    const slug = file.replace(/\.md$/, "");
    const filePath = path.join(contentDir, file);
    const raw = await fs.readFile(filePath, "utf-8");
    const { data } = matter(raw);

    if (!data.tags || !Array.isArray(data.tags)) continue;

    for (const tag of data.tags) {
      const termoLimpo = limparTermo(tag);
      const termoNorm = normalizeTermo(termoLimpo);

      // Ignora se for uma stopword pura
      if (isStopword(termoNorm)) continue;

      // Não sobrescreve se já tem
      if (!termos.has(termoNorm)) {
        termos.set(termoNorm, { termo: termoLimpo, slug });
        console.log(`➕ Mapeado termo: "${termoLimpo}" → /noticia/${slug}`);
      }
    }
  }

  const glossaryArray = Array.from(termos.values()).sort((a, b) =>
    a.termo.localeCompare(b.termo)
  );

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, JSON.stringify(glossaryArray, null, 2), "utf-8");

  console.log(`\n✅ Glossário gerado com ${glossaryArray.length} termos em ${outputPath}`);
}

function limparTermo(text) {
  // Remove acentos + espaços duplos + trim
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove acentos
    .replace(/\s+/g, " ") // normaliza espaços
    .trim();
}

function normalizeTermo(text) {
  return text
    .toLowerCase()
    .trim();
}

function isStopword(termoNorm) {
  // Se for uma única palavra e for uma stopword → ignora
  if (!termoNorm.includes(" ") && STOPWORDS.has(termoNorm)) return true;
  return false;
}

gerarGlossario();