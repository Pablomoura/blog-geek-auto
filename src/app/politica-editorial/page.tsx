import React from "react";
import Header from "@/components/Header";

export const metadata = {
  title: "Política Editorial - GeekNews",
  description:
    "Conheça os princípios editoriais que guiam a produção de conteúdo no GeekNews, o seu portal de cultura geek.",
  alternates: {
    canonical: "https://www.geeknews.com.br/politica-editorial",
  },
};

export default function PoliticaEditorialPage() {
  return (
    <>
      <Header />
      <main className="max-w-4xl mx-auto px-6 py-12 text-neutral-900 dark:text-white">
        <h1 className="text-4xl font-extrabold mb-6">Política Editorial</h1>

        <p className="mb-6">
          No <strong>GeekNews</strong>, nosso compromisso é com a informação de qualidade, o respeito ao leitor e a paixão pelo universo geek. Nossa linha editorial é guiada por valores de precisão, transparência e independência.
        </p>

        <h2 className="text-2xl font-bold mt-10 mb-4">Objetivo</h2>
        <p className="mb-6">
          Nosso propósito é informar, entreter e conectar fãs de filmes, séries, animes, games, quadrinhos e tudo que envolve a cultura pop. Buscamos sempre oferecer conteúdo relevante, atual e com responsabilidade.
        </p>

        <h2 className="text-2xl font-bold mt-10 mb-4">Critérios de Seleção de Conteúdo</h2>
        <ul className="list-disc pl-6 mb-6 space-y-2">
          <li>Relevância para o público geek</li>
          <li>Tendências, estreias e lançamentos</li>
          <li>Interesse cultural, artístico ou histórico</li>
          <li>Potencial de engajamento e utilidade</li>
        </ul>

        <h2 className="text-2xl font-bold mt-10 mb-4">Produção de Conteúdo</h2>
        <p className="mb-6">
          Os textos são escritos e revisados com apoio de ferramentas de inteligência artificial, sempre passando por curadoria humana. Garantimos que os conteúdos:
        </p>
        <ul className="list-disc pl-6 mb-6 space-y-2">
          <li>Não sejam plagiados</li>
          <li>Mantenham originalidade</li>
          <li>Apresentem fontes confiáveis</li>
          <li>Sejam atualizados regularmente quando necessário</li>
        </ul>

        <h2 className="text-2xl font-bold mt-10 mb-4">Autoria e Transparência</h2>
        <p className="mb-6">
          Cada artigo possui identificação do autor e data de publicação. Trabalhamos com colaboradores fixos e IA supervisionada, mas sempre indicamos claramente quando o conteúdo for colaborativo ou derivado de fontes externas.
        </p>

        <h2 className="text-2xl font-bold mt-10 mb-4">Correções e Atualizações</h2>
        <p className="mb-6">
          Valorizamos a precisão. Se detectarmos erros em nossos conteúdos, eles serão corrigidos de forma transparente. Os leitores também podem entrar em contato via nossa <a href="/contato" className="text-orange-500 hover:underline">página de contato</a>.
        </p>

        <h2 className="text-2xl font-bold mt-10 mb-4">Independência Comercial</h2>
        <p className="mb-6">
          A presença de anúncios, links de afiliados ou recomendações patrocinadas será sempre informada. Nosso conteúdo editorial é independente e não sofre interferência de interesses comerciais.
        </p>

        <h2 className="text-2xl font-bold mt-10 mb-4">Contato</h2>
        <p>
          Dúvidas ou sugestões? Entre em <a href="/contato" className="text-orange-500 hover:underline">contato conosco</a>. Estamos sempre abertos ao diálogo com nossa comunidade.
        </p>
      </main>
    </>
  );
}
