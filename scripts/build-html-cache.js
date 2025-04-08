const fs = require("fs/promises");
const fsExtra = require("fs-extra");
const path = require("path");
const matter = require("gray-matter");
const { marked } = require("marked");
const { markedHighlight } = require("marked-highlight");
const { gfmHeadingId } = require("marked-gfm-heading-id");
const hljs = require("highlight.js");
const DOMPurify = require("isomorphic-dompurify");
const { loadPostCache } = require("../src/utils/loadPostCache");
const { aplicarLinksInternosInteligente } = require("../src/utils/autoLinks");
const { otimizarImagensHtml } = require("../src/utils/otimizarImagensHtml");

const force = process.argv.includes("--force");

marked.use(
  gfmHeadingId({ prefix: "heading-" }),
  markedHighlight({
    langPrefix: "hljs language-",
    highlight(code) {
      return hljs.highlightAuto(code).value;
    },
  })
);

async function inserirLinksRelacionados(content, slugAtual) {
  const todosPosts = await loadPostCache();
  const atual = todosPosts.find((p) => p.slug === slugAtual);
  if (!atual || !atual.tags) return content;

  const tagsAtuais = atual.tags.map((t) => t.toLowerCase());
  const links = [];

  for (const post of todosPosts) {
    if (post.slug === slugAtual) continue;
    const tagsComparar = (post.tags || []).map((t) => t.toLowerCase());
    const temMatch = tagsAtuais.some((tag) => tagsComparar.includes(tag));
    if (temMatch) links.push({ title: post.titulo, slug: post.slug });
    if (links.length === 2) break;
  }

  if (links.length === 0) return content;

  const bloco = `
    <ul class="pl-5 mb-6 space-y-2">
      ${links
        .map(
          (link) =>
            `<li class="list-disc text-sm text-orange-700 dark:text-orange-400">
              <a href="/noticia/${link.slug}" class="hover:underline italic">${link.title}</a>
            </li>`
        )
        .join("\n")}
    </ul>
  `;

  const paragrafos = content.split("</p>");
  if (paragrafos.length > 2) {
    paragrafos.splice(2, 0, bloco);
  } else {
    paragrafos.push(bloco);
  }

  return paragrafos.join("</p>");
}

async function buildCache() {
  const contentDir = path.join(process.cwd(), "content");
  const cacheDir = path.join(process.cwd(), "public", "cache", "html");

  await fsExtra.ensureDir(cacheDir);

  const files = await fs.readdir(contentDir);

  for (const fileName of files) {
    const filePath = path.join(contentDir, fileName);
    const slug = fileName.replace(".md", "");
    const htmlPath = path.join(cacheDir, `${slug}.html`);

    try {
      const [mdStat, htmlStat] = await Promise.all([
        fs.stat(filePath),
        fs.stat(htmlPath)
      ]);
      if (!force && htmlStat.mtimeMs >= mdStat.mtimeMs) {
        console.log(`⏩ Pulado (sem alterações): ${slug}`);
        continue;
      }
    } catch {
      // continua se não existir o arquivo de cache
    }

    const raw = await fs.readFile(filePath, "utf-8");
    const { data, content } = matter(raw);

    let markdown = content;

    markdown = markdown.replace(
      /\[youtube\]:\s*(https:\/\/www\.youtube\.com\/watch\?v=([a-zA-Z0-9_-]+))/g,
      (_match, url, videoId) => {
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

    const htmlConvertido = await marked.parse(markdown);

    const htmlComTargetBlank = htmlConvertido.replace(
      /<a\s+(?![^>]*target=)[^>]*href="([^"]+)"([^>]*)>/g,
      '<a href="$1"$2 target="_blank" rel="noopener noreferrer">'
    );

    const htmlComLinks = await aplicarLinksInternosInteligente(htmlComTargetBlank, slug);
    const htmlSanitizado = DOMPurify.sanitize(htmlComLinks, {
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
    const htmlFinal = otimizarImagensHtml(htmlSanitizado);

    await fs.writeFile(htmlPath, htmlFinal);
    console.log(`✅ Cache atualizado: ${slug}`);
  }

  console.log("🚀 Cache HTML finalizado!");
}

buildCache();
