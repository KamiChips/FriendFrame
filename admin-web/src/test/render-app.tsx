import { QueryClient } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter } from "react-router";

import { App } from "@/App";
import { moderation } from "@/services/moderation";

// monta la app completa (router real, TanStack Query y servicio simulado) en una ruta
export function renderApp(path = "/dashboard") {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: 0 }, mutations: { retry: 0 } },
  });
  let router: ReturnType<typeof createMemoryRouter> | undefined;
  const user = userEvent.setup();
  const view = render(
    <App
      queryClient={queryClient}
      createRouter={(routes) => (router = createMemoryRouter(routes, { initialEntries: [path] }))}
    />,
  );
  return { ...view, user, queryClient, location: () => router!.state.location };
}

// entra como moderador (sin acceso a Bitacora ni Equipo)
export const signInAsModerator = () =>
  moderation.signIn({ email: "moderator@friendframe.test", password: "clave-de-prueba" });
