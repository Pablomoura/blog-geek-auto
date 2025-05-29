// app/stories/page.tsx
import { getAllStories } from "@/lib/getStories";
import Link from "next/link";
import Image from "next/image";
import Header from "@/components/Header";

export const runtime = 'edge';

export const metadata = {
  title: "Web Stories • GeekNews",
  description: "Explore os stories mais recentes do GeekNews",
};

export default async function StoriesPage() {
  const stories = await getAllStories();

  return (
    <>
      <Header />
      <main className="max-w-5xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-extrabold mb-8 text-neutral-900 dark:text-white">
          Web Stories
        </h1>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
          {stories.map((story) => (
            <Link
              key={story.slug}
              href={`/stories/${story.slug}`}
              className="group block text-center"
            >
              <div className="aspect-[9/16] rounded-xl overflow-hidden border-4 border-orange-500 group-hover:scale-105 transition shadow-lg">
                <Image
                  src={story.thumb}
                  alt={story.titulo}
                  width={300}
                  height={500}
                  className="object-cover w-full h-full"
                />
              </div>
              <p className="mt-2 text-sm text-orange-700 dark:text-orange-400 font-medium leading-snug line-clamp-2">
                {story.titulo}
              </p>
            </Link>
          ))}
        </div>
      </main>
    </>
  );
}
