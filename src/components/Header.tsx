"use client";

import { useState } from "react";
import Link from "@/components/SmartLink";
import SearchModal from "./SearchModal";
import { FaFacebook, FaXTwitter } from "react-icons/fa6";
import { FaSearch } from "react-icons/fa";
import ThreadsIcon from "@/components/ThreadsIcon";

export default function Header() {
  const [menuAberto, setMenuAberto] = useState(false);
  const [mostrarBusca, setMostrarBusca] = useState(false);
  const [submenuAberto, setSubmenuAberto] = useState(false);

  const categorias = [
    "Games",
    "Séries e TV",
    "Mangás e Animes",
    "Filmes",
    "Board Games",
    "Streaming",
    "HQ/Livros",
    "Musica",
  ];

  function slugify(text: string) {
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/\s+/g, "-")
      .replace(/[^\w-]/g, "");
  }

  return (
    <header className="bg-orange-50 border-b border-orange-100 shadow-sm sticky top-0 z-50 text-gray-900 dark:bg-gray-900 dark:text-white">
      <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
        {/* LOGO */}
        <Link href="/" className="text-xl font-bold hover:text-orange-500 transition">
          <img src="/logo.png" alt="GeekNews" className="h-10 w-auto" />
        </Link>

        {/* Menu Desktop */}
        <nav className="hidden md:flex space-x-6 font-medium items-center">
          {categorias.slice(0, 4).map((nome) => (
            <Link key={nome} href={`/categoria/${slugify(nome)}`} className="hover:text-orange-500 transition">
              {nome}
            </Link>
          ))}

          {/* Submenu */}
          <div
            className="relative"
            onMouseEnter={() => setSubmenuAberto(true)}
            onMouseLeave={() => setSubmenuAberto(false)}
          >
            <button
              className="flex items-center hover:text-orange-500 transition"
              aria-haspopup="true"
              aria-expanded={submenuAberto}
            >
              Mais
              <span className="ml-1 text-xs">▼</span>
            </button>

            <div
              className={`absolute left-0 top-full bg-white dark:bg-gray-800 shadow-md rounded-md z-50 transition-opacity duration-200 ease-out min-w-[150px] ${
                submenuAberto
                  ? "opacity-100 pointer-events-auto"
                  : "opacity-0 pointer-events-none"
              }`}
              role="menu"
            >
              {categorias.slice(4).map((nome) => (
                <Link
                  key={nome}
                  href={`/categoria/${slugify(nome)}`}
                  className="block px-4 py-2 hover:bg-orange-100 dark:hover:bg-gray-700 whitespace-nowrap"
                  role="menuitem"
                >
                  {nome}
                </Link>
              ))}
            </div>
          </div>
        </nav>

        {/* Ações: Busca + Redes sociais */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setMostrarBusca(true)}
            className="text-2xl hover:text-orange-400 transition"
            title="Buscar"
          >
            <FaSearch className="text-[22px]" />
          </button>

          <div className="h-6 w-px bg-gray-400 opacity-50" />

          <a
            href="https://www.facebook.com/geeknews.site/"
            target="_blank"
            rel="noopener noreferrer"
            title="Facebook"
            className="hover:text-orange-400"
          >
            <FaFacebook className="text-lg" />
          </a>
          <a
            href="https://x.com/SiteGeekNews"
            target="_blank"
            rel="noopener noreferrer"
            title="X"
            className="hover:text-orange-400"
          >
            <FaXTwitter className="text-lg" />
          </a>
          <ThreadsIcon />

          <button
            onClick={() => setMenuAberto(!menuAberto)}
            className="md:hidden p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition"
            title="Abrir menu"
          >
            ☰
          </button>
        </div>
      </div>

      {/* Dropdown Mobile */}
      {menuAberto && (
        <nav className="md:hidden px-6 pb-4 space-y-3 bg-orange-50 dark:bg-gray-900 text-sm font-medium">
          {categorias.map((nome) => (
            <Link key={nome} href={`/categoria/${slugify(nome)}`} className="block hover:text-orange-400">
              {nome}
            </Link>
          ))}
        </nav>
      )}

      {mostrarBusca && <SearchModal onClose={() => setMostrarBusca(false)} />}
    </header>
  );
}
