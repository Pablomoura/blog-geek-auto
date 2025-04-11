"use client";

import { useEffect, useState } from "react";
import Header from "@/components/Header";
import Link from "@/components/SmartLink";

// Interface da tag
interface TagData {
  tag: string;
  slug: string;
  count: number;
}

export default function TagsPage() {
  const [tags, setTags] = useState<TagData[]>([]);
  const [filtro, setFiltro] = useState("");

  useEffect(() => {
    async function carregarTags() {
      const res = await fetch("/api/tags");
      const data = await res.json();
      setTags(data);
    }
    carregarTags();
  }, []);

  const tagsFiltradas = tags.filter((t) =>
    t.tag.toLowerCase().includes(filtro.toLowerCase())
  );

  return (
    <>
      <Header />
      <main className="max-w-5xl mx-auto px-6 py-10">
        <h1 className="text-4xl font-bold mb-4">🏷️ Todas as Tags</h1>
        <input
          type="text"
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          placeholder="Filtrar tags..."
          className="w-full mb-6 px-4 py-2 rounded border dark:border-gray-700 dark:bg-gray-900 bg-white text-black dark:text-white"
        />
        {tagsFiltradas.length > 0 ? (
          <div className="flex flex-wrap gap-3">
            {tagsFiltradas.map((tag) => (
              <Link
                key={tag.slug}
                href={`/tag/${tag.slug}`}
                className="bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 px-4 py-2 rounded-full text-sm hover:bg-orange-200 dark:hover:bg-orange-800 transition"
              >
                {tag.tag} ({tag.count})
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-gray-600 dark:text-gray-300">Nenhuma tag encontrada.</p>
        )}
      </main>
    </>
  );
}
