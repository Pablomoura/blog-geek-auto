import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  const filePath = path.join(process.cwd(), "public", "posts.json");
  const jsonData = fs.readFileSync(filePath, "utf-8");
  const posts = JSON.parse(jsonData);

  return NextResponse.json(posts);
}