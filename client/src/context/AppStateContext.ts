import { createContext } from 'react';
import { ResumeAnalysis } from '../services/aiInterviewAPI';

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
  resumeAnalysis: ResumeAnalysis | null;
  setResumeAnalysis: (analysis: ResumeAnalysis | null) => void;
  isAiMode: boolean;
  setIsAiMode: (isAi: boolean) => void;
}

export const AppStateContext = createContext<AppState | undefined>(undefined);
