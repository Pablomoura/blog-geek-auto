import Header from "@/components/Header";
import Script from "next/script";

export const runtime = 'edge';

export const metadata = {
  title: "Contato - GeekNews",
  description: "Entre em contato com a equipe do GeekNews",
};

export default function ContatoPage() {
  return (
    <>
      <Header />
      <main className="max-w-2xl mx-auto px-6 py-16 text-neutral-900 dark:text-white">
        <h1 className="text-4xl font-bold mb-6">📬 Fale com a gente</h1>
        <p className="mb-4 text-gray-700 dark:text-gray-300">
          Tem uma sugestão, encontrou algum erro ou quer anunciar no GeekNews? Fique à vontade para nos mandar uma mensagem!
        </p>
        <form
          action="https://formspree.io/f/xjkyewgo"
          method="POST"
          className="space-y-6"
        >
          <div>
            <label htmlFor="nome" className="block font-medium mb-1">
              Nome
            </label>
            <input
              type="text"
              name="nome"
              id="nome"
              required
              className="w-full px-4 py-2 border rounded-md bg-white dark:bg-gray-900 dark:border-gray-700"
            />
          </div>
          <div>
            <label htmlFor="email" className="block font-medium mb-1">
              E-mail
            </label>
            <input
              type="email"
              name="email"
              id="email"
              required
              className="w-full px-4 py-2 border rounded-md bg-white dark:bg-gray-900 dark:border-gray-700"
            />
          </div>
          <div>
            <label htmlFor="mensagem" className="block font-medium mb-1">
              Mensagem
            </label>
            <textarea
              name="mensagem"
              id="mensagem"
              rows={5}
              required
              className="w-full px-4 py-2 border rounded-md bg-white dark:bg-gray-900 dark:border-gray-700"
            />
          </div>
          <button
            type="submit"
            className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-6 py-2 rounded-md transition"
          >
            Enviar mensagem
          </button>
        </form>
        <p className="text-xs text-gray-500 mt-4">
          Responderemos o mais breve possível. Agradecemos seu contato!
        </p>
      </main>
      <Script
        id="ld-json-contato"
        type="application/ld+json"
      >{`
        {
          "@context": "https://schema.org",
          "@type": "ContactPage",
          "name": "Contato",
          "url": "https://www.geeknews.com.br/contato",
          "description": "Entre em contato com a equipe do GeekNews para dúvidas, sugestões ou parcerias.",
          "publisher": {
            "@type": "Organization",
            "name": "GeekNews"
          }
        }
      `}</Script>
    </>
  );
}
