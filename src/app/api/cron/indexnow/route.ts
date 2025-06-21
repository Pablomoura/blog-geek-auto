import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import indexnow from '../../../../../scripts/ping-indexnow.js';
import { commitFile } from '@utils/githubCommit';

export async function GET() {
  await indexnow.run();
  const logPath = path.join(process.cwd(), 'public', 'indexnow-log.json');
  const content = await fs.readFile(logPath, 'utf-8');
  await commitFile('public/indexnow-log.json', content, '🤖 Atualiza log do IndexNow');
  return NextResponse.json({ ok: true });
}
