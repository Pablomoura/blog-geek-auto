"use client";

import { useState } from "react";
import Link from "next/link";
import SearchModal from "./SearchModal";
import { FaFacebook, FaXTwitter } from "react-icons/fa6";
import { FaSearch } from "react-icons/fa";

export default function Header() {
  const [menuAberto, setMenuAberto] = useState(false);
  const [mostrarBusca, setMostrarBusca] = useState(false);

  const toggleMenu = () => setMenuAberto(!menuAberto);

  const categorias = ["Games", "Séries e TV", "Mangás e Animes", "Filmes"];

  function slugify(text: string) {
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/\s+/g, "-")
      .replace(/[^\w-]/g, "");
  }

  return (
    <header className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-md sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
        {/* LOGO */}
        <Link href="/" className="text-xl font-bold hover:text-orange-500 transition">
          <img src="/logo.png" alt="GeekNews" className="h-10 w-auto" />
        </Link>

        {/* Menu Desktop */}
        <nav className="hidden md:flex space-x-6 font-medium">
          {categorias.map((nome) => (
            <Link key={nome} href={`/categoria/${slugify(nome)}`}>
              {nome}
            </Link>
          ))}
        </nav>

        {/* Ações: Busca + Redes sociais */}
        <div className="flex items-center space-x-3">
          {/* Botão de busca */}
          <button
            onClick={() => setMostrarBusca(true)}
            className="text-2xl hover:text-orange-400 transition"
            title="Buscar"
          >
            <FaSearch className="text-[22px]" />
          </button>

          {/* Divisor */}
          <div className="h-6 w-px bg-gray-400 opacity-50" />

          {/* Ícones redes sociais */}
          <a href="https://www.facebook.com/geeknews.site/" target="_blank" rel="noopener noreferrer" title="Facebook" className="hover:text-orange-400">
            <FaFacebook className="text-lg" />
          </a>
          <a href="https://x.com/SiteGeekNews" target="_blank" rel="noopener noreferrer" title="X" className="hover:text-orange-400">
            <FaXTwitter className="text-lg" />
          </a>

          {/* Menu Mobile */}
          <button
            onClick={toggleMenu}
            className="md:hidden p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition"
            title="Abrir menu"
          >
            ☰
          </button>
        </div>
      </div>

      {/* Dropdown Mobile */}
      {menuAberto && (
        <nav className="md:hidden px-6 pb-4 space-y-3 bg-white dark:bg-gray-900 text-sm font-medium">
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
