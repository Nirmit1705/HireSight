import React, { useMemo } from 'react';
import { Routes, Route, Navigate, useParams } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import HistoryDetail from './components/HistoryDetail';
import { createRouteConfig, PageType } from './routes';
import { AppState } from './context/AppStateContext';

interface AppRoutesProps {
  appState: AppState;
  handleNavigate: (page: PageType, historyId?: string) => void;
  handleLogin: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Wrapper components for routes with params
const HistoryDetailWrapper: React.FC<{ onNavigate: (page: PageType, historyId?: string) => void }> = ({ onNavigate }) => {
  const { id } = useParams<{ id: string }>();
  return <HistoryDetail onNavigate={onNavigate} historyId={id || ''} />;
};

export const AppRoutes: React.FC<AppRoutesProps> = ({
  appState,
  handleNavigate,
  handleLogin,
  isAuthenticated,
  isLoading
}) => {
  const routeConfig = useMemo(() => 
    createRouteConfig(appState, handleNavigate, handleLogin, HistoryDetailWrapper),
    [appState, handleNavigate, handleLogin]
  );

  return (
    <Routes>
      {routeConfig.map((route) => {
        const Component = route.component;
        const element = route.requiresAuth ? (
          <ProtectedRoute isAuthenticated={isAuthenticated} isLoading={isLoading}>
            <Component {...(route.props || {})} />
          </ProtectedRoute>
        ) : (
          <Component {...(route.props || {})} />
        );

        return (
          <Route 
            key={route.path} 
            path={route.path} 
            element={element} 
          />
        );
      })}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
