// src/app/politica-de-privacidade/page.tsx
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de Privacidade | GeekNews",
  description: "Entenda como tratamos suas informações pessoais no GeekNews conforme a LGPD.",
  robots: "index, follow",
};

export default function PoliticaDePrivacidadePage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-10 text-neutral-900 dark:text-white">
      <h1 className="text-3xl sm:text-4xl font-extrabold mb-6">Política de Privacidade — GeekNews</h1>
      <p className="text-sm text-gray-400 mb-6">Última atualização: Março de 2025</p>

      <section className="space-y-6 text-base leading-relaxed">
        <p>
          Na GeekNews, levamos a sua privacidade a sério. Este documento explica como coletamos,
          usamos, armazenamos e protegemos suas informações pessoais ao acessar nosso site,
          em conformidade com a Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018).
        </p>

        <h2 className="text-xl font-bold mt-8">1. Informações que coletamos</h2>
        <ul className="list-disc list-inside space-y-2">
          <li>
            <strong>Dados de navegação:</strong> tipo e versão do navegador, sistema operacional,
            endereço IP, data e hora de acesso, páginas visualizadas e tempo de permanência.
          </li>
          <li>
            <strong>Cookies e tecnologias similares:</strong> utilizamos cookies para lembrar suas preferências,
            melhorar a experiência do usuário e exibir anúncios relevantes.
          </li>
        </ul>

        <h2 className="text-xl font-bold mt-8">2. Finalidade do uso dos dados</h2>
        <ul className="list-disc list-inside space-y-2">
          <li>Melhorar a navegação e desempenho do site</li>
          <li>Entender como os visitantes utilizam o conteúdo</li>
          <li>Exibir anúncios personalizados via Google AdSense</li>
          <li>Proteger contra fraudes, acessos indevidos e atividades maliciosas</li>
        </ul>

        <h2 className="text-xl font-bold mt-8">3. Base legal para o tratamento de dados</h2>
        <p>
          O tratamento de dados está baseado em consentimento, legítimo interesse e cumprimento de
          obrigações legais, conforme a LGPD.
        </p>

        <h2 className="text-xl font-bold mt-8">4. Compartilhamento com terceiros</h2>
        <p>
          Podemos compartilhar dados com: Google Analytics, Google AdSense, Disqus, Vercel
          (hospedagem). Esses serviços possuem políticas próprias de privacidade.
        </p>

        <h2 className="text-xl font-bold mt-8">5. Seus direitos</h2>
        <ul className="list-disc list-inside space-y-2">
          <li>Solicitar exclusão ou atualização de dados</li>
          <li>Revogar consentimentos dados anteriormente</li>
          <li>Solicitar informações sobre o uso dos dados</li>
        </ul>

        <h2 className="text-xl font-bold mt-8">6. Cookies e anúncios</h2>
        <p>
          Utilizamos cookies próprios e de terceiros. O Google pode usar cookies para veicular anúncios
          com base em visitas anteriores. Você pode gerenciar essas preferências em:
          <a
            href="https://adssettings.google.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-orange-500 hover:underline"
          >
            Configurações de anúncios do Google
          </a>
          .
        </p>

        <h2 className="text-xl font-bold mt-8">7. Armazenamento e segurança</h2>
        <p>
          Seus dados são armazenados com segurança em servidores protegidos, com acesso restrito e
          monitoramento.
        </p>

        <h2 className="text-xl font-bold mt-8">8. Alterações nesta política</h2>
        <p>
          Podemos atualizar esta política a qualquer momento. Recomendamos visitar esta página
          periodicamente.
        </p>

        <h2 className="text-xl font-bold mt-8">9. Contato</h2>
        <p>
          Em caso de dúvidas ou solicitações, entre em contato pelo e-mail:
          <a
            href="mailto:contato@geeknews.com.br"
            className="text-orange-500 hover:underline ml-1"
          >
            contato@geeknews.com.br
          </a>
        </p>
      </section>
    </main>
  );
}
