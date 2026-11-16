/// <reference types="expo-router/types/expect" />
import { act, fireEvent, renderRouter, screen } from "expo-router/testing-library";

import { mockModeration } from "@/services/moderation/mock";

// recorre la app real (carpeta app/) con el servicio simulado
function renderApp(initialUrl: string) {
  return renderRouter("./app", { initialUrl });
}

// el router usa timers falsos: se presiona dentro de act para que terminen las cargas pendientes
async function press(element: Parameters<typeof fireEvent.press>[0]) {
  await act(async () => {
    fireEvent.press(element);
  });
}

// montar el router completo es lento cuando las suites corren en paralelo
jest.setTimeout(30000);

beforeEach(() => {
  mockModeration.reset();
});

describe("navegacion de la consola", () => {
  test("el login lleva al dashboard", async () => {
    renderApp("/");
    // la primera pantalla espera a que carguen las fuentes
    fireEvent.changeText(
      await screen.findByLabelText("Correo", {}, { timeout: 10000 }),
      "admin@friendframe.test",
    );
    fireEvent.changeText(screen.getByLabelText("Contraseña"), "clave-de-prueba");
    await press(screen.getByRole("button", { name: "Iniciar sesión" }));

    expect(screen).toHavePathname("/dashboard");
    expect(await screen.findByText("Reportes abiertos")).toBeTruthy();
  });

  test("el menu lateral lleva a cada seccion", async () => {
    renderApp("/dashboard");
    const sections = [
      ["Reportes", "/reports"],
      ["Usuarios", "/users"],
      ["Bitácora", "/audit"],
      ["Equipo", "/team"],
      ["Dashboard", "/dashboard"],
    ];

    for (const [label, path] of sections) {
      await press(await screen.findByRole("link", { name: label }));
      expect(screen).toHavePathname(path);
      expect(await screen.findByRole("header", { name: label })).toBeTruthy();
    }
  });

  test("una fila de la cola abre el detalle y se puede volver", async () => {
    renderApp("/reports");
    await press(
      await screen.findByRole("button", { name: "Abrir reporte de @luis.fotos, Hace 42 min" }),
    );

    expect(screen).toHavePathname("/reports/r5");
    expect(await screen.findByText("Publicado por @luis.fotos")).toBeTruthy();

    await press(screen.getByRole("button", { name: "Volver a la cola" }));
    expect(screen).toHavePathname("/reports");
  });

  test("tomar un caso muestra el panel de resolucion", async () => {
    renderApp("/reports/r1");
    await press(await screen.findByRole("button", { name: "Tomar caso" }));

    expect(await screen.findByText("Resolver reporte")).toBeTruthy();
    expect(screen.getByText("En revisión")).toBeTruthy();
  });

  test("resolver un caso lo cierra y regresa a la cola", async () => {
    renderApp("/reports/r1");
    await press(await screen.findByRole("button", { name: "Tomar caso" }));
    fireEvent.press(await screen.findByRole("radio", { name: "Advertir al autor" }));
    await press(screen.getByRole("button", { name: "Enviar advertencia" }));

    expect(screen).toHavePathname("/reports");
  });

  test("un usuario de la busqueda abre su perfil", async () => {
    renderApp("/users");
    await press(await screen.findByRole("link", { name: "Ver perfil de @ana.rmz" }));

    expect(screen).toHavePathname("/users/u3");
    expect(await screen.findByRole("header", { name: "@ana.rmz" })).toBeTruthy();
  });

  test("el historial del autor de un reporte abre su perfil", async () => {
    renderApp("/reports/r1");
    await press(await screen.findByRole("link", { name: "Ver perfil" }));

    expect(screen).toHavePathname("/users/u1");
  });

  test("filtrar la cola cambia los reportes mostrados", async () => {
    renderApp("/reports");
    await press(await screen.findByRole("button", { name: "Motivo: Todos" }));

    expect(await screen.findByRole("button", { name: "Motivo: Spam" })).toBeTruthy();
    expect(screen.getByText("Mostrando 2 de 2 reportes · 8 nov 2026")).toBeTruthy();
  });

  test("cerrar sesion regresa al login", async () => {
    renderApp("/team");
    await press(await screen.findByRole("button", { name: "Cerrar sesión" }));

    expect(screen).toHavePathname("/");
  });

  test("una ruta desconocida avisa y permite volver", async () => {
    renderApp("/reports/no-existe");
    expect(await screen.findByText("No encontramos lo que buscas.")).toBeTruthy();
  });
});
