"use client";
import { createContext, useContext, useState, ReactNode, Dispatch, SetStateAction } from "react";

// 1. Define o tipo do contexto
type LoadingContextType = {
  isLoading: boolean;
  setLoading: Dispatch<SetStateAction<boolean>>;
};

// 2. Cria o contexto com valor inicial apenas para tipagem
const LoadingContext = createContext<LoadingContextType>({
  isLoading: false,
  setLoading: () => {}, // função vazia só para inicialização
});

// 3. Provider que realmente usa o estado
export function LoadingProvider({ children }: { children: ReactNode }) {
  const [isLoading, setLoading] = useState(false);

  return (
    <LoadingContext.Provider value={{ isLoading, setLoading }}>
      {children}
    </LoadingContext.Provider>
  );
}

// 4. Hook para usar no restante do app
export function useLoading() {
  return useContext(LoadingContext);
}
