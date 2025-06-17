// app/noticia/[slug]/loading.tsx (Página de Notícia)
'use client';

import Header from "@/components/Header";

export default function LoadingNoticia() {
  return (
    <>
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-pulse">
        <div className="flex flex-col lg:flex-row gap-10">
          <main className="flex-1 space-y-6">
            <div className="h-6 w-1/3 bg-gray-300 rounded" />
            <div className="h-10 w-2/3 bg-gray-300 rounded" />
            <div className="h-4 w-3/4 bg-gray-400 rounded" />
            <div className="h-72 bg-gray-200 rounded-lg" />
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded" />
              <div className="h-4 w-5/6 bg-gray-200 rounded" />
              <div className="h-4 w-2/3 bg-gray-200 rounded" />
              <div className="h-4 w-3/4 bg-gray-200 rounded" />
            </div>
          </main>

          <aside className="w-full lg:w-80 space-y-6">
            <div className="h-8 w-1/2 bg-gray-300 rounded" />
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded-lg" />
            ))}
            <div className="h-6 w-2/3 bg-gray-300 rounded" />
          </aside>
        </div>
      </div>
    </>
  );
}