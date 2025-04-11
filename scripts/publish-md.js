const fs = require("fs/promises");
const path = require("path");
const matter = require("gray-matter");

const POSTS_DIR = path.join(process.cwd(), "content");
const OUTPUT_FILE = path.join(process.cwd(), "public", "posts.json");

// Carrega posts antigos
async function carregarPostsAntigos() {
  try {
    const raw = await fs.readFile(OUTPUT_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

// Gera o mapa de slugs antigos para comparação
function mapearPorSlug(posts) {
  return Object.fromEntries(posts.map((p) => [p.slug, p]));
}

(async () => {
  const arquivos = await fs.readdir(POSTS_DIR);
  const postsNovos = [];
  const slugsParaNotificar = [];

  const postsAntigos = await carregarPostsAntigos();
  const mapaAntigo = mapearPorSlug(postsAntigos);

  for (const file of arquivos) {
    if (!file.endsWith(".md")) continue;

    const filePath = path.join(POSTS_DIR, file);
    const raw = await fs.readFile(filePath, "utf-8");
    const { data } = matter(raw);

    if (!data.slug || !data.title || !data.data || !data.categoria || !data.resumo || !data.thumb) {
      console.warn(`⚠️ Ignorado: ${file} com frontmatter incompleto`);
      continue;
    }

    const post = {
      slug: data.slug,
      titulo: data.title,
      thumb: data.thumb,
      categoria: data.categoria,
      data: data.data,
      resumo: data.resumo,
      tags: data.tags || [],
    };

    postsNovos.push(post);

    const antigo = mapaAntigo[post.slug];
    if (!antigo) {
      console.log(`🆕 Novo post: ${post.slug}`);
      slugsParaNotificar.push(post.slug);
    } else {
      const mudou = JSON.stringify(antigo) !== JSON.stringify(post);
      if (mudou) {
        console.log(`✏️ Atualizado: ${post.slug}`);
        slugsParaNotificar.push(post.slug);
      }
    }
  }

  // Ordena os posts
  postsNovos.sort((a, b) => new Date(b.data) - new Date(a.data));

  // Salva novo posts.json
  await fs.writeFile(OUTPUT_FILE, JSON.stringify(postsNovos, null, 2));
  console.log(`✅ posts.json atualizado com ${postsNovos.length} entradas`);

  // Se não houver mudanças, finaliza
  if (slugsParaNotificar.length === 0) {
    console.log("🚫 Nenhum post novo ou atualizado. Nada a notificar.");
    return;
  }

  // Dispara pings para o Google Indexing API
  const { google } = require("googleapis");
  const keyPath = path.join(__dirname, "google-service-account.json");

  if (!process.env.GOOGLE_CREDENTIALS && !(await fs.stat(keyPath).catch(() => false))) {
    console.error("❌ Nenhuma credencial encontrada para Indexing API.");
    return;
  }

  // Recria o JSON da conta de serviço se necessário
  if (!await fs.stat(keyPath).catch(() => false) && process.env.GOOGLE_CREDENTIALS) {
    const jsonDecoded = Buffer.from(process.env.GOOGLE_CREDENTIALS, "base64").toString("utf-8");
    await fs.writeFile(keyPath, jsonDecoded);
  }

  const key = require(keyPath);
  const auth = new google.auth.GoogleAuth({
    credentials: key,
    scopes: ["https://www.googleapis.com/auth/indexing"],
  });

  const client = await auth.getClient();
  const index = google.indexing({ version: "v3", auth: client });

  for (const slug of slugsParaNotificar) {
    const url = `https://www.geeknews.com.br/noticia/${slug}`;
    try {
      const res = await index.urlNotifications.publish({
        requestBody: {
          url,
          type: "URL_UPDATED",
        },
      });
      console.log(`📣 Notificado: ${url}`);
    } catch (err) {
      console.error(`❌ Erro ao notificar ${slug}:`, err.response?.data || err.message);
    }
  }
})();
