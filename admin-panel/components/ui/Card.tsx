import type { ReactNode } from "react";
import { View } from "react-native";

export interface CardProps {
  // clases extra de layout: padding, gap, flex, ancho
  className?: string;
  // radio de las esquinas; "lg" es el de la tarjeta de acceso
  radius?: "md" | "lg";
  children: ReactNode;
}

const radii = { md: "rounded-2xl", lg: "rounded-3xl" };

// superficie con borde y esquinas redondeadas comun a todas las tarjetas
export function Card({ className = "", radius = "md", children }: CardProps) {
  return (
    <View
      className={`overflow-hidden bg-surface-light dark:bg-surface-dark ${radii[radius]} ${className}`}
    >
      {children}
      {/* el borde va superpuesto para no ocupar espacio: en el diseno el relleno se mide desde el canto */}
      <View
        pointerEvents="none"
        className={`absolute inset-0 border border-line-light dark:border-line-dark ${radii[radius]}`}
      />
    </View>
  );
}
