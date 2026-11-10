/**
 * PlaceFlow / Meridian — useResource Data Hook (Phase 4).
 *
 * Provides a standardized loading / error / data / refetch lifecycle
 * for portal pages and components.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { ApiError } from './errors';

export interface ResourceState<T> {
  data: T | null;
  loading: boolean;
  error: ApiError | Error | null;
  refetch: () => Promise<void>;
  setData: React.Dispatch<React.SetStateAction<T | null>>;
}

export function useResource<T>(
  fetcher: () => Promise<T>,
  deps: React.DependencyList = []
): ResourceState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<ApiError | Error | null>(null);

  // Keep a ref to the latest fetcher to avoid stale closure issues
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const execute = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetcherRef.current();
      setData(res);
    } catch (err: any) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, deps);

  useEffect(() => {
    execute();
  }, [execute]);

  return { data, loading, error, refetch: execute, setData };
}

