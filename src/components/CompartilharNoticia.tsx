"use client";

import {
  FaWhatsapp,
  FaFacebook,
  FaXTwitter,
  FaLink,
  FaShare,
  FaTelegram,
  FaLinkedin,
} from "react-icons/fa6";
import { usePathname } from "next/navigation";
import { useState } from "react";
import Image from "next/image";
import "@/styles/animations.css";

export default function CompartilharNoticia({ titulo }: { titulo: string }) {
  const pathname = usePathname();
  const url = `https://www.geeknews.com.br${pathname}`;
  const [aberto, setAberto] = useState(false);

  const copiarLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      alert("Link copiado para a área de transferência!");
    } catch {
      alert("Erro ao copiar link");
    }
  };

  return (
    <div className="relative">
      {/* Desktop */}
      <div className="hidden lg:flex items-center gap-4 mt-2 mb-6">
        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
          Compartilhar:
        </span>
        <div className="flex items-center gap-4 text-lg">
          <a
            href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
              titulo + " " + url
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            title="WhatsApp"
            className="hover:text-green-500 transition"
          >
            <FaWhatsapp />
          </a>
          <a
            href={`https://t.me/share/url?url=${encodeURIComponent(
              url
            )}&text=${encodeURIComponent(titulo)}`}
            target="_blank"
            rel="noopener noreferrer"
            title="Telegram"
            className="hover:text-sky-500 transition"
          >
            <FaTelegram />
          </a>
          <a
            href={`https://x.com/intent/tweet?text=${encodeURIComponent(
              titulo
            )}&url=${encodeURIComponent(url)}`}
            target="_blank"
            rel="noopener noreferrer"
            title="X"
            className="hover:text-blue-500 transition"
          >
            <FaXTwitter />
          </a>
          <a
            href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
              url
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            title="Facebook"
            className="hover:text-blue-600 transition"
          >
            <FaFacebook />
          </a>
          <a
            href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
              url
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            title="LinkedIn"
            className="hover:text-blue-700 transition"
          >
            <FaLinkedin />
          </a>
          <a
            href={`https://www.threads.net/intent/post?text=${encodeURIComponent(
              titulo
            )}%20${encodeURIComponent(url)}`}
            target="_blank"
            rel="noopener noreferrer"
            title="Threads"
            className="hover:text-black dark:hover:text-white transition"
          >
            <Image
              src="/images/threads.svg"
              alt="Threads"
              width={20}
              height={20}
              className="dark:invert"
            />
          </a>
          <button
            onClick={copiarLink}
            title="Copiar link"
            className="hover:text-orange-400 transition"
          >
            <FaLink />
          </button>
        </div>
      </div>

      {/* Mobile */}
      <div className="fixed bottom-5 right-5 z-50 lg:hidden">
        <button
          onClick={() => setAberto(!aberto)}
          className="bg-orange-500 hover:bg-orange-600 text-white p-3 rounded-full shadow-lg transition"
          title="Compartilhar"
        >
          <FaShare />
        </button>

        {aberto && (
          <div className="absolute bottom-16 right-0 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg p-3 flex flex-col gap-3 text-lg animate-slide-up">
            <a
              href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                titulo + " " + url
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-green-500 flex items-center gap-2"
            >
              <FaWhatsapp /> WhatsApp
            </a>
            <a
              href={`https://t.me/share/url?url=${encodeURIComponent(
                url
              )}&text=${encodeURIComponent(titulo)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-sky-500 flex items-center gap-2"
            >
              <FaTelegram /> Telegram
            </a>
            <a
              href={`https://x.com/intent/tweet?text=${encodeURIComponent(
                titulo
              )}&url=${encodeURIComponent(url)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-blue-500 flex items-center gap-2"
            >
              <FaXTwitter /> X
            </a>
            <a
              href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
                url
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-blue-600 flex items-center gap-2"
            >
              <FaFacebook /> Facebook
            </a>
            <a
              href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
                url
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-blue-700 flex items-center gap-2"
            >
              <FaLinkedin /> LinkedIn
            </a>
            <a
              href={`https://www.threads.net/intent/post?text=${encodeURIComponent(
                titulo
              )}%20${encodeURIComponent(url)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-black dark:hover:text-white flex items-center gap-2"
            >
              <Image
                src="/images/threads.svg"
                alt="Threads"
                width={20}
                height={20}
                className="dark:invert"
              />
              Threads
            </a>
            <button
              onClick={copiarLink}
              className="hover:text-orange-500 flex items-center gap-2"
            >
              <FaLink /> Copiar Link
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
