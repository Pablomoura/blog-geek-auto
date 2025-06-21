import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import postar from '../../../../../scripts/postar-redes-sociais.js';
import { commitFile } from '@utils/githubCommit';

export async function GET() {
  await postar();
  const logPath = path.join(process.cwd(), 'public', 'social-post-log.json');
  const content = await fs.readFile(logPath, 'utf-8');
  await commitFile('public/social-post-log.json', content, '🤖 Atualiza log de posts sociais');
  return NextResponse.json({ ok: true });
}
