import React from 'react';
import { 
  TrendingUp, 
  FileText, 
  Video, 
  Award, 
  Target, 
  Clock, 
  ArrowRight, 
  BarChart3,
  CheckCircle,
  AlertCircle,
  BookOpen,
  Brain,
  Calendar,
  Star
} from 'lucide-react';
import { PageType } from '../App';
import RadarChart from './RadarChart';

interface DashboardProps {
  onNavigate: (page: PageType) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  // Mock data - in real app this would come from API
  const userStats = {
    profileStrength: 78,
    interviewsTaken: 12,
    assessmentsCompleted: 8,
    bestScore: 84
  };

  const mlEvaluation = {
    overallScore: 76,
    strengths: ['Technical Knowledge', 'Problem Solving', 'Communication'],
    improvements: ['Confidence', 'Body Language', 'Clarity'],
    feedback: "You showed strong technical skills but hesitated during behavioral questions. Practice speaking with more confidence."
  };

  const progressData = [
    { name: 'Mock Interview 1', score: 65, date: '2024-01-15' },
    { name: 'Logic Test', score: 72, date: '2024-01-18' },
    { name: 'Mock Interview 2', score: 68, date: '2024-01-22' },
    { name: 'Technical Quiz', score: 81, date: '2024-01-25' },
    { name: 'Mock Interview 3', score: 76, date: '2024-01-28' },
  ];

  const recentActivities = [
    { date: 'Jan 28', activity: 'Mock Interview', score: 76, type: 'interview' },
    { date: 'Jan 25', activity: 'Technical Quiz', score: 81, type: 'test' },
    { date: 'Jan 22', activity: 'Mock Interview', score: 68, type: 'interview' },
    { date: 'Jan 18', activity: 'Logic Test', score: 72, type: 'test' },
  ];

  const radarData = [
    { label: 'Fluency', value: 82 },
    { label: 'Grammar', value: 78 },
    { label: 'Confidence', value: 75 },
    { label: 'Technical Knowledge', value: 85 },
    { label: 'Vocabulary', value: 80 }
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

  return (
    <div className="min-h-screen pt-20 pb-12 bg-gray-50">
      <div className="container mx-auto px-6">
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
                  <Target className="h-6 w-6 text-black" />
                </div>
                <span className={`text-2xl font-bold ${getScoreColor(userStats.profileStrength)}`}>
                  {userStats.profileStrength}%
                </span>
              </div>
              <h3 className="font-semibold text-black">Profile Strength</h3>
              <p className="text-sm text-gray-600">Based on your performance</p>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <Video className="h-6 w-6 text-black" />
                </div>
                <span className="text-2xl font-bold text-black">{userStats.interviewsTaken}</span>
              </div>
              <h3 className="font-semibold text-black">Interviews Taken</h3>
              <p className="text-sm text-gray-600">Mock interviews completed</p>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <FileText className="h-6 w-6 text-black" />
                </div>
                <span className="text-2xl font-bold text-black">{userStats.assessmentsCompleted}</span>
              </div>
              <h3 className="font-semibold text-black">Assessments Completed</h3>
              <p className="text-sm text-gray-600">Tests and quizzes</p>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <Award className="h-6 w-6 text-black" />
                </div>
                <span className={`text-2xl font-bold ${getScoreColor(userStats.bestScore)}`}>
                  {userStats.bestScore}/100
                </span>
              </div>
              <h3 className="font-semibold text-black">Best Score</h3>
              <p className="text-sm text-gray-600">Your highest achievement</p>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-8">
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
              {/* Skills Radar Chart */}
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <Target className="h-5 w-5 text-black" />
                  <h3 className="text-lg font-bold text-black">Skills Radar</h3>
                </div>
                
                <div className="flex justify-center mb-4">
                  <RadarChart data={radarData} size={200} showLabels={false} />
                </div>
                
                <div className="grid grid-cols-1 gap-2 text-xs">
                  {radarData.map((skill, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-gray-600">{skill.label}</span>
                      <span className={`font-semibold ${getScoreColor(skill.value)}`}>{skill.value}%</span>
                    </div>
                  ))}
                </div>
                
                <button
                  onClick={() => onNavigate('profile')}
                  className="w-full mt-4 text-center text-sm text-gray-600 hover:text-black transition-colors"
                >
                  View detailed breakdown →
                </button>
              </div>

              {/* Smart Recommendations */}
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <div className="flex items-center space-x-2 mb-6">
                  <Star className="h-6 w-6 text-black" />
                  <h2 className="text-xl font-bold">Smart Recommendations</h2>
                </div>

                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <h4 className="font-semibold text-black mb-2">Retake Aptitude Test</h4>
                    <p className="text-sm text-gray-600 mb-3">Improve your logic and reasoning scores</p>
                    <button 
                      onClick={() => onNavigate('aptitude')}
                      className="bg-black text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
                    >
                      Start Test
                    </button>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <h4 className="font-semibold text-black mb-2">Start New Interview</h4>
                    <p className="text-sm text-gray-600 mb-3">Practice with different question types</p>
                    <button 
                      onClick={() => onNavigate('position')}
                      className="bg-black text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
                    >
                      Begin Interview
                    </button>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <h4 className="font-semibold text-black mb-2">Study Resources</h4>
                    <p className="text-sm text-gray-600 mb-3">Common behavioral questions guide</p>
                    <button className="border border-black text-black px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
                      View Resources
                    </button>
                  </div>
                </div>
              </div>

              {/* What's Next Assistant */}
              <div className="bg-black text-white rounded-xl p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <Brain className="h-6 w-6" />
                  <h3 className="text-lg font-bold">What's Next?</h3>
                </div>
                <p className="text-gray-300 mb-4">
                  Based on your performance, we recommend taking the Technical Quiz to strengthen your coding skills.
                </p>
                <button 
                  onClick={() => onNavigate('aptitude')}
                  className="bg-white text-black px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors flex items-center space-x-2"
                >
                  <span>Take Technical Quiz</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
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
                  onClick={() => onNavigate('profile')}
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