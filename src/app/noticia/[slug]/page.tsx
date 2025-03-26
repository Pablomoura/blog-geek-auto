import fs from "fs/promises";
import path from "path";
import matter from "gray-matter";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Link from "next/link";
import Script from "next/script";

type NoticiaPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function NoticiaPage(props: NoticiaPageProps) {
  const { slug } = await props.params;
  const filePath = path.join(process.cwd(), "content", `${slug}.md`);

  try {
    const file = await fs.readFile(filePath, "utf-8");
    const { data, content } = matter(file);

    const tempoLeitura = Math.ceil(content.split(" ").length / 200);

    // Busca os outros posts para mostrar relacionados
    const allFiles = await fs.readdir(path.join(process.cwd(), "content"));
    const relacionados = [];

    for (const fileName of allFiles) {
      const relatedSlug = fileName.replace(".md", "");
      if (relatedSlug === slug) continue;

      const filePath = path.join(process.cwd(), "content", fileName);
      const contentRaw = await fs.readFile(filePath, "utf-8");
      const { data: relatedData } = matter(contentRaw);

      relacionados.push({
        slug: relatedSlug,
        titulo: relatedData.title,
        categoria: relatedData.categoria,
        thumb: relatedData.thumb,
      });

      if (relacionados.length === 3) break;
    }

    return (
      <>
        <Header />
        <Script id="json-ld" type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            headline: data.title,
            description: data.resumo || "",
            image: data.thumb || data.midia || "",
            author: {
              "@type": "Organization",
              name: "GeekNews",
              "url": "https://www.geeknews.com.br"
            },
            publisher: {
              "@type": "Organization",
              name: "GeekNews",
              logo: {
                "@type": "ImageObject",
                url: "https://www.geeknews.com.br/logo.png", // ← substitua pelo caminho real
              },
            },
            url: `https://blog-geek-auto.vercel.app/noticia/${slug}`,
            datePublished: new Date().toISOString(),
            dateModified: new Date().toISOString(),
          })}
        </Script>

        <main className="max-w-3xl mx-auto px-4 py-10 text-neutral-900 dark:text-white">
          <span className="text-orange-500 uppercase text-sm font-bold tracking-wide">
            {data.categoria}
          </span>

          <h1 className="text-5xl font-extrabold mt-2 mb-6">{data.title}</h1>

          <p className="text-neutral-600 dark:text-gray-400 text-sm mb-6">
            Publicado em {new Date().toLocaleDateString("pt-BR")} • {tempoLeitura} min de leitura
          </p>

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

          <div className="space-y-8 text-lg leading-relaxed text-neutral-800 dark:text-gray-300 mb-16">
            {content.split("\n").map((p, i) => (
              p.trim() !== "" ? <p key={i}>{p}</p> : null
            ))}
          </div>

          {/* POSTS RELACIONADOS */}
          {relacionados.length > 0 && (
            <section className="mt-12 border-t border-gray-700 pt-8">
              <h2 className="text-2xl font-bold mb-6 text-neutral-900 dark:text-white">
                🔗 Posts relacionados
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {relacionados.map((post, index) => (
                  <Link
                    href={`/noticia/${post.slug}`}
                    key={index}
                    className="block bg-white dark:bg-gray-900 p-5 rounded-lg shadow-md hover:shadow-xl transition hover:-translate-y-1"
                  >
                    <p className="text-orange-500 text-sm font-bold uppercase mb-2">
                      {post.categoria}
                    </p>
                  
                    {post.thumb && (
                      <img
                        src={post.thumb}
                        alt={post.titulo}
                        className="w-full h-40 object-cover rounded-md mb-4"
                      />
                    )}
                  
                    <h3 className="text-md font-semibold text-neutral-900 dark:text-white mb-2">
                      {post.titulo}
                    </h3>
                  
                    <span className="inline-block mt-2 text-orange-500 hover:underline font-bold text-sm">
                      ➜ Ler agora
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </main>
      </>
    );
  } catch {
    return notFound();
  }
}