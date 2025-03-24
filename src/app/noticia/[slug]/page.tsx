import fs from "fs/promises";
import path from "path";
import matter from "gray-matter";
import { notFound } from "next/navigation";
import Header from "@/components/Header";

// Geração dos slugs de forma estática
export async function generateStaticParams() {
  const dir = path.join(process.cwd(), "content");
  const files = await fs.readdir(dir);

  return files.map((filename) => ({
    slug: filename.replace(/\.md$/, ""),
  }));
}

// Corrigindo tipagem para evitar erro na build
type NoticiaPageProps = {
  params: {
    slug: string;
  };
};

export default async function NoticiaPage({ params }: NoticiaPageProps) {
  const filePath = path.join(process.cwd(), "content", `${params.slug}.md`);

  try {
    const file = await fs.readFile(filePath, "utf-8");
    const { data, content } = matter(file);

    const tempoLeitura = Math.ceil(content.split(" ").length / 200);

    return (
      <>
        <Header />
        <main className="max-w-3xl mx-auto px-4 py-10 text-white">
          <span className="text-orange-500 uppercase text-sm font-bold tracking-wide">
            {data.categoria}
          </span>

          <h1 className="text-5xl font-extrabold mt-2 mb-6">{data.title}</h1>

          <p className="text-gray-400 text-sm mb-6">
            Publicado em {new Date().toLocaleDateString("pt-BR")} • {tempoLeitura} min de leitura
          </p>

          {data.tipoMidia === "imagem" && data.midia && (
            <img src={data.midia} alt={data.title} className="w-full rounded-lg shadow-lg mb-6" />
          )}

          {data.tipoMidia === "video" && data.midia && (
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

          <div className="space-y-6 text-lg leading-relaxed text-gray-300">
            {content
              .split("\n")
              .filter((p) => p.trim() !== "")
              .map((p, i) => (
                <p key={i}>{p}</p>
              ))}
          </div>
        </main>
      </>
    );
  } catch {
    return notFound();
  }
}