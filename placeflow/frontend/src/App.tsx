/**
 * PlaceFlow / Meridian — Main Application Entrypoint (Phase 4).
 *
 * Mounts global AuthProvider, Toast notifications, and authoritative AppRouter.
 */

import React from 'react';
import { AppProviders } from './app/AppProviders';
import { AppRouter } from './app/router';

export function App() {
  return (
    <AppProviders>
      <AppRouter />
    </AppProviders>
  );
}

export default App;
