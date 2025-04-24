// src/components/SecaoCriticasRecentes.tsx
import Link from "@/components/SmartLink";
import Image from "next/image";
import { PostResumo } from "@/types/post";

type Props = {
  posts: PostResumo[];
};

export default function SecaoCriticasRecentes({ posts }: Props) {
  if (!posts || posts.length === 0) return null;

  return (
    <section className="max-w-6xl mx-auto px-6 py-12">
      <div className="max-w-6xl mx-auto pl-4">
        <h2 className="text-2xl font-bold mb-6 text-orange-500">
          Últimas Críticas
        </h2>
        <div className="flex overflow-x-auto gap-4">
          {posts.map((post, index) => (
            <Link
              key={index}
              href={`/noticia/${post.slug}`}
              className="min-w-[140px] max-w-[140px] flex-shrink-0"
            >
              <div className="w-full h-[207px] relative rounded overflow-hidden">
              <Image
                src={post.capaObra || "/images/default.jpg"}
                alt={post.tituloPortugues || post.titulo}
                width={140}
                height={207}
                className="w-full min-h-[207px] rounded-lg shadow"
                />
              </div>
              <h3 className="text-xs font-bold mt-3 text-gray-500 dark:text-gray-500">
                {post.tituloPortugues || post.titulo}
              </h3>
            </Link>
          ))}

          {/* Botão final para ver todas as críticas */}
          <Link
            href="/criticas"
            className="min-w-[140px] max-w-[140px] h-[210px] flex flex-col items-center justify-center border border-gray-600 border-dashed rounded text-sm text-gray-400 hover:bg-gray-800 transition"
          >
            <span className="text-3xl">+</span>
            <span className="italic mt-2">Ver todas as críticas</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
