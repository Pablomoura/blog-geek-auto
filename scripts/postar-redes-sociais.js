const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Carrega os posts
const postsPath = path.join(__dirname, 'public', 'posts.json');
if (!fs.existsSync(postsPath)) {
  console.error('❌ Arquivo posts.json não encontrado.');
  process.exit(1);
}
const posts = JSON.parse(fs.readFileSync(postsPath, 'utf-8'));

// Carrega o log de posts já publicados
const logPath = path.join(__dirname, 'public', 'social-post-log.json');
let postLog = [];
if (fs.existsSync(logPath)) {
  postLog = JSON.parse(fs.readFileSync(logPath, 'utf-8'));
}

// Seleciona o primeiro post que ainda não foi publicado
const postParaPostar = posts.find((p) => !postLog.includes(p.slug));

// Publica no Facebook
async function postToFacebook(post) {
  const message = `📰 ${post.titulo}\n\nLeia mais: https://www.geeknews.com.br/noticia/${post.slug}`;
  try {
    const response = await axios.post(`https://graph.facebook.com/${process.env.FACEBOOK_PAGE_ID}/feed`, {
      message,
      access_token: process.env.FACEBOOK_PAGE_ACCESS_TOKEN,
    });
    console.log('✅ Post publicado no Facebook:', response.data);
  } catch (error) {
    console.error('❌ Erro ao postar no Facebook:', error.response?.data || error.message);
  }
}

// Publica no Threads
async function postToThreads(post) {
  const message = `📰 ${post.titulo}\n\nLeia mais: https://www.geeknews.com.br/noticia/${post.slug}`;
  try {
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

    console.log('✅ Post publicado no Threads:', publishResponse.data);
  } catch (error) {
    console.error('❌ Erro ao postar no Threads:', error.response?.data || error.message);
  }
}

// Executa as funções
(async () => {
  if (!postParaPostar) {
    console.log('✅ Nenhum post novo para compartilhar.');
    return;
  }

  console.log(`📢 Compartilhando post: ${postParaPostar.titulo}`);

  await postToFacebook(postParaPostar);
  await postToThreads(postParaPostar);

  // Atualiza o log
  postLog.push(postParaPostar.slug);
  fs.writeFileSync(logPath, JSON.stringify(postLog, null, 2));
})();
