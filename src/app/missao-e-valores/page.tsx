// src/app/missao-e-valores/page.tsx
import Header from "@/components/Header";

export default function MissaoValoresPage() {
  return (
    <>
      <Header />
      <main className="max-w-3xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-bold mb-6">Missão e Valores do GeekNews</h1>

        <p className="mb-6 text-sm text-gray-600 dark:text-gray-400">
          No GeekNews, acreditamos que o universo geek é muito mais do que entretenimento — é uma forma de expressão, identidade e comunidade. Por isso, nossa missão é oferecer conteúdo informativo, original e relevante que respeite o tempo e a inteligência dos nossos leitores.
        </p>

        <h2 className="text-xl font-semibold mb-2">🎯 Nossa Missão</h2>
        <p className="mb-6 text-sm text-gray-600 dark:text-gray-400">
          Levar aos fãs da cultura geek as principais novidades sobre <strong>animes, filmes, séries, games, quadrinhos e tecnologia</strong>, com profundidade, responsabilidade editorial e linguagem acessível.
        </p>

        <h2 className="text-xl font-semibold mb-4">🧭 Nossos Valores</h2>

        <ul className="list-disc pl-5 space-y-4 text-sm text-gray-600 dark:text-gray-400">
          <li><strong>Transparência:</strong> deixamos claro quando um conteúdo possui links afiliados e mantemos nossa independência editorial acima de interesses comerciais.</li>
          <li><strong>Credibilidade:</strong> todos os conteúdos são baseados em fontes confiáveis, com revisão e autoria identificada. Valorizamos a apuração e evitamos clickbait.</li>
          <li><strong>Diversidade:</strong> a cultura geek é plural. Nosso time busca representar diferentes vozes e olhares sobre o universo nerd, destacando obras e criadores de variados contextos.</li>
          <li><strong>Acessibilidade:</strong> priorizamos uma linguagem clara e uma estrutura de site que seja fácil de navegar, tanto no desktop quanto no celular.</li>
          <li><strong>Inovação:</strong> usamos tecnologia (incluindo IA) para agilizar processos, mas mantemos <em>a curadoria humana</em> como centro do nosso trabalho editorial.</li>
        </ul>

        <h2 className="text-xl font-semibold mt-10 mb-2">🤝 Compromisso com o Leitor</h2>
        <p className="mb-10 text-sm text-gray-600 dark:text-gray-400">
          Cada conteúdo publicado no GeekNews é feito para <strong>informar, inspirar e empoderar o fã</strong>. Nosso compromisso é com a verdade, a relevância e o respeito ao leitor.
        </p>

        <p className="text-sm text-gray-600 dark:text-gray-400">
          📩 Em caso de dúvidas ou sugestões, entre em contato conosco pela página <a href="/contato" className="text-orange-600 hover:underline">Contato</a>.
        </p>
      </main>
    </>
  );
}
