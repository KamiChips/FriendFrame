import { screen, waitFor, within } from "@testing-library/react";

import { renderApp, signInAsModerator } from "@/test/render-app";

// recorridos de punta a punta dentro de jsdom: router, datos, formularios y avisos reales

describe("inicio de sesion", () => {
  test("valida los campos antes de enviar", async () => {
    const { user } = renderApp("/");
    await user.click(await screen.findByRole("button", { name: "Iniciar sesión" }));
    expect(await screen.findByText("Escribe tu correo")).toBeInTheDocument();
    expect(screen.getByText("Escribe tu contraseña")).toBeInTheDocument();
  });

  test("explica por que una cuenta no puede entrar", async () => {
    const { user } = renderApp("/");
    await user.type(await screen.findByLabelText("Correo"), "ana@gmail.com");
    await user.type(screen.getByLabelText("Contraseña"), "clave-de-prueba");
    await user.click(screen.getByRole("button", { name: "Iniciar sesión" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("No tienes acceso al panel");
  });

  test("con una cuenta del equipo entra al dashboard", async () => {
    const { user, location } = renderApp("/");
    await user.type(await screen.findByLabelText("Correo"), "admin@friendframe.test");
    await user.type(screen.getByLabelText("Contraseña"), "clave-de-prueba");
    await user.click(screen.getByRole("button", { name: "Iniciar sesión" }));
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
    const nav = await screen.findByRole("navigation", { name: "Secciones" });
    await waitFor(() =>
      expect(within(nav).getByRole("link", { name: /Reportes/ })).toHaveAttribute("aria-current", "page"),
    );
    expect(await within(nav).findByLabelText("9 abiertos")).toBeInTheDocument();
  });

  test("un moderador no ve las secciones de admin y recibe 403 si las abre", async () => {
    await signInAsModerator();
    renderApp("/audit");
    expect(await screen.findByText("No tienes permiso para ver esta sección")).toBeInTheDocument();
    const nav = screen.getByRole("navigation", { name: "Secciones" });
    expect(within(nav).queryByRole("link", { name: "Bitácora" })).not.toBeInTheDocument();
  });

  test("un reporte inexistente o una ruta desconocida muestran 404", async () => {
    renderApp("/reports/no-existe");
    expect(await screen.findByText("No encontramos esta página")).toBeInTheDocument();
  });

  test("una ruta desconocida muestra 404 dentro de la consola", async () => {
    renderApp("/algo/raro");
    expect(await screen.findByText("No encontramos esta página")).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Secciones" })).toBeInTheDocument();
  });

  test("cerrar sesion vuelve al login", async () => {
    const { user, location } = renderApp("/dashboard");
    await user.click(await screen.findByRole("button", { name: "Cerrar sesión" }));
    await waitFor(() => expect(location().pathname).toBe("/"));
  });
});

describe("cola de reportes", () => {
  test("los filtros viven en la URL y se pueden limpiar", async () => {
    const { user, location } = renderApp("/reports?type=post");
    expect(await screen.findByText("Mostrando 2 de 2 reportes · 8 nov 2026")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Limpiar filtros" }));
    expect(await screen.findByText(/Mostrando 8 de 8 reportes/)).toBeInTheDocument();
    expect(location().search).toBe("");
  });

  test("sin resultados muestra el estado vacio", async () => {
    renderApp("/reports?mine=1");
    expect(await screen.findByText("No hay reportes pendientes 🎉")).toBeInTheDocument();
  });

  test("el aviso de nuevos los incorpora y los deja resaltados", async () => {
    const { user } = renderApp("/reports");
    await user.click(await screen.findByRole("button", { name: /1 reporte nuevo — clic para ver/ }));
    expect(await screen.findByText("1 reporte nuevo incorporado · Cola actualizada")).toBeInTheDocument();
    expect(screen.getByTestId("row-r1")).toHaveClass("bg-highlight");
  });
});

describe("resolver un reporte", () => {
  test("tomar el caso, suspender y volver a la cola con aviso", async () => {
    const { user, location } = renderApp("/reports/r1");
    await user.click(await screen.findByRole("button", { name: "Tomar caso" }));
    await user.click(await screen.findByRole("radio", { name: "Suspender autor" }));

    const apply = screen.getByRole("button", { name: "Aplicar suspensión" });
    expect(apply).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "7 días" }));
    await waitFor(() => expect(apply).toBeEnabled());
    await user.click(apply);

    const dialog = await screen.findByRole("dialog", { name: "Confirmar suspensión" });
    await user.click(within(dialog).getByRole("button", { name: "Suspender" }));

    expect(await screen.findByText("Cola actualizada · 3 reportes resueltos")).toBeInTheDocument();
    expect(location().pathname).toBe("/reports");
    expect(await screen.findByText(/Usuario suspendido hasta el/)).toBeInTheDocument();
  });

  test("banear exige escribir el usuario exacto", async () => {
    const { user } = renderApp("/reports/r1");
    await user.click(await screen.findByRole("button", { name: "Tomar caso" }));
    await user.click(await screen.findByRole("radio", { name: "Banear autor" }));
    await user.type(screen.getByLabelText(/Notas internas/), "Reincidencia");
    await user.click(await screen.findByRole("button", { name: "Continuar con el baneo" }));

    const dialog = await screen.findByRole("dialog", { name: "Banear a @carlos_dev" });
    const confirm = within(dialog).getByRole("button", { name: "Banear" });
    await user.type(within(dialog).getByLabelText("Escribe @carlos_dev para confirmar"), "@carlos");
    expect(confirm).toBeDisabled();
    await user.type(within(dialog).getByLabelText("Escribe @carlos_dev para confirmar"), "_dev");
    await waitFor(() => expect(confirm).toBeEnabled());
    await user.click(confirm);
    expect(await screen.findByText("Baneo aplicado · 3 reportes resueltos")).toBeInTheDocument();
  });

  test("revelar evidencia quita el velo y queda en la bitacora", async () => {
    const { user } = renderApp("/reports/r2");
    await user.click(await screen.findByRole("button", { name: /clic para revelar/ }));
    expect(await screen.findByText("Evidencia revelada")).toBeInTheDocument();
  });
});

describe("usuarios", () => {
  test("restaurar una cuenta exige motivo y la deja activa", async () => {
    const { user } = renderApp("/users/u1");
    await user.click(await screen.findByRole("button", { name: "Restaurar cuenta" }));
    const dialog = await screen.findByRole("dialog", { name: "Restaurar a @carlos_dev" });
    const confirm = within(dialog).getByRole("button", { name: "Restaurar" });
    expect(confirm).toBeDisabled();
    await user.type(within(dialog).getByLabelText(/Notas internas/), "Apelación revisada");
    await waitFor(() => expect(confirm).toBeEnabled());
    await user.click(confirm);

    expect(await screen.findByRole("button", { name: "Cuenta activa" })).toBeDisabled();
    expect(await screen.findByText("Cuenta restaurada", { selector: "p" })).toBeInTheDocument();
  });

  test("la busqueda se guarda en la URL", async () => {
    const { user, location } = renderApp("/users");
    await user.type(await screen.findByRole("searchbox"), "ana");
    await user.click(screen.getByRole("button", { name: "Buscar" }));
    expect(await screen.findByText(/^1 cuenta ·/)).toBeInTheDocument();
    expect(location().search).toBe("?q=ana");
  });
});

describe("equipo", () => {
  test("los chips de rol filtran la tabla y se pueden quitar", async () => {
    const { user, location } = renderApp("/team");
    const moderators = await screen.findByRole("button", { name: "2 moderadores" });
    const table = await screen.findByRole("table", { name: "Miembros del equipo" });
    expect(within(table).getAllByRole("row")).toHaveLength(5);

    // cambiar el filtro es una navegacion: el router corre el loader antes de pintar
    await user.click(moderators);
    await waitFor(() => expect(moderators).toHaveAttribute("aria-pressed", "true"));
    expect(location().search).toBe("?role=moderator");
    await waitFor(() => expect(within(table).getAllByRole("row")).toHaveLength(3));
    expect(screen.getByText(/Mostrando 2 de 4 miembros/)).toBeInTheDocument();

    await user.click(moderators);
    await waitFor(() => expect(location().search).toBe(""));
    await waitFor(() => expect(within(table).getAllByRole("row")).toHaveLength(5));
  });

  test("agregar un miembro buscandolo por su usuario", async () => {
    const { user } = renderApp("/team");
    await user.click(await screen.findByRole("button", { name: "Agregar miembro" }));
    const dialog = await screen.findByRole("dialog", { name: "Agregar miembro" });
    await user.type(within(dialog).getByLabelText("Buscar por nombre o @username"), "@sofia");
    expect(await within(dialog).findByText("@sofia.crea")).toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: "Agregar" }));
    expect(await screen.findByTestId(/row-m\d{4,}/)).toHaveTextContent("@sofia.crea");
  });

  test("no puedes quitarte tu propio rol", async () => {
    renderApp("/team");
    expect(await screen.findByRole("button", { name: "Quitar rol a @admin" })).toBeDisabled();
  });
});
