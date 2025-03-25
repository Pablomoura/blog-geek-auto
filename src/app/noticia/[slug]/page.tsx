import fs from "fs/promises";
import path from "path";
import matter from "gray-matter";
import { notFound } from "next/navigation";
import Header from "@/components/Header";

type PostMeta = {
  title: string;
  slug: string;
  categoria: string;
  midia: string;
  tipoMidia: string;
  thumb?: string;
};

export async function generateStaticParams() {
  const dir = path.join(process.cwd(), "content");
  const files = await fs.readdir(dir);

  return files.map((filename) => ({
    slug: filename.replace(/\.md$/, ""),
  }));
}

export default async function NoticiaPage({ params }: { params: { slug: string } }) {
  const filePath = path.join(process.cwd(), "content", `${params.slug}.md`);
  const jsonPath = path.join(process.cwd(), "public", "posts.json");

  try {
    const file = await fs.readFile(filePath, "utf-8");
    const { data, content } = matter(file) as unknown as { data: PostMeta; content: string };

    const tempoLeitura = Math.ceil(content.split(" ").length / 200);

    // 🧠 Buscar outras notícias da mesma categoria
    const jsonData = await fs.readFile(jsonPath, "utf-8");
    const allPosts: PostMeta[] = JSON.parse(jsonData);

    const outrasNoticias = allPosts
      .filter((post) => post.categoria === data.categoria && post.slug !== data.slug)
      .slice(0, 3);

    return (
      <>
        <Header />

        <main className="max-w-3xl mx-auto px-4 py-10 text-white">
          {/* Categoria */}
          <span className="text-orange-500 uppercase text-sm font-bold tracking-wide">
            {data.categoria}
          </span>

          {/* Título */}
          <h1 className="text-5xl font-extrabold mt-2 mb-6">{data.title}</h1>

          {/* Info */}
          <p className="text-gray-400 text-sm mb-6">
            Publicado em {new Date().toLocaleDateString("pt-BR")} • {tempoLeitura} min de leitura
          </p>

          {/* Mídia */}
          {data.tipoMidia === "imagem" && (
            <img
              src={data.midia}
              alt={data.title}
              className="w-full rounded-lg shadow-lg mb-6"
            />
          )}

          {data.tipoMidia === "video" && (
            <div className="relative pb-[56.25%] mb-6 h-0 overflow-hidden rounded-lg shadow-lg">
              <iframe
                src={data.midia}
                title={data.title}
                className="absolute top-0 left-0 w-full h-full"
                frameBorder="0"
                allowFullScreen
              />
            </div>
          )}

          {/* Conteúdo com parágrafos */}
          <div className="space-y-8 text-lg leading-relaxed text-gray-300">
          {content.split("\n\n").map((p, i) =>
            p.trim() !== "" ? <p key={i}>{p.trim()}</p> : null
          )}
          </div>

          {/* Outras notícias recomendadas */}
          {outrasNoticias.length > 0 && (
            <div className="border-t pt-10 mt-10">
              <h2 className="text-2xl font-bold mb-6 text-white">
                Veja também em{" "}
                <span className="text-orange-400">{data.categoria}</span>:
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
                        alt={post.title}
                        className="w-full h-40 object-cover rounded-md mb-4"
                      />
                    )}
                    <p className="text-orange-400 text-xs font-bold uppercase mb-2">
                      {post.categoria}
                    </p>
                    <h3 className="text-lg font-semibold text-white">
                      {post.title}
                    </h3>
                  </a>
                ))}
              </div>
            </div>
          )}
        </main>
      </>
    );
  } catch (err) {
    return notFound();
  }
}
