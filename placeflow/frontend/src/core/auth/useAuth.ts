/**
 * PlaceFlow / Meridian — useAuth Hook (Phase 4).
 */

import { useContext } from 'react';
import { AuthContext, AuthContextType } from './AuthProvider';

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

