"use client";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import Link from "@/components/SmartLink"; // usa o seu link customizado;
import { Plus } from "lucide-react";

interface Story {
  slug: string;
  titulo: string;
  thumb: string;
}

export default function WebStories({ stories }: { stories: Story[] }) {
  if (stories.length === 0) return null;

  return (
    <section className="py-4 mb-2">
      <div className="max-w-6xl mx-auto px-4">
      <Swiper
        spaceBetween={12}
        slidesPerView={2.5} // padrão mobile
        breakpoints={{
            640: { slidesPerView: 4 },
            768: { slidesPerView: 6 },
            1024: { slidesPerView: 8 },
        }}
        >
          {stories.slice(0, 7).map((story) => (
            <SwiperSlide key={story.slug}>
              <Link href={`/noticia/${story.slug}`} className="flex flex-col items-center text-center group">
                <div className="w-24 h-24 md:w-28 md:h-28 rounded-full overflow-hidden border-4 border-orange-500 group-hover:scale-105 transition shadow-lg">
                  <img
                    src={story.thumb}
                    alt={story.titulo}
                    className="object-cover w-full h-full"
                  />
                </div>
                <p className="text-xs mt-2 text-orange-800 dark:text-orange-400 font-medium leading-snug line-clamp-2">
                  {story.titulo}
                </p>
              </Link>
            </SwiperSlide>
          ))}

          {/* Botão "Mais stories" */}
          <SwiperSlide>
            <Link
              href="/stories"
              className="flex flex-col items-center justify-center text-center text-orange-600 hover:text-orange-800 transition"
            >
              <div className="w-24 h-24 md:w-28 md:h-28 rounded-full border-4 border-dashed border-orange-500 flex items-center justify-center shadow-md hover:scale-105 transition">
                <Plus className="w-8 h-8" />
              </div>
              <span className="text-xs mt-2 font-medium">Mais stories</span>
            </Link>
          </SwiperSlide>
        </Swiper>
      </div>
    </section>
  );
}
