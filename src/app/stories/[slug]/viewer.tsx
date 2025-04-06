// app/stories/[slug]/viewer.tsx
"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface Story {
  slug: string;
  titulo: string;
  thumb: string;
}

export default function FullscreenStory({ stories, slugAtual }: { stories: Story[]; slugAtual: string }) {
  const router = useRouter();
  const [indiceAtual, setIndiceAtual] = useState(0);
  const [progresso, setProgresso] = useState(0);

  useEffect(() => {
    const index = stories.findIndex((s) => s.slug === slugAtual);
    setIndiceAtual(index >= 0 ? index : 0);
  }, [slugAtual, stories]);

  useEffect(() => {
    if (stories.length === 0) return;
    setProgresso(0);
    const intervalo = setInterval(() => {
      setProgresso((p) => {
        if (p >= 100) {
          clearInterval(intervalo);
          irParaProximo();
        }
        return p + 2;
      });
    }, 80);
    return () => clearInterval(intervalo);
  }, [indiceAtual, stories]);

  function irParaProximo() {
    const proximo = indiceAtual + 1;
    if (proximo < stories.length) {
      router.push(`/stories/${stories[proximo].slug}`);
    } else {
      router.push("/");
    }
  }

  function irParaAnterior() {
    const anterior = indiceAtual - 1;
    if (anterior >= 0) {
      router.push(`/stories/${stories[anterior].slug}`);
    }
  }

  const story = stories[indiceAtual];
  if (!story) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center">
      {/* Fechar */}
      <button
        onClick={() => router.push("/")}
        className="absolute top-5 right-5 text-white text-2xl"
        aria-label="Fechar"
      >
        &times;
      </button>

      {/* Progresso */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gray-700">
        <div
          className="h-full bg-orange-500 transition-all duration-100"
          style={{ width: `${progresso}%` }}
        />
      </div>

      {/* Story */}
      <div className="relative w-[320px] h-[568px] sm:w-[360px] sm:h-[640px] rounded-2xl overflow-hidden shadow-xl">
        <Image
          src={story.thumb}
          alt={story.titulo}
          fill
          className="object-cover bg-black"
          priority
        />
        <div className="absolute bottom-0 left-0 w-full bg-black/60 p-4 text-center">
          <h1 className="text-base font-semibold leading-tight line-clamp-3 text-white">
            {story.titulo}
          </h1>
        </div>
      </div>

      {/* Navegação toque/click */}
      <div
        className="absolute top-0 left-0 w-1/4 h-full cursor-pointer z-10"
        onClick={irParaAnterior}
      />
      <div
        className="absolute top-0 right-0 w-1/4 h-full cursor-pointer z-10"
        onClick={irParaProximo}
      />
      <div
        className="absolute top-0 left-1/4 w-1/2 h-full cursor-pointer z-10"
        onClick={() => router.push(`/noticia/${story.slug}`)}
      />
    </div>
  );
}
