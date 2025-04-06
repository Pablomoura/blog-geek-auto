"use client";
import { createContext, useContext, useState } from "react";

const LoadingContext = createContext({
  isLoading: false,
  setLoading: (value: boolean) => {},
});

export function LoadingProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setLoading] = useState(false);

  return (
    <LoadingContext.Provider value={{ isLoading, setLoading }}>
      {children}
    </LoadingContext.Provider>
  );
}

export function useLoading() {
  return useContext(LoadingContext);
}
