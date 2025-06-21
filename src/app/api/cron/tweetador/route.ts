import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import tweetador from '../../../../../scripts/tweetador.js';
import { commitFile } from '@utils/githubCommit';

export async function GET() {
  await tweetador.run();
  const logPath = path.join(process.cwd(), 'data', 'tweet-log.json');
  const content = await fs.readFile(logPath, 'utf-8');
  await commitFile('data/tweet-log.json', content, '🤖 Atualiza tweet-log.json');
  return NextResponse.json({ ok: true });
}
