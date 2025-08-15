import { useContext } from 'react';
import { AppStateContext } from '../context/AppStateContext';

export const useAppStateContext = () => {
  const context = useContext(AppStateContext);
  if (context === undefined) {
    throw new Error('useAppStateContext must be used within an AppStateProvider');
  }
  return context;
};
