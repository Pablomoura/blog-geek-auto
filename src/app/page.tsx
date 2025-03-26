"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Header from "@/components/Header";

type Post = {
  titulo: string;
  resumo: string;
  texto: string;
  midia: string;
  tipoMidia: string;
  categoria: string;
  thumb?: string;
  slug: string;
};

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [visiblePosts, setVisiblePosts] = useState(6);

  useEffect(() => {
    fetch("/api/posts")
      .then((res) => res.json())
      .then((data) => {
        const ordenado = [...data].reverse(); // Deixa os mais novos primeiro
        setPosts(ordenado);
      });
  }, []);

  return (
    <>
      <Header />

      <main className="max-w-5xl mx-auto px-6 py-10">
        <h1 className="text-4xl font-bold mb-6 text-neutral-900 dark:text-white">📰 Últimas Notícias</h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.slice(0, visiblePosts).map((post, index) => (
            <article
              key={index}
              className="bg-white dark:bg-gray-900 p-5 rounded-lg shadow-lg hover:shadow-xl transition-transform transform hover:-translate-y-2"
            >
              <p className="text-orange-500 text-sm font-bold uppercase mb-2">
                {post.categoria}
              </p>

              {(post.thumb || post.midia) && (
                <img
                  src={post.thumb || post.midia}
                  alt={post.titulo}
                  className="w-full h-48 object-cover rounded-md mb-4"
                />
              )}

              <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">
                <Link href={`/noticia/${post.slug}`} className="hover:text-orange-500">
                  {post.titulo}
                </Link>
              </h3>

              <p className="text-neutral-600 dark:text-gray-400 text-sm">{post.resumo}</p>

              <Link
                href={`/noticia/${post.slug}`}
                className="inline-block mt-4 text-orange-500 hover:underline font-bold"
              >
                ➜ Leia mais
              </Link>
            </article>
          ))}
        </div>

        {visiblePosts < posts.length && (
          <div className="flex justify-center mt-8">
            <button
              onClick={() => setVisiblePosts(visiblePosts + 6)}
              className="px-6 py-2 bg-orange-500 text-white font-bold rounded-lg hover:bg-orange-600 transition"
            >
              Carregar mais notícias
            </button>
          </div>
        )}
      </main>
    </>
  );
}
