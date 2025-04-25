// src/app/not-found.tsx
import Link from 'next/link';
import { FaArrowLeft } from 'react-icons/fa';
import Header from '@/components/Header';
import UltimoPost404 from '@/components/UltimoPost404';
import Image from 'next/image';

export default function NotFoundPage() {
  return (
    <>
      <Header />
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-6 py-6 bg-white text-black dark:bg-black dark:text-white transition-colors">
        <pre className="text-orange-500 text-xs sm:text-lg mb-6 leading-snug">
          {String.raw`
     _____ ___  _   _ ____  _____   ____   ___  _   _ _____ 
    |  ___/ _ \| \ | |  _ \| ____| |___ \ / _ \| \ | | ____|
    | |_ | | | |  \| | | | |  _|     __) | | | |  \| |  _|  
    |  _|| |_| | |\  | |_| | |___   / __/| |_| | |\  | |___ 
    |_|   \___/|_| \_|____/|_____| |_____|\___/|_| \_|_____|
          `}
        </pre>

        <h1 className="text-3xl sm:text-4xl font-bold mb-4">Você invocou uma rota que não existe! (404)</h1>
        <p className="text-gray-400 max-w-lg mb-8">
          Parece que essa página foi para outra dimensão... ou talvez nunca existiu.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition shadow"
          >
            <FaArrowLeft /> Voltar para a Home
          </Link>

          <UltimoPost404 />
        </div>
      </div>
    </>
  );
}
