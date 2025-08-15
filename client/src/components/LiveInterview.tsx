import React, { useState, useEffect } from 'react';
import { Mic, MicOff, ArrowRight } from 'lucide-react';
import { PageType } from '../App';

interface LiveInterviewProps {
  onNavigate: (page: PageType) => void;
  setInterviewScore: (score: number) => void;
}

const LiveInterview: React.FC<LiveInterviewProps> = ({ onNavigate, setInterviewScore }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [responses, setResponses] = useState<string[]>([]);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingTipIndex, setLoadingTipIndex] = useState(0);
  const [isProcessingResponse, setIsProcessingResponse] = useState(false);
  const [waveformAmplitude, setWaveformAmplitude] = useState(0);
  const [videoPlayCount, setVideoPlayCount] = useState(0);
  const [videoRef, setVideoRef] = useState<HTMLVideoElement | null>(null);
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [userVideoStream, setUserVideoStream] = useState<MediaStream | null>(null);
  const [cameraPermissionGranted, setCameraPermissionGranted] = useState(false);
  const [userVideoRef, setUserVideoRef] = useState<HTMLVideoElement | null>(null);

  const questions = [
    "Tell me about yourself and your background.",
    "What interests you most about this position?", 
    "Describe a challenging project you've worked on.",
    "How do you handle working under pressure?",
    "What are your greatest strengths and weaknesses?",
    "Where do you see yourself in 5 years?",
    "Do you have any questions for us?",
  ];

  const interviewTips = [
    "✨ Preparing your personalized interview experience...",
    "🎯 Analyzing industry-specific questions for your domain...",
    "💡 Tip: Maintain good eye contact and speak clearly",
    "📝 Tip: Use the STAR method for behavioral questions",
    "🚀 Tip: Prepare specific examples from your experience",
    "⭐ Your AI interviewer is getting ready...",
    "🎉 Almost ready! Setting up your interview environment..."
  ];

  const mockAIResponses = [
    "That's a great background! Can you tell me more about your experience with teamwork?",
    "Interesting perspective. How do you typically approach learning new technologies?",
    "That sounds like a challenging project. What was the most difficult obstacle you overcame?",
    "Good approach to handling pressure. Can you give me a specific example from your experience?",
    "I appreciate your self-awareness. How are you actively working on improving your weaknesses?",
    "Those are ambitious goals. What concrete steps are you taking to achieve them?",
    "Thank you for those thoughtful questions. Based on our conversation, how do you feel about this role?"
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

  // Waveform animation
  useEffect(() => {
    let animationFrame: number;
    if (isRecording) {
      const animate = () => {
        setWaveformAmplitude(Math.random() * 0.8 + 0.2);
        animationFrame = requestAnimationFrame(animate);
      };
      animate();
    } else {
      setWaveformAmplitude(0);
    }
    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [isRecording]);

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
    
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
    
    setIsProcessingResponse(false);
  };

  const handleMicClick = async () => {
    if (isRecording) {
      // Stop recording
      setIsRecording(false);
      
      // Add mock response to responses array
      const newResponses = [...responses];
      newResponses[currentQuestion] = 'Voice response recorded (mock data)';
      setResponses(newResponses);
      
      if (currentQuestion < questions.length - 1) {
        await generateMockResponse();
      } else {
        handleComplete();
      }
    } else {
      // Start recording
      setIsRecording(true);
    }
  };

  const handleComplete = () => {
    const score = Math.floor(Math.random() * 30) + 70;
    setInterviewScore(score);
    
    const newHistoryItem = {
      id: Date.now().toString(),
      type: 'interview' as const,
      date: new Date().toISOString().split('T')[0],
      score: score,
      duration: formatTime(timeElapsed),
      status: 'completed' as const,
      responses: responses.filter(response => response.trim() !== ''),
      questions: questions
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

  const WaveformAnimation = () => (
    <div className="flex items-center justify-center space-x-1 h-16 mb-8">
      {[...Array(25)].map((_, i) => (
        <div
          key={i}
          className="bg-black transition-all duration-100"
          style={{
            width: '3px',
            height: `${isRecording ? Math.random() * 40 + 10 : 2}px`,
            opacity: isRecording ? 0.3 + Math.random() * 0.7 : 0.3,
            borderRadius: '2px'
          }}
        />
      ))}
    </div>
  );

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
      setCameraPermissionGranted(true);
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
                    {isProcessingResponse ? "Let me think about your response..." : questions[currentQuestion]}
                  </p>
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
              <div className="text-xs md:text-sm text-white md:text-gray-600">Question {currentQuestion + 1} of {questions.length}</div>
              <div className="w-20 md:w-32 bg-gray-300 md:bg-gray-200 rounded-full h-1 md:h-2 mt-1 md:mt-2">
                <div 
                  className="bg-white md:bg-black h-1 md:h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
                />
              </div>
            </div>
          )}
          
          {!interviewStarted ? (
            /* Pre-Interview Start Screen */
            <div className="flex-1 flex items-center justify-center p-4 md:p-12">
              <div className="text-center">
                <div className="mb-4 md:mb-8">
                  <div className="w-16 md:w-24 h-16 md:h-24 bg-black rounded-full flex items-center justify-center mx-auto mb-3 md:mb-6">
                    <span className="text-white text-2xl md:text-3xl">🎥</span>
                  </div>
                  <h2 className="text-xl md:text-3xl font-bold mb-2 md:mb-4">Ready to Start?</h2>
                  <p className="text-gray-600 mb-4 md:mb-8 max-w-sm text-sm md:text-base px-2">
                    We'll need access to your camera and microphone for this interview. 
                    Click the button below to grant permissions and begin.
                  </p>
                </div>
                
                <button
                  onClick={startInterview}
                  className="bg-black hover:bg-gray-800 text-white px-6 md:px-8 py-3 md:py-4 rounded-lg font-semibold flex items-center space-x-2 mx-auto transition-all duration-200 text-sm md:text-base"
                >
                  <span>Start Interview</span>
                  <ArrowRight className="h-4 w-4 md:h-5 md:w-5" />
                </button>
                
                <div className="mt-4 md:mt-8 text-xs md:text-sm text-gray-500 space-y-1">
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
                  
                  {/* End Interview Button (appears after question 5) */}
                  {currentQuestion >= 4 && !isProcessingResponse && (
                    <button
                      onClick={handleComplete}
                      className="bg-gray-800 text-white px-3 md:px-6 py-2 md:py-3 rounded-lg hover:bg-black transition-colors font-semibold text-xs md:text-base"
                    >
                      End Interview
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