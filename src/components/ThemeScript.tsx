// src/components/ThemeScript.tsx
export default function ThemeScript() {
    return (
      <script
        id="set-theme"
        dangerouslySetInnerHTML={{
          __html: `
            try {
              const theme = localStorage.getItem("theme");
              if (theme === "dark") {
                document.documentElement.classList.add("dark");
              } else {
                document.documentElement.classList.remove("dark");
              }
            } catch {
              // Silencia erro se localStorage não estiver disponível
            }
          `,
        }}
      />
    );
  }
  