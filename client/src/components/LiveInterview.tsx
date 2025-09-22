import React, { useState, useEffect } from 'react';
import { Mic, MicOff, ArrowRight } from 'lucide-react';
import { PageType } from '../App';
import { aiInterviewAPI, ResumeAnalysis, AIQuestion } from '../services/aiInterviewAPI';

interface LiveInterviewProps {
  onNavigate: (page: PageType) => void;
  setInterviewScore: (score: number) => void;
  resumeAnalysis?: ResumeAnalysis | null;
  isAiMode?: boolean;
}

const LiveInterview: React.FC<LiveInterviewProps> = ({ 
  onNavigate, 
  setInterviewScore,
  resumeAnalysis,
  isAiMode = false 
}) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [responses, setResponses] = useState<string[]>([]);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingTipIndex, setLoadingTipIndex] = useState(0);
  const [isProcessingResponse, setIsProcessingResponse] = useState(false);
  const [videoPlayCount, setVideoPlayCount] = useState(0);
  const [videoRef, setVideoRef] = useState<HTMLVideoElement | null>(null);
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [userVideoStream, setUserVideoStream] = useState<MediaStream | null>(null);
  const [userVideoRef, setUserVideoRef] = useState<HTMLVideoElement | null>(null);
  
  // AI interview states
  const [aiQuestions, setAiQuestions] = useState<AIQuestion[]>([]);
  const [aiSessionId, setAiSessionId] = useState<string | null>(null);

  const questions = [
    "Tell me about yourself and your background.",
    "What interests you most about this position?", 
    "Describe a challenging project you've worked on.",
    "How do you handle working under pressure?",
    "What are your greatest strengths and weaknesses?",
    "Where do you see yourself in 5 years?",
    "Do you have any questions for us?",
  ];

  // Get current question text - prioritize AI questions when available
  const getCurrentQuestion = () => {
    console.log('getCurrentQuestion called:', {
      isAiMode,
      aiQuestionsLength: aiQuestions.length,
      currentQuestion,
      aiQuestion: aiQuestions[currentQuestion],
      fallbackQuestion: questions[currentQuestion]
    });
    
    if (isAiMode && aiQuestions.length > 0 && aiQuestions[currentQuestion]) {
      console.log('Using AI question:', aiQuestions[currentQuestion].text);
      return aiQuestions[currentQuestion].text;
    }
    
    console.log('Using fallback question:', questions[currentQuestion]);
    return questions[currentQuestion] || "Thank you for your responses.";
  };

  // Get total questions count - dynamic for AI mode
  const getTotalQuestions = () => {
    if (isAiMode && aiQuestions.length > 0) {
      // In AI mode, show dynamic count based on current progress
      // Don't show exact total as it changes dynamically
      return Math.max(aiQuestions.length, currentQuestion + 3);
    }
    return questions.length;
  };

  const interviewTips = [
    "✨ Preparing your personalized interview experience...",
    "🎯 Analyzing industry-specific questions for your domain...",
    "💡 Tip: Maintain good eye contact and speak clearly",
    "📝 Tip: Use the STAR method for behavioral questions",
    "🚀 Tip: Prepare specific examples from your experience",
    "⭐ Your AI interviewer is getting ready...",
    "🎉 Almost ready! Setting up your interview environment..."
  ];

  // Loading screen with tips
  useEffect(() => {
    if (isLoading) {
      const tipInterval = setInterval(() => {
        setLoadingTipIndex(prev => (prev + 1) % interviewTips.length);
      }, 800);

      const loadingTimer = setTimeout(() => {
        setIsLoading(false);
      }, 6000);

      return () => {
        clearInterval(tipInterval);
        clearTimeout(loadingTimer);
      };
    }
  }, [isLoading]);

  // Timer
  useEffect(() => {
    if (!isCompleted && !isLoading) {
      const timer = setTimeout(() => setTimeElapsed(timeElapsed + 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeElapsed, isCompleted, isLoading]);

  // Waveform animation (placeholder - not used currently)
  useEffect(() => {
    let animationFrame: number;
    if (isRecording) {
      const animate = () => {
        // Placeholder for waveform animation
        animationFrame = requestAnimationFrame(animate);
      };
      animate();
    }
    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [isRecording]);

  // Timer effect
  useEffect(() => {
    let interval: number;
    if (interviewStarted && !isCompleted) {
      interval = setInterval(() => {
        setTimeElapsed(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [interviewStarted, isCompleted]);

  // Reset video play count when question changes (only if interview started)
  useEffect(() => {
    if (videoRef && !isLoading && interviewStarted) {
      setVideoPlayCount(0);
      videoRef.currentTime = 0;
      videoRef.play();
    }
  }, [currentQuestion, videoRef, isLoading, interviewStarted]);

  // Set up user video when ref is available
  useEffect(() => {
    if (userVideoRef && userVideoStream) {
      userVideoRef.srcObject = userVideoStream;
    }
  }, [userVideoRef, userVideoStream]);

  // Initialize AI interview if in AI mode - after loading is complete
  useEffect(() => {
    console.log('AI initialization effect triggered:', {
      isAiMode,
      resumeAnalysis: !!resumeAnalysis,
      aiSessionId: !!aiSessionId,
      isLoading,
      shouldStart: isAiMode && resumeAnalysis && !aiSessionId && !isLoading
    });
    
    if (isAiMode && resumeAnalysis && !aiSessionId && !isLoading) {
      console.log('Starting AI interview initialization...');
      startAiInterview(resumeAnalysis);
    }
  }, [isAiMode, resumeAnalysis, aiSessionId, isLoading]);

  // Start AI interview with resume analysis
  const startAiInterview = async (analysis: ResumeAnalysis) => {
    try {
      console.log('Starting AI interview with analysis:', analysis);
      const session = await aiInterviewAPI.startAIInterview(analysis);
      console.log('AI interview session started:', session);
      
      if (session && session.firstQuestion) {
        setAiSessionId(session.sessionId);
        setAiQuestions([session.firstQuestion]);
        setCurrentQuestion(0);
        
        console.log('First AI question set:', session.firstQuestion);
        console.log('AI questions array after setting:', [session.firstQuestion]);
      } else {
        throw new Error('No first question received from AI service');
      }
    } catch (error) {
      console.error('AI interview start error:', error);
      alert(`Failed to start AI interview: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      // Fallback to standard interview if AI fails
      console.log('Falling back to standard interview mode');
      // Don't set isAiMode to false here, just let it use standard questions
    }
  };

  // Submit AI interview answer
  const submitAiAnswer = async (answer: string) => {
    if (!aiSessionId) return;

    try {
      setIsProcessingResponse(true);
      const result = await aiInterviewAPI.submitAnswer(aiSessionId, answer);
      
      if (result.nextQuestion) {
        setAiQuestions(prev => [...prev, result.nextQuestion!]);
        setCurrentQuestion(prev => prev + 1);
      } else if (!result.shouldContinue) {
        // Interview completed
        handleComplete();
      }
    } catch (error) {
      console.error('Answer submission error:', error);
      alert(`Failed to submit answer: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsProcessingResponse(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Mock AI response generator - easily replaceable with real AI
  const generateMockResponse = async (): Promise<void> => {
    setIsProcessingResponse(true);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    if (currentQuestion < getTotalQuestions() - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      handleComplete();
    }
    
    setIsProcessingResponse(false);
  };

  const handleMicClick = async () => {
    if (isRecording) {
      // Stop recording
      setIsRecording(false);
      
      // Add mock response to responses array
      const newResponses = [...responses];
      const mockResponse = 'Voice response recorded (mock data)';
      newResponses[currentQuestion] = mockResponse;
      setResponses(newResponses);
      
      if (isAiMode && aiSessionId) {
        // Submit to AI service
        await submitAiAnswer(mockResponse);
      } else {
        // Standard mode
        if (currentQuestion < getTotalQuestions() - 1) {
          await generateMockResponse();
        } else {
          handleComplete();
        }
      }
    } else {
      // Start recording
      setIsRecording(true);
    }
  };

  const handleComplete = () => {
    const score = Math.floor(Math.random() * 30) + 70;
    setInterviewScore(score);
    
    // Get the actual questions that were asked
    const actualQuestions = isAiMode && aiQuestions.length > 0 
      ? aiQuestions.map(q => q.text)
      : questions;
    
    const newHistoryItem = {
      id: Date.now().toString(),
      type: 'interview' as const,
      date: new Date().toISOString().split('T')[0],
      score: score,
      duration: formatTime(timeElapsed),
      status: 'completed' as const,
      responses: responses.filter(response => response.trim() !== ''),
      questions: actualQuestions,
      isAiMode: isAiMode || false,
      domain: isAiMode && resumeAnalysis ? resumeAnalysis.domain : undefined
    };

    const savedHistory = localStorage.getItem('hiresight_history');
    const historyItems = savedHistory ? JSON.parse(savedHistory) : [];
    historyItems.unshift(newHistoryItem);
    localStorage.setItem('hiresight_history', JSON.stringify(historyItems));
    
    setIsCompleted(true);
    
    // Navigate to feedback page after 2 seconds
    setTimeout(() => {
      onNavigate('feedback');
    }, 2000);
  };

  const getStatusText = () => {
    if (isProcessingResponse) return "Processing your response...";
    if (isRecording) return "Recording... Click to stop";
    return "Click to Start Answering";
  };

  const handleVideoEnded = () => {
    if (videoRef && videoPlayCount < 1) {
      setVideoPlayCount(prev => prev + 1);
      videoRef.currentTime = 0;
      videoRef.play();
    } else if (videoRef) {
      videoRef.currentTime = 0;
      videoRef.pause();
    }
  };

  const requestCameraPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setUserVideoStream(stream);
      return true;
    } catch (error) {
      console.error('Camera permission denied:', error);
      alert('Camera and microphone access is required for the interview. Please allow access and try again.');
      return false;
    }
  };

  const startInterview = async () => {
    const permissionGranted = await requestCameraPermission();
    if (permissionGranted) {
      setInterviewStarted(true);
      // Start the background video
      if (videoRef) {
        videoRef.currentTime = 0;
        videoRef.play();
      }
    }
  };

  // Loading Screen
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center">
        <div className="text-center max-w-lg mx-auto px-6">
          <div className="mb-8">
            <div className="w-24 h-24 bg-black rounded-full flex items-center justify-center mx-auto mb-6">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
                <div className="w-8 h-8 bg-black rounded-full animate-pulse"></div>
              </div>
            </div>
            <h2 className="text-4xl font-bold mb-4">Setting Up Your Interview</h2>
          </div>
          
          <div className="mb-8">
            <div className="flex justify-center items-center space-x-2 mb-6">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="w-3 h-3 bg-black rounded-full animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
            
            <div className="bg-white rounded-2xl p-8 shadow-lg border-2 border-gray-200">
              <p className="text-xl text-gray-700 font-medium animate-pulse">
                {interviewTips[loadingTipIndex]}
              </p>
            </div>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-black h-3 rounded-full transition-all duration-700"
              style={{ width: `${((loadingTipIndex + 1) / interviewTips.length) * 100}%` }}
            />
          </div>
        </div>
      </div>
    );
  }

  // Completed Screen
  if (isCompleted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="bg-white border-2 border-gray-200 rounded-xl p-8 shadow-lg">
            <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-2xl text-white">✓</span>
            </div>
            <h2 className="text-3xl font-bold mb-4">Interview Completed!</h2>
            <p className="text-gray-600 mb-6">Duration: {formatTime(timeElapsed)}</p>
            <div className="text-sm text-gray-500 mb-4">
              Preparing your feedback...
            </div>
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main Interview Interface
  return (
    <div className="h-screen flex flex-col pt-16">
      <div className="flex-1 flex flex-col md:flex-row">
        {/* Left Panel - Video Background (AI Interviewer) */}
        <div className="w-full md:w-1/2 h-1/2 md:h-full bg-black flex flex-col justify-between p-3 md:p-12 relative overflow-hidden">
          {/* Background Video */}
          <video
            ref={setVideoRef}
            src="/202508.mp4"
            muted
            playsInline
            className="absolute inset-0 w-full h-full"
            style={{ zIndex: 1 }}
            onEnded={handleVideoEnded}
          >
          </video>
          <div className="absolute bottom-2 md:bottom-4 left-2 md:left-4 bg-black bg-opacity-50 text-white px-2 md:px-3 py-1 md:py-2 rounded text-xs md:text-lg z-10">
            Sara (AI Interviewer)
          </div>
          
          {/* Dark overlay for better text readability */}
          <div className="absolute inset-0 bg-black bg-opacity-20" style={{ zIndex: 2 }}></div>
          
          {/* Timer */}
          {interviewStarted && (
            <div className="absolute top-2 md:top-8 right-2 md:right-8 text-white text-sm md:text-lg font-semibold" style={{ zIndex: 3 }}>
              {formatTime(timeElapsed)}
            </div>
          )}
          
          {/* Content Container */}
          <div className="relative flex flex-col justify-between h-full" style={{ zIndex: 3 }}>
            {/* Title */}
            <div className="flex-1 flex flex-col justify-center items-center text-center">
              {!interviewStarted && (
                <>
                  <h1 className="text-2xl md:text-5xl font-bold text-white mb-1 md:mb-4">Live Interview</h1>
                  <p className="text-gray-200 text-sm md:text-xl">AI-Powered Interview Experience</p>
                </>
              )}
            </div>
            
            {/* Question Box - only show if interview started */}
            {interviewStarted && (
              <div className="w-full px-2 md:px-0">
                <div className="bg-white bg-opacity-95 backdrop-blur-sm rounded-lg md:rounded-2xl p-3 md:p-8 shadow-lg">
                  <p className="text-black text-sm md:text-xl leading-relaxed">
                    {isProcessingResponse 
                      ? (isAiMode ? "AI is analyzing your response..." : "Let me think about your response...")
                      : getCurrentQuestion()
                    }
                  </p>
                  {/* Debug info in development */}
                  {import.meta.env.DEV && (
                    <div className="mt-2 text-xs text-gray-400">
                      Debug: AI Mode: {isAiMode ? 'Yes' : 'No'} | AI Questions: {aiQuestions.length} | Current: {currentQuestion}
                    </div>
                  )}
                  {isProcessingResponse && (
                    <div className="mt-2 md:mt-4 flex justify-center">
                      <div className="flex space-x-1">
                        {[...Array(3)].map((_, i) => (
                          <div
                            key={i}
                            className="w-1 h-1 md:w-2 md:h-2 bg-black rounded-full animate-bounce"
                            style={{ animationDelay: `${i * 0.2}s` }}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                  {/* AI Question Info */}
                  {isAiMode && aiQuestions[currentQuestion] && !isProcessingResponse && (
                    <div className="mt-2 md:mt-4 text-xs text-gray-500">
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                        AI Question • {aiQuestions[currentQuestion].category}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - User Interface (User Video) */}
        <div className="w-full md:w-1/2 h-1/2 md:h-full bg-white flex flex-col relative overflow-hidden">
          {/* Progress Indicator - only show if interview started */}
          {interviewStarted && (
            <div className="absolute top-2 md:top-8 left-2 md:left-8 text-white md:text-black z-20 bg-black bg-opacity-60 md:bg-transparent rounded px-2 py-1 md:p-0">
              <div className="text-xs md:text-sm text-white md:text-gray-600">
                {isAiMode ? (
                  <>
                    Question {currentQuestion + 1}
                    <span className="ml-1 text-blue-500">• AI Dynamic</span>
                  </>
                ) : (
                  <>
                    Question {currentQuestion + 1} of {getTotalQuestions()}
                  </>
                )}
              </div>
              <div className="w-20 md:w-32 bg-gray-300 md:bg-gray-200 rounded-full h-1 md:h-2 mt-1 md:mt-2">
                {isAiMode ? (
                  /* Dynamic progress for AI mode */
                  <div className="bg-blue-500 h-1 md:h-2 rounded-full transition-all duration-300 animate-pulse"
                    style={{ width: `${Math.min(((currentQuestion + 1) / 6) * 100, 100)}%` }}
                  />
                ) : (
                  /* Fixed progress for standard mode */
                  <div 
                    className="bg-white md:bg-black h-1 md:h-2 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${((currentQuestion + 1) / getTotalQuestions()) * 100}%`
                    }}
                  />
                )}
              </div>
            </div>
          )}
          
          {!interviewStarted ? (
            /* Pre-Interview Start Screen */
            <div className="flex-1 flex items-center justify-center p-4 md:p-12">
              <div className="text-center max-w-md">
                <div className="mb-4 md:mb-8">
                  <div className="w-16 md:w-24 h-16 md:h-24 bg-black rounded-full flex items-center justify-center mx-auto mb-3 md:mb-6">
                    <span className="text-white text-2xl md:text-3xl">🎥</span>
                  </div>
                  <h2 className="text-xl md:text-3xl font-bold mb-2 md:mb-4">Ready to Start?</h2>
                  <p className="text-gray-600 mb-4 md:mb-6 max-w-sm text-sm md:text-base px-2">
                    {isAiMode 
                      ? 'Your AI-powered personalized interview is ready based on your resume analysis.'
                      : 'We\'ll need access to your camera and microphone for this interview. Click the button below to grant permissions and begin.'
                    }
                  </p>
                  {isAiMode && resumeAnalysis && (
                    <div className="mb-4 md:mb-6 bg-blue-50 border border-blue-200 rounded-lg p-3 text-left">
                      <h3 className="font-semibold text-blue-800 mb-1">Interview Profile</h3>
                      <p className="text-sm text-blue-700"><strong>Domain:</strong> {resumeAnalysis.domain}</p>
                      <p className="text-sm text-blue-700"><strong>Experience:</strong> {resumeAnalysis.experience}</p>
                      <p className="text-sm text-blue-700"><strong>Type:</strong> AI-Generated Questions</p>
                    </div>
                  )}
                </div>
                
                <button
                  onClick={startInterview}
                  className="w-full px-6 md:px-8 py-3 md:py-4 rounded-lg font-semibold flex items-center justify-center space-x-2 bg-black hover:bg-gray-800 text-white transition-all duration-200 text-sm md:text-base"
                >
                  <span>{isAiMode ? 'Start AI Interview' : 'Start Interview'}</span>
                  <ArrowRight className="h-4 w-4 md:h-5 md:w-5" />
                </button>
                
                <div className="mt-4 md:mt-6 text-xs md:text-sm text-gray-500 space-y-1">
                  <p>• Make sure you're in a quiet environment</p>
                  <p>• Ensure good lighting on your face</p>
                  <p>• Check your internet connection</p>
                </div>
              </div>
            </div>
          ) : (
            /* Interview Interface */
            <>
              {/* User Video - Full Panel */}
              <div className="relative flex-1">
                <video
                  ref={setUserVideoRef}
                  autoPlay
                  muted
                  playsInline
                  className="absolute inset-0 w-full h-full object-cover"
                >
                </video>
                <div className="absolute bottom-2 md:bottom-4 left-2 md:left-4 bg-black bg-opacity-50 text-white px-2 md:px-3 py-1 md:py-2 rounded text-xs md:text-lg z-10">
                  You
                </div>
              </div>
              
              {/* Bottom Overlay for Controls */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3 md:p-8 z-10">
                {/* Waveform Animation */}
                <div className="flex justify-center mb-2 md:mb-8">
                  <div className="flex items-center justify-center space-x-1 h-8 md:h-16">
                    {[...Array(window.innerWidth < 768 ? 15 : 25)].map((_, i) => (
                      <div
                        key={i}
                        className="bg-white md:bg-black transition-all duration-100"
                        style={{
                          width: window.innerWidth < 768 ? '2px' : '3px',
                          height: `${isRecording ? (window.innerWidth < 768 ? Math.random() * 20 + 5 : Math.random() * 40 + 10) : 2}px`,
                          opacity: isRecording ? 0.4 + Math.random() * 0.6 : 0.4,
                          borderRadius: '1px'
                        }}
                      />
                    ))}
                  </div>
                </div>
                
                {/* Status Text */}
                <p className="text-sm md:text-xl text-white md:text-black font-medium text-center mb-3 md:mb-8">
                  {getStatusText()}
                </p>
                
                {/* Control Buttons Container */}
                <div className="flex justify-center items-center space-x-3 md:space-x-4">
                  {/* Microphone Button */}
                  <div className="relative">
                    {/* Animated Ring for Active State */}
                    {isRecording && (
                      <>
                        <div className="absolute inset-0 rounded-full border-2 md:border-4 border-white md:border-black animate-ping opacity-75"></div>
                        <div className="absolute inset-0 rounded-full border-2 md:border-2 border-white md:border-black animate-pulse"></div>
                      </>
                    )}
                    
                    <button
                      onClick={handleMicClick}
                      disabled={isProcessingResponse}
                      className={`relative w-14 h-14 md:w-40 md:h-40 rounded-full border-2 md:border-4 transition-all duration-300 flex items-center justify-center ${
                        isRecording 
                          ? 'bg-red-500 md:bg-black border-red-500 md:border-black text-white scale-110' 
                          : 'bg-white border-white md:border-black text-black hover:scale-105 shadow-lg'
                      } ${isProcessingResponse ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      {isRecording ? (
                        <MicOff className="h-5 w-5 md:h-16 md:w-16" />
                      ) : (
                        <Mic className="h-5 w-5 md:h-16 md:w-16" />
                      )}
                    </button>
                  </div>
                  
                  {/* End Interview Button - dynamic appearance */}
                  {(
                    (isAiMode && currentQuestion >= 5) || // AI mode: after 5 questions
                    (!isAiMode && currentQuestion >= 4)   // Standard mode: after 4 questions
                  ) && !isProcessingResponse && (
                    <button
                      onClick={handleComplete}
                      className="bg-gray-800 text-white px-3 md:px-6 py-2 md:py-3 rounded-lg hover:bg-black transition-colors font-semibold text-xs md:text-base"
                    >
                      {isAiMode ? 'Conclude Interview' : 'End Interview'}
                    </button>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default LiveInterview;