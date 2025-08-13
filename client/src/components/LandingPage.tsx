import React, { useState } from 'react';
import { ArrowRight, CheckCircle, Brain, FileText, Video, BarChart3, Star, Users, Target } from 'lucide-react';
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
      <section className="relative min-h-screen flex items-center justify-center px-6 pt-20">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center space-y-12">
            {/* Logo/Brand Mark */}
            <div className="mb-20">
              <Brain className="h-12 w-12 text-black mx-auto mb-6" />
            </div>
            
            {/* Main Headline */}
            <div className="space-y-8">
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-tight">
                Ace every interview.
              </h1>
              <p className="text-xl md:text-2xl text-gray-500 font-normal max-w-2xl mx-auto leading-relaxed">
                AI-powered prep platform for job seekers.
              </p>
            </div>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-12">
              <button
                onClick={() => handleAuthClick('signin')}
                className="bg-black hover:bg-gray-800 text-white px-8 py-4 rounded-full font-medium text-lg transition-all duration-300 hover:scale-105"
              >
                Try Interview
              </button>
              <button
                onClick={() => handleAuthClick('signup')}
                className="border-2 border-black hover:bg-black hover:text-white text-black px-8 py-4 rounded-full font-medium text-lg transition-all duration-300"
              >
                Take Aptitude Test
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Process Steps Section */}
      <section className="py-24 px-6 bg-white">
        <div className="container mx-auto max-w-7xl">
          {/* Step 1: Choose Position */}
          <div className="grid lg:grid-cols-2 gap-16 items-center mb-32">
            <div className="space-y-8">
              <div className="space-y-6">
                <h2 className="text-4xl md:text-5xl font-bold leading-tight">Choose position.</h2>
                <p className="text-lg text-gray-600 max-w-md leading-relaxed">
                  Select your role and preferred domain—get ready for a tailored experience.
                </p>
              </div>
            </div>
            
            <div className="relative">
              <div className="bg-white border-2 border-gray-200 rounded-2xl p-8 shadow-lg">
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 hover:border-black transition-colors cursor-pointer">
                      <div className="w-8 h-8 bg-black rounded mb-4"></div>
                      <div className="text-sm font-medium text-black">Frontend Developer</div>
                      <div className="text-xs text-gray-500 mt-1">React, Vue, Angular</div>
                    </div>
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 hover:border-black transition-colors cursor-pointer">
                      <div className="w-8 h-8 bg-gray-400 rounded mb-4"></div>
                      <div className="text-sm font-medium text-black">Backend Developer</div>
                      <div className="text-xs text-gray-500 mt-1">Node.js, Python, Java</div>
                    </div>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 hover:border-black transition-colors cursor-pointer">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gray-300 rounded"></div>
                      <div>
                        <div className="text-sm font-medium text-black">Data Analyst</div>
                        <div className="text-xs text-gray-500">SQL, Python, Visualization</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Step 2: Aptitude Test */}
          <div className="grid lg:grid-cols-2 gap-16 items-center mb-32">
            <div className="relative order-2 lg:order-1">
              <div className="bg-white border-2 border-gray-200 rounded-2xl p-8 shadow-lg">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-500">Question 3 of 10</div>
                    <div className="text-sm text-black font-medium">15:30</div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-black h-2 rounded-full w-1/3 transition-all duration-300"></div>
                  </div>
                  <div className="space-y-4">
                    <div className="text-lg font-medium text-black">What is the time complexity of binary search?</div>
                    <div className="space-y-3">
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm hover:border-black transition-colors cursor-pointer">O(n)</div>
                      <div className="bg-black text-white rounded-lg p-4 text-sm">O(log n)</div>
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm hover:border-black transition-colors cursor-pointer">O(n²)</div>
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm hover:border-black transition-colors cursor-pointer">O(1)</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-8 order-1 lg:order-2">
              <div className="space-y-6">
                <h2 className="text-4xl md:text-5xl font-bold leading-tight">Aptitude round.</h2>
                <p className="text-lg text-gray-600 max-w-md leading-relaxed">
                  Tackle questions under time pressure to assess your core skills.
                </p>
              </div>
            </div>
          </div>

          {/* Step 3: Live Interview */}
          <div className="grid lg:grid-cols-2 gap-16 items-center mb-32">
            <div className="space-y-8">
              <div className="space-y-6">
                <h2 className="text-4xl md:text-5xl font-bold leading-tight">Live interview.</h2>
                <p className="text-lg text-gray-600 max-w-md leading-relaxed">
                  Practice with our AI interviewer in real-time simulation.
                </p>
              </div>
            </div>
            
            <div className="relative">
              <div className="bg-white border-2 border-gray-200 rounded-2xl p-8 shadow-lg">
                <div className="space-y-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-medium">AI</span>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-black">AI Interviewer</div>
                      <div className="text-xs text-gray-500">Sarah - Senior Technical</div>
                    </div>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
                    <div className="text-sm text-black leading-relaxed">
                      "Tell me about a challenging project you've worked on recently and how you overcame the obstacles."
                    </div>
                  </div>
                  <div className="flex items-center justify-center space-x-6 pt-4">
                    <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center">
                      <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                    </div>
                    <div className="w-12 h-12 bg-gray-200 border-2 border-gray-300 rounded-full flex items-center justify-center hover:border-black transition-colors cursor-pointer">
                      <Video className="w-5 h-5 text-gray-600" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Step 4: Feedback */}
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="relative order-2 lg:order-1">
              <div className="bg-white border-2 border-gray-200 rounded-2xl p-8 shadow-lg">
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="text-5xl font-bold text-green-600 mb-2">85%</div>
                    <div className="text-sm text-gray-500">Overall Score</div>
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">82%</div>
                      <div className="text-xs text-gray-500">Technical Skills</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-500">78%</div>
                      <div className="text-xs text-gray-500">Communication</div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="text-sm text-green-700 flex items-center">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Strong technical knowledge
                      </div>
                    </div>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="text-sm text-yellow-700 flex items-center">
                        <span className="w-4 h-4 mr-2 text-yellow-500">⚠</span>
                        Improve confidence level
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-8 order-1 lg:order-2">
              <div className="space-y-6">
                <h2 className="text-4xl md:text-5xl font-bold leading-tight">Get feedback.</h2>
                <p className="text-lg text-gray-600 max-w-md leading-relaxed">
                  Detailed insights and personalized improvement suggestions.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24 px-6 bg-gray-50 border-t border-gray-200">
        <div className="container mx-auto max-w-5xl">
          <div className="grid md:grid-cols-3 gap-12 text-center">
            <div className="space-y-3">
              <div className="text-4xl md:text-5xl font-bold text-black">10K+</div>
              <div className="text-gray-600">Interviews Completed</div>
            </div>
            <div className="space-y-3">
              <div className="text-4xl md:text-5xl font-bold text-black">95%</div>
              <div className="text-gray-600">Success Rate</div>
            </div>
            <div className="space-y-3">
              <div className="text-4xl md:text-5xl font-bold text-black">4.9/5</div>
              <div className="text-gray-600">User Rating</div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-24 px-6 bg-white">
        <div className="container mx-auto max-w-4xl text-center">
          <div className="space-y-10">
            <h2 className="text-4xl md:text-5xl font-bold leading-tight">
              Ready to ace your next interview?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Join thousands of job seekers who have improved their interview skills with Hiresight.
            </p>
            <button
              onClick={() => handleAuthClick('signup')}
              className="bg-black hover:bg-gray-800 text-white px-8 py-4 rounded-full font-medium text-lg transition-all duration-300 hover:scale-105 inline-flex items-center space-x-2"
            >
              <span>Get Started Now</span>
              <ArrowRight className="h-5 w-5" />
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
    </div>
  );
};

export default LandingPage;