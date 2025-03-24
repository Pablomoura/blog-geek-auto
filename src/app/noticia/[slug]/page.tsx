import fs from "fs/promises";
import path from "path";
import { notFound } from "next/navigation";
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

export async function generateStaticParams() {
  const filePath = path.join(process.cwd(), "public", "posts.json");
  const data = await fs.readFile(filePath, "utf-8");
  const posts: Post[] = JSON.parse(data);

  return posts.map((post) => ({ slug: post.slug }));
}

function normalizeSlug(text: string) {
  return text
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
}

export default async function Page({ params }: { params: { slug: string } }) {
  const filePath = path.join(process.cwd(), "public", "posts.json");
  const data = await fs.readFile(filePath, "utf-8");
  const posts: Post[] = JSON.parse(data);

  const slug = normalizeSlug(params.slug);
  const noticia = posts.find((post) => normalizeSlug(post.slug) === slug);

  if (!noticia) return notFound();

  const outrasNoticias = posts
    .filter(
      (post) =>
        post.categoria === noticia.categoria &&
        normalizeSlug(post.slug) !== slug
    )
    .slice(0, 3);

  const tempoLeitura = Math.ceil(noticia.texto.split(" ").length / 200);

  return (
    <>
      <Header />

      <main className="max-w-3xl mx-auto px-4 py-10">
        <span className="text-orange-500 uppercase text-sm font-bold tracking-wide">
          {noticia.categoria}
        </span>

        <h1 className="text-5xl font-extrabold mt-2 mb-6">{noticia.titulo}</h1>

        <p className="text-gray-400 text-sm mb-6">
          Publicado em {new Date().toLocaleDateString("pt-BR")} • {tempoLeitura} min de leitura
        </p>

        {noticia.tipoMidia === "imagem" && (
          <img
            src={noticia.midia}
            alt={noticia.titulo}
            className="w-full rounded-lg shadow-lg mb-6"
          />
        )}

        {noticia.tipoMidia === "video" && (
          <div className="relative pb-[56.25%] mb-6 h-0 overflow-hidden rounded-lg shadow-lg">
            <iframe
              src={noticia.midia}
              title={noticia.titulo}
              className="absolute top-0 left-0 w-full h-full"
              frameBorder="0"
              allowFullScreen
            />
          </div>
        )}

        <div className="space-y-6 text-lg leading-relaxed text-gray-300">
          {noticia.texto.split("\n").map((paragrafo, i) => (
            <p key={i}>{paragrafo}</p>
          ))}
        </div>

        <div className="border-t pt-10 mt-10">
          <h2 className="text-2xl font-bold mb-6 text-white">
            Veja também em <span className="text-orange-400">{noticia.categoria}</span>:
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {outrasNoticias.map((post) => (
              <a
                key={post.slug}
                href={`/noticia/${post.slug}`}
                className="bg-gray-900 p-4 rounded-lg shadow-md hover:shadow-lg hover:-translate-y-1 transition duration-300"
              >
                {post.thumb && (
                  <img
                    src={post.thumb}
                    alt={post.titulo}
                    className="w-full h-40 object-cover rounded-md mb-4"
                  />
                )}
                <p className="text-orange-400 text-xs font-bold uppercase mb-2">
                  {post.categoria}
                </p>
                <h3 className="text-lg font-semibold text-white">{post.titulo}</h3>
              </a>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}