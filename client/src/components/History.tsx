import React, { useState, useEffect } from 'react';
import { Clock, FileText, Video, BarChart3, Calendar, Trophy, TrendingUp } from 'lucide-react';
import { PageType } from '../App';

interface HistoryProps {
  onNavigate: (page: PageType, historyId?: string) => void;
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
}

const History: React.FC<HistoryProps> = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState<'aptitude' | 'interview'>('interview');
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);

  useEffect(() => {
    // Load history from localStorage
    const savedHistory = localStorage.getItem('hiresight_history');
    if (savedHistory) {
      setHistoryItems(JSON.parse(savedHistory));
    } else {
      // Mock data for demonstration
      const mockHistory: HistoryItem[] = [
        {
          id: '1',
          type: 'interview',
          date: '2024-01-28',
          score: 76,
          position: 'Frontend Developer',
          domain: 'React.js',
          duration: '25:30',
          status: 'completed'
        },
        {
          id: '2',
          type: 'aptitude',
          date: '2024-01-25',
          score: 81,
          duration: '28:45',
          status: 'completed'
        },
        {
          id: '3',
          type: 'interview',
          date: '2024-01-22',
          score: 68,
          position: 'Backend Developer',
          domain: 'Node.js',
          duration: '22:15',
          status: 'completed'
        },
        {
          id: '4',
          type: 'aptitude',
          date: '2024-01-18',
          score: 72,
          duration: '30:00',
          status: 'completed'
        }
      ];
      setHistoryItems(mockHistory);
      localStorage.setItem('hiresight_history', JSON.stringify(mockHistory));
    }
  }, []);

  const filteredHistory = historyItems.filter(item => item.type === activeTab);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBackground = (score: number) => {
    if (score >= 80) return 'bg-green-100 border-green-200';
    if (score >= 60) return 'bg-yellow-100 border-yellow-200';
    return 'bg-red-100 border-red-200';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const calculateStats = () => {
    const filtered = filteredHistory.filter(item => item.status === 'completed');
    const avgScore = filtered.length > 0 
      ? Math.round(filtered.reduce((sum, item) => sum + item.score, 0) / filtered.length)
      : 0;
    const bestScore = filtered.length > 0 
      ? Math.max(...filtered.map(item => item.score))
      : 0;
    return { avgScore, bestScore, totalAttempts: filtered.length };
  };

  const stats = calculateStats();

  return (
    <div className="min-h-screen pt-20 pb-12">
      <div className="container mx-auto px-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-black mb-2">History</h1>
            <p className="text-gray-600">Track your progress and view detailed feedback from previous attempts</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <Trophy className="h-6 w-6 text-black" />
                </div>
                <span className={`text-2xl font-bold ${getScoreColor(stats.bestScore)}`}>
                  {stats.bestScore}%
                </span>
              </div>
              <h3 className="font-semibold text-black">Best Score</h3>
              <p className="text-sm text-gray-600">Your highest achievement</p>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-black" />
                </div>
                <span className={`text-2xl font-bold ${getScoreColor(stats.avgScore)}`}>
                  {stats.avgScore}%
                </span>
              </div>
              <h3 className="font-semibold text-black">Average Score</h3>
              <p className="text-sm text-gray-600">Overall performance</p>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <BarChart3 className="h-6 w-6 text-black" />
                </div>
                <span className="text-2xl font-bold text-black">{stats.totalAttempts}</span>
              </div>
              <h3 className="font-semibold text-black">Total Attempts</h3>
              <p className="text-sm text-gray-600">Completed sessions</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="border-b border-gray-200">
              <div className="flex">
                <button
                  onClick={() => setActiveTab('interview')}
                  className={`flex items-center space-x-2 px-6 py-4 font-medium transition-colors ${
                    activeTab === 'interview'
                      ? 'text-black border-b-2 border-black'
                      : 'text-gray-600 hover:text-black'
                  }`}
                >
                  <Video className="h-5 w-5" />
                  <span>Interview History</span>
                </button>
                <button
                  onClick={() => setActiveTab('aptitude')}
                  className={`flex items-center space-x-2 px-6 py-4 font-medium transition-colors ${
                    activeTab === 'aptitude'
                      ? 'text-black border-b-2 border-black'
                      : 'text-gray-600 hover:text-black'
                  }`}
                >
                  <FileText className="h-5 w-5" />
                  <span>Aptitude History</span>
                </button>
              </div>
            </div>

            {/* History List */}
            <div className="p-6">
              {filteredHistory.length === 0 ? (
                <div className="text-center py-12">
                  <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    {activeTab === 'interview' ? 
                      <Video className="h-8 w-8 text-gray-400" /> : 
                      <FileText className="h-8 w-8 text-gray-400" />
                    }
                  </div>
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">
                    No {activeTab} history found
                  </h3>
                  <p className="text-gray-500">
                    Start your first {activeTab} to see your progress here
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredHistory.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => onNavigate('history-detail', item.id)}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-black hover:shadow-sm transition-all cursor-pointer"
                    >
                      <div className="flex items-center space-x-4">
                        <div className={`p-3 rounded-lg border ${getScoreBackground(item.score)}`}>
                          {item.type === 'interview' ? 
                            <Video className="h-5 w-5" /> : 
                            <FileText className="h-5 w-5" />
                          }
                        </div>
                        <div>
                          <div className="flex items-center space-x-3 mb-1">
                            <h3 className="font-semibold text-black">
                              {item.type === 'interview' ? 
                                `${item.position} Interview` : 
                                'Aptitude Test'
                              }
                            </h3>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${getScoreBackground(item.score)}`}>
                              {item.score}%
                            </span>
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <div className="flex items-center space-x-1">
                              <Calendar className="h-4 w-4" />
                              <span>{formatDate(item.date)}</span>
                            </div>
                            {item.duration && (
                              <div className="flex items-center space-x-1">
                                <Clock className="h-4 w-4" />
                                <span>{item.duration}</span>
                              </div>
                            )}
                            {item.domain && (
                              <span className="bg-gray-100 px-2 py-1 rounded text-xs">
                                {item.domain}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-gray-400">
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default History;
