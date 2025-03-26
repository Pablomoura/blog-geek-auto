"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function Header() {
  const [temaEscuro, setTemaEscuro] = useState(false);
  const [menuAberto, setMenuAberto] = useState(false);

  useEffect(() => {
    const temaSalvo = localStorage.getItem("tema");
    if (temaSalvo === "dark") {
      document.documentElement.classList.add("dark");
      setTemaEscuro(true);
    } else {
      document.documentElement.classList.remove("dark");
      setTemaEscuro(false);
    }
  }, []);

  const alternarTema = () => {
    const novoTema = !temaEscuro;
    setTemaEscuro(novoTema);
    document.documentElement.classList.toggle("dark", novoTema);
    localStorage.setItem("tema", novoTema ? "dark" : "light");
  };

  const toggleMenu = () => setMenuAberto(!menuAberto);

  return (
    <header className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-md sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
        {/* LOGO */}
        <Link href="/" className="text-xl font-bold hover:text-orange-500 transition">
        <img src="/logo.png" alt="GeekNews" className="h-10 w-auto" />
        </Link>

        {/* Menu Desktop */}
        <nav className="hidden md:flex space-x-6 font-medium">
          <Link href="#" className="hover:text-orange-400">Games</Link>
          <Link href="#" className="hover:text-orange-400">Séries e TV</Link>
          <Link href="#" className="hover:text-orange-400">Mangás e Animes</Link>
          <Link href="#" className="hover:text-orange-400">Filmes</Link>
        </nav>

        {/* Botões */}
        <div className="flex items-center space-x-4">
          <button
            onClick={alternarTema}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition"
            title="Alternar tema"
          >
            {temaEscuro ? "🌞" : "🌙"}
          </button>

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
          <Link href="#" className="block hover:text-orange-400">Games</Link>
          <Link href="#" className="block hover:text-orange-400">Séries e TV</Link>
          <Link href="#" className="block hover:text-orange-400">Mangás e Animes</Link>
          <Link href="#" className="block hover:text-orange-400">Filmes</Link>
        </nav>
      )}
    </header>
  );
}
