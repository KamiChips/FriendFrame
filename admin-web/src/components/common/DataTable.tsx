import type { ReactNode } from "react";
import { Link } from "react-router";

import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

export interface Column<Row> {
  key: string;
  header: string;
  // ancho fijo en px; sin el la columna ocupa el espacio restante
  width?: number;
  render: (row: Row) => ReactNode;
}

export interface DataTableProps<Row> {
  // nombre accesible de la tabla
  label: string;
  columns: Column<Row>[];
  rows: Row[];
  getRowKey: (row: Row) => string;
  // alto de fila en px
  rowHeight?: number;
  // "comfortable" da mas aire a tablas con filas de dos lineas
  density?: "compact" | "regular" | "comfortable";
  isRowHighlighted?: (row: Row) => boolean;
  // fila entera como enlace: un clic en cualquier parte abre el destino, y se puede abrir en otra pestana
  rowLink?: (row: Row) => { to: string; label: string };
  footer?: ReactNode;
}

const densities = {
  compact: { cell: "px-2 first:pl-4 last:pr-4", header: "h-10 text-xs" },
  regular: { cell: "px-2 first:pl-5 last:pr-5", header: "h-11 text-xs" },
  comfortable: { cell: "px-2.5 first:pl-[22px] last:pr-[22px]", header: "h-11 text-[13px]" },
};

export function DataTable<Row>({
  label,
  columns,
  rows,
  getRowKey,
  rowHeight = 50,
  density = "compact",
  isRowHighlighted,
  rowLink,
  footer,
}: DataTableProps<Row>) {
  const styles = densities[density];

  return (
    <Card className="gap-0 overflow-hidden py-0">
      <Table aria-label={label} className="table-fixed">
        <colgroup>
          {columns.map((column) => (
            <col key={column.key} style={column.width ? { width: column.width } : undefined} />
          ))}
        </colgroup>
        <TableHeader className="bg-soft">
          <TableRow className="hover:bg-transparent">
            {columns.map((column) => (
              <TableHead
                key={column.key}
                className={cn("font-normal text-muted-foreground", styles.cell, styles.header)}
              >
                {column.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => {
            const key = getRowKey(row);
            const link = rowLink?.(row);
            return (
              <TableRow
                key={key}
                data-testid={`row-${key}`}
                className={cn(
                  "border-line hover:bg-soft/60",
                  link && "relative cursor-pointer",
                  isRowHighlighted?.(row) && "bg-highlight",
                )}
                style={{ height: rowHeight }}
              >
                {columns.map((column, index) => (
                  <TableCell key={column.key} className={cn("truncate", styles.cell)}>
                    {/* el enlace se estira sobre toda la fila */}
                    {link && index === 0 && (
                      <Link
                        to={link.to}
                        aria-label={link.label}
                        className="absolute inset-0 z-10 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                      />
                    )}
                    {column.render(row)}
                  </TableCell>
                ))}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      {footer}
    </Card>
  );
}
