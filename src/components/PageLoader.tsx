"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useLoading } from "@/app/loading-context";

export default function PageLoader() {
  const pathname = usePathname();
  const { isLoading, setLoading } = useLoading();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!isLoading) return;

    setProgress(0);

    const interval = setInterval(() => {
      setProgress((old) => (old < 90 ? old + Math.random() * 10 : old));
    }, 100);

    return () => clearInterval(interval);
  }, [isLoading]);

  useEffect(() => {
    // Quando a navegação termina, finaliza
    setProgress(100);
    const timeout = setTimeout(() => setLoading(false), 300);
    return () => clearTimeout(timeout);
  }, [pathname]);

  if (!isLoading) return null;

  return (
    <div className="fixed top-0 left-0 w-full h-1 z-[9999] bg-transparent">
      <div
        className="h-full bg-orange-500 transition-all duration-200 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
