import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { AppState } from '../context/AppStateContext';
import { aptitudeAPI } from '../services/aptitudeAPI';

export const useHistoryManager = (appState: AppState, isAuthenticated: boolean) => {
  const location = useLocation();
  const feedbackVisitedRef = useRef(false);

  useEffect(() => {
    if (isAuthenticated) {
      // Check for previous aptitude scores from database
      const checkPreviousScores = async () => {
        try {
          const testHistory = await aptitudeAPI.getTestHistory();
          // The API already filters for completed tests and non-practice tests
          const hasCompletedAptitudeTest = testHistory.length > 0;
          appState.setHasPreviousAptitudeScore(hasCompletedAptitudeTest);
        } catch (error) {
          console.error('Error fetching test history:', error);
          // Fallback to localStorage if API fails
          const savedHistory = localStorage.getItem('hiresight_history');
          if (savedHistory) {
            const historyItems = JSON.parse(savedHistory);
            const hasAptitudeScore = historyItems.some((item: any) => item.type === 'aptitude' && item.status === 'completed');
            appState.setHasPreviousAptitudeScore(hasAptitudeScore);
          }
        }
      };

      checkPreviousScores();
    }
  }, [isAuthenticated, appState]);

  useEffect(() => {
    if (location.pathname === '/feedback' && !feedbackVisitedRef.current && 
        (appState.testScore > 0 || appState.interviewScore > 0)) {
      feedbackVisitedRef.current = true;
      
      const newHistoryItem = {
        id: Date.now().toString(),
        type: 'interview' as const,
        date: new Date().toISOString().split('T')[0],
        score: appState.interviewScore,
        position: appState.selectedPosition,
        domain: appState.selectedDomain,
        duration: '25:30',
        status: 'completed' as const,
        testScore: appState.testScore
      };

      const savedHistory = localStorage.getItem('hiresight_history');
      const historyItems = savedHistory ? JSON.parse(savedHistory) : [];
      historyItems.unshift(newHistoryItem);
      localStorage.setItem('hiresight_history', JSON.stringify(historyItems));
    }

    // Reset flag when leaving feedback page
    if (location.pathname !== '/feedback') {
      feedbackVisitedRef.current = false;
    }
  }, [location.pathname, appState]);
};
