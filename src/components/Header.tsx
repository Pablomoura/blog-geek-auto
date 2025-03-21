"use client"; // Precisamos do useState e useEffect no lado do cliente

import { useEffect, useState } from "react";

export default function Header() {
  const [temaEscuro, setTemaEscuro] = useState(false);

  useEffect(() => {
    // Verifica se o tema já está salvo no localStorage
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
    <header className="bg-gray-900 text-white py-4 flex justify-between items-center px-6">
      <h1 className="text-xl font-bold">🚀 GeekNews</h1>
      <nav className="space-x-6">
        <a href="#" className="hover:text-orange-400">Games</a>
        <a href="#" className="hover:text-orange-400">Séries e TV</a>
        <a href="#" className="hover:text-orange-400">Mangás e Animes</a>
        <a href="#" className="hover:text-orange-400">Filmes</a>
      </nav>
      {/* Botão Tema Claro/Escuro */}
      <button
        onClick={alternarTema}
        className="bg-gray-800 p-2 rounded-full hover:bg-gray-700 transition"
      >
        {temaEscuro ? "🌞" : "🌙"}
      </button>
    </header>
  );
}