/// <reference types="expo-router/types/expect" />
import { router } from "expo-router";
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

  test("un reporte inexistente muestra el error 404 y permite volver", async () => {
    renderApp("/reports/no-existe");
    expect(await screen.findByRole("header", { name: "Error 404" })).toBeTruthy();
    await press(screen.getByRole("button", { name: "Volver al dashboard" }));
    expect(screen).toHavePathname("/dashboard");
  });

  test("una ruta desconocida muestra el error 404", async () => {
    renderApp("/no-existe");
    expect(await screen.findByText("No encontramos esta página")).toBeTruthy();
  });
});

describe("estados y confirmaciones", () => {
  async function signIn(email: string, password: string) {
    renderApp("/");
    fireEvent.changeText(await screen.findByLabelText("Correo", {}, { timeout: 10000 }), email);
    fireEvent.changeText(screen.getByLabelText("Contraseña"), password);
    await press(screen.getByRole("button", { name: "Iniciar sesión" }));
  }

  test("el login explica por que no se pudo entrar", async () => {
    await signIn("admin@friendframe.test", "123");
    expect(await screen.findByText("Correo o contraseña incorrectos")).toBeTruthy();
    expect(screen).toHavePathname("/");
  });

  test("el login rechaza cuentas fuera del equipo", async () => {
    await signIn("ana@gmail.com", "clave-de-prueba");
    expect(await screen.findByText("No tienes acceso al panel")).toBeTruthy();
  });

  test("un moderador no ve ni abre las secciones de admin", async () => {
    await signIn("moderador@friendframe.test", "clave-de-prueba");
    expect(await screen.findByText("@moderador1")).toBeTruthy();
    expect(screen.queryByRole("link", { name: "Bitácora" })).toBeNull();

    await act(async () => router.push("/audit"));
    expect(await screen.findByRole("header", { name: "Error 403" })).toBeTruthy();
  });

  test("suspender pide confirmacion, avisa el resultado y actualiza la cola", async () => {
    renderApp("/reports/r1");
    await press(await screen.findByRole("button", { name: "Tomar caso" }));
    fireEvent.press(await screen.findByRole("radio", { name: "Suspender autor" }));
    fireEvent.press(screen.getByRole("button", { name: "7 días" }));
    fireEvent.press(screen.getByRole("button", { name: "Aplicar suspensión" }));
    expect(await screen.findByText("Confirmar suspensión")).toBeTruthy();
    await press(screen.getByRole("button", { name: "Suspender" }));

    expect(screen).toHavePathname("/reports");
    expect(await screen.findByText(/^Usuario suspendido hasta el/)).toBeTruthy();
    expect(screen.getByText("@carlos_dev · 3 reportes cerrados")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Cola actualizada · 3 reportes resueltos" })).toBeTruthy();
  });

  test("la evidencia expirada ofrece recargar", async () => {
    renderApp("/reports/r3");
    expect(await screen.findByText("El enlace de evidencia expiró")).toBeTruthy();
    await press(screen.getByRole("button", { name: "Recargar" }));
    expect(screen.getByText("El enlace de evidencia expiró")).toBeTruthy();
  });

  test("un caso en revision por otra persona no se puede tomar", async () => {
    renderApp("/reports/r6");
    expect(await screen.findByRole("button", { name: "En revisión por @moderador2" })).toBeTruthy();
    expect(screen.queryByText("Resolver reporte")).toBeNull();
  });

  test("restaurar una cuenta exige notas y la deja activa", async () => {
    renderApp("/users/u1");
    await press(await screen.findByRole("button", { name: "Restaurar cuenta" }));
    fireEvent.changeText(screen.getByLabelText("Notas internas"), "Apelación revisada");
    await press(screen.getByRole("button", { name: "Restaurar" }));

    expect(await screen.findByRole("button", { name: "Cuenta activa" })).toBeTruthy();
    expect(screen.getByText("Cuenta restaurada")).toBeTruthy();
  });

  test("agregar un miembro lo suma a la tabla del equipo", async () => {
    renderApp("/team");
    await press(await screen.findByRole("button", { name: "Agregar miembro" }));
    await act(async () => {
      fireEvent.changeText(screen.getByLabelText("Buscar por nombre o @username"), "@sofia");
    });
    expect(await screen.findByText("@sofia.crea")).toBeTruthy();
    await press(screen.getByRole("button", { name: "Agregar" }));

    expect(await screen.findByText("Sofía Vega")).toBeTruthy();
    expect(screen.getByText("5 miembros")).toBeTruthy();
  });

  test("quitar un rol pide confirmacion", async () => {
    renderApp("/team");
    await press(await screen.findByRole("button", { name: "Quitar rol a @maria.lopez" }));
    const confirmButtons = screen.getAllByRole("button", { name: "Quitar rol" });
    await press(confirmButtons[confirmButtons.length - 1]);
    expect(await screen.findByText("3 miembros")).toBeTruthy();
  });
});
