// app/layout.tsx
import './globals.css';
import Script from 'next/script'; // 👈 importa Script do next

export const metadata = {
  title: "GeekNews - O melhor do mundo geek",
  description: "Notícias Geek",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt">
      <head>
        {/* Google Tag */}
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
      <body style={{ fontFamily: "Arial, sans-serif", padding: "20px" }}>
        <main>{children}</main>
        <footer style={{ marginTop: "20px", textAlign: "center", padding: "10px", background: "#222", color: "#fff" }}>
          <p>© 2025 GeekNews - Todos os direitos reservados.</p>
        </footer>
      </body>
    </html>
  );
}