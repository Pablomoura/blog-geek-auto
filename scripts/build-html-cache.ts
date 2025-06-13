import fs from "fs/promises";
import fsExtra from "fs-extra";
import path from "path";
import matter from "gray-matter";
import { marked } from "marked";
import { markedHighlight } from "marked-highlight";
import { gfmHeadingId } from "marked-gfm-heading-id";
import hljs from "highlight.js";
import DOMPurify from "isomorphic-dompurify";
import { loadPostCache } from "../src/utils/loadPostCache";
import { otimizarImagensHtml } from "../src/utils/otimizarImagensHtml";
import { aplicarLinksInternosInteligente } from "../src/utils/autoLinks-jsdom";

const force = process.argv.includes("--force");

marked.use(
  gfmHeadingId({ prefix: "heading-" }),
  markedHighlight({
    langPrefix: "hljs language-",
    highlight(code: string) {
      return hljs.highlightAuto(code).value;
    },
  })
);

async function inserirLinksRelacionados(content: string, slugAtual: string): Promise<string> {
  const todosPosts = await loadPostCache();
  const atual = todosPosts.find((p) => p.slug === slugAtual);
  const tags = Array.isArray(atual?.tags) ? atual.tags : [];

  if (tags.length === 0) return content;

  const tagsAtuais = tags.map((t: string) => t.toLowerCase());
  const links: { title: string; slug: string }[] = [];

  for (const post of todosPosts) {
    if (post.slug === slugAtual) continue;
    const comparar = Array.isArray(post.tags) ? post.tags.map((t: string) => t.toLowerCase()) : [];
    const temMatch = tagsAtuais.some((tag) => comparar.includes(tag));
    if (temMatch) links.push({ title: post.titulo, slug: post.slug });
    if (links.length >= 6) break;
  }

  if (links.length === 0) return content;

  const blocos: string[] = [];
  for (let i = 0; i < links.length; i += 2) {
    const grupo = links.slice(i, i + 2);
    const bloco = `
      <ul class="pl-5 mb-6 space-y-2">
        ${grupo
          .map(
            (link: { title: string; slug: string }) => `
            <li class="list-disc text-sm text-orange-700 dark:text-orange-400">
              <a href="/noticia/${link.slug}" class="hover:underline italic">${link.title}</a>
            </li>`
          )
          .join("\n")}
      </ul>
    `;
    blocos.push(bloco);
  }

  const paragrafos = content.split("</p>");
  const palavras = content.split(/\s+/).length;

  if (palavras <= 500) {
    paragrafos.splice(2, 0, blocos[0]);
  } else if (palavras <= 1000) {
    paragrafos.splice(2, 0, blocos[0]);
    paragrafos.push(blocos[1] || "");
  } else {
    paragrafos.splice(2, 0, blocos[0]);
    paragrafos.splice(Math.floor(paragrafos.length / 2), 0, blocos[1] || "");
    paragrafos.push(blocos[2] || "");
  }

  return paragrafos.join("</p>");
}

async function buildCache(): Promise<void> {
  const contentDir = path.join(process.cwd(), "content");
  const cacheDir = path.join(process.cwd(), "public", "cache", "html");

  await fsExtra.ensureDir(cacheDir);

  const files = await fs.readdir(contentDir);

  for (const fileName of files) {
    if (!fileName.endsWith(".md")) continue;

    const filePath = path.join(contentDir, fileName);
    const slug = fileName.replace(".md", "");
    const htmlPath = path.join(cacheDir, `${slug}.html`);

    try {
      const [mdStat, htmlStat] = await Promise.all([
        fs.stat(filePath),
        fs.stat(htmlPath),
      ]);

      if (!force && htmlStat.mtimeMs >= mdStat.mtimeMs) {
        console.log(`⏩ Pulado (sem alterações): ${slug}`);
        continue;
      }
    } catch {
      // Se não existir ainda o HTML, vamos gerar normalmente
    }

    const raw = await fs.readFile(filePath, "utf-8");
    const { data, content } = matter(raw);

    let markdown = content;

    // Embed YouTube antes de tudo
    markdown = markdown.replace(
      /\[youtube\]:\s*(https:\/\/www\.youtube\.com\/watch\?v=([a-zA-Z0-9_-]+))/g,
      (_match: string, url: string, videoId: string) => {
        return `
          <div class="relative pb-[56.25%] h-0 overflow-hidden rounded-lg shadow-lg my-8">
            <iframe
              src="https://www.youtube.com/embed/${videoId}"
              title="YouTube video"
              class="absolute top-0 left-0 w-full h-full"
              frameborder="0"
              allowfullscreen
              loading="lazy"
            ></iframe>
          </div>
        `;
      }
    );

    // ✅ Só depois converte para HTML
    let htmlConvertido = await marked.parse(markdown);

    // ✅ Aplica links internos ainda no markdown puro
    htmlConvertido = await aplicarLinksInternosInteligente(htmlConvertido)

    // ✅ Depois insere links relacionados
    htmlConvertido = await inserirLinksRelacionados(htmlConvertido, slug);

    // ✅ Corrige target blank em links externos
    const htmlComTargetBlank = htmlConvertido.replace(
      /<a\s+(?![^>]*target=)[^>]*href="([^"]+)"([^>]*)>/g,
      '<a href="$1"$2 target="_blank" rel="noopener noreferrer">'
    );

    // ✅ Sanitiza o HTML
    const htmlSanitizado = DOMPurify.sanitize(htmlComTargetBlank, {
      ADD_TAGS: ["iframe"],
      ADD_ATTR: [
        "allow",
        "allowfullscreen",
        "frameborder",
        "scrolling",
        "src",
        "title",
        "loading",
        "class",
        "target",
        "rel",
      ],
    });

    // ✅ Otimiza imagens no HTML
    const htmlFinal = otimizarImagensHtml(htmlSanitizado);

    await fs.writeFile(htmlPath, htmlFinal);
    console.log(`✅ Cache atualizado: ${slug}`);
  }

  console.log("🚀 Cache HTML finalizado!");
}

buildCache();
