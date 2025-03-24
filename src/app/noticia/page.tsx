'use client';

import { useEffect, useState } from "react";
import { useSearchParams, notFound } from "next/navigation";
import Header from "@/components/Header";

type Post = {
  titulo: string;
  texto: string;
  midia: string;
  tipoMidia: string;
  categoria: string;
  slug: string;
  thumb?: string;
};

function normalizeSlug(text: string) {
  return text
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
}

export default function Noticia() {
  const searchParams = useSearchParams();
  const slug = searchParams.get("slug");

  const [post, setPost] = useState<Post | null>(null);
  const [outras, setOutras] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!slug) return;

      const res = await fetch("/api/posts");
      const posts: Post[] = await res.json();

      const noticia = posts.find(
        (p) => normalizeSlug(p.slug) === normalizeSlug(slug)
      );

      if (!noticia) {
        setPost(null);
        setLoading(false);
        return;
      }

      const recomendados = posts
        .filter(
          (p) =>
            p.categoria === noticia.categoria &&
            normalizeSlug(p.slug) !== normalizeSlug(noticia.slug)
        )
        .slice(0, 3);

      setPost(noticia);
      setOutras(recomendados);
      setLoading(false);
    }

    fetchData();
  }, [slug]);

  if (loading) return <p className="text-center p-8">Carregando...</p>;
  if (!post) return notFound();

  const tempoLeitura = Math.ceil(post.texto.split(" ").length / 200);

  return (
    <>
      <Header />
      <main className="max-w-3xl mx-auto px-4 py-10">
        <span className="text-orange-500 uppercase text-sm font-bold tracking-wide">
          {post.categoria}
        </span>

        <h1 className="text-5xl font-extrabold mt-2 mb-6">{post.titulo}</h1>

        <p className="text-gray-400 text-sm mb-6">
          Publicado em {new Date().toLocaleDateString("pt-BR")} • {tempoLeitura} min de leitura
        </p>

        {post.tipoMidia === "imagem" && post.midia && (
          <img
            src={post.midia}
            alt={post.titulo}
            className="w-full rounded-lg shadow-lg mb-6"
          />
        )}

        {post.tipoMidia === "video" && post.midia && (
          <div className="relative pb-[56.25%] mb-6 h-0 overflow-hidden rounded-lg shadow-lg">
            <iframe
              src={post.midia}
              title={post.titulo}
              className="absolute top-0 left-0 w-full h-full"
              frameBorder="0"
              allowFullScreen
            />
          </div>
        )}

        <div className="space-y-6 text-lg leading-relaxed text-gray-300">
          {post.texto.split("\n").map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>

        {outras.length > 0 && (
          <div className="border-t pt-10 mt-10">
            <h2 className="text-2xl font-bold mb-6 text-white">
              Veja também em{" "}
              <span className="text-orange-400">{post.categoria}</span>:
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {outras.map((p) => (
                <a
                  key={p.slug}
                  href={`/noticia?slug=${p.slug}`}
                  className="bg-gray-900 p-4 rounded-lg shadow-md hover:shadow-lg hover:-translate-y-1 transition duration-300"
                >
                  {p.thumb && (
                    <img
                      src={p.thumb}
                      alt={p.titulo}
                      className="w-full h-40 object-cover rounded-md mb-4"
                    />
                  )}
                  <p className="text-orange-400 text-xs font-bold uppercase mb-2">
                    {p.categoria}
                  </p>
                  <h3 className="text-lg font-semibold text-white">
                    {p.titulo}
                  </h3>
                </a>
              ))}
            </div>
          </div>
        )}
      </main>
    </>
  );
}