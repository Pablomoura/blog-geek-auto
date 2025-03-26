"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function Header() {
  const [temaEscuro, setTemaEscuro] = useState(false);

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

    if (novoTema) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("tema", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("tema", "light");
    }
  };

  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 py-4 px-6 shadow-md">
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        {/* Logo com link pra home */}
        <Link href="/" className="flex items-center gap-2">
          <img src="/logo.png" alt="GeekNews Logo" className="h-10 w-auto" />
          <span className="text-xl font-bold text-neutral-900 dark:text-white">GeekNews</span>
        </Link>

        {/* Navegação */}
        <nav className="hidden sm:flex space-x-6 text-sm font-medium">
          <Link href="#" className="text-neutral-700 dark:text-gray-300 hover:text-orange-500 dark:hover:text-orange-400">Games</Link>
          <Link href="#" className="text-neutral-700 dark:text-gray-300 hover:text-orange-500 dark:hover:text-orange-400">Séries e TV</Link>
          <Link href="#" className="text-neutral-700 dark:text-gray-300 hover:text-orange-500 dark:hover:text-orange-400">Mangás e Animes</Link>
          <Link href="#" className="text-neutral-700 dark:text-gray-300 hover:text-orange-500 dark:hover:text-orange-400">Filmes</Link>
        </nav>

        {/* Botão de tema */}
        <button
          onClick={alternarTema}
          className="p-2 rounded-full text-lg text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
          aria-label="Alternar tema"
        >
          {temaEscuro ? "🌞" : "🌙"}
        </button>
      </div>
    </header>
  );
}
