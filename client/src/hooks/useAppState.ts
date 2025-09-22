import { useState } from 'react';
import { AppState } from '../context/AppStateContext';
import { ResumeAnalysis } from '../services/aiInterviewAPI';

export const useAppState = (): AppState => {
  const [selectedPosition, setSelectedPosition] = useState('');
  const [selectedDomain, setSelectedDomain] = useState('');
  const [testScore, setTestScore] = useState(0);
  const [interviewScore, setInterviewScore] = useState(0);
  const [hasPreviousAptitudeScore, setHasPreviousAptitudeScore] = useState(false);
  const [resumeAnalysis, setResumeAnalysis] = useState<ResumeAnalysis | null>(null);
  const [isAiMode, setIsAiMode] = useState(false);

  return {
    selectedPosition,
    setSelectedPosition,
    selectedDomain,
    setSelectedDomain,
    testScore,
    setTestScore,
    interviewScore,
    setInterviewScore,
    hasPreviousAptitudeScore,
    setHasPreviousAptitudeScore,
    resumeAnalysis,
    setResumeAnalysis,
    isAiMode,
    setIsAiMode,
  };
};
