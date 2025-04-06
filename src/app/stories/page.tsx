// app/stories/page.tsx
import fs from "fs/promises";
import path from "path";
import matter from "gray-matter";
import Link from "@/components/SmartLink"; // usa o seu link customizado
import Header from "@/components/Header";

interface Post {
  slug: string;
  titulo: string;
  thumb: string;
  story?: boolean;
}

export const metadata = {
  title: "Web Stories - GeekNews",
  description: "Confira os Web Stories mais recentes do GeekNews",
  alternates: {
    canonical: "https://www.geeknews.com.br/stories",
  },
};

export default async function StoriesPage() {
  const arquivos = await fs.readdir(path.join(process.cwd(), "content"));
  const posts: Post[] = [];

  for (const nomeArquivo of arquivos) {
    const arquivo = await fs.readFile(path.join(process.cwd(), "content", nomeArquivo), "utf-8");
    const { data } = matter(arquivo);

    if (data.story === true) {
      posts.push({
        slug: data.slug,
        titulo: data.title,
        thumb: data.thumb,
        story: true,
      });
    }
  }

  return (
    <>
      <Header />
      <main className="max-w-5xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-bold text-orange-600 mb-8">📲 Web Stories</h1>

        {posts.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400">Nenhuma story encontrada.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
            {posts.map((post) => (
              <Link
                key={post.slug}
                href={`/noticia/${post.slug}`}
                className="flex flex-col items-center group"
              >
                <div className="w-24 h-24 md:w-28 md:h-28 rounded-full overflow-hidden border-4 border-orange-500 group-hover:scale-105 transition shadow-lg">
                  <img
                    src={post.thumb}
                    alt={post.titulo}
                    className="object-cover w-full h-full"
                  />
                </div>
                <p className="text-sm mt-2 text-center text-orange-800 dark:text-orange-300 font-medium line-clamp-2">
                  {post.titulo}
                </p>
              </Link>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
