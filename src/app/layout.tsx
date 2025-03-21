import './globals.css'

export const metadata = {
  title: "GeekNews - O melhor do mundo geek",
  description: "Notícias Geek",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt">
      <body style={{ fontFamily: "Arial, sans-serif", padding: "20px" }}>
        <main>{children}</main>
        <footer style={{ marginTop: "20px", textAlign: "center", padding: "10px", background: "#222", color: "#fff" }}>
          <p>© 2025 GeekNews - Todos os direitos reservados.</p>
        </footer>
      </body>
    </html>
  );
}