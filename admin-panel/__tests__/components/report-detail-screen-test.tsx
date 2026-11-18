import { fireEvent, render } from "@testing-library/react-native";

import { pendingReport, reportInReview } from "@/fixtures/report-detail";
import { ReportDetailScreen } from "@/screens/ReportDetailScreen";

import { buildShell } from "../fixtures/shell";

function renderDetail(overrides = {}) {
  return render(<ReportDetailScreen shell={buildShell()} report={pendingReport} {...overrides} />);
}

describe("<ReportDetailScreen /> con un reporte disponible", () => {
  test("identifica el reporte en la cabecera", () => {
    const { getByText, getByRole } = renderDetail();
    expect(getByText("Moderación / Reportes / Reporte FF-1048")).toBeTruthy();
    expect(getByRole("header", { name: "Reporte FF-1048" })).toBeTruthy();
  });

  test("resume motivo, tipo, fecha, estado y asignacion", () => {
    const { getByText, getAllByText } = renderDetail();
    expect(getByText("Acoso")).toBeTruthy();
    expect(getByText("Post")).toBeTruthy();
    expect(getByText("8 nov 2026 · 10:45")).toBeTruthy();
    // el estado tambien aparece en los reportes relacionados
    expect(getAllByText("Pendiente").length).toBeGreaterThan(0);
    expect(getByText("Sin asignar")).toBeTruthy();
  });

  test("da el contexto de quien publico y en que perfil", () => {
    const { getByText } = renderDetail();
    expect(getByText("Publicado por @carlos_dev")).toBeTruthy();
    expect(getByText("en el perfil de @ana.rmz")).toBeTruthy();
    expect(getByText("Post · 8 nov 2026, 10:32 · Autor ≠ dueño del perfil")).toBeTruthy();
    expect(getByText("Visible")).toBeTruthy();
  });

  test("no senala diferencia cuando el autor publica en su propio perfil", () => {
    const own = {
      ...pendingReport,
      content: { ...pendingReport.content, profileOwnerHandle: "@carlos_dev" },
    };
    const { getByText } = renderDetail({ report: own });
    expect(getByText("Post · 8 nov 2026, 10:32")).toBeTruthy();
  });

  test("muestra la declaracion de quien reporto", () => {
    const { getByText } = renderDetail();
    expect(getByText("REPORTADO POR @maria.lopez")).toBeTruthy();
    expect(
      getByText(
        "“Publica repetidamente en el perfil de Ana después de que ella le pidió que dejara de hacerlo.”",
      ),
    ).toBeTruthy();
  });

  test("oculta el contenido sensible y avisa al pedir revelarlo", () => {
    const onRevealEvidence = jest.fn();
    const { getByRole } = renderDetail({ onRevealEvidence });
    fireEvent.press(
      getByRole("button", { name: "Contenido potencialmente sensible — clic para revelar" }),
    );
    expect(onRevealEvidence).toHaveBeenCalledTimes(1);
  });

  test("permite tomar el caso", () => {
    const onTakeCase = jest.fn();
    const { getByRole } = renderDetail({ onTakeCase });
    fireEvent.press(getByRole("button", { name: "Tomar caso" }));
    expect(onTakeCase).toHaveBeenCalledTimes(1);
  });

  test("lista las sanciones previas del autor", () => {
    const { getByText } = renderDetail();
    expect(getByText("Advertencia · Acoso")).toBeTruthy();
    expect(getByText("Suspensión · 3 días")).toBeTruthy();
    expect(getByText("2 nov 2026")).toBeTruthy();
  });

  test("avisa al pedir el perfil del autor", () => {
    const onViewAuthorProfile = jest.fn();
    const { getByRole } = renderDetail({ onViewAuthorProfile });
    fireEvent.press(getByRole("link", { name: "Ver perfil" }));
    expect(onViewAuthorProfile).toHaveBeenCalledTimes(1);
  });

  test("lista los otros reportes del mismo contenido", () => {
    const { getByText } = renderDetail();
    expect(getByText("Mismo contenido · 3 reportes")).toBeTruthy();
    expect(
      getByText("El objetivo es el mismo post de @carlos_dev en el perfil de @ana.rmz."),
    ).toBeTruthy();
    expect(getByText("Resuelto")).toBeTruthy();
  });

  test("avisa que reporte relacionado se quiere abrir", () => {
    const onOpenReport = jest.fn();
    const { getByRole } = renderDetail({ onOpenReport });
    fireEvent.press(getByRole("link", { name: "FF-1045" }));
    expect(onOpenReport).toHaveBeenCalledWith("r-1045");
  });

  test("permite volver a la cola", () => {
    const onBack = jest.fn();
    const { getByRole } = renderDetail({ onBack });
    fireEvent.press(getByRole("button", { name: "Volver a la cola" }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});

describe("<ReportDetailScreen /> con un reporte en revision", () => {
  const today = new Date(2026, 10, 8);

  test("muestra el estado y a quien esta asignado", () => {
    const { getByText, queryByRole } = renderDetail({ report: reportInReview });
    expect(getByText("En revisión")).toBeTruthy();
    expect(getByText("Asignado a @admin")).toBeTruthy();
    expect(queryByRole("button", { name: "Tomar caso" })).toBeNull();
  });

  test("indica que la evidencia ya fue revelada", () => {
    const { getByText, queryByText } = renderDetail({ report: reportInReview });
    expect(getByText("Evidencia revelada")).toBeTruthy();
    expect(queryByText(/clic para revelar/)).toBeNull();
  });

  test("resume antecedentes y reportes relacionados", () => {
    const { getByText } = renderDetail({ report: reportInReview });
    expect(getByText("2 advertencias · 1 suspensión")).toBeTruthy();
    expect(getByText("7 nov, 6 nov y 2 nov 2026 · @carlos_dev")).toBeTruthy();
    expect(getByText("3 reportes del mismo contenido")).toBeTruthy();
  });

  test("avisa al pedir el historial y los relacionados", () => {
    const onViewAuthorProfile = jest.fn();
    const onViewRelated = jest.fn();
    const { getByRole } = renderDetail({ report: reportInReview, onViewAuthorProfile, onViewRelated });
    fireEvent.press(getByRole("link", { name: "Ver historial" }));
    fireEvent.press(getByRole("link", { name: "Ver relacionados" }));
    expect(onViewAuthorProfile).toHaveBeenCalledTimes(1);
    expect(onViewRelated).toHaveBeenCalledTimes(1);
  });

  test("entrega la resolucion elegida", () => {
    const onResolve = jest.fn();
    const { getByRole } = renderDetail({ report: reportInReview, referenceDate: today, onResolve });
    fireEvent.press(getByRole("radio", { name: "Advertir al autor" }));
    fireEvent.press(getByRole("button", { name: "Enviar advertencia" }));
    expect(onResolve).toHaveBeenCalledWith({ action: "warn", notes: "" });
  });

  test("cuenta los otros reportes pendientes que se cerraran", () => {
    const { getByText } = renderDetail({ report: reportInReview });
    expect(
      getByText("Se cerrarán también los otros 2 reportes pendientes de este contenido"),
    ).toBeTruthy();
  });
});

describe("<ReportDetailScreen /> con evidencia no disponible", () => {
  test("ofrece recargar cuando el enlace de la evidencia expiro", () => {
    const onReloadEvidence = jest.fn();
    const report = { ...pendingReport, content: { ...pendingReport.content, evidenceStatus: "expired" as const } };
    const { getByText, getByRole, queryByText } = renderDetail({ report, onReloadEvidence });
    expect(getByText("El enlace de evidencia expiró")).toBeTruthy();
    expect(queryByText(/clic para revelar/)).toBeNull();
    fireEvent.press(getByRole("button", { name: "Recargar" }));
    expect(onReloadEvidence).toHaveBeenCalledTimes(1);
  });

  test("explica que el autor borro la publicacion", () => {
    const report = { ...pendingReport, content: { ...pendingReport.content, evidenceStatus: "deleted" as const } };
    const { getByText, queryByText } = renderDetail({ report });
    expect(getByText("Borrado por el autor")).toBeTruthy();
    expect(getByText("El autor borró esta publicación")).toBeTruthy();
    expect(getByText("El reporte y su historial se conservan.")).toBeTruthy();
    expect(queryByText("Visible")).toBeNull();
  });

  test("marca el contenido que ya esta oculto", () => {
    const report = { ...pendingReport, content: { ...pendingReport.content, isVisible: false } };
    const { getByText } = renderDetail({ report });
    expect(getByText("Oculto")).toBeTruthy();
  });
});

describe("<ReportDetailScreen /> en revision por otra persona", () => {
  const takenByOther = { ...pendingReport, status: "in_review" as const, assignee: "@moderador2" };

  test("no permite resolverlo ni tomarlo", () => {
    const { getByRole, queryByText } = renderDetail({ report: takenByOther });
    const button = getByRole("button", { name: "En revisión por @moderador2" });
    expect(button.props.accessibilityState.disabled).toBe(true);
    expect(queryByText("Resolver reporte")).toBeNull();
    expect(queryByText("Tomar caso")).toBeNull();
  });

  test("indica a quien esta asignado", () => {
    const { getByText } = renderDetail({ report: takenByOther });
    expect(getByText("Asignado a @moderador2")).toBeTruthy();
  });
});

describe("<ReportDetailScreen /> confirmaciones", () => {
  const today = new Date(2026, 10, 8);

  test("pide confirmar la suspension antes de aplicarla", () => {
    const onResolve = jest.fn();
    const { getByRole, getByText, getAllByText } = renderDetail({
      report: reportInReview,
      referenceDate: today,
      onResolve,
    });
    fireEvent.press(getByRole("radio", { name: "Suspender autor" }));
    fireEvent.press(getByRole("button", { name: "7 días" }));
    fireEvent.press(getByRole("button", { name: "Aplicar suspensión" }));
    expect(onResolve).not.toHaveBeenCalled();

    expect(getByText("Confirmar suspensión")).toBeTruthy();
    expect(getByText("@carlos_dev no podrá acceder durante 7 días.")).toBeTruthy();
    // la fecha aparece en el panel y en la confirmacion
    expect(getAllByText("Suspendido hasta: 15 nov 2026")).toHaveLength(2);
    expect(getByText("Se cerrarán también los otros 2 reportes pendientes de este contenido.")).toBeTruthy();

    fireEvent.press(getByRole("button", { name: "Suspender" }));
    expect(onResolve).toHaveBeenCalledWith({ action: "suspend", suspensionDays: 7, notes: "" });
  });

  test("cancelar la suspension no la aplica", () => {
    const onResolve = jest.fn();
    const { getByRole, queryByText } = renderDetail({ report: reportInReview, referenceDate: today, onResolve });
    fireEvent.press(getByRole("radio", { name: "Suspender autor" }));
    fireEvent.press(getByRole("button", { name: "7 días" }));
    fireEvent.press(getByRole("button", { name: "Aplicar suspensión" }));
    fireEvent.press(getByRole("button", { name: "Cancelar" }));
    expect(onResolve).not.toHaveBeenCalled();
    expect(queryByText("Confirmar suspensión")).toBeNull();
  });

  test("el baneo se confirma escribiendo el usuario", () => {
    const onResolve = jest.fn();
    const { getByRole, getAllByLabelText, getByLabelText } = renderDetail({ report: reportInReview, onResolve });
    fireEvent.press(getByRole("radio", { name: "Banear autor" }));
    fireEvent.changeText(getByLabelText("Notas internas"), "Reincidencia.");
    fireEvent.press(getByRole("button", { name: "Continuar con el baneo" }));

    const banButton = getByRole("button", { name: "Banear" });
    fireEvent.press(banButton);
    expect(onResolve).not.toHaveBeenCalled();

    fireEvent.changeText(getByLabelText("Escribe @carlos_dev para confirmar"), "@carlos_dev");
    // las notas del panel pasan a la confirmacion y pueden ajustarse ahi
    const notes = getAllByLabelText("Notas internas");
    expect(notes[notes.length - 1].props.value).toBe("Reincidencia.");
    fireEvent.press(getByRole("button", { name: "Banear" }));
    expect(onResolve).toHaveBeenCalledWith({ action: "ban", notes: "Reincidencia." });
  });
});
