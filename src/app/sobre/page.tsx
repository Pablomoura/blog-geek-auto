import Header from "@/components/Header";

export const runtime = 'edge';

export default function SobrePage() {
  return (
    <>
      <Header />
      <main className="max-w-3xl mx-auto px-6 py-12 text-neutral-900 dark:text-white">
        <h1 className="text-4xl sm:text-5xl font-bold mb-8">Sobre o GeekNews</h1>

        <p className="mb-5 text-lg leading-relaxed">
          Toda grande jornada começa com uma pergunta: <br />
          <span className="italic font-semibold">
            “E se existisse um lugar onde todo o universo geek estivesse reunido em um só portal?”
          </span>
        </p>

        <p className="mb-6 text-lg">
          Foi assim que nasceu o <strong>GeekNews</strong> — mais do que um site de notícias, uma
          central interdimensional de informações sobre <strong>filmes, séries, animes, quadrinhos, games</strong> e
          tudo que pulsa no coração da cultura pop.
        </p>

        <h2 className="text-2xl font-bold mt-10 mb-4">Uma bússola para quem vive no hype</h2>
        <p className="mb-6">
          Entre timelines caóticas, spoilers e fake news, o GeekNews é o seu <strong>ponto de equilíbrio</strong>. Aqui, cada notícia é
          escolhida, refinada e apresentada como um artefato valioso. Nosso compromisso é com a{" "}
          <strong>clareza, autenticidade e curadoria geek de verdade</strong>.
        </p>
        <p className="mb-6">
          Você não precisa mais abrir dezenas de abas, fuçar redes sociais ou perder horas procurando o que há de novo.
          <br />
          <strong>Se está em alta no multiverso nerd, está no GeekNews.</strong>
        </p>

        <h2 className="text-2xl font-bold mt-10 mb-4">O que você encontra por aqui:</h2>
        <ul className="list-disc pl-6 space-y-2 mb-6">
          <li>📰 Notícias atualizadas sobre lançamentos e bastidores</li>
          <li>🧠 Listas, curiosidades e guias de referência</li>
          <li>🎮 Tudo sobre games, consoles e o mundo digital</li>
          <li>📺 Estreias comentadas, trailers, calendários e cronologias</li>
          <li>📚 Conteúdos para iniciantes e veteranos do universo geek</li>
          <li>🧵 Conexões que vão de Westeros a Tatooine, de Gotham ao U.A.</li>
        </ul>

        <h2 className="text-2xl font-bold mt-10 mb-4">Nossa essência</h2>
        <p className="mb-6">
          O GeekNews é feito para quem vibra com uma nova temporada, se emociona com um arco bem escrito,{" "}
          <em>discute teorias como se fosse uma missão da S.H.I.E.L.D.</em>, e sabe que cada pixel tem uma história.
        </p>
        <p className="mb-6">
          Aqui, <strong>o hype é levado a sério</strong> — e o conteúdo também.
        </p>

        <h2 className="text-2xl font-bold mt-10 mb-4">O conselho editorial</h2>
        <p className="mb-6">
          Por trás de cada publicação, existe uma guilda de nerds, cinéfilos, gamers e otakus comprometidos com uma
          missão sagrada: <strong>manter o público informado e encantado</strong>.
        </p>
        <p className="mb-6">Sem enrolação. Sem exageros. Apenas o essencial, com estilo.</p>

        <p className="mt-12 italic text-sm text-gray-500 dark:text-gray-400">
          GeekNews: onde grandes histórias ganham voz. E você, um lugar para chamá-las de lar.
        </p>
      </main>
    </>
  );
}
