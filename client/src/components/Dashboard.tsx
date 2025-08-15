import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  TrendingUp, 
  FileText, 
  Video, 
  Award, 
  Target, 
  Clock, 
  ArrowRight, 
  CheckCircle,
  AlertCircle,
  Brain,
  Star
} from 'lucide-react';
import PerformanceTrendChart from './PerformanceTrendChart';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();

  // Mock data - in real app this would come from API
  const userStats = {
    aptitudeScore: 81, // Latest aptitude test score
    interviewScore: 76, // Latest interview score
    overallPerformance: 78, // Average score across all tests
    completedSessions: 20 // Total interviews + aptitude tests
  };

  // Performance trend data (same as in PerformanceTrendChart)
  const performanceData = [
    { date: '2024-01-08', overallScore: 75, sessionNumber: 1 },
    { date: '2024-01-15', overallScore: 65, sessionNumber: 2 },
    { date: '2024-01-18', overallScore: 88, sessionNumber: 3 },
    { date: '2024-02-22', overallScore: 71, sessionNumber: 4 },
    { date: '2024-03-25', overallScore: 54, sessionNumber: 5 },
    { date: '2024-06-28', overallScore: 76, sessionNumber: 6 },
    { date: '2024-07-01', overallScore: 78, sessionNumber: 7 },
    { date: '2024-08-05', overallScore: 90, sessionNumber: 8 },
  ];

  // Calculate performance stats
  const lastScore = performanceData[performanceData.length - 1]?.overallScore || 0;
  const previousScore = performanceData[performanceData.length - 2]?.overallScore || 0;
  const highestScore = Math.max(...performanceData.map(d => d.overallScore));
  const scoreChange = lastScore - previousScore;
  const isImprovement = scoreChange > 0;

  const mlEvaluation = {
    overallScore: 76,
    strengths: ['Technical Knowledge', 'Problem Solving', 'Communication'],
    improvements: ['Confidence', 'Body Language', 'Clarity'],
    feedback: "You showed strong technical skills but hesitated during behavioral questions. Practice speaking with more confidence."
  };

  const recentActivities = [
    { date: 'Jan 28', activity: 'Mock Interview', score: 76, type: 'interview' },
    { date: 'Jan 25', activity: 'Technical Quiz', score: 81, type: 'test' },
    { date: 'Jan 22', activity: 'Mock Interview', score: 68, type: 'interview' },
    { date: 'Jan 18', activity: 'Logic Test', score: 72, type: 'test' },
  ];

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="min-h-screen pt-20 pb-12 bg-gray-50">
      <div className="container mx-auto px-6 pt-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-black mb-2">Welcome back, John!</h1>
            <p className="text-gray-600">Track your progress and improve your interview skills</p>
          </div>

          {/* Top Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <Brain className="h-6 w-6 text-black" />
                </div>
                <span className={`text-2xl font-bold ${getScoreColor(userStats.aptitudeScore)}`}>
                  {userStats.aptitudeScore}%
                </span>
              </div>
              <h3 className="font-semibold text-black">Aptitude Score</h3>
              <p className="text-sm text-gray-600">Latest test result</p>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <Video className="h-6 w-6 text-black" />
                </div>
                <span className={`text-2xl font-bold ${getScoreColor(userStats.interviewScore)}`}>
                  {userStats.interviewScore}%
                </span>
              </div>
              <h3 className="font-semibold text-black">Interview Score</h3>
              <p className="text-sm text-gray-600">Latest interview result</p>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-black" />
                </div>
                <span className={`text-2xl font-bold ${getScoreColor(userStats.overallPerformance)}`}>
                  {userStats.overallPerformance}%
                </span>
              </div>
              <h3 className="font-semibold text-black">Overall Performance</h3>
              <p className="text-sm text-gray-600">Average across all tests</p>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <Award className="h-6 w-6 text-black" />
                </div>
                <span className="text-2xl font-bold text-black">{userStats.completedSessions}</span>
              </div>
              <h3 className="font-semibold text-black">Completed Sessions</h3>
              <p className="text-sm text-gray-600">Interviews & aptitude tests</p>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-8">
              {/* Performance Trend Chart */}
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-6 w-6 text-black" />
                    <h2 className="text-xl font-bold">Performance Trend</h2>
                  </div>
                  <div className="text-sm text-gray-600">
                    Overall Score (Aptitude + Interview)
                  </div>
                </div>
                <PerformanceTrendChart data={performanceData} />
                
                {/* Performance Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 border-t border-gray-200">
                  <div className="text-center">
                    <div className={`text-2xl font-bold mb-1 ${getScoreColor(lastScore)}`}>
                      {lastScore}%
                    </div>
                    <div className="text-sm text-gray-600">Last Recorded</div>
                  </div>
                  
                  <div className="text-center">
                    <div className={`text-2xl font-bold mb-1 ${getScoreColor(highestScore)}`}>
                      {highestScore}%
                    </div>
                    <div className="text-sm text-gray-600">Highest Score</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="flex items-center justify-center space-x-1 mb-1">
                      <span className={`text-2xl font-bold ${isImprovement ? 'text-green-600' : scoreChange < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                        {isImprovement ? '+' : ''}{scoreChange}%
                      </span>
                      {scoreChange !== 0 && (
                        <TrendingUp 
                          className={`h-5 w-5 ${isImprovement ? 'text-green-600' : 'text-red-600 rotate-180'}`}
                        />
                      )}
                    </div>
                    <div className="text-sm text-gray-600">
                      {scoreChange > 0 ? 'Improvement' : scoreChange < 0 ? 'Decrease' : 'No Change'}
                    </div>
                  </div>
                </div>
              </div>

              {/* ML Evaluation Summary */}
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <div className="flex items-center space-x-2 mb-6">
                  <Brain className="h-6 w-6 text-black" />
                  <h2 className="text-xl font-bold">AI Evaluation Summary</h2>
                </div>

                <div className="grid md:grid-cols-3 gap-6 mb-6">
                  <div className="text-center">
                    <div className={`text-3xl font-bold mb-2 ${getScoreColor(mlEvaluation.overallScore)}`}>
                      {mlEvaluation.overallScore}/100
                    </div>
                    <div className="text-sm text-gray-600">Overall ML Score</div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-black mb-3 flex items-center">
                      <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                      Strengths
                    </h4>
                    <div className="space-y-2">
                      {mlEvaluation.strengths.map((strength, index) => (
                        <span key={index} className="inline-block bg-green-50 text-green-700 px-3 py-1 rounded-full text-xs border border-green-200 mr-2 mb-2">
                          {strength}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-black mb-3 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-2 text-yellow-600" />
                      Areas to Improve
                    </h4>
                    <div className="space-y-2">
                      {mlEvaluation.improvements.map((improvement, index) => (
                        <span key={index} className="inline-block bg-yellow-50 text-yellow-700 px-3 py-1 rounded-full text-xs border border-yellow-200 mr-2 mb-2">
                          {improvement}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <h4 className="font-semibold text-black mb-2">AI Feedback</h4>
                  <p className="text-gray-700 text-sm italic">"{mlEvaluation.feedback}"</p>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-8">

              {/* Smart Recommendations */}
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <div className="flex items-center space-x-2 mb-6">
                  <Star className="h-6 w-6 text-black" />
                  <h2 className="text-xl font-bold">Smart Recommendations</h2>
                </div>

                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <h4 className="font-semibold text-black mb-2">Practice Session</h4>
                    <p className="text-sm text-gray-600 mb-3">Enhance your aptitude preparation with mock practice sessions</p>
                    <button 
                      onClick={() => navigate('/practice')}
                      className="bg-black text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
                    >
                      Start Practice
                    </button>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <h4 className="font-semibold text-black mb-2">Assessment Test</h4>
                    <p className="text-sm text-gray-600 mb-3">Evaluate your aptitude and technical knowledge</p>
                    <button 
                      onClick={() => navigate('/assessment')}
                      className="bg-black text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
                    >
                      Take Assessment
                    </button>
                  </div>
                </div>
              </div>

              {/* Activity History */}
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <div className="flex items-center space-x-2 mb-6">
                  <Clock className="h-6 w-6 text-black" />
                  <h2 className="text-xl font-bold">Recent Activity</h2>
                </div>

                <div className="space-y-4">
                  {recentActivities.map((activity, index) => (
                    <div key={index} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-gray-100 rounded-lg">
                          {activity.type === 'interview' ? 
                            <Video className="h-4 w-4 text-black" /> : 
                            <FileText className="h-4 w-4 text-black" />
                          }
                        </div>
                        <div>
                          <div className="text-sm font-medium text-black">{activity.activity}</div>
                          <div className="text-xs text-gray-500">{activity.date}</div>
                        </div>
                      </div>
                      <div className={`text-sm font-semibold ${getScoreColor(activity.score)}`}>
                        {activity.score}%
                      </div>
                    </div>
                  ))}
                </div>

                <button 
                  onClick={() => navigate('/history')}
                  className="w-full mt-4 text-center text-sm text-gray-600 hover:text-black transition-colors"
                >
                  View All Activity
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;