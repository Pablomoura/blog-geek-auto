// src/components/UltimoPost404.tsx
import Link from "next/link";
import Image from "next/image";
import { loadPostCache } from "@/utils/loadPostCache";

export default async function UltimoPost404() {
  const posts = await loadPostCache();

  // Filtra posts com data válida e ordena pela data mais recente
  const ordenados = posts
    .filter((p) => p.data && !isNaN(new Date(p.data).getTime()))
    .sort((a, b) => new Date(b.data!).getTime() - new Date(a.data!).getTime());

  const ultimo = ordenados[0];
  if (!ultimo) return null;

  return (

    <Link
      href={`/noticia/${ultimo.slug}`}
      className="group bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden shadow hover:shadow-lg transition max-w-xs"
    >
      <Image
        src={ultimo.thumb || "/images/default.jpg"}
        alt={ultimo.titulo}
        width={400}
        height={160}
        className="w-full h-40 object-cover group-hover:scale-105 transition-transform"
        unoptimized
      />
      <div className="p-4">
        <p className="text-xs uppercase text-orange-500 font-bold mb-1">Último post</p>
        <h3 className="text-sm font-semibold group-hover:underline">{ultimo.titulo}</h3>
      </div>
    </Link>
  );
}
