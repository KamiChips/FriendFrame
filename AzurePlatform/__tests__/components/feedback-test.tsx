import { fireEvent, render } from "@testing-library/react-native";
import { Text } from "react-native";

import { ErrorMessage } from "@/components/layout/ErrorMessage";
import { StatePanel } from "@/components/layout/StatePanel";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { NotesField } from "@/components/ui/NotesField";
import { SkeletonRow } from "@/components/ui/Skeleton";
import { TextField } from "@/components/ui/TextField";
import { Toast } from "@/components/ui/Toast";

describe("<Toast />", () => {
  test("muestra titulo y detalle y se puede cerrar", () => {
    const onDismiss = jest.fn();
    const { getByText, getByRole } = render(
      <Toast
        variant="success"
        title="Suspensión aplicada"
        message="@carlos_dev · Hasta el 15 nov 2026"
        onDismiss={onDismiss}
      />,
    );
    expect(getByText("Suspensión aplicada")).toBeTruthy();
    expect(getByText("@carlos_dev · Hasta el 15 nov 2026")).toBeTruthy();
    fireEvent.press(getByRole("button", { name: "Cerrar aviso" }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  test("usa un icono distinto para exito y error", () => {
    const { getByTestId, rerender } = render(<Toast variant="success" title="Listo" />);
    expect(getByTestId("icon-circle-check")).toBeTruthy();
    rerender(<Toast variant="error" title="No se pudo aplicar la acción" />);
    expect(getByTestId("icon-circle-alert")).toBeTruthy();
  });

  test("se anuncia a los lectores de pantalla", () => {
    const { getByRole } = render(<Toast variant="error" title="Falló" />);
    expect(getByRole("alert")).toBeTruthy();
  });
});

describe("<ConfirmDialog />", () => {
  function renderDialog(overrides = {}) {
    const props = {
      visible: true,
      icon: "clock-3" as const,
      title: "Confirmar suspensión",
      description: "@carlos_dev no podrá acceder durante 7 días.",
      confirmLabel: "Suspender",
      onConfirm: jest.fn(),
      onCancel: jest.fn(),
      ...overrides,
    };
    return { props, ...render(<ConfirmDialog {...props} />) };
  }

  test("muestra titulo, descripcion e icono", () => {
    const { getByText, getByTestId } = renderDialog();
    expect(getByText("Confirmar suspensión")).toBeTruthy();
    expect(getByText("@carlos_dev no podrá acceder durante 7 días.")).toBeTruthy();
    expect(getByTestId("icon-clock-3")).toBeTruthy();
  });

  test("confirma o cancela con sus botones", () => {
    const { props, getByRole } = renderDialog();
    fireEvent.press(getByRole("button", { name: "Suspender" }));
    fireEvent.press(getByRole("button", { name: "Cancelar" }));
    expect(props.onConfirm).toHaveBeenCalledTimes(1);
    expect(props.onCancel).toHaveBeenCalledTimes(1);
  });

  test("no confirma mientras falten datos", () => {
    const { props, getByRole } = renderDialog({ confirmDisabled: true });
    fireEvent.press(getByRole("button", { name: "Suspender" }));
    expect(props.onConfirm).not.toHaveBeenCalled();
  });

  test("incluye el contenido propio de cada flujo", () => {
    const { getByText } = renderDialog({ children: <Text>Suspendido hasta: 15 nov 2026</Text> });
    expect(getByText("Suspendido hasta: 15 nov 2026")).toBeTruthy();
  });

  test("no se muestra cerrado", () => {
    const { queryByText } = renderDialog({ visible: false });
    expect(queryByText("Confirmar suspensión")).toBeNull();
  });
});

describe("<NotesField />", () => {
  test("indica si es obligatorio y cuenta los caracteres", () => {
    const { getByText, getByLabelText } = render(
      <NotesField value="Acoso reiterado" onChangeText={jest.fn()} required />,
    );
    expect(getByText("Notas internas · obligatorio")).toBeTruthy();
    expect(getByText("15 / 500")).toBeTruthy();
    expect(getByLabelText("Notas internas").props.maxLength).toBe(500);
  });

  test("avisa cuando cambia el texto", () => {
    const onChangeText = jest.fn();
    const { getByLabelText } = render(<NotesField value="" onChangeText={onChangeText} />);
    fireEvent.changeText(getByLabelText("Notas internas"), "Revisión completa");
    expect(onChangeText).toHaveBeenCalledWith("Revisión completa");
  });
});

describe("<TextField /> con error", () => {
  test("muestra el mensaje de error debajo del campo", () => {
    const { getByText } = render(
      <TextField label="Notas internas" value="" error="Este campo es obligatorio." />,
    );
    expect(getByText("Este campo es obligatorio.")).toBeTruthy();
  });
});

describe("<SkeletonRow />", () => {
  test("se anuncia como contenido en carga", () => {
    const { getAllByLabelText } = render(
      <>
        <SkeletonRow />
        <SkeletonRow />
      </>,
    );
    expect(getAllByLabelText("Cargando")).toHaveLength(2);
  });
});

describe("<StatePanel />", () => {
  test("muestra icono, titulo, texto y accion", () => {
    const onAction = jest.fn();
    const { getByText, getByTestId, getByRole } = render(
      <StatePanel
        icon="heart-handshake"
        title="No hay reportes pendientes 🎉"
        description="La comunidad está al día."
        actionLabel="Reintentar"
        onAction={onAction}
      />,
    );
    expect(getByTestId("icon-heart-handshake")).toBeTruthy();
    expect(getByText("No hay reportes pendientes 🎉")).toBeTruthy();
    expect(getByText("La comunidad está al día.")).toBeTruthy();
    fireEvent.press(getByRole("button", { name: "Reintentar" }));
    expect(onAction).toHaveBeenCalledTimes(1);
  });
});

describe("<ErrorMessage />", () => {
  test("muestra el codigo, la explicacion y la salida", () => {
    const onAction = jest.fn();
    const { getByText, getByRole } = render(
      <ErrorMessage
        code="403"
        title="No tienes permiso para ver esta sección"
        description="Esta sección está disponible solo para administradores."
        actionLabel="Volver al dashboard"
        onAction={onAction}
      />,
    );
    expect(getByText("403")).toBeTruthy();
    expect(getByText("No tienes permiso para ver esta sección")).toBeTruthy();
    fireEvent.press(getByRole("button", { name: "Volver al dashboard" }));
    expect(onAction).toHaveBeenCalledTimes(1);
  });
});
