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
    <header className="bg-white dark:bg-gray-900 text-gray-800 dark:text-white shadow-md sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
        {/* Logo */}
        <Link href="/" className="text-2xl font-bold hover:text-orange-500 transition">
          GeekNews
        </Link>

        {/* Navegação */}
        <nav className="hidden md:flex space-x-6 text-sm font-medium">
          <Link href="#" className="hover:text-orange-500 transition">Games</Link>
          <Link href="#" className="hover:text-orange-500 transition">Séries e TV</Link>
          <Link href="#" className="hover:text-orange-500 transition">Mangás e Animes</Link>
          <Link href="#" className="hover:text-orange-500 transition">Filmes</Link>
        </nav>

        {/* Botão de Tema */}
        <button
          onClick={alternarTema}
          className="bg-gray-200 dark:bg-gray-700 text-xl p-2 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600 transition"
          aria-label="Alternar tema"
        >
          {temaEscuro ? "🌞" : "🌙"}
        </button>
      </div>
    </header>
  );
}
