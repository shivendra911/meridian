/**
 * PlaceFlow / Meridian — useCan Permission Helpers (Phase 4).
 */

import { useAuth } from './useAuth';

export function useCan(permission: string): boolean {
  const { can } = useAuth();
  return can(permission);
}

export function useCanAny(permissions: string[]): boolean {
  const { canAny } = useAuth();
  return canAny(permissions);
}

export function useCanAll(permissions: string[]): boolean {
  const { canAll } = useAuth();
  return canAll(permissions);
}

