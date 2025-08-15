import React from 'react';
import { BookOpen, Brain, ArrowRight } from 'lucide-react';
import { PageType } from '../App';

interface PracticeSelectionProps {
  onNavigate: (page: PageType) => void;
}

const PracticeSelection: React.FC<PracticeSelectionProps> = ({ onNavigate }) => {
  const practiceOptions = [
    {
      id: 'aptitude',
      title: 'Aptitude Practice',
      icon: Brain,
      description: 'Practice aptitude questions without affecting your scores',
      features: ['No time limit', 'Immediate feedback', 'Results not saved', 'Unlimited attempts'],
      action: () => onNavigate('practice-aptitude')
    }
  ];

  return (
    <div className="min-h-screen pt-20 pb-12">
      <div className="container mx-auto px-6 pt-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <BookOpen className="h-8 w-8 text-black" />
              <h1 className="text-4xl md:text-5xl font-bold">Practice Mode</h1>
            </div>
            <p className="text-xl text-gray-600">
              Improve your skills without affecting your official scores
            </p>
          </div>

          {/* Practice Options */}
          <div className="grid md:grid-cols-1 gap-8">
            {practiceOptions.map((option) => (
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
                          <div className="w-2 h-2 bg-black rounded-full"></div>
                          <span className="text-sm text-gray-700">{feature}</span>
                        </div>
                      ))}
                    </div>
                    
                    <button
                      onClick={option.action}
                      className="bg-black hover:bg-gray-800 text-white px-6 py-3 rounded-lg font-semibold flex items-center space-x-2 transition-all duration-200 hover:scale-105"
                    >
                      <span>Start Practice</span>
                      <ArrowRight className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Note */}
          <div className="mt-12 bg-gray-100 border-2 border-black rounded-xl p-6">
            <div className="flex items-start space-x-3">
              <BookOpen className="h-6 w-6 text-black mt-1" />
              <div>
                <h4 className="font-semibold text-black mb-2">Practice Mode Benefits</h4>
                <ul className="text-sm text-black space-y-1">
                  <li>• Practice as many times as you want without time pressure</li>
                  <li>• Get instant feedback on your answers</li>
                  <li>• Your practice scores won't affect your official assessment results</li>
                  <li>• Perfect for learning and skill improvement</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PracticeSelection;
