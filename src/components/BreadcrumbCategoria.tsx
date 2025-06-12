"use client";

import Link from "@/components/SmartLink";
import { FaChevronRight, FaHome } from "react-icons/fa";

type Props = {
  categoria: string;
  categoriaSlug: string;
};

export default function BreadcrumbCategoria({ categoria, categoriaSlug }: Props) {
  return (
    <nav
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 text-sm text-gray-600 dark:text-gray-400 mb-5"
      aria-label="Breadcrumb"
    >
      <div className="flex items-center flex-wrap space-x-2 text-[13px] leading-tight">
        <Link
          href="/"
          className="flex items-center space-x-1 hover:text-orange-500 transition"
        >
          <FaHome className="w-4 h-4" />
          <span>Home</span>
        </Link>

        <FaChevronRight className="w-3 h-3 opacity-50" />

        <Link
          href={`/categoria/${categoriaSlug}`}
          className="uppercase font-bold hover:text-orange-500 transition"
        >
          {categoria}
        </Link>
      </div>
    </nav>
  );
}
