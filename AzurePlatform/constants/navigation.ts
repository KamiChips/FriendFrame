import type { IconName } from "@/components/ui/Icon";

export type SectionKey = "dashboard" | "reports" | "users" | "audit" | "team";

export interface Section {
  key: SectionKey;
  label: string;
  icon: IconName;
  // ruta de la seccion en la app
  href: string;
}

// secciones fijas de la consola de moderacion
export const sections: Section[] = [
  { key: "dashboard", href: "/dashboard", label: "Dashboard", icon: "layout-dashboard" },
  { key: "reports", href: "/reports", label: "Reportes", icon: "flag" },
  { key: "users", href: "/users", label: "Usuarios", icon: "users" },
  { key: "audit", href: "/audit", label: "Bitácora", icon: "history" },
  { key: "team", href: "/team", label: "Equipo", icon: "shield-check" },
];
