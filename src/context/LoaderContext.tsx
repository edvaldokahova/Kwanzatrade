"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import Bot24Loader from "@/components/Bot24Loader";

const LoaderContext = createContext({
  startLoading: () => {},
  stopLoading: () => {},
}); //ok

export function LoaderProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);

  return (
    <LoaderContext.Provider value={{ 
      startLoading: () => setIsLoading(true), 
      stopLoading: () => setIsLoading(false) 
    }}>
      {children}
      <Bot24Loader show={isLoading} />
    </LoaderContext.Provider>
  );
}

export const useLoader = () => useContext(LoaderContext);
