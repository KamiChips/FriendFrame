import { useState } from "react";

export interface Option<T> {
  label: string;
  // undefined significa "sin filtro"
  value: T | undefined;
}

// selector que avanza a la siguiente opcion en cada toque; sustituye un menu desplegable
export function useCycle<T>(options: Option<T>[], initialIndex = 0) {
  const [index, setIndex] = useState(initialIndex);

  return {
    option: options[index],
    next: () => setIndex((current) => (current + 1) % options.length),
    reset: () => setIndex(initialIndex),
  };
}
