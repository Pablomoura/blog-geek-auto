// app/loading.tsx (Home)
'use client';

import Header from "@/components/Header";

export default function LoadingHome() {
  return (
    <>
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-pulse space-y-10">
        {/* Banner principal */}
        <div className="w-full h-64 bg-gray-300 rounded-lg" />

        {/* Seções Especiais */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-40 bg-gray-200 rounded-lg" />
          <div className="h-40 bg-gray-200 rounded-lg" />
          <div className="h-40 bg-gray-200 rounded-lg" />
        </div>

        <div className="flex flex-col lg:flex-row gap-10">
          <main className="flex-1 space-y-6">
            {/* Últimas Notícias */}
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-5 w-1/3 bg-gray-300 rounded" />
                <div className="h-4 w-full bg-gray-100 rounded" />
                <div className="h-4 w-5/6 bg-gray-100 rounded" />
              </div>
            ))}

            {/* Carrossel Especiais */}
            <div className="space-y-4">
              <div className="h-6 w-1/2 bg-gray-300 rounded" />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-40 bg-gray-200 rounded-lg" />
                ))}
              </div>
            </div>
          </main>

          {/* Sidebar */}
          <aside className="w-full lg:w-80 space-y-6">
            <div className="h-8 w-1/2 bg-gray-300 rounded" />
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded-lg" />
            ))}
            <div className="h-6 w-2/3 bg-gray-300 rounded" />
          </aside>
        </div>
      </div>
    </>
  );
}