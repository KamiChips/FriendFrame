import { screen, waitFor, within } from "@testing-library/react";

import { renderApp, signInAsModerator } from "@/test/render-app";

// recorridos de punta a punta dentro de jsdom: router, datos, formularios y avisos reales

describe("inicio de sesion", () => {
  test("valida los campos antes de enviar", async () => {
    const { user } = renderApp("/");
    await user.click(await screen.findByRole("button", { name: "Sign in" }));
    expect(await screen.findByText("Enter your email")).toBeInTheDocument();
    expect(screen.getByText("Enter your password")).toBeInTheDocument();
  });

  test("explica por que una cuenta no puede entrar", async () => {
    const { user } = renderApp("/");
    await user.type(await screen.findByLabelText("Email"), "ana@gmail.com");
    await user.type(screen.getByLabelText("Password"), "clave-de-prueba");
    await user.click(screen.getByRole("button", { name: "Sign in" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("You don't have access to the panel");
  });

  test("con una cuenta del equipo entra al dashboard", async () => {
    const { user, location } = renderApp("/");
    await user.type(await screen.findByLabelText("Email"), "admin@friendframe.test");
    await user.type(screen.getByLabelText("Password"), "clave-de-prueba");
    await user.click(screen.getByRole("button", { name: "Sign in" }));
    // la primera visita descarga la pagina y las graficas
    expect(
      await screen.findByRole("heading", { name: "Dashboard", level: 1 }, { timeout: 5000 }),
    ).toBeInTheDocument();
    expect(location().pathname).toBe("/dashboard");
  });
});

describe("navegacion y permisos", () => {
  test("el menu marca la seccion activa y muestra los reportes abiertos", async () => {
    renderApp("/reports/r2");
    const nav = await screen.findByRole("navigation", { name: "Sections" });
    await waitFor(() =>
      expect(within(nav).getByRole("link", { name: /Reports/ })).toHaveAttribute("aria-current", "page"),
    );
    expect(await within(nav).findByLabelText("9 open")).toBeInTheDocument();
  });

  test("un moderador no ve las secciones de admin y recibe 403 si las abre", async () => {
    await signInAsModerator();
    renderApp("/audit");
    expect(await screen.findByText("You don't have permission to view this section")).toBeInTheDocument();
    const nav = screen.getByRole("navigation", { name: "Sections" });
    expect(within(nav).queryByRole("link", { name: "Audit log" })).not.toBeInTheDocument();
  });

  test("un reporte inexistente o una ruta desconocida muestran 404", async () => {
    renderApp("/reports/no-existe");
    expect(await screen.findByText("We couldn't find this page")).toBeInTheDocument();
  });

  test("una ruta desconocida muestra 404 dentro de la consola", async () => {
    renderApp("/algo/raro");
    expect(await screen.findByText("We couldn't find this page")).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Sections" })).toBeInTheDocument();
  });

  test("cerrar sesion vuelve al login", async () => {
    const { user, location } = renderApp("/dashboard");
    await user.click(await screen.findByRole("button", { name: "Sign out" }));
    await waitFor(() => expect(location().pathname).toBe("/"));
  });
});

describe("cola de reportes", () => {
  test("los filtros viven en la URL y se pueden limpiar", async () => {
    const { user, location } = renderApp("/reports?type=post");
    expect(await screen.findByText("Showing 2 of 2 reports · 8 Nov 2026")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Clear filters" }));
    expect(await screen.findByText(/Showing 8 of 8 reports/)).toBeInTheDocument();
    expect(location().search).toBe("");
  });

  test("sin resultados muestra el estado vacio", async () => {
    renderApp("/reports?mine=1");
    expect(await screen.findByText("No pending reports 🎉")).toBeInTheDocument();
  });

  test("el aviso de nuevos los incorpora y los deja resaltados", async () => {
    const { user } = renderApp("/reports");
    await user.click(await screen.findByRole("button", { name: /1 new report — click to view/ }));
    expect(await screen.findByText("1 new report added · Queue updated")).toBeInTheDocument();
    expect(screen.getByTestId("row-r1")).toHaveClass("bg-highlight");
  });
});

describe("resolver un reporte", () => {
  test("tomar el caso, suspender y volver a la cola con aviso", async () => {
    const { user, location } = renderApp("/reports/r1");
    await user.click(await screen.findByRole("button", { name: "Take case" }));
    await user.click(await screen.findByRole("radio", { name: "Suspend author" }));

    const apply = screen.getByRole("button", { name: "Apply suspension" });
    expect(apply).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "7 days" }));
    await waitFor(() => expect(apply).toBeEnabled());
    await user.click(apply);

    const dialog = await screen.findByRole("dialog", { name: "Confirm suspension" });
    await user.click(within(dialog).getByRole("button", { name: "Suspend" }));

    expect(await screen.findByText("Queue updated · 3 reports resolved")).toBeInTheDocument();
    expect(location().pathname).toBe("/reports");
    expect(await screen.findByText(/User suspended until/)).toBeInTheDocument();
  });

  test("banear exige escribir el usuario exacto", async () => {
    const { user } = renderApp("/reports/r1");
    await user.click(await screen.findByRole("button", { name: "Take case" }));
    await user.click(await screen.findByRole("radio", { name: "Ban author" }));
    await user.type(screen.getByLabelText(/Internal notes/), "Repeat offense");
    await user.click(await screen.findByRole("button", { name: "Continue with ban" }));

    const dialog = await screen.findByRole("dialog", { name: "Ban @carlos_dev" });
    const confirm = within(dialog).getByRole("button", { name: "Ban" });
    await user.type(within(dialog).getByLabelText("Type @carlos_dev to confirm"), "@carlos");
    expect(confirm).toBeDisabled();
    await user.type(within(dialog).getByLabelText("Type @carlos_dev to confirm"), "_dev");
    await waitFor(() => expect(confirm).toBeEnabled());
    await user.click(confirm);
    expect(await screen.findByText("Ban applied · 3 reports resolved")).toBeInTheDocument();
  });

  test("revelar evidencia quita el velo y queda en la bitacora", async () => {
    const { user } = renderApp("/reports/r2");
    await user.click(await screen.findByRole("button", { name: /click to reveal/ }));
    expect(await screen.findByText("Evidence revealed")).toBeInTheDocument();
  });
});

describe("usuarios", () => {
  test("restaurar una cuenta exige motivo y la deja activa", async () => {
    const { user } = renderApp("/users/u1");
    await user.click(await screen.findByRole("button", { name: "Restore account" }));
    const dialog = await screen.findByRole("dialog", { name: "Restore @carlos_dev" });
    const confirm = within(dialog).getByRole("button", { name: "Restore" });
    expect(confirm).toBeDisabled();
    await user.type(within(dialog).getByLabelText(/Internal notes/), "Appeal reviewed");
    await waitFor(() => expect(confirm).toBeEnabled());
    await user.click(confirm);

    expect(await screen.findByRole("button", { name: "Account active" })).toBeDisabled();
    expect(await screen.findByText("Account restored", { selector: "p" })).toBeInTheDocument();
  });

  test("la busqueda se guarda en la URL", async () => {
    const { user, location } = renderApp("/users");
    await user.type(await screen.findByRole("searchbox"), "ana");
    await user.click(screen.getByRole("button", { name: "Search" }));
    expect(await screen.findByText(/^1 account ·/)).toBeInTheDocument();
    expect(location().search).toBe("?q=ana");
  });
});

describe("equipo", () => {
  test("los chips de rol filtran la tabla y se pueden quitar", async () => {
    const { user, location } = renderApp("/team");
    const moderators = await screen.findByRole("button", { name: "2 moderators" });
    const table = await screen.findByRole("table", { name: "Team members" });
    expect(within(table).getAllByRole("row")).toHaveLength(5);

    // cambiar el filtro es una navegacion: el router corre el loader antes de pintar
    await user.click(moderators);
    await waitFor(() => expect(moderators).toHaveAttribute("aria-pressed", "true"));
    expect(location().search).toBe("?role=moderator");
    await waitFor(() => expect(within(table).getAllByRole("row")).toHaveLength(3));
    expect(screen.getByText(/Showing 2 of 4 members/)).toBeInTheDocument();

    await user.click(moderators);
    await waitFor(() => expect(location().search).toBe(""));
    await waitFor(() => expect(within(table).getAllByRole("row")).toHaveLength(5));
  });

  test("agregar un miembro buscandolo por su usuario", async () => {
    const { user } = renderApp("/team");
    await user.click(await screen.findByRole("button", { name: "Add member" }));
    const dialog = await screen.findByRole("dialog", { name: "Add member" });
    await user.type(within(dialog).getByLabelText("Search by name or @username"), "@sofia");
    expect(await within(dialog).findByText("@sofia.crea")).toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: "Add" }));
    expect(await screen.findByTestId(/row-m\d{4,}/)).toHaveTextContent("@sofia.crea");
  });

  test("no puedes quitarte tu propio rol", async () => {
    renderApp("/team");
    expect(await screen.findByRole("button", { name: "Remove role from @admin" })).toBeDisabled();
  });
});
