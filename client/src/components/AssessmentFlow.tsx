import React, { useState, useEffect } from 'react';
import { Target, Trophy, ArrowRight, CheckCircle, Brain } from 'lucide-react';
import { PageType } from '../App';
import { aptitudeAPI } from '../services/aptitudeAPI';

interface AssessmentFlowProps {
  onNavigate: (page: PageType) => void;
  hasPreviousScore: boolean;
}

const AssessmentFlow: React.FC<AssessmentFlowProps> = ({ onNavigate, hasPreviousScore }) => {
  const [latestScore, setLatestScore] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Get the latest aptitude score from database
  useEffect(() => {
    const fetchLatestScore = async () => {
      try {
        const testHistory = await aptitudeAPI.getTestHistory();
        // The API already filters for completed tests and non-practice tests
        if (testHistory.length > 0) {
          // Get the most recent completed test score (they're already sorted by completedAt desc)
          const mostRecent = testHistory[0];
          setLatestScore(Math.round(mostRecent.overallScore));
        }
      } catch (error) {
        console.error('Error fetching latest score:', error);
        // Fallback to localStorage
        const savedHistory = localStorage.getItem('hiresight_history');
        if (savedHistory) {
          const historyItems = JSON.parse(savedHistory);
          const aptitudeTests = historyItems.filter((item: any) => item.type === 'aptitude' && item.status === 'completed');
          if (aptitudeTests.length > 0) {
            setLatestScore(aptitudeTests[0].score);
          }
        }
      } finally {
        setIsLoading(false);
      }
    };

    if (hasPreviousScore) {
      fetchLatestScore();
    } else {
      setIsLoading(false);
    }
  }, [hasPreviousScore]);

  const assessmentOptions = [
    {
      id: 'new-assessment',
      title: 'Complete New Assessment',
      description: 'Take a fresh aptitude test followed by interview',
      icon: Brain,
      features: ['New aptitude test', 'Fresh interview questions', 'Complete evaluation', 'Results saved to profile'],
      action: () => onNavigate('position')
    }
  ];

  if (hasPreviousScore && !isLoading && latestScore !== null) {
    assessmentOptions.unshift({
      id: 'continue-assessment',
      title: 'Continue with Previous Score',
      description: `Use your previous aptitude score (${latestScore}%) and proceed to interview`,
      icon: Trophy,
      features: ['Skip aptitude test', 'Use previous score', 'Direct to interview', 'Faster assessment'],
      action: () => onNavigate('assessment-position')
    });
  }

  return (
    <div className="min-h-screen pt-20 pb-12">
      <div className="container mx-auto px-6 pt-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <Target className="h-8 w-8 text-black" />
              <h1 className="text-4xl md:text-5xl font-bold">Official Assessment</h1>
            </div>
            <p className="text-xl text-gray-600">
              Complete your assessment and get evaluated for your target role
            </p>
          </div>

          {/* Assessment Flow Options */}
          <div className="space-y-6">
            {hasPreviousScore && isLoading && (
              <div className="bg-white border-2 border-gray-200 rounded-xl p-8">
                <div className="flex items-center justify-center space-x-3">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-black"></div>
                  <span className="text-gray-600">Loading your previous score...</span>
                </div>
              </div>
            )}
            
            {assessmentOptions.map((option) => (
              <div
                key={option.id}
                className="bg-white border-2 border-gray-200 rounded-xl p-8 hover:border-black transition-all duration-200 hover:shadow-lg"
              >
                <div className="flex items-start space-x-6">
                  <div className="p-4 bg-gray-100 rounded-xl">
                    <option.icon className="h-8 w-8 text-black" />
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold mb-3">{option.title}</h3>
                    <p className="text-gray-600 mb-6">{option.description}</p>
                    
                    <div className="grid md:grid-cols-2 gap-4 mb-6">
                      {option.features.map((feature, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4 text-black" />
                          <span className="text-sm text-gray-700">{feature}</span>
                        </div>
                      ))}
                    </div>
                    
                    <button
                      onClick={option.action}
                      className="bg-black hover:bg-gray-800 text-white px-6 py-3 rounded-lg font-semibold flex items-center space-x-2 transition-all duration-200 hover:scale-105"
                    >
                      <span>
                        {option.id === 'continue-assessment' ? 'Continue Assessment' : 'Start New Assessment'}
                      </span>
                      <ArrowRight className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Assessment Info */}
          <div className="mt-12 bg-gray-100 border-2 border-black rounded-xl p-6">
            <div className="flex items-start space-x-3">
              <Target className="h-6 w-6 text-black mt-1" />
              <div>
                <h4 className="font-semibold text-black mb-2">Assessment Information</h4>
                <ul className="text-sm text-black space-y-1">
                  <li>• Official assessments are saved to your profile and count towards your performance history</li>
                  <li>• Results are analyzed by our AI system to provide detailed feedback</li>
                  <li>• You can retake assessments anytime to improve your scores</li>
                  {hasPreviousScore && (
                    <li>• Using previous aptitude scores allows you to focus on interview preparation</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssessmentFlow;
