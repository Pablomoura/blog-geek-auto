import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carrega os posts
const postsPath = path.join(__dirname, '../public/posts.json');
const logPath = path.join(__dirname, '../public/social-post-log.json');

console.log(`📂 Lendo posts de: ${postsPath}`);

let posts = [];
try {
  const postsRaw = await fs.readFile(postsPath, 'utf-8');
  posts = JSON.parse(postsRaw);
} catch (err) {
  console.error('❌ Erro ao ler posts.json:', err);
  process.exit(1);
}

// Carrega o log de posts já publicados
let postLog = [];
try {
  const logRaw = await fs.readFile(logPath, 'utf-8');
  postLog = JSON.parse(logRaw);
  console.log(`🗂️ Log de posts já publicados carregado (${postLog.length} posts).`);
} catch {
  console.log('ℹ️ Nenhum log existente, criando um novo.');
}

// Ordena por data DESC → para pegar o post mais recente ainda não publicado
posts = posts
  .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
  .slice(0, 20);

// Seleciona o primeiro post que ainda não foi publicado
const postParaPostar = posts.find((p) => !postLog.includes(p.slug));

if (!postParaPostar) {
  console.log('✅ Nenhum post novo para compartilhar.');
  process.exit(0);
}

console.log(`📢 Preparando para compartilhar: ${postParaPostar.titulo} (${postParaPostar.slug})`);

// Publica no Facebook com imagem
async function postToFacebook(post) {
  const caption = `${post.titulo}\n\nLeia mais: https://www.geeknews.com.br/noticia/${post.slug}`;

  if (!post.thumb || post.thumb.trim() === '') {
    console.warn('⚠️ Post não tem thumb definida, pulando postagem no Facebook.');
    return;
  }

  // Converte thumb em URL absoluta
  const thumbUrl = post.thumb.startsWith('http')
    ? post.thumb
    : `https://www.geeknews.com.br${post.thumb}`;

  try {
    console.log(`➡️ Publicando no Facebook com imagem: ${thumbUrl}`);
    const response = await axios.post(`https://graph.facebook.com/${process.env.FACEBOOK_PAGE_ID}/photos`, {
      url: thumbUrl,
      caption,
      access_token: process.env.FACEBOOK_PAGE_ACCESS_TOKEN,
    });
    console.log('✅ Facebook:', response.data);
  } catch (error) {
    console.error('❌ Erro ao postar no Facebook:', error.response?.data || error.message);
  }
}

// Publica no Threads
async function postToThreads(post) {
  const message = `${post.titulo}\n\nLeia mais: https://www.geeknews.com.br/noticia/${post.slug}`;
  try {
    console.log('➡️ Criando post no Threads...');
    const createResponse = await axios.post(
      `https://graph.threads.net/${process.env.THREADS_USER_ID}/threads`,
      null,
      {
        params: {
          text: message,
          media_type: 'TEXT',
          access_token: process.env.THREADS_ACCESS_TOKEN,
        },
      }
    );

    const creationId = createResponse.data.id;
    console.log(`✅ Container Threads criado (creation_id=${creationId})`);

    console.log('➡️ Publicando no Threads...');
    const publishResponse = await axios.post(
      `https://graph.threads.net/${process.env.THREADS_USER_ID}/threads_publish`,
      null,
      {
        params: {
          creation_id: creationId,
          access_token: process.env.THREADS_ACCESS_TOKEN,
        },
      }
    );

    console.log('✅ Threads:', publishResponse.data);
  } catch (error) {
    console.error('❌ Erro ao postar no Threads:', error.response?.data || error.message);
  }
}

// Executa as funções
(async () => {
  console.log(`🚀 Iniciando publicação do post: ${postParaPostar.slug}`);

  await postToFacebook(postParaPostar);
  await postToThreads(postParaPostar);

  console.log('📝 Atualizando log de posts...');
  postLog.push(postParaPostar.slug);
  await fs.writeFile(logPath, JSON.stringify(postLog, null, 2));
  console.log('✅ Log atualizado.');

  console.log('🏁 Script concluído.');
})();