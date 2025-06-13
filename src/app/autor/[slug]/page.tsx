import fs from "fs/promises";
import path from "path";
import matter from "gray-matter";
import Image from "next/image";
import { notFound } from "next/navigation";
import autores from "@/data/autores.json";
import Link from "@/components/SmartLink";
import Header from "@/components/Header";
import JsonLdProfilePage from "@/components/JsonLdProfilePage";

function slugify(nome: string) {
  return nome
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function generateStaticParams() {
  return autores.map((autor) => ({
    slug: slugify(autor.nome),
  }));
}

async function getPostsDoAutor(slugAutor: string) {
  const contentDir = path.join(process.cwd(), "content");
  let arquivos = [];

  try {
    arquivos = await fs.readdir(contentDir);
  } catch (err) {
    console.warn(`⚠️ Pasta content/ não encontrada.`, err);
    return { posts: [], totalPalavras: 0, tagCounts: {} };
  }

  const posts = [];
  const tagCounts: Record<string, number> = {};
  let totalPalavras = 0;

  for (const nome of arquivos) {
    const caminho = path.join(contentDir, nome);
    let conteudo;
    try {
      conteudo = await fs.readFile(caminho, "utf-8");
    } catch {
      continue;
    }

    const { data, content } = matter(conteudo);

    if (data.author && slugify(data.author) === slugAutor) {
      posts.push({
        slug: data.slug,
        title: data.title,
        data: data.data,
        thumb: data.thumb || "",
        resumo: data.resumo || "",
      });

      totalPalavras += content.split(/\s+/).length;

      if (Array.isArray(data.tags)) {
        for (const tag of data.tags) {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        }
      }
    }
  }

  return { posts, totalPalavras, tagCounts };
}

export default async function AutorPage(props: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { slug } = await props.params;
  const { page } = await props.searchParams;

  const autor = autores.find((a) => slugify(a.nome) === slug);
  if (!autor) return notFound();

  const { posts, totalPalavras, tagCounts } = await getPostsDoAutor(slug);

  posts.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());

  const mediaLeitura =
    posts.length > 0 ? Math.round((totalPalavras / posts.length) / 200) : 1;

  const topTags = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([tag]) => tag);

  const paginaAtual = parseInt(page || "1", 10);
  const postsPorPagina = 20;
  const totalPaginas = Math.ceil(posts.length / postsPorPagina);
  const exibidos = posts.slice(
    (paginaAtual - 1) * postsPorPagina,
    paginaAtual * postsPorPagina
  );

  return (
    <>
      <Header />
      <JsonLdProfilePage
        nome={autor.nome}
        bio={autor.bio}
        imagem={autor.imagem}
        slug={slug}
      />
      <main className="max-w-4xl mx-auto px-6 py-10">
        <div className="flex items-center gap-6 mb-10">
          <Image
            src={autor.imagem}
            alt={autor.nome}
            width={96}
            height={96}
            className="rounded-full border-2 border-orange-400"
          />
          <div>
            <h1 className="text-2xl font-bold">{autor.nome}</h1>
            <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{autor.bio}</p>

            <p className="text-xs mt-2 text-orange-500 font-semibold">
              {posts.length} artigo{posts.length !== 1 ? "s" : ""} publicado{posts.length !== 1 ? "s" : ""}
              {posts.length > 20 && (
                <span className="ml-2 inline-block bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  Colunista GeekNews 🏅
                </span>
              )}
            </p>

            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Média de leitura: {mediaLeitura} min por artigo
            </p>

            {topTags.length > 0 && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Temas principais: {topTags.map((tag, i) => (
                  <span key={tag}>
                    <Link
                      href={`/tag/${tag.toLowerCase().replace(/\s+/g, "-")}`}
                      className="text-orange-600 hover:underline"
                    >
                      #{tag}
                    </Link>
                    {i < topTags.length - 1 ? ", " : ""}
                  </span>
                ))}
              </p>
            )}
          </div>
        </div>

        <h2 className="text-xl font-bold mb-6">Artigos por {autor.nome}</h2>
        <div className="space-y-6">
          {exibidos.map((post) => (
            <Link
              key={post.slug}
              href={`/noticia/${post.slug}`}
              className="block bg-gray-100 dark:bg-gray-800 p-4 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition"
            >
              <p className="text-sm font-semibold">{post.title}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {new Date(post.data).toLocaleDateString("pt-BR")}
              </p>
            </Link>
          ))}
        </div>

        {totalPaginas > 1 && (
          <div className="flex justify-center mt-10 gap-4 text-sm">
            {paginaAtual > 1 && (
              <Link
                href={`/autor/${slug}?page=${paginaAtual - 1}`}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                ← Página anterior
              </Link>
            )}
            {paginaAtual < totalPaginas && (
              <Link
                href={`/autor/${slug}?page=${paginaAtual + 1}`}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                Próxima página →
              </Link>
            )}
          </div>
        )}
      </main>
    </>
  );
}
