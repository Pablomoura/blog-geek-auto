// app/layout.tsx
import './globals.css';
import Script from 'next/script';
import { Metadata } from 'next';
import Link from "@/components/SmartLink";
import CookieBanner from '@/components/CookieBanner';
import PageLoader from "@/components/PageLoader";
import { LoadingProvider } from "@/app/loading-context";
import BotaoTrocarTema from "@/components/BotaoTrocarTema";
import CookieScripts from "@/components/CookieScripts";
import { Analytics } from "@vercel/analytics/next"
import JsonLdOrganization from "@/components/JsonLdOrganization";

export const metadata: Metadata = {
  title: "GeekNews - O melhor do mundo geek",
  description: "Fique por dentro das últimas notícias sobre filmes, séries, games e cultura pop geek.",
  metadataBase: new URL("https://www.geeknews.com.br"),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="">
      <head>
        {/* Google Analytics */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-SMFR890H32"
          strategy="afterInteractive"
        />
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9111051074987830"
          crossOrigin="anonymous"
          /> 
        <CookieScripts />
        <Script id="adsbygoogle-init" strategy="afterInteractive">
          {`
            (adsbygoogle = window.adsbygoogle || []).push({});
          `}
        </Script>
        <Script id="set-theme" strategy="beforeInteractive">
          {`
            try {
              const theme = localStorage.getItem("theme");
              if (theme === "dark") {
                document.documentElement.classList.add("dark");
              } else if (theme === "light") {
                document.documentElement.classList.remove("dark");
              }
            } catch (_) {}
          `}
        </Script>
      </head>
      <body className="text-neutral-900 dark:text-white font-sans">
        <JsonLdOrganization />
      <div className="bg-white dark:bg-black text-neutral-900 dark:text-white transition-all duration-300 ease-in-out">
        <BotaoTrocarTema />
        <CookieScripts />
        <LoadingProvider>
        <PageLoader />
        <CookieBanner />
        <main>{children}</main>
        <footer className="mt-10 text-center py-4 bg-orange-100 border-b border-orange-100 text-gray-900 dark:bg-gray-900 dark:text-white">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 sm:grid-cols-4 gap-8">
    
    <div>
      <h3 className="text-gray-900 dark:text-white font-semibold mb-3">GeekNews</h3>
      <p className="text-gray-500 text-sm leading-relaxed">
        Notícias diárias sobre cultura pop, animes, séries e games — feitas por profissionais que amam o universo geek.
      </p>
    </div>

    <div>
      <h3 className="text-gray-900 dark:text-white font-semibold mb-3">Navegação</h3>
      <ul className="space-y-2">
        <li><Link href="/missao-e-valores" className="text-gray-500 text-sm leading-relaxed hover:text-orange-400">Missão e Valores</Link></li>
        <li><Link href="/sobre" className="text-gray-500 text-sm leading-relaxed hover:text-orange-400">Sobre o GeekNews</Link></li>
        <li><Link href="/contato" className="text-gray-500 text-sm leading-relaxed hover:text-orange-400">Contato</Link></li>
      </ul>
    </div>

    <div>
      <h3 className="text-gray-900 dark:text-white font-semibold mb-3">Categorias</h3>
      <ul className="space-y-2">
        <li><Link href="/categoria/games" className="text-gray-500 text-sm leading-relaxed hover:text-orange-400">Games</Link></li>
        <li><Link href="/categoria/series-e-tv" className="text-gray-500 text-sm leading-relaxed hover:text-orange-400">Séries e TV</Link></li>
        <li><Link href="/categoria/mangas-e-animes" className="text-gray-500 text-sm leading-relaxed hover:text-orange-400">Mangás e Animes</Link></li>
        <li><Link href="/categoria/filmes" className="text-gray-500 text-sm leading-relaxed hover:text-orange-400">Filmes</Link></li>
      </ul>
    </div>

    <div>
      <h3 className="text-gray-900 dark:text-white font-semibold mb-3">Legal</h3>
      <ul className="space-y-2">
        <li><Link href="/politica-de-privacidade" className="text-gray-500 text-sm leading-relaxed hover:text-orange-400">Política de Privacidade</Link></li>
        <li><Link href="/politica-editorial" className="text-gray-500 text-sm leading-relaxed hover:text-orange-400">Política Editorial</Link></li>
      </ul>
    </div>
  </div>

  <div className="text-center text-gray-500 text-xs mt-10 border-t border-orange-200 pt-6">
    © 2025 GeekNews — Todos os direitos reservados.
  </div>
</footer>
        </LoadingProvider>
        </div>
        <Analytics/>
      </body>
    </html>
  );
}