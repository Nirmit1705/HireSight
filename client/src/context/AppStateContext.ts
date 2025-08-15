import { createContext } from 'react';

// App State Context
export interface AppState {
  selectedPosition: string;
  setSelectedPosition: (position: string) => void;
  selectedDomain: string;
  setSelectedDomain: (domain: string) => void;
  testScore: number;
  setTestScore: (score: number) => void;
  interviewScore: number;
  setInterviewScore: (score: number) => void;
  hasPreviousAptitudeScore: boolean;
  setHasPreviousAptitudeScore: (hasScore: boolean) => void;
}

export const AppStateContext = createContext<AppState | undefined>(undefined);
