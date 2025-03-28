// scripts/postToTwitter.js
import { TwitterApi } from 'twitter-api-v2';
import 'dotenv/config';
import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';

const client = new TwitterApi({
  appKey: process.env.TWITTER_APP_KEY,
  appSecret: process.env.TWITTER_APP_SECRET,
  accessToken: process.env.TWITTER_ACCESS_TOKEN,
  accessSecret: process.env.TWITTER_ACCESS_SECRET,
});

async function postLatestArticle() {
  const files = await fs.readdir(path.join(process.cwd(), 'content'));
  const latest = files.sort().reverse()[0];
  const file = await fs.readFile(path.join(process.cwd(), 'content', latest), 'utf-8');
  const { data } = matter(file);

  const url = `https://www.geeknews.com.br/noticia/${data.slug}`;
  const status = `📰 ${data.title}\n\nLeia mais: ${url}`;

  try {
    await client.v2.tweet(status);
    console.log('✅ Tweet publicado com sucesso!');
  } catch (err) {
    console.error('❌ Erro ao publicar tweet:', err);
  }
}

postLatestArticle();