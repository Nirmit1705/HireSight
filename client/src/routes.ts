import React from 'react';
import LandingPage from './components/LandingPage';
import Dashboard from './components/Dashboard';
import PositionSelection from './components/PositionSelection';
import AptitudeTest from './components/AptitudeTest';
import LiveInterview from './components/LiveInterview';
import Feedback from './components/Feedback';
import UserProfile from './components/UserProfile';
import History from './components/History';
import PracticeSelection from './components/PracticeSelection';
import AssessmentFlow from './components/AssessmentFlow';
import { AppState } from './context/AppStateContext';

export type PageType = 'landing' | 'dashboard' | 'position' | 'aptitude' | 'interview' | 'feedback' | 'profile' | 'history' | 'history-detail' | 'practice' | 'practice-aptitude' | 'assessment' | 'assessment-position';

// Route Configuration
export interface RouteConfig {
  path: string;
  pageKey: PageType;
  component: React.ComponentType<any>;
  requiresAuth: boolean;
  props?: Record<string, any>;
}

// Route definitions
export const createRouteConfig = (
  appState: AppState, 
  handleNavigate: (page: PageType, historyId?: string) => void,
  handleLogin: () => void,
  HistoryDetailWrapper: React.ComponentType<{ onNavigate: (page: PageType, historyId?: string) => void }>
): RouteConfig[] => [
  {
    path: '/',
    pageKey: 'landing',
    component: LandingPage,
    requiresAuth: false,
    props: { onNavigate: handleNavigate, onLogin: handleLogin }
  },
  {
    path: '/dashboard',
    pageKey: 'dashboard',
    component: Dashboard,
    requiresAuth: true
  },
  {
    path: '/position',
    pageKey: 'position',
    component: PositionSelection,
    requiresAuth: true,
    props: {
      onNavigate: handleNavigate,
      selectedPosition: appState.selectedPosition,
      setSelectedPosition: appState.setSelectedPosition,
      selectedDomain: appState.selectedDomain,
      setSelectedDomain: appState.setSelectedDomain
    }
  },
  {
    path: '/aptitude',
    pageKey: 'aptitude',
    component: AptitudeTest,
    requiresAuth: true,
    props: { onNavigate: handleNavigate, setTestScore: appState.setTestScore }
  },
  {
    path: '/practice',
    pageKey: 'practice',
    component: PracticeSelection,
    requiresAuth: true,
    props: { onNavigate: handleNavigate }
  },
  {
    path: '/practice/aptitude',
    pageKey: 'practice-aptitude',
    component: AptitudeTest,
    requiresAuth: true,
    props: { 
      onNavigate: handleNavigate, 
      setTestScore: appState.setTestScore,
      isPracticeMode: true
    }
  },
  {
    path: '/assessment',
    pageKey: 'assessment',
    component: AssessmentFlow,
    requiresAuth: true,
    props: { 
      onNavigate: handleNavigate, 
      hasPreviousScore: appState.hasPreviousAptitudeScore 
    }
  },
  {
    path: '/assessment/position',
    pageKey: 'assessment-position',
    component: PositionSelection,
    requiresAuth: true,
    props: {
      onNavigate: handleNavigate,
      selectedPosition: appState.selectedPosition,
      setSelectedPosition: appState.setSelectedPosition,
      selectedDomain: appState.selectedDomain,
      setSelectedDomain: appState.setSelectedDomain,
      isAssessmentMode: true
    }
  },
  {
    path: '/interview',
    pageKey: 'interview',
    component: LiveInterview,
    requiresAuth: true,
    props: { onNavigate: handleNavigate, setInterviewScore: appState.setInterviewScore }
  },
  {
    path: '/feedback',
    pageKey: 'feedback',
    component: Feedback,
    requiresAuth: true,
    props: {
      onNavigate: handleNavigate,
      position: appState.selectedPosition,
      domain: appState.selectedDomain,
      testScore: appState.testScore,
      interviewScore: appState.interviewScore
    }
  },
  {
    path: '/profile',
    pageKey: 'profile',
    component: UserProfile,
    requiresAuth: true,
    props: { onNavigate: handleNavigate }
  },
  {
    path: '/history',
    pageKey: 'history',
    component: History,
    requiresAuth: true,
    props: { onNavigate: handleNavigate }
  },
  {
    path: '/history/:id',
    pageKey: 'history-detail',
    component: HistoryDetailWrapper,
    requiresAuth: true,
    props: { onNavigate: handleNavigate }
  }
];
