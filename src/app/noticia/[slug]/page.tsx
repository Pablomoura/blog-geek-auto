import fs from "fs/promises";
import path from "path";
import matter from "gray-matter";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Link from "next/link";
import Script from "next/script";
import Head from "next/head";
import React from "react";
import DisqusReset from "@/components/DisqusReset";

type NoticiaPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function NoticiaPage(props: NoticiaPageProps) {
  const { slug } = await props.params;
  const filePath = path.join(process.cwd(), "content", `${slug}.md`);

  try {
    const file = await fs.readFile(filePath, "utf-8");
    const { data, content } = matter(file);
    const tempoLeitura = Math.ceil(content.split(" ").length / 200);

    const allFiles = await fs.readdir(path.join(process.cwd(), "content"));
    const relacionados = [];
    const posts = [];

    for (const fileName of allFiles) {
      const relatedSlug = fileName.replace(".md", "");
      if (relatedSlug === slug) continue;

      const relatedPath = path.join(process.cwd(), "content", fileName);
      const contentRaw = await fs.readFile(relatedPath, "utf-8");
      const { data: relatedData, content: relatedContent } = matter(contentRaw);
      const tempoLeituraRel = Math.ceil(relatedContent.split(/\s+/).length / 200);

      relacionados.push({
        slug: relatedSlug,
        titulo: relatedData.title,
        categoria: relatedData.categoria,
        thumb: relatedData.thumb,
        tempoLeitura: tempoLeituraRel,
      });

      posts.push({
        slug: relatedSlug,
        titulo: relatedData.title,
        texto: relatedContent,
      });

      if (relacionados.length === 3) break;
    }

    const maisLidas = [...posts]
      .sort((a, b) => b.texto.length - a.texto.length)
      .slice(0, 3);

    return (
      <>
        <Head>
          <title>{data.title}</title>
          <meta name="description" content={data.resumo || "Notícia geek do GeekNews."} />
          <meta property="og:title" content={data.title} />
          <meta property="og:description" content={data.resumo || ""} />
          <meta property="og:image" content={data.thumb || data.midia || "/logo.png"} />
          <meta property="og:url" content={`https://www.geeknews.com.br/noticia/${slug}`} />
          <meta property="og:type" content="article" />
          <meta property="og:site_name" content="GeekNews" />
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content={data.title} />
          <meta name="twitter:description" content={data.resumo || ""} />
          <meta name="twitter:image" content={data.thumb || data.midia || "/logo.png"} />
        </Head>

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
              url: "https://www.geeknews.com.br",
            },
            publisher: {
              "@type": "Organization",
              name: "GeekNews",
              logo: {
                "@type": "ImageObject",
                url: "https://www.geeknews.com.br/logo.png",
              },
            },
            url: `https://www.geeknews.com.br/noticia/${slug}`,
            datePublished: data.data || new Date().toISOString(),
            dateModified: data.data || new Date().toISOString(),
          })}
        </Script>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="w-full bg-gray-200 dark:bg-gray-800 h-32 mt-8 mb-8 rounded-lg flex items-center justify-center text-sm text-gray-500 dark:text-gray-400">
            Publicidade
          </div>

          <div className="flex flex-col lg:flex-row gap-14">
            <main className="flex-1 w-full lg:pr-10 py-10 text-neutral-900 dark:text-white">
              <span className="text-orange-500 uppercase text-sm font-bold tracking-wide">{data.categoria}</span>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mt-2 mb-6">{data.title}</h1>
              <p className="text-neutral-600 dark:text-gray-400 text-sm mb-6">
                Publicado em {new Date().toLocaleDateString("pt-BR")} • {tempoLeitura} min de leitura
              </p>

              {data.tipoMidia === "imagem" && (
                <img src={data.midia} alt={data.title} className="w-full rounded-lg shadow-lg mb-6" />
              )}

              {data.tipoMidia === "video" && (
                <div className="relative pb-[56.25%] mb-6 h-0 overflow-hidden rounded-lg shadow-lg">
                  <iframe
                    src={data.midia}
                    title={data.title}
                    className="absolute top-0 left-0 w-full h-full"
                    frameBorder="0"
                    allowFullScreen
                    loading="lazy"
                  />
                </div>
              )}

              <div className="space-y-8 text-lg leading-relaxed text-neutral-800 dark:text-gray-300 mb-16">
                {content
                  .split("\n")
                  .filter((p) => p.trim() !== "")
                  .map((p, i) => (
                    <React.Fragment key={i}>
                      <p>{p}</p>
                      {i === 1 && (
                        <div className="bg-gray-200 dark:bg-gray-800 h-32 my-8 rounded-lg flex items-center justify-center text-sm text-gray-500 dark:text-gray-400">
                          Publicidade
                        </div>
                      )}
                    </React.Fragment>
                  ))}
              </div>

              {relacionados.length > 0 && (
                <section className="mt-12 border-t border-gray-700 pt-8">
                  <h2 className="text-2xl font-bold mb-6 text-neutral-900 dark:text-white">🔗 Posts relacionados</h2>
                  <div className="space-y-6">
                    {relacionados.map((post, index) => (
                      <Link
                        href={`/noticia/${post.slug}`}
                        key={index}
                        className="flex gap-4 bg-white dark:bg-gray-900 p-4 rounded-lg shadow hover:shadow-md hover:bg-gray-100 dark:hover:bg-gray-800 transition overflow-hidden"
                      >
                        {post.thumb && (
                          <img src={post.thumb} alt={post.titulo} className="w-32 h-24 object-cover rounded-md" />
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
              )}

              <div id="disqus_thread" className="mt-12" />
              <DisqusReset slug={slug} />
              <Script id="disqus-script" strategy="afterInteractive">
                {`
                  var disqus_config = function () {
                    this.page.url = "https://www.geeknews.com.br/noticia/${slug}";
                    this.page.identifier = "${slug}";
                  };
                  (function() {
                    var d = document, s = d.createElement('script');
                    s.src = 'https://geeknewsblog.disqus.com/embed.js';
                    s.setAttribute('data-timestamp', +new Date());
                    (d.head || d.body).appendChild(s);
                  })();
                `}
              </Script>
              <noscript>
                Por favor, habilite o JavaScript para visualizar os{" "}
                <a href="https://disqus.com/?ref_noscript">comentários fornecidos pelo Disqus</a>.
              </noscript>
            </main>

            <aside className="w-full lg:w-[320px] flex-shrink-0 space-y-10">
              <div className="bg-gray-200 dark:bg-gray-800 h-32 rounded-lg flex items-center justify-center text-sm text-gray-500 dark:text-gray-400 mb-8">
                Publicidade
              </div>
              <section className="mb-8">
                <div className="flex items-center justify-between mb-4 border-b pb-2">
                  <h2 className="text-sm uppercase tracking-widest font-semibold text-gray-600 dark:text-gray-300">
                    Mais lidas
                  </h2>
                  <span className="text-yellow-500 text-xl">★</span>
                </div>
                <div className="space-y-3">
                  {maisLidas.map((post, index) => (
                    <Link
                      key={index}
                      href={`/noticia/${post.slug}`}
                      className="flex items-start gap-4 bg-gray-100 dark:bg-gray-800 p-4 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                    >
                      <span className="text-3xl font-light text-gray-400 dark:text-gray-500 w-6">{index + 1}</span>
                      <p className="text-sm text-gray-900 dark:text-gray-200 leading-snug">{post.titulo}</p>
                    </Link>
                  ))}
                </div>
              </section>
              <div className="bg-gray-200 dark:bg-gray-800 h-96 rounded-lg flex items-center justify-center text-sm text-gray-500 dark:text-gray-400">
                Publicidade
              </div>
            </aside>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="bg-gray-200 dark:bg-gray-800 h-40 rounded-lg flex items-center justify-center text-sm text-gray-500 dark:text-gray-400">
            Publicidade
          </div>
        </div>
      </>
    );
  } catch {
    return notFound();
  }
}