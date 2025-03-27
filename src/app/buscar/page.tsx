import fs from "fs/promises";
import path from "path";
import matter from "gray-matter";
import Link from "next/link";
import Header from "@/components/Header";

interface SearchPageProps {
  searchParams: { q?: string };
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const termo = searchParams.q?.toLowerCase() || "";
  const arquivos = await fs.readdir(path.join(process.cwd(), "content"));
  const posts = [];

  for (const nomeArquivo of arquivos) {
    const arquivo = await fs.readFile(path.join(process.cwd(), "content", nomeArquivo), "utf-8");
    const { data, content } = matter(arquivo);
    const textoCompleto = `${data.title} ${data.resumo || ""} ${content}`.toLowerCase();
    if (termo && textoCompleto.includes(termo)) {
      const tempoLeitura = Math.ceil(content.split(/\s+/).length / 200);
      posts.push({
        slug: data.slug,
        titulo: data.title,
        thumb: data.thumb,
        resumo: data.resumo || content.slice(0, 160) + "...",
        categoria: data.categoria,
        data: data.data,
        tempoLeitura,
      });
    }
  }

  posts.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());

  return (
    <>
      <Header />
      <main className="max-w-5xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold mb-6 text-center text-neutral-800 dark:text-white">
          Resultados para <mark className="bg-yellow-200 text-black px-1 rounded">{termo}</mark>
        </h1>

        {posts.length === 0 && (
          <p className="text-center text-gray-500 dark:text-gray-400">Nenhum resultado encontrado.</p>
        )}

        <div className="space-y-8">
          {posts.map((post) => (
            <Link
              key={post.slug}
              href={`/noticia/${post.slug}`}
              className="flex gap-4 bg-white dark:bg-gray-900 p-4 rounded-lg shadow hover:shadow-md hover:bg-gray-100 dark:hover:bg-gray-800 transition overflow-hidden"
            >
              {post.thumb && (
                <img
                  src={post.thumb}
                  alt={post.titulo}
                  className="w-40 h-28 object-cover flex-shrink-0"
                />
              )}
              <div className="py-2 pr-4 flex flex-col justify-center">
                <p className="text-orange-500 text-xs font-bold uppercase mb-1">{post.categoria}</p>
                <h2 className="text-md font-semibold text-neutral-900 dark:text-white leading-snug">
                  {post.titulo}
                </h2>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  {new Date(post.data).toLocaleDateString("pt-BR")} • {post.tempoLeitura} min de leitura
                </p>
                <p
                  className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2"
                  dangerouslySetInnerHTML={{
                    __html: post.resumo.replace(
                      new RegExp(`(${termo})`, "gi"),
                      '<mark class="bg-yellow-200 text-black">$1</mark>'
                    )
                  }}
                />
              </div>
            </Link>
          ))}
        </div>
      </main>
    </>
  );
}
