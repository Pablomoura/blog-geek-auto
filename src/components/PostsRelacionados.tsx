import Link from "@/components/SmartLink";
import Image from "next/image";
import { PostResumo } from "@/types/post";

export function getPostsRelacionados(
  slugAtual: string,
  tagsAtuais: string[] = [],
  categoriaAtual: string,
  todosPosts: PostResumo[]
): PostResumo[] {
  return todosPosts
    .filter((post) => post.slug !== slugAtual)
    .map((post) => {
      const tagsPost = (post.tags || []).map((t) => t.toLowerCase());
      const tagsRelevantes = tagsAtuais.map((t) => t.toLowerCase());
      const tagsEmComum = tagsRelevantes.filter((tag) => tagsPost.includes(tag)).length;
      const mesmaCategoria = post.categoria === categoriaAtual ? 1 : 0;

      return {
        ...post,
        score: tagsEmComum * 10 + mesmaCategoria * 2 + (post.textoLength || 0) * 0.0001,
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}

export default function PostsRelacionados({ posts }: { posts: PostResumo[] }) {
  if (!posts || posts.length === 0) return null;

  return (
    <section className="mt-12 border-t border-gray-700 pt-8">
      <h2 className="text-2xl font-bold mb-6 text-neutral-900 dark:text-white">
        🔗 Posts relacionados
      </h2>
      <div className="space-y-6">
        {posts.map((post, index) => (
          <Link
            href={`/noticia/${post.slug}`}
            key={index}
            className="flex gap-4 bg-white dark:bg-gray-900 p-4 rounded-lg shadow hover:shadow-md hover:bg-gray-100 dark:hover:bg-gray-800 transition overflow-hidden"
          >
            {post.thumb && (
              <Image
                src={post.thumb}
                alt={post.titulo}
                width={128}
                height={96}
                className="w-32 h-24 object-cover rounded-md"
                unoptimized
              />
            )}
            <div className="flex flex-col justify-center">
              <p className="text-orange-500 text-xs font-bold uppercase mb-1">{post.categoria}</p>
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-white leading-snug">
                {post.titulo}
              </h3>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{post.tempoLeitura} min de leitura</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
