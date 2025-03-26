// app/layout.tsx
import './globals.css';
import Script from 'next/script';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "GeekNews - O melhor do mundo geek",
  description: "Fique por dentro das últimas notícias sobre filmes, séries, games e cultura pop geek.",
  metadataBase: new URL("https://www.geeknews.com.br"),
  openGraph: {
    title: "GeekNews - O melhor do mundo geek",
    description: "Notícias atualizadas sobre filmes, séries, games e muito mais.",
    url: "https://www.geeknews.com.br",
    siteName: "GeekNews",
    images: [
      {
        url: "/logo.jpg",
        width: 1200,
        height: 630,
        alt: "GeekNews",
      },
    ],
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "GeekNews",
    description: "Fique por dentro das últimas notícias do universo geek.",
    images: ["/logo.png"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt" className="dark">
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
      </head>
      <body className="bg-white text-neutral-900 dark:bg-black dark:text-white font-sans">
        <main>{children}</main>
        <footer className="mt-10 text-center py-4 bg-gray-900 text-white text-sm">
          <p>© 2025 GeekNews - Todos os direitos reservados.</p>
        </footer>
      </body>
    </html>
  );
}
