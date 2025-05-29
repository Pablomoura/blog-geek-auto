import { produtosPorCategoria } from "@utils/produtosAmazon";
import { ProdutoAmazon } from "@/utils/produtosAmazon";

export const runtime = 'edge';

function embaralhar<T>(arr: T[]): T[] {
    return arr.sort(() => Math.random() - 0.5);
  }
  
  export default function ProdutosAmazon({ categoria }: { categoria: string }) {
    const listaOriginal = produtosPorCategoria[categoria.toLowerCase()] || [];
    const produtos: ProdutoAmazon[] = embaralhar(listaOriginal).slice(0, 4); // ← aqui limita e embaralha
  
    if (produtos.length === 0) return null;

  return (
    <div className="mt-12">
        <div className="flex items-center justify-between mb-4 border-b pb-2">
        <h2 className="text-sm uppercase tracking-widest font-semibold text-gray-600 dark:text-gray-300">Produtos recomendados</h2>
     </div>
      <ul className="space-y-4">
        {produtos.map((p: ProdutoAmazon, i: number) => (
          <li key={i} className="bg-white dark:bg-gray-900 p-4 rounded shadow flex gap-4">
          <img
            src={p.imagem}
            alt={p.titulo}
            className="w-20 h-20 object-contain flex-shrink-0 rounded"
          />
          <div className="flex flex-col justify-center">
            <p className="font-semibold">{p.titulo}</p>
            <a
              href={`https://www.amazon.com.br/dp/${p.asin}?tag=geeknews06-20`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-orange-500 hover:underline text-sm"
            >
              Ver na Amazon
            </a>
          </div>
        </li>
        
        ))}
      </ul>
    </div>
  );
}
