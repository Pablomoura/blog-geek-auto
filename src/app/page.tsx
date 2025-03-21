"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Header from "@/components/Header"; // Mantendo apenas o novo Header

type Post = {
  titulo: string;
  texto: string;
  midia: string;
  tipoMidia: string;
  categoria: string;
  thumb?: string;
  slug: string;
};

// Função para gerar slugs
function slugify(text: string) {
  return text.toLowerCase().replace(/\s+/g, "-").replace(/[^\w-]+/g, "");
}

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [visiblePosts, setVisiblePosts] = useState(6); // Número inicial de posts visíveis

  useEffect(() => {
    fetch("/api/posts")
      .then((res) => res.json())
      .then((data) => setPosts(data.reverse())); // Ordena os mais recentes primeiro
  }, []);

  return (
    <>
      {/* Novo Header */}
      <Header />

      <main className="max-w-5xl mx-auto px-6 py-10">
        <h2 className="text-4xl font-bold mb-6 text-white">📰 Últimas Notícias</h2>

        {/* Grid responsivo */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.slice(0, visiblePosts).map((post, index) => (
            <article
              key={index}
              className="bg-gray-900 p-5 rounded-lg shadow-lg hover:shadow-xl transition-transform transform hover:-translate-y-2"
            >
              <p className="text-orange-400 text-sm font-bold uppercase mb-2">
                {post.categoria}
              </p>

              {(post.thumb || post.midia) && (
                <img
                  src={post.thumb || post.midia}
                  alt={post.titulo}
                  className="w-full h-48 object-cover rounded-md mb-4"
                />
              )}

              <h3 className="text-lg font-semibold text-white">
                <Link href={`/noticia/${slugify(post.slug)}`} className="hover:text-orange-400">
                  {post.titulo}
                </Link>
              </h3>

              <p className="text-gray-400 text-sm mt-2">{post.texto.substring(0, 120)}...</p>

              <Link
                href={`/noticia/${slugify(post.slug)}`}
                className="inline-block mt-4 text-orange-400 hover:underline font-bold"
              >
                ➜ Leia mais
              </Link>
            </article>
          ))}
        </div>

        {/* Botão "Carregar mais" */}
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