// components/AutorCard.tsx
import Image from "next/image";

export default function AutorCard({ nome, bio, imagem }: { nome: string, bio: string, imagem: string }) {
  return (
    <div className="mt-16 flex items-center gap-6 p-4 border-t border-gray-700 pt-6">
      <Image
        src={imagem}
        alt={`Foto de ${nome}`}
        width={80}
        height={80}
        className="rounded-full object-cover"
      />
      <div>
        <p className="text-sm text-gray-500 dark:text-gray-400 uppercase">Sobre o autor</p>
        <h3 className="font-bold text-lg text-black dark:text-white">{nome}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{bio}</p>
      </div>
    </div>
  );
}
