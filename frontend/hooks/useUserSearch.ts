// hooks/useUserSearch.ts
import { useState, useEffect, useRef, useCallback } from 'react';
import { searchUsers } from "@/services/supabase/profile/queries";
import type { SearchResult } from "@/services/supabase/profile/types";

const DEBOUNCE_MS = 300;

interface UseUserSearchOptions {
  currentUserId: string | undefined;
  limit?: number;
  debounceMs?: number;
}

interface UseUserSearchReturn {
  query: string;
  setQuery: (q: string) => void;
  results: SearchResult[];
  loading: boolean;
  error: string | null;
  clear: () => void;
}

export function useUserSearch({
  currentUserId,
  limit = 20,
  debounceMs = DEBOUNCE_MS,
}: UseUserSearchOptions): UseUserSearchReturn {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef(false);

  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    abortRef.current = false;

    const trimmed = query.trim();

    // Refleja la validación de searchUsers: retorna [] sin llamar al backend
    if (trimmed.length < 2) {
      setResults([]);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);

    debounceTimer.current = setTimeout(async () => {
      if (!currentUserId) {
        setError('No hay sesión activa.');
        setLoading(false);
        return;
      }

      // Llama directo a tu función — ella ya sanitiza, valida y llama al RPC
      const { data, error: searchError } = await searchUsers(
        trimmed,
        currentUserId,
        limit,
      );

      if (abortRef.current) return; // descarta respuestas desactualizadas

      setLoading(false);

      if (searchError) {
        setError(searchError);
        setResults([]);
      } else {
        setError(null);
        setResults(data ?? []);
      }
    }, debounceMs);

    return () => {
      abortRef.current = true;
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [query, currentUserId, limit, debounceMs]);

  const clear = useCallback(() => {
    setQuery('');
    setResults([]);
    setError(null);
    setLoading(false);
  }, []);

  return { query, setQuery, results, loading, error, clear };
}