import Image from "next/image";
import { FaStar } from "react-icons/fa6";

type Props = {
  capa: string;
  tituloPortugues: string;
  tituloOriginal: string;
  nota: number;
  ano: string;
  pais: string;
  classificacao: string;
  duracao: string;
  direcao: string;
  elenco: string[] | string;
};

export default function FichaTecnica({
  capa,
  tituloPortugues,
  tituloOriginal,
  nota,
  ano,
  pais,
  classificacao,
  duracao,
  direcao,
  elenco,
}: Props) {
  return (
    <div className="mt-16 bg-white dark:bg-gray-900 rounded-xl shadow-md p-6 flex flex-col sm:flex-row gap-6">
      <div className="flex-shrink-0">
        <Image
          src={capa}
          alt={tituloPortugues}
          width={200}
          height={300}
          className="rounded-lg object-cover"
          unoptimized
        />
      </div>

      <div>
        <p className="text-sm text-neutral-600 dark:text-gray-400 font-semibold uppercase mb-2">
          Nota do Crítico
        </p>
        <div className="flex items-center gap-1 text-orange-400 mb-4">
          {[...Array(5)].map((_, i) => (
            <FaStar key={i} className={i < nota ? "text-orange-500" : "text-gray-300"} />
          ))}
          <span className="ml-2 text-sm text-neutral-600 dark:text-gray-400">
            {nota === 5 ? "Excelente!" : nota === 4 ? "Muito bom" : "Avaliação"}
          </span>
        </div>

        <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-1">
          {tituloPortugues}
        </h2>
        {tituloOriginal && (
          <h3 className="text-md italic text-gray-500 mb-4">{tituloOriginal}</h3>
        )}

        <ul className="text-sm space-y-1 text-neutral-700 dark:text-gray-300">
          {ano && <li><strong className="font-semibold">Ano:</strong> {ano}</li>}
          {pais && <li><strong className="font-semibold">País:</strong> {pais}</li>}
          {classificacao && (
            <li><strong className="font-semibold">Classificação:</strong> {classificacao}</li>
          )}
          {duracao && <li><strong className="font-semibold">Duração:</strong> {duracao}</li>}
          {direcao && <li><strong className="font-semibold">Direção:</strong> {direcao}</li>}
          {elenco && (
            <li>
              <strong className="font-semibold">Elenco:</strong>{" "}
              {Array.isArray(elenco) ? elenco.join(", ") : elenco}
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
