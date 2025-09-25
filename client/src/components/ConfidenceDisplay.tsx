import React from 'react';
import { TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle, Clock, MessageSquare } from 'lucide-react';
import { ConfidenceMetrics } from '../services/speechToTextAPI';

interface ConfidenceDisplayProps {
  confidenceMetrics: ConfidenceMetrics | null;
  className?: string;
}

const ConfidenceDisplay: React.FC<ConfidenceDisplayProps> = ({ confidenceMetrics, className = '' }) => {
  if (!confidenceMetrics) {
    return null;
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 80) return <CheckCircle className="h-4 w-4" />;
    if (score >= 60) return <TrendingUp className="h-4 w-4" />;
    if (score >= 40) return <Minus className="h-4 w-4" />;
    return <AlertTriangle className="h-4 w-4" />;
  };

  const formatDuration = (seconds: number) => {
    return `${seconds.toFixed(1)}s`;
  };

  const formatSpeechRate = (wpm: number) => {
    return `${Math.round(wpm)} WPM`;
  };

  return (
    <div className={`bg-white rounded-lg p-4 border border-gray-200 shadow-sm ${className}`}>
      <div className="flex items-center space-x-2 mb-4">
        <MessageSquare className="h-5 w-5 text-gray-600" />
        <h3 className="text-lg font-semibold text-gray-800">Speech Confidence Analysis</h3>
      </div>

      {/* Overall Confidence Score */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Overall Confidence</span>
          <div className={`flex items-center space-x-1 ${getScoreColor(confidenceMetrics.overallScore)}`}>
            {getScoreIcon(confidenceMetrics.overallScore)}
            <span className="font-bold text-lg">{confidenceMetrics.overallScore}%</span>
          </div>
        </div>
      </div>

      {/* Score Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        <div className="text-center p-2 bg-gray-50 rounded">
          <div className={`text-xl font-bold ${getScoreColor(confidenceMetrics.fillerWordScore)}`}>
            {confidenceMetrics.fillerWordScore}%
          </div>
          <div className="text-xs text-gray-600">Clarity</div>
          <div className="text-xs text-gray-500">(Filler Words)</div>
        </div>
        
        <div className="text-center p-2 bg-gray-50 rounded">
          <div className={`text-xl font-bold ${getScoreColor(confidenceMetrics.pauseScore)}`}>
            {confidenceMetrics.pauseScore}%
          </div>
          <div className="text-xs text-gray-600">Fluency</div>
          <div className="text-xs text-gray-500">(Pauses)</div>
        </div>
        
        <div className="text-center p-2 bg-gray-50 rounded">
          <div className={`text-xl font-bold ${getScoreColor(confidenceMetrics.fluencyScore)}`}>
            {confidenceMetrics.fluencyScore}%
          </div>
          <div className="text-xs text-gray-600">Flow</div>
          <div className="text-xs text-gray-500">(Combined)</div>
        </div>
      </div>

      {/* Detailed Breakdown */}
      <div className="space-y-3">
        {/* Speech Statistics */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Total Words:</span>
            <span className="font-medium">{confidenceMetrics.breakdown.totalWords}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Speech Rate:</span>
            <span className="font-medium">{formatSpeechRate(confidenceMetrics.breakdown.speechRate)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Speaking Time:</span>
            <span className="font-medium">{formatDuration(confidenceMetrics.breakdown.totalSpeechTime)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Pause Time:</span>
            <span className="font-medium">{formatDuration(confidenceMetrics.breakdown.totalPauseTime)}</span>
          </div>
        </div>

        {/* Filler Words Details */}
        {confidenceMetrics.breakdown.fillerWords.length > 0 && (
          <div className="pt-3 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Filler Words Detected:</h4>
            <div className="flex flex-wrap gap-1">
              {confidenceMetrics.breakdown.fillerWords.map((filler, index) => (
                <span
                  key={index}
                  className="inline-block bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs"
                  title={`Used ${filler.count} times (${filler.percentage.toFixed(1)}%)`}
                >
                  "{filler.word}" ({filler.count})
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Pause Analysis */}
        {confidenceMetrics.breakdown.pauses.length > 0 && (
          <div className="pt-3 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-700 mb-2">
              Pause Analysis ({confidenceMetrics.breakdown.pauses.length} pauses):
            </h4>
            <div className="grid grid-cols-4 gap-2 text-xs">
              <div className="text-center">
                <div className="font-medium text-green-600">
                  {confidenceMetrics.breakdown.pauses.filter(p => p.type === 'short').length}
                </div>
                <div className="text-gray-600">Short</div>
              </div>
              <div className="text-center">
                <div className="font-medium text-yellow-600">
                  {confidenceMetrics.breakdown.pauses.filter(p => p.type === 'medium').length}
                </div>
                <div className="text-gray-600">Medium</div>
              </div>
              <div className="text-center">
                <div className="font-medium text-orange-600">
                  {confidenceMetrics.breakdown.pauses.filter(p => p.type === 'long').length}
                </div>
                <div className="text-gray-600">Long</div>
              </div>
              <div className="text-center">
                <div className="font-medium text-red-600">
                  {confidenceMetrics.breakdown.pauses.filter(p => p.type === 'excessive').length}
                </div>
                <div className="text-gray-600">Excessive</div>
              </div>
            </div>
            {confidenceMetrics.breakdown.averagePauseDuration > 0 && (
              <div className="text-xs text-gray-600 mt-2">
                Average pause: {formatDuration(confidenceMetrics.breakdown.averagePauseDuration)}
              </div>
            )}
          </div>
        )}

        {/* Improvement Suggestions */}
        <div className="pt-3 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Quick Tips:</h4>
          <div className="space-y-1 text-xs text-gray-600">
            {confidenceMetrics.fillerWordScore < 70 && (
              <div className="flex items-center space-x-1">
                <AlertTriangle className="h-3 w-3 text-yellow-500" />
                <span>Try to reduce filler words like "um", "uh", and "like"</span>
              </div>
            )}
            {confidenceMetrics.pauseScore < 70 && (
              <div className="flex items-center space-x-1">
                <Clock className="h-3 w-3 text-orange-500" />
                <span>Practice speaking at a steady pace with natural pauses</span>
              </div>
            )}
            {confidenceMetrics.breakdown.speechRate < 120 && (
              <div className="flex items-center space-x-1">
                <TrendingUp className="h-3 w-3 text-blue-500" />
                <span>Try speaking a bit faster for better engagement</span>
              </div>
            )}
            {confidenceMetrics.breakdown.speechRate > 180 && (
              <div className="flex items-center space-x-1">
                <TrendingDown className="h-3 w-3 text-purple-500" />
                <span>Consider slowing down slightly for better clarity</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfidenceDisplay;