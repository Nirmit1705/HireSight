import React, { useEffect, useState } from 'react';
import { User, Trophy, TrendingUp, Calendar, Target, BarChart3, Clock, Award } from 'lucide-react';
import { PageType } from '../App';
import RadarChart from './RadarChart';
import { userProfileAPI, UserProfileData } from '../services/userProfileAPI';

interface UserProfileProps {
  onNavigate: (page: PageType) => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ onNavigate }) => {
  const [profileData, setProfileData] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await userProfileAPI.getUserProfile();
      setProfileData(data);
    } catch (err: any) {
      console.error('Error loading profile data:', err);
      setError(err.response?.data?.message || 'Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen pt-20 pb-12">
        <div className="container mx-auto px-6 pt-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
              <p className="text-gray-600">Loading your profile...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error || !profileData) {
    return (
      <div className="min-h-screen pt-20 pb-12">
        <div className="container mx-auto px-6 pt-6">
          <div className="max-w-2xl mx-auto">
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-8 text-center">
              <p className="text-red-600 mb-4">{error || 'Failed to load profile data'}</p>
              <button
                onClick={loadProfileData}
                className="bg-black hover:bg-gray-800 text-white px-6 py-2 rounded-lg font-semibold transition-all duration-200"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { userInfo, statistics, recentInterviews, skillProgress, radarData, achievements } = profileData;

  // Map icon types to actual icon components
  const getAchievementIcon = (iconType: string) => {
    switch (iconType) {
      case 'award': return Award;
      case 'trophy': return Trophy;
      case 'trending': return TrendingUp;
      case 'clock': return Clock;
      default: return Award;
    }
  };

  const userStats = {
    totalInterviews: statistics.totalInterviews,
    averageScore: statistics.averageScore,
    improvementRate: statistics.improvementRate,
    timeSpent: statistics.timeSpent,
    bestScore: statistics.bestScore,
    streak: statistics.streak
  };

  const recentInterviewsData = recentInterviews;

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

  // Generate dynamic key insights based on skill values
  const generateKeyInsights = () => {
    if (radarData.length === 0) return ['Complete interviews to get personalized insights'];
    
    const insights: string[] = [];
    
    // Sort skills by value to identify strongest and weakest
    const sortedSkills = [...radarData].sort((a, b) => b.value - a.value);
    const strongest = sortedSkills.slice(0, 2);
    const weakest = sortedSkills.slice(-2);
    
    // Insight about strongest skills
    if (strongest[0].value > 0) {
      const strongestNames = strongest.map(s => s.label).join(' and ');
      insights.push(`Strongest in ${strongestNames}`);
    }
    
    // Insight about skills that need improvement (below 75)
    const needsImprovement = radarData.filter(s => s.value > 0 && s.value < 75);
    if (needsImprovement.length > 0) {
      needsImprovement.forEach(skill => {
        insights.push(`${skill.label} shows room for improvement`);
      });
    }
    
    // Insight about skills that need focused practice (below 65)
    const needsPractice = radarData.filter(s => s.value > 0 && s.value < 65);
    if (needsPractice.length > 0 && needsPractice.length <= 2) {
      needsPractice.forEach(skill => {
        insights.push(`${skill.label} needs focused practice`);
      });
    }
    
    // Insight about above average skills (above 75)
    const aboveAverage = radarData.filter(s => s.value >= 75 && s.value < 85);
    if (aboveAverage.length > 0 && insights.length < 4) {
      aboveAverage.forEach(skill => {
        if (insights.length < 4) {
          insights.push(`${skill.label} is above average and improving`);
        }
      });
    }
    
    // Insight about excellent skills (above 85)
    const excellent = radarData.filter(s => s.value >= 85);
    if (excellent.length > 0 && insights.length < 4) {
      excellent.forEach(skill => {
        if (insights.length < 4) {
          insights.push(`${skill.label} is excellent - keep it up!`);
        }
      });
    }
    
    return insights.length > 0 ? insights : ['Continue practicing to improve your skills'];
  };

  const keyInsights = generateKeyInsights();

  return (
    <div className="min-h-screen pt-20 pb-12">
      <div className="container mx-auto px-6 pt-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="bg-white border-2 border-gray-200 rounded-xl p-8 mb-8 shadow-lg">
            <div className="flex items-center space-x-6">
              <div className="w-20 h-20 bg-black rounded-full flex items-center justify-center">
                <User className="h-10 w-10 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold mb-2">{userInfo.name}</h1>
                <p className="text-gray-600">
                  {userInfo.currentPosition || 'Aspiring Professional'}
                </p>
              </div>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-6 mb-8">
            <div className="bg-white border-2 border-gray-200 rounded-xl p-6 text-center shadow-lg">
              <div className="text-2xl font-bold text-black mb-1">{userStats.totalInterviews}</div>
              <div className="text-sm text-gray-600">Total Interviews</div>
            </div>
            <div className="bg-white border-2 border-gray-200 rounded-xl p-6 text-center shadow-lg">
              <div className={`text-2xl font-bold mb-1 ${getScoreColor(userStats.averageScore)}`}>{userStats.averageScore}%</div>
              <div className="text-sm text-gray-600">Average Score</div>
            </div>
            <div className="bg-white border-2 border-gray-200 rounded-xl p-6 text-center shadow-lg">
              <div className={`text-2xl font-bold mb-1 ${getScoreColor(userStats.bestScore)}`}>{userStats.bestScore}%</div>
              <div className="text-sm text-gray-600">Best Score</div>
            </div>
            <div className="bg-white border-2 border-gray-200 rounded-xl p-6 text-center shadow-lg">
              <div className="text-2xl font-bold text-green-600 mb-1">+{userStats.improvementRate}%</div>
              <div className="text-sm text-gray-600">Improvement</div>
            </div>
            <div className="bg-white border-2 border-gray-200 rounded-xl p-6 text-center shadow-lg">
              <div className="text-2xl font-bold text-black mb-1">{userStats.timeSpent}m</div>
              <div className="text-sm text-gray-600">Time Spent</div>
            </div>
            <div className="bg-white border-2 border-gray-200 rounded-xl p-6 text-center shadow-lg">
              <div className="text-2xl font-bold text-black mb-1">{userStats.streak}</div>
              <div className="text-sm text-gray-600">Day Streak</div>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Recent Interviews */}
            <div className="bg-white border-2 border-gray-200 rounded-xl p-6 shadow-lg">
              <div className="flex items-center space-x-2 mb-6">
                <Calendar className="h-6 w-6 text-black" />
                <h2 className="text-2xl font-bold">Recent Interviews</h2>
              </div>
              
              <div className="space-y-4">
                {recentInterviewsData.map((interview, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-semibold">{interview.position}</h3>
                      <span className={`text-lg font-bold ${getScoreColor(interview.score)}`}>
                        {interview.score}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm text-gray-600">
                      <span>{interview.domain}</span>
                      <span>{new Date(interview.date).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
              
              <button
                onClick={() => onNavigate('position')}
                className="w-full mt-4 bg-black hover:bg-gray-800 text-white py-3 rounded-lg font-semibold transition-all duration-200 hover:scale-105"
              >
                Take New Interview
              </button>
            </div>

            {/* Skill Progress */}
            <div className="bg-white border-2 border-gray-200 rounded-xl p-6 shadow-lg">
              <div className="flex items-center space-x-2 mb-6">
                <BarChart3 className="h-6 w-6 text-black" />
                <h2 className="text-2xl font-bold">Skill Progress</h2>
              </div>
              
              <div className="space-y-6">
                {skillProgress.map((skill, index) => (
                  <div key={index}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold">{skill.skill}</span>
                      <div className="flex items-center space-x-2">
                        <span className={`text-sm ${getScoreColor(skill.current)}`}>{skill.current}%</span>
                        <span className="text-sm text-green-600">+{skill.change}</span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-500 ${getScoreBackground(skill.current)}`}
                        style={{ width: `${skill.current}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Target: {skill.target}%
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Skills Radar Chart */}
          <div className="mt-8 bg-white border-2 border-gray-200 rounded-xl p-6 shadow-lg">
            <div className="flex items-center space-x-2 mb-6">
              <Target className="h-6 w-6 text-black" />
              <h2 className="text-2xl font-bold">Skills Overview</h2>
            </div>
            
            <div className="grid lg:grid-cols-2 gap-8 items-center">
              <div className="flex justify-center">
                <RadarChart data={radarData} size={350} />
              </div>
              
              <div className="space-y-4">
                <h3 className="text-lg font-semibold mb-4">Skill Breakdown</h3>
                {radarData.map((skill, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium">{skill.label}</span>
                    <div className="flex items-center space-x-3">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-500 ${getScoreBackground(skill.value)}`}
                          style={{ width: `${skill.value}%` }}
                        ></div>
                      </div>
                      <span className={`font-bold text-sm ${getScoreColor(skill.value)}`}>
                        {skill.value}%
                      </span>
                    </div>
                  </div>
                ))}
                
                <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <h4 className="font-semibold text-black mb-2">Key Insights</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {keyInsights.map((insight, index) => (
                      <li key={index}>• {insight}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Achievements */}
          <div className="mt-8 bg-white border-2 border-gray-200 rounded-xl p-6 shadow-lg">
            <div className="flex items-center space-x-2 mb-6">
              <Trophy className="h-6 w-6 text-black" />
              <h2 className="text-2xl font-bold">Achievements</h2>
            </div>
            
                          <div className="grid md:grid-cols-2 gap-6">
              {achievements.map((achievement, index) => {
                const IconComponent = getAchievementIcon(achievement.iconType);
                return (
                  <div key={index} className={`border rounded-lg p-4 ${
                    achievement.earned 
                      ? 'border-black bg-gray-50' 
                      : 'border-gray-200 bg-white'
                  }`}>
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${
                        achievement.earned ? 'bg-black' : 'bg-gray-200'
                      }`}>
                        <IconComponent className={`h-6 w-6 ${
                          achievement.earned ? 'text-white' : 'text-gray-500'
                        }`} />
                      </div>
                      <div>
                        <h3 className={`font-semibold ${
                          achievement.earned ? 'text-black' : 'text-gray-500'
                        }`}>
                          {achievement.title}
                        </h3>
                        <p className="text-sm text-gray-600">{achievement.description}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recommended Actions */}
          <div className="mt-8 bg-white border-2 border-gray-200 rounded-xl p-6 shadow-lg">
            <div className="flex items-center space-x-2 mb-6">
              <Target className="h-6 w-6 text-black" />
              <h2 className="text-2xl font-bold">Recommended for You</h2>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h3 className="font-semibold mb-2 text-black">Practice Communication</h3>
                <p className="text-sm text-gray-600 mb-4">Your communication scores can be improved with focused practice.</p>
                <button 
                  onClick={() => onNavigate('position')}
                  className="text-black text-sm hover:text-gray-700 transition-colors font-medium"
                >
                  Start Practice →
                </button>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h3 className="font-semibold mb-2 text-black">Try Different Roles</h3>
                <p className="text-sm text-gray-600 mb-4">Expand your skills by practicing interviews for different positions.</p>
                <button 
                  onClick={() => onNavigate('position')}
                  className="text-black text-sm hover:text-gray-700 transition-colors font-medium"
                >
                  Explore Roles →
                </button>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h3 className="font-semibold mb-2 text-black">Take Aptitude Test</h3>
                <p className="text-sm text-gray-600 mb-4">Regular testing helps track your progress and identify gaps.</p>
                <button 
                  onClick={() => onNavigate('practice-aptitude')}
                  className="text-black text-sm hover:text-gray-700 transition-colors font-medium"
                >
                  Take Test →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;