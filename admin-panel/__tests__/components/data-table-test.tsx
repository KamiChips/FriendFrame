import { fireEvent, render } from "@testing-library/react-native";
import { Text } from "react-native";

import { type Column, DataTable } from "@/components/ui/DataTable";

interface Fruit {
  id: string;
  name: string;
  stock: number;
}

const fruits: Fruit[] = [
  { id: "f1", name: "Mango", stock: 4 },
  { id: "f2", name: "Pera", stock: 0 },
];

const columns: Column<Fruit>[] = [
  { key: "name", header: "Fruta", width: 120, render: (fruit) => <Text>{fruit.name}</Text> },
  { key: "stock", header: "Existencias", render: (fruit) => <Text>{fruit.stock} uds</Text> },
];

describe("<DataTable />", () => {
  test("muestra los encabezados y una fila por elemento", () => {
    const { getByText } = render(
      <DataTable columns={columns} rows={fruits} keyExtractor={(fruit) => fruit.id} />,
    );
    expect(getByText("Fruta")).toBeTruthy();
    expect(getByText("Existencias")).toBeTruthy();
    expect(getByText("Mango")).toBeTruthy();
    expect(getByText("0 uds")).toBeTruthy();
  });

  test("avisa que fila se presiono", () => {
    const onRowPress = jest.fn();
    const { getByRole } = render(
      <DataTable
        columns={columns}
        rows={fruits}
        keyExtractor={(fruit) => fruit.id}
        rowLabel={(fruit) => `Abrir ${fruit.name}`}
        onRowPress={onRowPress}
      />,
    );
    fireEvent.press(getByRole("button", { name: "Abrir Pera" }));
    expect(onRowPress).toHaveBeenCalledWith(fruits[1]);
  });

  test("muestra el pie recibido", () => {
    const { getByText } = render(
      <DataTable
        columns={columns}
        rows={fruits}
        keyExtractor={(fruit) => fruit.id}
        footer={<Text>2 frutas</Text>}
      />,
    );
    expect(getByText("2 frutas")).toBeTruthy();
  });
});
