import fs from "fs/promises";
import path from "path";

export async function GET() {
  const baseUrl = "https://www.geeknews.com.br"; 
  const contentDir = path.join(process.cwd(), "content");
  const files = await fs.readdir(contentDir);

  const urls = files
    .filter((f) => f.endsWith(".md"))
    .map((file) => {
      const slug = file.replace(".md", "");
      return `<url>
        <loc>${baseUrl}/noticia/${slug}</loc>
      </url>`;
    });

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}</loc>
  </url>
  ${urls.join("\n")}
</urlset>`;

  return new Response(sitemap, {
    headers: {
      "Content-Type": "application/xml",
    },
  });
}
