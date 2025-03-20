export const metadata = {
  title: "GeekNews - O melhor do mundo geek",
  description: "Notícias geek automáticas com IA",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt">
      <body style={{ fontFamily: "Arial, sans-serif", padding: "20px" }}>
        <header style={{ background: "#222", color: "#fff", padding: "15px", textAlign: "center" }}>
          <h1>🚀 GeekNews</h1>
        </header>
        <main>{children}</main>
        <footer style={{ marginTop: "20px", textAlign: "center", padding: "10px", background: "#222", color: "#fff" }}>
          <p>© 2025 GeekNews - Todos os direitos reservados.</p>
        </footer>
      </body>
    </html>
  );
}