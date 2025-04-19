import fs from "fs/promises";
import path from "path";
import matter from "gray-matter";
import Link from "@/components/SmartLink";
import Image from "next/image";
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
        titulo: data.title,
        resumo: data.resumo,
        thumb: data.thumb,
        capaObra: data.capaObra || null,
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-4xl font-bold mb-8 text-neutral-900 dark:text-white">Críticas</h1>

      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {criticas.map((critica) => (
          <Link
            key={critica.slug}
            href={`/noticia/${critica.slug}`}
            className="bg-white dark:bg-gray-900 rounded-lg shadow hover:shadow-md transition overflow-hidden"
          >
            {critica.thumb && (
              <Image
                src={critica.thumb}
                alt={critica.titulo}
                width={400}
                height={225}
                className="w-full h-auto object-cover"
              />
            )}
            <div className="p-4">
              <p className="text-xs text-orange-500 font-bold uppercase mb-1">
                {critica.categoria}
              </p>
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-white leading-snug">
                {critica.titulo}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {new Date(critica.data).toLocaleDateString("pt-BR")}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
