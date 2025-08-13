import React from 'react';
import { BarChart3, Target, TrendingUp, Award, AlertCircle, CheckCircle, ArrowRight, RefreshCw } from 'lucide-react';
import { PageType } from '../App';
import RadarChart from './RadarChart';

interface FeedbackProps {
  onNavigate: (page: PageType) => void;
  position: string;
  domain: string;
  testScore: number;
  interviewScore: number;
}

const Feedback: React.FC<FeedbackProps> = ({ onNavigate, position, domain, testScore, interviewScore }) => {
  const overallScore = Math.round((testScore + interviewScore) / 2);
  
  const strengths = [
    { area: 'Technical Knowledge', score: 85, description: 'Strong understanding of core concepts' },
    { area: 'Communication', score: 78, description: 'Clear and articulate responses' },
    { area: 'Problem Solving', score: 82, description: 'Good analytical approach' },
  ];

  const improvements = [
    { area: 'Confidence', severity: 'medium', description: 'Work on speaking with more authority' },
    { area: 'Clarity', severity: 'low', description: 'Occasionally unclear in explanations' },
    { area: 'Technical Depth', severity: 'high', description: 'Need more detailed technical examples' },
  ];

  const suggestions = [
    {
      title: 'Practice Technical Scenarios',
      description: 'Work on more complex technical problems and be prepared to explain your approach step by step.',
      action: 'Take more practice interviews'
    },
    {
      title: 'Improve Communication Skills',
      description: 'Practice speaking clearly and confidently. Consider recording yourself to identify areas for improvement.',
      action: 'Join communication workshops'
    },
    {
      title: 'Expand Technical Knowledge',
      description: 'Deepen your understanding of advanced concepts in your field. Focus on practical applications.',
      action: 'Study advanced topics'
    }
  ];

  const radarData = [
    { label: 'Fluency', value: 78 },
    { label: 'Grammar', value: 75 },
    { label: 'Confidence', value: 70 },
    { label: 'Technical Knowledge', value: 85 },
    { label: 'Vocabulary', value: 77 }
  ];

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBackground = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen pt-20 pb-12">
      <div className="container mx-auto px-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <Award className="h-16 w-16 text-black mx-auto mb-4" />
            <h1 className="text-4xl font-bold mb-4">Interview Feedback</h1>
            <p className="text-xl text-gray-600">
              Comprehensive analysis of your {position} interview performance
            </p>
          </div>

          {/* Overall Score */}
          <div className="bg-white border-2 border-gray-200 rounded-xl p-8 mb-8 shadow-lg">
            <div className="text-center">
              <div className={`text-6xl font-bold mb-2 ${getScoreColor(overallScore)}`}>
                {overallScore}%
              </div>
              <div className="text-xl text-gray-700 mb-4">Overall Score</div>
              <div className="flex justify-center space-x-8">
                <div className="text-center">
                  <div className={`text-2xl font-bold ${getScoreColor(testScore)}`}>{testScore}%</div>
                  <div className="text-sm text-gray-600">Aptitude Test</div>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${getScoreColor(interviewScore)}`}>{interviewScore}%</div>
                  <div className="text-sm text-gray-600">Interview Performance</div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Strengths */}
            <div className="bg-white border-2 border-gray-200 rounded-xl p-6 shadow-lg">
              <div className="flex items-center space-x-2 mb-6">
                <CheckCircle className="h-6 w-6 text-black" />
                <h2 className="text-2xl font-bold">Strengths</h2>
              </div>
              
              <div className="space-y-4">
                {strengths.map((strength, index) => (
                  <div key={index} className="border-l-4 border-black pl-4">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-semibold">{strength.area}</h3>
                      <span className={`font-bold ${getScoreColor(strength.score)}`}>{strength.score}%</span>
                    </div>
                    <p className="text-gray-600 text-sm">{strength.description}</p>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-500 ${getScoreBackground(strength.score)}`}
                        style={{ width: `${strength.score}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Areas for Improvement */}
            <div className="bg-white border-2 border-gray-200 rounded-xl p-6 shadow-lg">
              <div className="flex items-center space-x-2 mb-6">
                <AlertCircle className="h-6 w-6 text-black" />
                <h2 className="text-2xl font-bold">Areas for Improvement</h2>
              </div>
              
              <div className="space-y-4">
                {improvements.map((improvement, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-semibold">{improvement.area}</h3>
                      <span className={`px-2 py-1 rounded text-xs border ${getSeverityColor(improvement.severity)}`}>
                        {improvement.severity}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm">{improvement.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Suggestions */}
          <div className="mt-8 bg-white border-2 border-gray-200 rounded-xl p-6 shadow-lg">
            <div className="flex items-center space-x-2 mb-6">
              <TrendingUp className="h-6 w-6 text-black" />
              <h2 className="text-2xl font-bold">Personalized Suggestions</h2>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {suggestions.map((suggestion, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                  <h3 className="font-semibold mb-3 text-black">{suggestion.title}</h3>
                  <p className="text-gray-600 text-sm mb-4">{suggestion.description}</p>
                  <button className="text-black text-sm hover:text-gray-700 transition-colors font-medium">
                    {suggestion.action} →
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Detailed Analytics */}
          <div className="mt-8 bg-white border-2 border-gray-200 rounded-xl p-6 shadow-lg">
            <div className="flex items-center space-x-2 mb-6">
              <BarChart3 className="h-6 w-6 text-black" />
              <h2 className="text-2xl font-bold">Detailed Analytics</h2>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="font-semibold mb-4">Performance Breakdown</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Response Time</span>
                    <span className="text-green-600">Excellent</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Answer Completeness</span>
                    <span className="text-yellow-600">Good</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Technical Accuracy</span>
                    <span className="text-green-600">Very Good</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Communication Style</span>
                    <span className="text-yellow-600">Needs Work</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold mb-4">Compared to Others</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Overall Rank</span>
                    <span className="text-green-600">Top 25%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Technical Skills</span>
                    <span className="text-green-600">Top 20%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Communication</span>
                    <span className="text-yellow-600">Top 40%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Problem Solving</span>
                    <span className="text-green-600">Top 30%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Performance Radar Chart */}
          <div className="mt-8 bg-white border-2 border-gray-200 rounded-xl p-6 shadow-lg">
            <div className="flex items-center space-x-2 mb-6">
              <Target className="h-6 w-6 text-black" />
              <h2 className="text-2xl font-bold">Performance Radar</h2>
            </div>
            
            <div className="grid lg:grid-cols-2 gap-8 items-center">
              <div className="flex justify-center">
                <RadarChart data={radarData} size={350} />
              </div>
              
              <div className="space-y-4">
                <h3 className="text-lg font-semibold mb-4">Performance Analysis</h3>
                <div className="space-y-3">
                  {radarData.map((item, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium">{item.label}</span>
                      <span className={`font-bold ${getScoreColor(item.value)}`}>
                        {item.value}%
                      </span>
                    </div>
                  ))}
                </div>
                
                <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="font-semibold text-blue-900 mb-2">Performance Insights</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Technical knowledge is your strongest area</li>
                    <li>• Focus on building confidence in delivery</li>
                    <li>• Grammar improvement will enhance clarity</li>
                    <li>• Fluency and vocabulary are solid foundations</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => onNavigate('position')}
              className="bg-black hover:bg-gray-800 text-white px-8 py-4 rounded-lg font-semibold flex items-center justify-center space-x-2 transition-all duration-200 hover:scale-105"
            >
              <RefreshCw className="h-5 w-5" />
              <span>Practice Again</span>
            </button>
            <button
              onClick={() => onNavigate('profile')}
              className="bg-white hover:bg-gray-50 text-black px-8 py-4 rounded-lg font-semibold border-2 border-black flex items-center justify-center space-x-2 transition-all duration-200"
            >
              <span>View Profile</span>
              <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Feedback;