import { type QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { createBrowserRouter, RouterProvider } from "react-router";
import { Toaster } from "sonner";

import { useTheme } from "@/hooks/use-theme";

import { createRoutes } from "./router";

type CreateRouter = (routes: ReturnType<typeof createRoutes>) => ReturnType<typeof createBrowserRouter>;

export interface AppProps {
  queryClient: QueryClient;
  // las pruebas pasan un router en memoria; la app usa el del navegador
  createRouter?: CreateRouter;
}

export function App({ queryClient, createRouter = createBrowserRouter }: AppProps) {
  const [router] = useState(() => createRouter(createRoutes(queryClient)));
  const { theme } = useTheme();

  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      {/* avisos abajo a la derecha; sobreviven a la navegacion */}
      <Toaster position="bottom-right" theme={theme} richColors closeButton duration={6000} />
    </QueryClientProvider>
  );
}
