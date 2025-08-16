import React from 'react';
import { BrowserRouter as Router, useNavigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import { AppProviders } from './AppProviders';
import { AppRoutes } from './AppRoutes';
import { useAuth } from './hooks/useAuth';
import { useAppState } from './hooks/useAppState';
import { useHistoryManager } from './hooks/useHistoryManager';
import { createRouteConfig, PageType } from './routes';

export type { PageType } from './routes';

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, isLoading, handleLogin, handleLogout } = useAuth();
  const appState = useAppState();
  
  useHistoryManager(appState, isAuthenticated);

  const handleNavigate = (page: PageType, historyId?: string) => {
    const routeConfig = createRouteConfig(appState, handleNavigate, handleLogin, () => null);
    const route = routeConfig.find(r => r.pageKey === page);
    
    if (!route) {
      console.warn(`Route not found for page: ${page}`);
      return;
    }

    let path = route.path;
    if (historyId && page === 'history-detail') {
      path = path.replace(':id', historyId);
    }
    
    navigate(path);
  };

  const getCurrentPage = (): PageType => {
    const routeConfig = createRouteConfig(appState, handleNavigate, handleLogin, () => null);
    const currentRoute = routeConfig.find(route => {
      if (route.path.includes(':id')) {
        return location.pathname.startsWith(route.path.split('/:')[0]);
      }
      return route.path === location.pathname;
    });
    
    return currentRoute?.pageKey || 'landing';
  };

  return (
    <AppProviders appState={appState}>
      <div className="min-h-screen bg-white text-black font-inter">
        <Navbar 
          currentPage={getCurrentPage()} 
          onNavigate={handleNavigate} 
          isAuthenticated={isAuthenticated}
          onLogin={handleLogin}
          onLogout={handleLogout}
        />
        <main className="relative">
          <AppRoutes
            appState={appState}
            handleNavigate={handleNavigate}
            handleLogin={handleLogin}
            isAuthenticated={isAuthenticated}
            isLoading={isLoading}
          />
        </main>
      </div>
    </AppProviders>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;