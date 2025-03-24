const fs = require("fs");
const path = require("path");

const pastaContent = path.join(process.cwd(), "content");
const arquivoJSON = path.join(process.cwd(), "public", "posts.json");

// Apaga todos os arquivos .md da pasta content
if (fs.existsSync(pastaContent)) {
  const arquivos = fs.readdirSync(pastaContent);
  arquivos.forEach((arquivo) => {
    if (arquivo.endsWith(".md")) {
      fs.unlinkSync(path.join(pastaContent, arquivo));
    }
  });
  console.log("🧹 Arquivos .md apagados da pasta content/");
} else {
  console.log("⚠️ Pasta content/ não encontrada.");
}

// Zera o posts.json
if (fs.existsSync(arquivoJSON)) {
  fs.writeFileSync(arquivoJSON, "[]", "utf-8");
  console.log("🧼 Arquivo posts.json resetado.");
} else {
  console.log("⚠️ Arquivo posts.json não encontrado.");
}