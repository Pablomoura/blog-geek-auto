import fs from "fs/promises";
import path from "path";
import matter from "gray-matter";
import Link from "@/components/SmartLink";
import Image from "next/image";
import Header from "@/components/Header";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Críticas | GeekNews",
  description: "Análises e críticas de filmes, séries e mais no GeekNews.",
  alternates: {
    canonical: "https://www.geeknews.com.br/criticas",
  },
};

async function carregarCriticas() {
  const contentDir = path.join(process.cwd(), "content");
  const arquivos = await fs.readdir(contentDir);

  const criticas = [];

  for (const nomeArquivo of arquivos) {
    if (!nomeArquivo.endsWith(".md")) continue;
    const slug = nomeArquivo.replace(/\.md$/, "");
    const caminho = path.join(contentDir, nomeArquivo);
    const arquivo = await fs.readFile(caminho, "utf-8");
    const { data } = matter(arquivo);

    if (data.tipo === "critica") {
      criticas.push({
        slug,
        tituloPortugues: data.tituloPortugues || data.title,
        capaObra: data.capaObra || data.thumb || null,
        data: data.data,
        categoria: data.categoria,
      });
    }
  }

  return criticas.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
}

export default async function CriticasPage() {
  const criticas = await carregarCriticas();

  return (
    <>
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-4xl font-bold mb-8 text-neutral-900 dark:text-white">Críticas</h1>

        <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5">
          {criticas.map((critica) => (
            <Link
              key={critica.slug}
              href={`/noticia/${critica.slug}`}
              className="bg-white dark:bg-gray-900 rounded-lg shadow hover:shadow-md transition overflow-hidden"
            >
              {critica.capaObra && (
                <Image
                  src={critica.capaObra}
                  alt={critica.tituloPortugues}
                  width={160}
                  height={280}
                  className="w-full h-[320px] object-cover rounded-t"
                  unoptimized
                />
              )}
              <div className="p-4">
                <p className="text-xs text-orange-500 font-bold uppercase mb-1">
                  {critica.categoria}
                </p>
                <h2 className="text-sm font-semibold text-neutral-900 dark:text-white leading-snug">
                  {critica.tituloPortugues}
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {new Date(critica.data).toLocaleDateString("pt-BR")}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
