import React, { useState } from 'react';
import { Brain, Home, User, LogIn, LogOut, BarChart3, BookOpen, Target } from 'lucide-react';
import { PageType } from '../App';
import AuthModal from './AuthModal';

interface NavbarProps {
  currentPage: PageType;
  onNavigate: (page: PageType) => void;
  isAuthenticated: boolean;
  onLogin: () => void;
  onLogout: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ currentPage, onNavigate, isAuthenticated, onLogin, onLogout }) => {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'practice', label: 'Practice', icon: BookOpen },
    { id: 'assessment', label: 'Assessment', icon: Target },
    { id: 'history', label: 'History', icon: BarChart3 },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  const handleAuthClick = (mode: 'signin' | 'signup') => {
    setAuthMode(mode);
    setIsAuthModalOpen(true);
  };

  const handleAuthSuccess = () => {
    setIsAuthModalOpen(false);
    onLogin();
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div 
              className="flex items-center space-x-2 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => onNavigate(isAuthenticated ? 'dashboard' : 'landing')}
            >
              <Brain className="h-8 w-8 text-white" />
              <span className="text-xl font-bold text-white">Hiresight</span>
            </div>

            {/* Navigation Links */}
            {isAuthenticated && (
              <div className="hidden md:flex items-center space-x-8">
                {navItems.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => onNavigate(id as PageType)}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200 ${
                      currentPage === id
                        ? 'text-black bg-white'
                        : 'text-white hover:text-gray-300 hover:bg-gray-800'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="font-medium">{label}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Auth Buttons */}
            <div className="flex items-center space-x-4">
              {isAuthenticated ? (
                <button 
                  onClick={onLogout}
                  className="hidden md:flex items-center space-x-2 text-white hover:text-gray-300 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </button>
              ) : (
                <>
                  <button 
                    onClick={() => handleAuthClick('signin')}
                    className="hidden md:flex items-center space-x-2 text-white hover:text-gray-300 transition-colors"
                  >
                    <LogIn className="h-4 w-4" />
                    <span>Login</span>
                  </button>
                  <button 
                    onClick={() => handleAuthClick('signup')}
                    className="bg-white hover:bg-gray-100 text-black px-6 py-2 rounded-lg font-medium transition-colors border border-gray-300"
                  >
                    Sign Up
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLogin={handleAuthSuccess}
        initialMode={authMode}
      />
    </>
  );
};

export default Navbar;