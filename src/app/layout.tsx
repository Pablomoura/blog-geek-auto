import './globals.css'

export const metadata = {
  title: "GeekNews - O melhor do mundo geek",
  description: "Notícias Geek",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt">
      <body className="bg-[var(--background)] text-[var(--foreground)] font-sans">
        <main>{children}</main>
        <footer className="mt-10 text-center py-6 bg-neutral-100 dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300">
          <p>© 2025 GeekNews - Todos os direitos reservados.</p>
        </footer>
      </body>
    </html>
  );
}