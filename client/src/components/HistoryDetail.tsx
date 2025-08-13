import React, { useState, useEffect } from 'react';
import { BarChart3, Target, TrendingUp, Award, AlertCircle, CheckCircle, ArrowLeft, ArrowRight, RefreshCw, Clock } from 'lucide-react';
import { PageType } from '../App';
import RadarChart from './RadarChart';

interface HistoryDetailProps {
  onNavigate: (page: PageType) => void;
  historyId: string;
}

interface HistoryItem {
  id: string;
  type: 'aptitude' | 'interview';
  date: string;
  score: number;
  position?: string;
  domain?: string;
  duration?: string;
  status: 'completed' | 'in-progress';
  testScore?: number;
  interviewScore?: number;
  detailedResults?: Array<{
    question: string;
    options: string[];
    selectedAnswer: number;
    correctAnswer: number;
    isCorrect: boolean;
  }>;
}

const HistoryDetail: React.FC<HistoryDetailProps> = ({ onNavigate, historyId }) => {
  const [historyItem, setHistoryItem] = useState<HistoryItem | null>(null);

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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  useEffect(() => {
    // Load specific history item from localStorage
    const savedHistory = localStorage.getItem('hiresight_history');
    if (savedHistory) {
      const historyItems: HistoryItem[] = JSON.parse(savedHistory);
      const item = historyItems.find(h => h.id === historyId);
      if (item) {
        // Add mock detailed scores for interview display
        setHistoryItem({
          ...item,
          testScore: item.type === 'interview' ? Math.floor(Math.random() * 20) + 70 : item.score,
          interviewScore: item.type === 'interview' ? item.score : 0
        });
      }
    }
  }, [historyId]);

  if (!historyItem) {
    return (
      <div className="min-h-screen pt-20 pb-12 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-600 mb-2">History item not found</h2>
          <button
            onClick={() => onNavigate('history')}
            className="text-black hover:text-gray-600 transition-colors"
          >
            ← Back to History
          </button>
        </div>
      </div>
    );
  }

  // Render aptitude test detailed results
  if (historyItem.type === 'aptitude') {
    const correctAnswers = historyItem.detailedResults?.filter(r => r.isCorrect).length || 0;
    const totalQuestions = historyItem.detailedResults?.length || 0;
    const incorrectAnswers = totalQuestions - correctAnswers;

    return (
      <div className="min-h-screen pt-20 pb-12">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            {/* Back Button */}
            <button
              onClick={() => onNavigate('history')}
              className="flex items-center space-x-2 text-gray-600 hover:text-black transition-colors mb-6"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to History</span>
            </button>

            {/* Header */}
            <div className="text-center mb-12">
              <Award className="h-16 w-16 text-black mx-auto mb-4" />
              <h1 className="text-4xl font-bold mb-4">Aptitude Test Results</h1>
              <p className="text-xl text-gray-600">
                Detailed breakdown from {formatDate(historyItem.date)}
              </p>
            </div>

            {/* Overall Score Summary */}
            <div className="bg-white border-2 border-gray-200 rounded-xl p-8 mb-8 shadow-lg">
              <div className="text-center mb-6">
                <div className={`text-6xl font-bold mb-2 ${getScoreColor(historyItem.score)}`}>
                  {historyItem.score}%
                </div>
                <div className="text-xl text-gray-700 mb-4">Overall Score</div>
                <div className="text-gray-600">
                  Completed in {historyItem.duration || 'N/A'}
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-green-50 rounded-lg p-4 border border-green-200 text-center">
                  <div className="text-2xl font-bold text-green-600">{correctAnswers}</div>
                  <div className="text-sm text-green-700">Correct</div>
                </div>
                <div className="bg-red-50 rounded-lg p-4 border border-red-200 text-center">
                  <div className="text-2xl font-bold text-red-600">{incorrectAnswers}</div>
                  <div className="text-sm text-red-700">Incorrect</div>
                </div>
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200 text-center">
                  <div className="text-2xl font-bold text-blue-600">{totalQuestions}</div>
                  <div className="text-sm text-blue-700">Total Questions</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 text-center">
                  <div className="text-2xl font-bold text-gray-600">
                    {Math.round((historyItem.score / 100) * totalQuestions)}
                  </div>
                  <div className="text-sm text-gray-700">Score Points</div>
                </div>
              </div>
            </div>

            {/* Question-by-Question Breakdown */}
            {historyItem.detailedResults && (
              <div className="bg-white border-2 border-gray-200 rounded-xl p-6 mb-8 shadow-lg">
                <h3 className="text-2xl font-bold mb-6 flex items-center">
                  <BarChart3 className="h-6 w-6 mr-2" />
                  Question-by-Question Analysis
                </h3>
                
                <div className="space-y-6">
                  {historyItem.detailedResults.map((result, index) => (
                    <div key={index} className={`border-2 rounded-lg p-6 ${
                      result.isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                    }`}>
                      <div className="flex items-start justify-between mb-4">
                        <h4 className="font-semibold text-lg flex items-center">
                          <span className="mr-3">Q{index + 1}.</span>
                          {result.question}
                        </h4>
                        <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                          result.isCorrect 
                            ? 'bg-green-100 text-green-800 border border-green-200' 
                            : 'bg-red-100 text-red-800 border border-red-200'
                        }`}>
                          {result.isCorrect ? 'Correct' : 'Incorrect'}
                        </div>
                      </div>
                      
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <h5 className="font-medium text-gray-700 mb-3">Answer Options:</h5>
                          <div className="space-y-2">
                            {result.options.map((option, optIndex) => (
                              <div key={optIndex} className={`p-3 rounded border-2 text-sm ${
                                optIndex === result.correctAnswer 
                                  ? 'border-green-400 bg-green-100 text-green-800' 
                                  : optIndex === result.selectedAnswer && !result.isCorrect
                                  ? 'border-red-400 bg-red-100 text-red-800'
                                  : 'border-gray-200 bg-white text-gray-700'
                              }`}>
                                <div className="flex items-center space-x-2">
                                  <span className="font-medium">{String.fromCharCode(65 + optIndex)}.</span>
                                  <span>{option}</span>
                                  {optIndex === result.correctAnswer && (
                                    <CheckCircle className="h-4 w-4 text-green-600 ml-auto" />
                                  )}
                                  {optIndex === result.selectedAnswer && !result.isCorrect && (
                                    <AlertCircle className="h-4 w-4 text-red-600 ml-auto" />
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        <div>
                          <div className="space-y-3">
                            <div>
                              <span className="font-medium text-gray-700">Your Answer: </span>
                              <span className={`font-medium ${result.isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                                {result.selectedAnswer !== undefined ? String.fromCharCode(65 + result.selectedAnswer) : 'Not answered'}
                              </span>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">Correct Answer: </span>
                              <span className="font-medium text-green-600">
                                {String.fromCharCode(65 + result.correctAnswer)}
                              </span>
                            </div>
                            {!result.isCorrect && (
                              <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mt-3">
                                <p className="text-sm text-yellow-800">
                                  <strong>Explanation:</strong> The correct answer is "{result.options[result.correctAnswer]}" 
                                  because it represents the most accurate solution to this problem.
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Performance Analysis */}
            <div className="grid lg:grid-cols-2 gap-8 mb-8">
              {/* Subject-wise Performance */}
              <div className="bg-white border-2 border-gray-200 rounded-xl p-6 shadow-lg">
                <div className="flex items-center space-x-2 mb-6">
                  <Target className="h-6 w-6 text-black" />
                  <h2 className="text-2xl font-bold">Subject-wise Analysis</h2>
                </div>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium">Technical Knowledge</span>
                    <span className={`font-bold ${getScoreColor(85)}`}>85%</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium">Logical Reasoning</span>
                    <span className={`font-bold ${getScoreColor(78)}`}>78%</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium">Problem Solving</span>
                    <span className={`font-bold ${getScoreColor(72)}`}>72%</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium">Analytical Skills</span>
                    <span className={`font-bold ${getScoreColor(80)}`}>80%</span>
                  </div>
                </div>
              </div>

              {/* Time Analysis */}
              <div className="bg-white border-2 border-gray-200 rounded-xl p-6 shadow-lg">
                <div className="flex items-center space-x-2 mb-6">
                  <Clock className="h-6 w-6 text-black" />
                  <h2 className="text-2xl font-bold">Time Analysis</h2>
                </div>
                
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                      <span className="font-medium text-green-800">Good time management</span>
                    </div>
                    <p className="text-sm text-green-700 mt-1">
                      You completed the test within the allocated time
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Average time per question:</span>
                      <span className="font-medium">1m 42s</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Fastest question:</span>
                      <span className="font-medium">32s</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Slowest question:</span>
                      <span className="font-medium">3m 15s</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => onNavigate('aptitude')}
                className="bg-black hover:bg-gray-800 text-white px-8 py-4 rounded-lg font-semibold flex items-center justify-center space-x-2 transition-all duration-200 hover:scale-105"
              >
                <RefreshCw className="h-5 w-5" />
                <span>Retake Test</span>
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
  }

  // Existing interview history detail code
  const overallScore = historyItem.type === 'interview' 
    ? Math.round(((historyItem.testScore || 0) + historyItem.score) / 2)
    : historyItem.score;
  
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

  return (
    <div className="min-h-screen pt-20 pb-12">
      <div className="container mx-auto px-6">
        <div className="max-w-6xl mx-auto">
          {/* Back Button */}
          <button
            onClick={() => onNavigate('history')}
            className="flex items-center space-x-2 text-gray-600 hover:text-black transition-colors mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to History</span>
          </button>

          {/* Header */}
          <div className="text-center mb-12">
            <Award className="h-16 w-16 text-black mx-auto mb-4" />
            <h1 className="text-4xl font-bold mb-4">
              {historyItem.type === 'interview' ? 'Interview' : 'Aptitude Test'} Feedback
            </h1>
            <p className="text-xl text-gray-600">
              {historyItem.type === 'interview' 
                ? `${historyItem.position} interview performance from ${formatDate(historyItem.date)}`
                : `Aptitude test results from ${formatDate(historyItem.date)}`
              }
            </p>
          </div>

          {/* Overall Score */}
          <div className="bg-white border-2 border-gray-200 rounded-xl p-8 mb-8 shadow-lg">
            <div className="text-center">
              <div className={`text-6xl font-bold mb-2 ${getScoreColor(overallScore)}`}>
                {overallScore}%
              </div>
              <div className="text-xl text-gray-700 mb-4">Overall Score</div>
              {historyItem.type === 'interview' ? (
                <div className="flex justify-center space-x-8">
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${getScoreColor(historyItem.testScore || 0)}`}>
                      {historyItem.testScore || 0}%
                    </div>
                    <div className="text-sm text-gray-600">Aptitude Test</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${getScoreColor(historyItem.score)}`}>
                      {historyItem.score}%
                    </div>
                    <div className="text-sm text-gray-600">Interview Performance</div>
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <div className="text-sm text-gray-600">
                    Completed in {historyItem.duration || 'N/A'}
                  </div>
                </div>
              )}
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

export default HistoryDetail;
