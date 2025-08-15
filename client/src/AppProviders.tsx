import React from 'react';
import { AppStateContext, AppState } from './context/AppStateContext';

interface AppProvidersProps {
  appState: AppState;
  children: React.ReactNode;
}

export const AppProviders: React.FC<AppProvidersProps> = ({ appState, children }) => {
  return (
    <AppStateContext.Provider value={appState}>
      {children}
    </AppStateContext.Provider>
  );
};
