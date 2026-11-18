import { useFocusEffect } from "expo-router";
import { type DependencyList, useCallback, useRef, useState } from "react";

// carga datos al entrar a la pantalla, al volver a ella y cuando cambian las dependencias.
// conserva los datos anteriores mientras recarga para no parpadear
export function useAsync<T>(load: () => Promise<T>, deps: DependencyList) {
  const [data, setData] = useState<T | undefined>(undefined);
  const [error, setError] = useState<Error | null>(null);
  const [version, setVersion] = useState(0);
  const loadRef = useRef(load);
  loadRef.current = load;

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      loadRef
        .current()
        .then((result) => {
          if (!isActive) return;
          setData(result);
          setError(null);
        })
        .catch((reason: unknown) => {
          if (isActive) setError(reason instanceof Error ? reason : new Error(String(reason)));
        });
      return () => {
        isActive = false;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [...deps, version]),
  );

  const reload = useCallback(() => setVersion((current) => current + 1), []);

  return { data, error, isLoading: data === undefined && error === null, reload };
}
