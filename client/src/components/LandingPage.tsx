import React, { useState } from 'react';
import { ArrowRight, CheckCircle, FileText, Video, BarChart3, Star, Users, Target } from 'lucide-react';
import { PageType } from '../App';
import AuthModal from './AuthModal';

interface LandingPageProps {
  onNavigate: (page: PageType) => void;
  onLogin: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onNavigate, onLogin }) => {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');

  const handleAuthClick = (mode: 'signin' | 'signup') => {
    setAuthMode(mode);
    setIsAuthModalOpen(true);
  };

  const handleAuthSuccess = () => {
    setIsAuthModalOpen(false);
    onLogin();
  };

  return (
    <div className="min-h-screen bg-white text-black">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 pt-16 sm:pt-20">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center space-y-8 sm:space-y-12">
            {/* Logo/Brand Mark */}
            <div className="mb-12 sm:mb-20">
              <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4 mb-6">
                <img src="/logo-2.png" alt="Hiresight Logo" className="h-16 w-16 sm:h-20 sm:w-20" />
                <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-tight">
                  Hiresight
                </h1>
              </div>
            </div>
            
            {/* Main Headline */}
            <div className="space-y-6 sm:space-y-">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-tight">
                Ace every interview
              </h1>
              <p className="text-lg sm:text-xl md:text-2xl text-gray-500 font-normal max-w-2xl mx-auto leading-relaxed px-4">
                AI-powered prep platform for job seekers.
              </p>
            </div>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8 sm:pt-12 px-4">
              <button
                onClick={() => handleAuthClick('signin')}
                className="bg-black hover:bg-gray-800 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-full font-medium text-base sm:text-lg transition-all duration-300 hover:scale-105 w-full sm:w-auto"
              >
                Try Interview
              </button>
              <button
                onClick={() => handleAuthClick('signup')}
                className="border-2 border-black hover:bg-black hover:text-white text-black px-6 sm:px-8 py-3 sm:py-4 rounded-full font-medium text-base sm:text-lg transition-all duration-300 w-full sm:w-auto"
              >
                Take Aptitude Test
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Process Steps Section */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 bg-gray-100">
        <div className="container mx-auto max-w-7xl">
          {/* Step 1: Choose Position */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center mb-20 sm:mb-32">
            <div className="space-y-6 sm:space-y-8 text-center lg:text-left">
              <div className="space-y-4 sm:space-y-6">
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight">Choose position.</h2>
                <p className="text-base sm:text-lg text-gray-600 max-w-md leading-relaxed mx-auto lg:mx-0">
                  Select your role and preferred domain—get ready for a tailored experience.
                </p>
              </div>
            </div>
            
            <div className="relative">
              <div className="bg-white border-2 border-gray-200 rounded-2xl p-4 sm:p-8 shadow-lg">
                <div className="space-y-4 sm:space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 sm:p-6 hover:border-black transition-colors cursor-pointer">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 bg-black rounded mb-3 sm:mb-4"></div>
                      <div className="text-xs sm:text-sm font-medium text-black">Frontend Developer</div>
                      <div className="text-xs text-gray-500 mt-1">React, Vue, Angular</div>
                    </div>
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 sm:p-6 hover:border-black transition-colors cursor-pointer">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gray-400 rounded mb-3 sm:mb-4"></div>
                      <div className="text-xs sm:text-sm font-medium text-black">Backend Developer</div>
                      <div className="text-xs text-gray-500 mt-1">Node.js, Python, Java</div>
                    </div>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 sm:p-6 hover:border-black transition-colors cursor-pointer">
                    <div className="flex items-center space-x-3">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gray-300 rounded"></div>
                      <div>
                        <div className="text-xs sm:text-sm font-medium text-black">Data Analyst</div>
                        <div className="text-xs text-gray-500">SQL, Python, Visualization</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Step 2: Aptitude Test */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center mb-20 sm:mb-32">
            <div className="relative order-2 lg:order-1">
              <div className="bg-white border-2 border-gray-200 rounded-2xl p-4 sm:p-8 shadow-lg">
                <div className="space-y-4 sm:space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="text-xs sm:text-sm text-gray-500">Question 3 of 10</div>
                    <div className="text-xs sm:text-sm text-black font-medium">15:30</div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-black h-2 rounded-full w-1/3 transition-all duration-300"></div>
                  </div>
                  <div className="space-y-3 sm:space-y-4">
                    <div className="text-base sm:text-lg font-medium text-black">What is the time complexity of binary search?</div>
                    <div className="space-y-2 sm:space-y-3">
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 sm:p-4 text-sm hover:border-black transition-colors cursor-pointer">O(n)</div>
                      <div className="bg-black text-white rounded-lg p-3 sm:p-4 text-sm">O(log n)</div>
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 sm:p-4 text-sm hover:border-black transition-colors cursor-pointer">O(n²)</div>
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 sm:p-4 text-sm hover:border-black transition-colors cursor-pointer">O(1)</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-6 sm:space-y-8 order-1 lg:order-2 text-center lg:text-left">
              <div className="space-y-4 sm:space-y-6">
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight">Aptitude round.</h2>
                <p className="text-base sm:text-lg text-gray-600 max-w-md leading-relaxed mx-auto lg:mx-0">
                  Tackle questions under time pressure to assess your core skills.
                </p>
              </div>
            </div>
          </div>

          {/* Step 3: Live Interview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center mb-20 sm:mb-32">
            <div className="space-y-6 sm:space-y-8 text-center lg:text-left">
              <div className="space-y-4 sm:space-y-6">
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight">Live interview.</h2>
                <p className="text-base sm:text-lg text-gray-600 max-w-md leading-relaxed mx-auto lg:mx-0">
                  Practice with our AI interviewer in real-time simulation.
                </p>
              </div>
            </div>
            
            <div className="relative">
              <div className="bg-white border-2 border-gray-200 rounded-2xl p-4 sm:p-8 shadow-lg">
                <div className="space-y-4 sm:space-y-6">
                  <div className="flex items-center space-x-3 sm:space-x-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-black rounded-full flex items-center justify-center">
                      <span className="text-white text-xs sm:text-sm font-medium">AI</span>
                    </div>
                    <div>
                      <div className="text-xs sm:text-sm font-medium text-black">AI Interviewer</div>
                      <div className="text-xs text-gray-500">Sarah - Senior Technical</div>
                    </div>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 sm:p-6">
                    <div className="text-xs sm:text-sm text-black leading-relaxed">
                      "Tell me about a challenging project you've worked on recently and how you overcame the obstacles."
                    </div>
                  </div>
                  <div className="flex items-center justify-center space-x-4 sm:space-x-6 pt-3 sm:pt-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-500 rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 sm:w-3 sm:h-3 bg-white rounded-full animate-pulse"></div>
                    </div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-200 border-2 border-gray-300 rounded-full flex items-center justify-center hover:border-black transition-colors cursor-pointer">
                      <Video className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Step 4: Feedback */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
            <div className="relative order-2 lg:order-1">
              <div className="bg-white border-2 border-gray-200 rounded-2xl p-4 sm:p-8 shadow-lg">
                <div className="space-y-4 sm:space-y-6">
                  <div className="text-center">
                    <div className="text-4xl sm:text-5xl font-bold text-green-600 mb-2">85%</div>
                    <div className="text-xs sm:text-sm text-gray-500">Overall Score</div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 sm:gap-6">
                    <div className="text-center">
                      <div className="text-xl sm:text-2xl font-bold text-green-600">82%</div>
                      <div className="text-xs text-gray-500">Technical Skills</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl sm:text-2xl font-bold text-yellow-500">78%</div>
                      <div className="text-xs text-gray-500">Communication</div>
                    </div>
                  </div>
                  <div className="space-y-2 sm:space-y-3">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4">
                      <div className="text-xs sm:text-sm text-green-700 flex items-center">
                        <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                        Strong technical knowledge
                      </div>
                    </div>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 sm:p-4">
                      <div className="text-xs sm:text-sm text-yellow-700 flex items-center">
                        <span className="w-3 h-3 sm:w-4 sm:h-4 mr-2 text-yellow-500">⚠</span>
                        Improve confidence level
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-6 sm:space-y-8 order-1 lg:order-2 text-center lg:text-left">
              <div className="space-y-4 sm:space-y-6">
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight">Get feedback.</h2>
                <p className="text-base sm:text-lg text-gray-600 max-w-md leading-relaxed mx-auto lg:mx-0">
                  Detailed insights and personalized improvement suggestions.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 bg-gray-50 border-t border-gray-200">
        <div className="container mx-auto max-w-5xl">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-12 text-center">
            <div className="space-y-2 sm:space-y-3">
              <div className="text-3xl sm:text-4xl md:text-5xl font-bold text-black">10K+</div>
              <div className="text-sm sm:text-base text-gray-600">Interviews Completed</div>
            </div>
            <div className="space-y-2 sm:space-y-3">
              <div className="text-3xl sm:text-4xl md:text-5xl font-bold text-black">95%</div>
              <div className="text-sm sm:text-base text-gray-600">Success Rate</div>
            </div>
            <div className="space-y-2 sm:space-y-3">
              <div className="text-3xl sm:text-4xl md:text-5xl font-bold text-black">4.9/5</div>
              <div className="text-sm sm:text-base text-gray-600">User Rating</div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 bg-white">
        <div className="container mx-auto max-w-4xl text-center">
          <div className="space-y-8 sm:space-y-10">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight">
              Ready to ace your next interview?
            </h2>
            <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Join thousands of job seekers who have improved their interview skills with Hiresight.
            </p>
            <button
              onClick={() => handleAuthClick('signup')}
              className="bg-black hover:bg-gray-800 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-full font-medium text-base sm:text-lg transition-all duration-300 hover:scale-105 inline-flex items-center space-x-2"
            >
              <span>Get Started Now</span>
              <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          </div>
        </div>
      </section>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLogin={handleAuthSuccess}
        initialMode={authMode}
      />

      {/* Footer */}
      <footer className="bg-black text-white py-12 sm:py-16 px-4 sm:px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 sm:gap-12">
            {/* Brand Section */}
            <div className="space-y-4 sm:space-y-6 sm:col-span-2 md:col-span-1">
              <div className="flex items-center space-x-2">
                <img src="/logo.png" alt="Hiresight Logo" className="h-6 w-6 sm:h-8 sm:w-8" />
                <span className="text-lg sm:text-xl font-bold">Hiresight</span>
              </div>
              <p className="text-gray-400 text-xs sm:text-sm leading-relaxed">
                AI-powered interview preparation platform helping job seekers ace their interviews with confidence.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" clipRule="evenodd" />
                  </svg>
                </a>
              </div>
            </div>

            {/* Product Links */}
            <div className="space-y-4 sm:space-y-6">
              <h3 className="text-base sm:text-lg font-semibold">Product</h3>
              <ul className="space-y-2 sm:space-y-3 text-xs sm:text-sm">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Interview Practice</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Aptitude Tests</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">AI Feedback</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Progress Tracking</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Mock Interviews</a></li>
              </ul>
            </div>

            {/* Resources Links */}
            <div className="space-y-4 sm:space-y-6">
              <h3 className="text-base sm:text-lg font-semibold">Resources</h3>
              <ul className="space-y-2 sm:space-y-3 text-xs sm:text-sm">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Interview Tips</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Career Guides</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Technical Questions</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Success Stories</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Blog</a></li>
              </ul>
            </div>

            {/* Company Links */}
            <div className="space-y-4 sm:space-y-6">
              <h3 className="text-base sm:text-lg font-semibold">Company</h3>
              <ul className="space-y-2 sm:space-y-3 text-xs sm:text-sm">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Contact</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="border-t border-gray-800 mt-8 sm:mt-12 pt-6 sm:pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
              <div className="text-gray-400 text-xs sm:text-sm text-center md:text-left">
                © 2025 Hiresight. All rights reserved.
              </div>
              <div className="flex items-center space-x-4 sm:space-x-6 text-xs sm:text-sm text-gray-400">
                <a href="#" className="hover:text-white transition-colors">Privacy</a>
                <a href="#" className="hover:text-white transition-colors">Terms</a>
                <a href="#" className="hover:text-white transition-colors">Cookies</a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;