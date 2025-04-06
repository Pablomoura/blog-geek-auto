// app/stories/[slug]/page.tsx
import { getAllStories } from "@/lib/getStories";
import FullscreenStory from "./viewer";

export default async function StoryPage({ params }: { params: { slug: string } }) {
  const stories = await getAllStories();
  return <FullscreenStory stories={stories} slugAtual={params.slug} />;
}
