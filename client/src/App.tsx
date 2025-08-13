import React, { useState } from 'react';
import Navbar from './components/Navbar';
import LandingPage from './components/LandingPage';
import Dashboard from './components/Dashboard';
import PositionSelection from './components/PositionSelection';
import AptitudeTest from './components/AptitudeTest';
import LiveInterview from './components/LiveInterview';
import Feedback from './components/Feedback';
import UserProfile from './components/UserProfile';
import History from './components/History';
import HistoryDetail from './components/HistoryDetail';

export type PageType = 'landing' | 'dashboard' | 'position' | 'aptitude' | 'interview' | 'feedback' | 'profile' | 'history' | 'history-detail';

function App() {
  const [currentPage, setCurrentPage] = useState<PageType>('landing');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState('');
  const [selectedDomain, setSelectedDomain] = useState('');
  const [testScore, setTestScore] = useState(0);
  const [interviewScore, setInterviewScore] = useState(0);
  const [currentHistoryId, setCurrentHistoryId] = useState<string>('');

  const handleLogin = () => {
    setIsAuthenticated(true);
    setCurrentPage('dashboard');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentPage('landing');
  };

  const handleNavigation = (page: PageType, historyId?: string) => {
    setCurrentPage(page);
    if (historyId) {
      setCurrentHistoryId(historyId);
    }
  };

  // Save attempt to history when feedback is reached
  React.useEffect(() => {
    if (currentPage === 'feedback' && (testScore > 0 || interviewScore > 0)) {
      const newHistoryItem = {
        id: Date.now().toString(),
        type: 'interview' as const,
        date: new Date().toISOString().split('T')[0],
        score: interviewScore,
        position: selectedPosition,
        domain: selectedDomain,
        duration: '25:30', // Mock duration
        status: 'completed' as const,
        testScore: testScore
      };

      const savedHistory = localStorage.getItem('hiresight_history');
      const historyItems = savedHistory ? JSON.parse(savedHistory) : [];
      historyItems.unshift(newHistoryItem);
      localStorage.setItem('hiresight_history', JSON.stringify(historyItems));
    }
  }, [currentPage, testScore, interviewScore, selectedPosition, selectedDomain]);

  const renderPage = () => {
    switch (currentPage) {
      case 'landing':
        return <LandingPage onNavigate={handleNavigation} onLogin={handleLogin} />;
      case 'dashboard':
        return <Dashboard onNavigate={handleNavigation} />;
      case 'position':
        return (
          <PositionSelection
            onNavigate={handleNavigation}
            selectedPosition={selectedPosition}
            setSelectedPosition={setSelectedPosition}
            selectedDomain={selectedDomain}
            setSelectedDomain={setSelectedDomain}
          />
        );
      case 'aptitude':
        return <AptitudeTest onNavigate={handleNavigation} setTestScore={setTestScore} />;
      case 'interview':
        return <LiveInterview onNavigate={handleNavigation} setInterviewScore={setInterviewScore} />;
      case 'feedback':
        return (
          <Feedback
            onNavigate={handleNavigation}
            position={selectedPosition}
            domain={selectedDomain}
            testScore={testScore}
            interviewScore={interviewScore}
          />
        );
      case 'profile':
        return <UserProfile onNavigate={handleNavigation} />;
      case 'history':
        return <History onNavigate={handleNavigation} />;
      case 'history-detail':
        return <HistoryDetail onNavigate={handleNavigation} historyId={currentHistoryId} />;
      default:
        return <LandingPage onNavigate={handleNavigation} onLogin={handleLogin} />;
    }
  };

  return (
    <div className="min-h-screen bg-white text-black font-inter">
      <Navbar 
        currentPage={currentPage} 
        onNavigate={handleNavigation} 
        isAuthenticated={isAuthenticated}
        onLogin={handleLogin}
        onLogout={handleLogout}
      />
      <main className="relative">
        {renderPage()}
      </main>
    </div>
  );
}

export default App;