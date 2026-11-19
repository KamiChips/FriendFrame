import type { ReactNode } from "react";
import { Pressable, Text, View } from "react-native";

import { Card } from "./Card";

export interface Column<Row> {
  key: string;
  header: string;
  // ancho fijo en px; sin el la columna ocupa el espacio restante
  width?: number;
  render: (row: Row) => ReactNode;
}

export interface DataTableProps<Row> {
  columns: Column<Row>[];
  rows: Row[];
  keyExtractor: (row: Row) => string;
  rowHeight?: number;
  // "comfortable" da mas aire a tablas con filas de dos lineas
  density?: Density;
  headerHeight?: number;
  isRowHighlighted?: (row: Row) => boolean;
  // con onRowPress cada fila es un boton; rowLabel le da nombre accesible
  onRowPress?: (row: Row) => void;
  rowLabel?: (row: Row) => string;
  rowTestID?: (row: Row) => string;
  footer?: ReactNode;
}

type Density = "compact" | "regular" | "comfortable";

// separacion y tamano de encabezado de cada densidad, segun las tablas del diseno
const densities: Record<Density, { spacing: string; headerText: string; headerHeight: number }> = {
  compact: { spacing: "gap-3 px-4", headerText: "text-xs leading-[14px]", headerHeight: 40 },
  regular: { spacing: "gap-4 px-5", headerText: "text-xs leading-[14px]", headerHeight: 44 },
  comfortable: { spacing: "gap-5 px-[22px]", headerText: "text-[13px] leading-4", headerHeight: 42 },
};

function cellStyle(width?: number) {
  return width === undefined ? { flex: 1, minWidth: 0 } : { width };
}

export function DataTable<Row>({
  columns,
  rows,
  keyExtractor,
  rowHeight = 50,
  density = "compact",
  headerHeight,
  isRowHighlighted,
  onRowPress,
  rowLabel,
  rowTestID,
  footer,
}: DataTableProps<Row>) {
  const { spacing, headerText, headerHeight: defaultHeaderHeight } = densities[density];

  return (
    <Card>
      <View
        className={`flex-row items-center bg-soft-light dark:bg-soft-dark ${spacing}`}
        style={{ height: headerHeight ?? defaultHeaderHeight }}
      >
        {columns.map((column) => (
          <Text
            key={column.key}
            style={cellStyle(column.width)}
            className={`font-spartan text-muted-light dark:text-muted-dark ${headerText}`}
          >
            {column.header}
          </Text>
        ))}
      </View>

      {rows.map((row) => {
        const cells = columns.map((column) => (
          <View key={column.key} style={cellStyle(column.width)}>
            {column.render(row)}
          </View>
        ));
        const className = `flex-row items-center border-b border-line-light dark:border-line-dark ${spacing} ${isRowHighlighted?.(row) ? "bg-highlight-light dark:bg-highlight-dark" : ""}`;

        return onRowPress ? (
          <Pressable
            key={keyExtractor(row)}
            accessibilityRole="button"
            accessibilityLabel={rowLabel?.(row)}
            testID={rowTestID?.(row)}
            onPress={() => onRowPress(row)}
            className={className}
            style={{ height: rowHeight }}
          >
            {cells}
          </Pressable>
        ) : (
          <View
            key={keyExtractor(row)}
            testID={rowTestID?.(row)}
            className={className}
            style={{ height: rowHeight }}
          >
            {cells}
          </View>
        );
      })}

      {footer}
    </Card>
  );
}
