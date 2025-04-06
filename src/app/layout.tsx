// app/layout.tsx
import './globals.css';
import Script from 'next/script';
import { Metadata } from 'next';
import Link from "@/components/SmartLink"; // usa o seu link customizado
import CookieBanner from '@/components/CookieBanner';
import PageLoader from "@/components/PageLoader";
import { LoadingProvider } from "@/app/loading-context";

export const metadata: Metadata = {
  title: "GeekNews - O melhor do mundo geek",
  description: "Fique por dentro das últimas notícias sobre filmes, séries, games e cultura pop geek.",
  metadataBase: new URL("https://www.geeknews.com.br"),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="dark">
      <head>
        {/* Google Analytics */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-SMFR890H32"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-SMFR890H32');
          `}
        </Script>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "GeekNews",
              url: "https://www.geeknews.com.br",
              logo: "https://www.geeknews.com.br/logo.png"
            }),
          }}
        />
      </head>
      <body className="bg-white text-neutral-900 dark:bg-black dark:text-white font-sans">
        <LoadingProvider>
        <PageLoader />
        <CookieBanner />
        <main>{children}</main>
        <footer className="mt-10 text-center py-4 bg-gray-900 text-white text-sm">
          <p>
            © 2025 GeekNews - Todos os direitos reservados. |
            <Link href="/politica-de-privacidade" className="underline hover:text-orange-400 ml-1">
              Política de Privacidade
            </Link>
            {" | "}
            <Link href="/contato" className="underline hover:text-orange-400 ml-1">
              Contato
            </Link>
          </p>
        </footer>
        </LoadingProvider>
      </body>
    </html>
  );
}