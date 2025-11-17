import React, { useState, useEffect } from 'react';
import { BarChart3, Target, Award, AlertCircle, CheckCircle, ArrowRight, RefreshCw } from 'lucide-react';
import { PageType } from '../App';
import { InterviewFeedback } from '../services/interviewAPI';
import { aptitudeAPI } from '../services/aptitudeAPI';
import RadarChart from './RadarChart';

interface FeedbackProps {
  onNavigate: (page: PageType) => void;
  position: string;
  domain: string;
  testScore: number;
  interviewScore: number;
  feedbackData?: InterviewFeedback | null;
}

const Feedback: React.FC<FeedbackProps> = ({ onNavigate, position, domain, testScore, interviewScore, feedbackData }) => {
  const [latestAptitude, setLatestAptitude] = useState<any>(null);

  // Fetch latest aptitude test results
  useEffect(() => {
    const fetchLatestAptitude = async () => {
      try {
        const aptitudeHistory = await aptitudeAPI.getTestHistory();
        if (aptitudeHistory && aptitudeHistory.length > 0) {
          // Get the most recent aptitude test (first item, already sorted by date desc)
          const latest = aptitudeHistory[0];
          console.log('📚 Latest aptitude test:', latest);
          setLatestAptitude(latest);
        }
      } catch (error) {
        console.error('Error fetching aptitude history:', error);
      }
    };

    fetchLatestAptitude();
  }, []);

  // Debug logging
  console.log('Feedback component received props:', {
    position,
    domain,
    testScore,
    interviewScore,
    feedbackData,
    hasFeedbackData: !!feedbackData,
    feedbackDataKeys: feedbackData ? Object.keys(feedbackData) : [],
    latestAptitude
  });

  if (feedbackData) {
    console.log('Feedback data details:', {
      strengths: feedbackData.strengths,
      improvements: feedbackData.improvements,
      performanceInsights: feedbackData.performanceInsights,
      aptitudeInsights: feedbackData.aptitudeInsights,
      position: feedbackData.position,
      hasPerformanceInsights: feedbackData.performanceInsights && feedbackData.performanceInsights.length > 0,
      performanceInsightsLength: feedbackData.performanceInsights?.length
    });
    
    console.log('🔍 DEBUG Strengths array:', feedbackData.strengths);
    if (feedbackData.strengths) {
      feedbackData.strengths.forEach((s: string, i: number) => {
        console.log(`Strength ${i}:`, s);
      });
    }
  }

  // Use position from feedbackData if available, otherwise use prop
  const displayPosition = feedbackData?.position || position;
  // Use dynamic feedback data if available, otherwise fall back to static/calculated data
  const actualInterviewScore = feedbackData?.interviewOverallScore || interviewScore;
  
  // Use latest aptitude test score if available
  const actualTestScore = latestAptitude?.overallScore || feedbackData?.aptitudeOverallScore || testScore;
  
  // Only average if both scores exist and are valid (> 0)
  const hasAptitudeScore = actualTestScore && actualTestScore > 0;
  const overallScore = hasAptitudeScore 
    ? Math.round((actualTestScore + actualInterviewScore) / 2)
    : Math.round(actualInterviewScore);
  
  // Calculate actual strengths based on all available scores (top 3 areas)
  const allScores = {
    // Interview scores
    ...(feedbackData?.fluencyScore && { 'Communication Fluency': feedbackData.fluencyScore }),
    ...(feedbackData?.grammarScore && { 'Grammar': feedbackData.grammarScore }),
    ...(feedbackData?.confidenceScore && { 'Confidence': feedbackData.confidenceScore }),
    ...(feedbackData?.technicalKnowledgeScore && { 'Technical Knowledge': feedbackData.technicalKnowledgeScore }),
    ...(feedbackData?.vocabularyScore && { 'Vocabulary': feedbackData.vocabularyScore }),
    ...(feedbackData?.analyticalThinkingScore && { 'Analytical Thinking': feedbackData.analyticalThinkingScore }),
    // Aptitude scores
    ...(feedbackData?.domainKnowledgeScore && { 'Domain Knowledge': feedbackData.domainKnowledgeScore }),
    ...(feedbackData?.quantitativeScore && { 'Quantitative Aptitude': feedbackData.quantitativeScore }),
    ...(feedbackData?.logicalReasoningScore && { 'Logical Reasoning': feedbackData.logicalReasoningScore }),
    ...(feedbackData?.verbalAbilityScore && { 'Verbal Ability': feedbackData.verbalAbilityScore })
  };

  // Generate dynamic strengths from AI-generated text AND top scores
  const strengths = (() => {
    console.log('🔍 Strengths generation debug:', {
      hasFeedbackData: !!feedbackData,
      hasStrengths: !!feedbackData?.strengths,
      strengthsLength: feedbackData?.strengths?.length,
      strengthsArray: feedbackData?.strengths,
      allScores: allScores,
      allScoresKeys: Object.keys(allScores),
      allScoresLength: Object.keys(allScores).length
    });
    
    if (feedbackData?.strengths && feedbackData.strengths.length > 0 && Object.keys(allScores).length > 0) {
      console.log('🎯 Processing strengths with allScores:', allScores);
      
      // Map LLM-generated strengths to actual database scores for consistency
      const parsed = feedbackData.strengths.map((strengthText: string) => {
        console.log('📝 Parsing strength text:', strengthText);
        
        // Try to extract area name from LLM text like "Grammar: 100% - Description"
        const areaMatch = strengthText.match(/^(\w+(?:\s+\w+)?)\s*:/);
        
        if (areaMatch) {
          const areaFromText = areaMatch[1];
          const description = strengthText.split(' - ')[1] || strengthText.split(/\d+%\s*-\s*/)[1] || strengthText;
          
          // Map the area name to actual score from database
          let actualScore = 85; // fallback
          let actualArea = areaFromText;
          
          // Match area to actual score from allScores
          if (areaFromText.toLowerCase().includes('grammar')) {
            actualScore = Math.round(allScores.Grammar || 0);
            actualArea = 'Grammar';
          } else if (areaFromText.toLowerCase().includes('fluency')) {
            actualScore = Math.round(allScores['Communication Fluency'] || 0);
            actualArea = 'Fluency';
          } else if (areaFromText.toLowerCase().includes('confidence')) {
            actualScore = Math.round(allScores.Confidence || 0);
            actualArea = 'Confidence';
          } else if (areaFromText.toLowerCase().includes('vocabulary')) {
            actualScore = Math.round(allScores.Vocabulary || 0);
            actualArea = 'Vocabulary';
          } else if (areaFromText.toLowerCase().includes('technical')) {
            actualScore = Math.round(allScores['Technical Knowledge'] || 0);
            actualArea = 'Technical Knowledge';
          } else if (areaFromText.toLowerCase().includes('analytical')) {
            actualScore = Math.round(allScores['Analytical Thinking'] || 0);
            actualArea = 'Analytical Thinking';
          }
          
          console.log('✅ Mapped to database score:', { area: actualArea, score: actualScore, description });
          
          return {
            area: actualArea,
            score: actualScore,
            description: description
          };
        }
        
        // Fallback: Try to find matching area in allScores
        const areaName = Object.keys(allScores).find(key => 
          strengthText.toLowerCase().includes(key.toLowerCase())
        );
        
        if (areaName) {
          console.log('⚠️ Using fallback with areaName:', areaName);
          return {
            area: areaName,
            score: Math.round(allScores[areaName as keyof typeof allScores] || 0),
            description: strengthText
          };
        }
        
        // Last resort: use top scores
        const topScore = Object.entries(allScores)
          .sort(([, a], [, b]) => (b || 0) - (a || 0))[0];
        
        console.log('❌ Using last resort with topScore:', topScore);
        
        return {
          area: topScore?.[0] || 'Performance',
          score: Math.round(topScore?.[1] || 0),
          description: strengthText
        };
      }).slice(0, 3);
      
      console.log('📊 Final parsed strengths:', parsed);
      return parsed;
    }
    
    // Fallback to static data if no dynamic data available
    return [
      { area: 'Technical Knowledge', score: 85, description: 'Strong understanding of core concepts' },
      { area: 'Communication', score: 78, description: 'Clear and articulate responses' },
      { area: 'Problem Solving', score: 82, description: 'Good analytical approach' },
    ];
  })();

  // Dynamic improvements - use AI-generated improvements if available
  const improvements = feedbackData?.improvements && feedbackData.improvements.length > 0 ?
    feedbackData.improvements.map(improvement => ({
      area: improvement.area,
      severity: improvement.priority.toLowerCase() as 'high' | 'medium' | 'low',
      description: improvement.description || `Focus on improving your ${improvement.area.toLowerCase()}`
    })) :
    [
      { area: 'Confidence', severity: 'medium' as const, description: 'Work on speaking with more authority' },
      { area: 'Clarity', severity: 'low' as const, description: 'Occasionally unclear in explanations' },
      { area: 'Technical Depth', severity: 'high' as const, description: 'Need more detailed technical examples' },
    ];

  // Dynamic radar chart data
  const radarData = [
    { label: 'Fluency', value: feedbackData?.fluencyScore || 78 },
    { label: 'Grammar', value: feedbackData?.grammarScore || 75 },
    { label: 'Confidence', value: feedbackData?.confidenceScore || 70 },
    { label: 'Technical Knowledge', value: feedbackData?.technicalKnowledgeScore || 85 },
    { label: 'Vocabulary', value: feedbackData?.vocabularyScore || 77 }
  ];

  // Dynamic aptitude scores - only show if user took aptitude test
  const hasAptitudeData = latestAptitude && (
    latestAptitude.logicalReasoningScore || 
    latestAptitude.quantitativeScore || 
    latestAptitude.verbalAbilityScore || 
    latestAptitude.domainKnowledgeScore
  );
  
  const aptitudeScores = hasAptitudeData ? [
    ...(latestAptitude.logicalReasoningScore ? [{ label: 'Logical Reasoning', score: latestAptitude.logicalReasoningScore, color: latestAptitude.logicalReasoningScore >= 80 ? 'green' : latestAptitude.logicalReasoningScore >= 60 ? 'yellow' : 'red' }] : []),
    ...(latestAptitude.quantitativeScore ? [{ label: 'Quantitative Aptitude', score: latestAptitude.quantitativeScore, color: latestAptitude.quantitativeScore >= 80 ? 'green' : latestAptitude.quantitativeScore >= 60 ? 'yellow' : 'red' }] : []),
    ...(latestAptitude.verbalAbilityScore ? [{ label: 'Verbal Ability', score: latestAptitude.verbalAbilityScore, color: latestAptitude.verbalAbilityScore >= 80 ? 'green' : latestAptitude.verbalAbilityScore >= 60 ? 'yellow' : 'red' }] : []),
    ...(latestAptitude.domainKnowledgeScore ? [{ label: 'Technical Knowledge', score: latestAptitude.domainKnowledgeScore, color: latestAptitude.domainKnowledgeScore >= 80 ? 'green' : latestAptitude.domainKnowledgeScore >= 60 ? 'yellow' : 'red' }] : [])
  ] : [];

  // Dynamic performance insights - use AI-generated if available
  const performanceInsights = feedbackData?.performanceInsights && feedbackData.performanceInsights.length > 0 ?
    feedbackData.performanceInsights :
    [
      'Technical knowledge is your strongest area',
      'Focus on building confidence in delivery',
      'Grammar improvement will enhance clarity',
      'Fluency and vocabulary are solid foundations'
    ];

  // Dynamic aptitude insights based on actual test scores
  const aptitudeInsights = latestAptitude ? (() => {
    const insights: Array<{ type: 'success' | 'warning' | 'info'; title: string; description: string }> = [];
    
    // Find strongest area
    const scores = {
      'Logical Reasoning': latestAptitude.logicalReasoningScore || 0,
      'Quantitative Aptitude': latestAptitude.quantitativeScore || 0,
      'Verbal Ability': latestAptitude.verbalAbilityScore || 0,
      'Technical Knowledge': latestAptitude.domainKnowledgeScore || 0
    };
    
    const maxScore = Math.max(...Object.values(scores));
    const minScore = Math.min(...Object.values(scores).filter(s => s > 0));
    const strongestArea = Object.entries(scores).find(([_, score]) => score === maxScore)?.[0];
    const weakestArea = Object.entries(scores).find(([_, score]) => score === minScore)?.[0];
    
    // Add strength insight
    if (strongestArea && maxScore >= 70) {
      insights.push({
        type: maxScore >= 85 ? 'success' : 'info',
        title: `Strong ${strongestArea}`,
        description: `${maxScore >= 85 ? 'Excellent' : 'Good'} performance in ${strongestArea.toLowerCase()} (${maxScore}%). ${maxScore >= 85 ? 'This is a key strength that sets you apart.' : 'This is a solid foundation to build upon.'}`
      });
    }
    
    // Add weakness insight
    if (weakestArea && minScore < 70 && weakestArea !== strongestArea) {
      insights.push({
        type: 'warning',
        title: `Improve ${weakestArea}`,
        description: `Focus on ${weakestArea.toLowerCase()} (${minScore}%). ${minScore < 50 ? 'Significant improvement needed - consider focused practice sessions.' : 'Some practice will help strengthen this area.'}`
      });
    }
    
    // Add overall assessment
    const overallScore = latestAptitude.overallScore || 0;
    insights.push({
      type: overallScore >= 80 ? 'success' : overallScore >= 60 ? 'info' : 'warning',
      title: 'Overall Assessment',
      description: `Overall aptitude score of ${overallScore}%. ${
        overallScore >= 80 ? `Excellent readiness for ${displayPosition} roles with strong all-around capabilities.` :
        overallScore >= 60 ? `Good foundation for ${displayPosition} roles. Focus on weak areas to stand out.` :
        `More preparation needed for ${displayPosition} roles. Dedicate time to strengthen fundamentals.`
      }`
    });
    
    return insights;
  })() : [
    { type: 'success' as const, title: 'Strong Logical Thinking', description: 'Excellent performance in logical reasoning shows strong analytical skills.' },
    { type: 'warning' as const, title: 'Math Skills Need Work', description: 'Focus on quantitative problems and practice speed calculation techniques.' },
    { type: 'info' as const, title: 'Well-Rounded Profile', description: `Good balance across verbal and technical areas. Ready for most ${displayPosition} roles.` }
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
              Comprehensive analysis of your {displayPosition} interview performance
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
                  <div className={`text-2xl font-bold ${getScoreColor(actualTestScore)}`}>{Math.round(actualTestScore)}%</div>
                  <div className="text-sm text-gray-600">Aptitude Test</div>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${getScoreColor(actualInterviewScore)}`}>{Math.round(actualInterviewScore)}%</div>
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

          {/* Aptitude Analytics - Only show if user took aptitude test */}
          {hasAptitudeData && aptitudeScores.length > 0 && (
            <div className="mt-8 bg-white border-2 border-gray-200 rounded-xl p-6 shadow-lg">
              <div className="flex items-center space-x-2 mb-6">
                <BarChart3 className="h-6 w-6 text-black" />
                <h2 className="text-2xl font-bold">Aptitude Analytics</h2>
              </div>
              
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="font-semibold mb-4">Subject Performance</h3>
                  <div className="space-y-3">
                    {aptitudeScores.map((score, index) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <span className="text-gray-600">{score.label}</span>
                        <span className={`font-medium ${
                          score.score >= 80 ? 'text-green-600' : 
                          score.score >= 70 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {Math.round(score.score)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-4">Aptitude Insights</h3>
                  <div className="space-y-3">
                    {aptitudeInsights.map((insight, index) => (
                      <div key={index} className={`border rounded-lg p-3 ${
                        insight.type === 'success' ? 'bg-green-50 border-green-200' :
                        insight.type === 'warning' ? 'bg-yellow-50 border-yellow-200' :
                        'bg-blue-50 border-blue-200'
                      }`}>
                        <div className="flex items-center mb-1">
                          {insight.type === 'success' ? <CheckCircle className="h-4 w-4 text-green-600 mr-2" /> :
                           insight.type === 'warning' ? <AlertCircle className="h-4 w-4 text-yellow-600 mr-2" /> :
                           <Target className="h-4 w-4 text-blue-600 mr-2" />}
                          <span className={`font-medium ${
                            insight.type === 'success' ? 'text-green-800' :
                            insight.type === 'warning' ? 'text-yellow-800' :
                            'text-blue-800'
                          }`}>
                            {insight.title}
                          </span>
                        </div>
                        <p className={`text-sm ${
                          insight.type === 'success' ? 'text-green-700' :
                          insight.type === 'warning' ? 'text-yellow-700' :
                          'text-blue-700'
                        }`}>
                        {insight.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            </div>
          )}

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
                    {performanceInsights.map((insight, index) => (
                      <li key={index}>• {insight}</li>
                    ))}
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