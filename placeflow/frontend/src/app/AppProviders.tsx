/**
 * PlaceFlow / Meridian — Global Application Providers (Phase 4).
 *
 * Provides AuthProvider, BrowserRouter, and Toast notifications.
 * Strictly eliminates PersonaContext and localStorage persona leakage.
 */

import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider } from '../core/auth/AuthProvider';

export const AppProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <BrowserRouter>
      <AuthProvider>
        {children}
        <Toaster position="top-right" richColors closeButton />
      </AuthProvider>
    </BrowserRouter>
  );
};

export default AppProviders;

