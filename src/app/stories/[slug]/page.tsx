// app/stories/[slug]/page.tsx
import { getAllStories } from "@/lib/getStories";
import FullscreenStory from "./viewer";

export default async function StoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const stories = await getAllStories();
  return <FullscreenStory stories={stories} slugAtual={slug} />;
}
