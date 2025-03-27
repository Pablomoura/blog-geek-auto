"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import SearchModal from "./SearchModal";

export default function Header() {
  const [temaEscuro, setTemaEscuro] = useState(false);
  const [menuAberto, setMenuAberto] = useState(false);
  const [mostrarBusca, setMostrarBusca] = useState(false);

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

  const categorias = ["Games", "Séries e TV", "Mangás e Animes", "Filmes"];

  function slugify(text: string) {
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
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

        {/* Botões */}
        <div className="flex items-center space-x-4">
        <button
          onClick={() => setMostrarBusca(true)}
          className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition"
          title="Buscar"
        >
          🔍
        </button>
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
