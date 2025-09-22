import React, { useState } from 'react';
import { Home, User, LogIn, LogOut, BarChart3, BookOpen, Target, Menu, X } from 'lucide-react';
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleMobileNavigate = (page: PageType) => {
    onNavigate(page);
    setIsMobileMenuOpen(false);
  };

  const handleMobileAuth = (mode: 'signin' | 'signup') => {
    handleAuthClick(mode);
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <nav className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-black rounded-xl shadow-lg max-w-7xl w-[95%] sm:w-[85%] md:w-[80%] lg:w-[75%] xl:w-[70%]">
        <div className="px-6 sm:px-8 py-3">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div 
              className="flex items-center space-x-2 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => onNavigate(isAuthenticated ? 'dashboard' : 'landing')}
            >
              <img src="/logo.png" alt="Hiresight Logo" className="h-7 w-7 sm:h-9 sm:w-9" />
              <span className="text-lg sm:text-2xl font-bold text-white">Hiresight</span>
            </div>

            {/* Desktop Navigation Links */}
            {isAuthenticated && (
              <div className="hidden lg:flex items-center space-x-6">
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

            {/* Desktop Auth Buttons */}
            <div className="hidden md:flex items-center space-x-4">
              {isAuthenticated ? (
                <button 
                  onClick={onLogout}
                  className="flex items-center space-x-2 text-white hover:text-gray-300 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </button>
              ) : (
                <>
                  <button 
                    onClick={() => handleAuthClick('signin')}
                    className="flex items-center space-x-2 text-white hover:text-gray-300 transition-colors"
                  >
                    <LogIn className="h-4 w-4" />
                    <span>Login</span>
                  </button>
                  <button 
                    onClick={() => handleAuthClick('signup')}
                    className="bg-white hover:bg-gray-100 text-black px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    Sign Up
                  </button>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={toggleMobileMenu}
              className="md:hidden text-white hover:text-gray-300 transition-colors p-2"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden absolute top-full left-0 right-0 mt-2 bg-black rounded-2xl border-t border-gray-700 shadow-xl">
              <div className="flex flex-col space-y-2 p-4">
                {/* Mobile Navigation Links */}
                {isAuthenticated && (
                  <>
                    {navItems.map(({ id, label, icon: Icon }) => (
                      <button
                        key={id}
                        onClick={() => handleMobileNavigate(id as PageType)}
                        className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                          currentPage === id
                            ? 'text-black bg-white'
                            : 'text-white hover:text-gray-300 hover:bg-gray-800'
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                        <span className="font-medium">{label}</span>
                      </button>
                    ))}
                    <div className="border-t border-gray-700 my-2"></div>
                  </>
                )}

                {/* Mobile Auth Buttons */}
                {isAuthenticated ? (
                  <button 
                    onClick={() => {
                      onLogout();
                      setIsMobileMenuOpen(false);
                    }}
                    className="flex items-center space-x-3 px-4 py-3 text-white hover:text-gray-300 hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    <LogOut className="h-5 w-5" />
                    <span>Logout</span>
                  </button>
                ) : (
                  <>
                    <button 
                      onClick={() => handleMobileAuth('signin')}
                      className="flex items-center space-x-3 px-4 py-3 text-white hover:text-gray-300 hover:bg-gray-800 rounded-lg transition-colors"
                    >
                      <LogIn className="h-5 w-5" />
                      <span>Login</span>
                    </button>
                    <button 
                      onClick={() => handleMobileAuth('signup')}
                      className="mx-4 bg-white hover:bg-gray-100 text-black px-4 py-3 rounded-lg font-medium transition-colors text-center"
                    >
                      Sign Up
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
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