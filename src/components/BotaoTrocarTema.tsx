"use client";

import { useEffect, useState } from "react";
import { FaSun, FaMoon } from "react-icons/fa6";

export default function BotaoTrocarTema() {
  const [tema, setTema] = useState<"light" | "dark">("light");

  useEffect(() => {
    const temaSalvo = localStorage.getItem("theme") as "light" | "dark" | null;
    const sistemaPrefereEscuro = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const temaInicial = temaSalvo || (sistemaPrefereEscuro ? "dark" : "light");

    setTema(temaInicial);
    document.documentElement.classList.toggle("dark", temaInicial === "dark");
  }, []);

  const alternarTema = () => {
    const novoTema = tema === "light" ? "dark" : "light";
    setTema(novoTema);
    localStorage.setItem("theme", novoTema);
    document.documentElement.classList.toggle("dark", novoTema === "dark");
  };

  return (
    <button
      onClick={alternarTema}
      className="fixed bottom-6 right-6 z-50 bg-orange-500 hover:bg-orange-600 text-white p-3 rounded-full shadow-lg"
      title="Trocar tema"
    >
      {tema === "dark" ? <FaSun /> : <FaMoon />}
    </button>
  );
}
