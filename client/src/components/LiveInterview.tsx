import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, ArrowRight } from 'lucide-react';
import { PageType } from '../App';
import { aiInterviewAPI, ResumeAnalysis, AIQuestion } from '../services/aiInterviewAPI';
import { useSpeechToText } from '../hooks/useSpeechToText';

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
  const [responses, setResponses] = useState<string[]>([]);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingTipIndex, setLoadingTipIndex] = useState(0);
  const [isProcessingResponse, setIsProcessingResponse] = useState(false);
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [userVideoStream, setUserVideoStream] = useState<MediaStream | null>(null);
  const [userVideoRef, setUserVideoRef] = useState<HTMLVideoElement | null>(null);
  
  // AI interview states
  const [aiQuestions, setAiQuestions] = useState<AIQuestion[]>([]);
  const [aiSessionId, setAiSessionId] = useState<string | null>(null);
  
  // Contextual AI states
  const [humanResponse, setHumanResponse] = useState<string>('');
  const [isFollowUp, setIsFollowUp] = useState(false);
  const [conversationContext, setConversationContext] = useState<{
    totalMessages: number;
    averageResponseLength: number;
    topicsCovered: string[];
  } | null>(null);

  // Chat interface states
  const [chatHistory, setChatHistory] = useState<Array<{
    type: 'question' | 'answer';
    content: string;
    timestamp: Date;
    isFollowUp?: boolean;
    isTyping?: boolean;
    displayedContent?: string;
  }>>([]);

  // Typing animation states
  const [typingSpeed] = useState(30); // milliseconds per character
  const [currentlyTypingIndex, setCurrentlyTypingIndex] = useState<number | null>(null);
  
  // Chat scroll ref for auto-scrolling
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Transcript display management
  const [displayedTranscript, setDisplayedTranscript] = useState('');
  const [transcriptSubmitted, setTranscriptSubmitted] = useState(false);

  // Speech-to-text functionality
  const {
    isRecording: isSpeechRecording,
    isProcessing: isSpeechProcessing,
    transcript,
    error: speechError,
    startRecording: startSpeechRecording,
    stopRecording: stopSpeechRecording,
    clearTranscript,
  } = useSpeechToText();

  // Handle transcript display management
  useEffect(() => {
    if (transcript && !transcriptSubmitted) {
      setDisplayedTranscript(transcript);
    }
  }, [transcript, transcriptSubmitted]);

  // Reset transcript states when question changes (successful submission)
  useEffect(() => {
    setDisplayedTranscript('');
    setTranscriptSubmitted(false);
    clearTranscript();
  }, [currentQuestion]);

  // Handle completed transcription
  useEffect(() => {
    if (transcript && !isSpeechRecording && !isSpeechProcessing && !isProcessingResponse && !transcriptSubmitted) {
      // Add transcribed response to responses array
      const newResponses = [...responses];
      
      // Check if this response has already been processed
      if (newResponses[currentQuestion] === transcript) {
        return; // Avoid duplicate processing
      }
      
      newResponses[currentQuestion] = transcript;
      setResponses(newResponses);
      setTranscriptSubmitted(true); // Mark as submitted to prevent re-processing
      
      // Add answer to chat history
      addToChatHistory('answer', transcript);
      
      if (isAiMode && aiSessionId) {
        // Submit to AI service
        if (isAiMode) {
          submitContextualAiAnswer(transcript);
        } else {
          // Standard mode - proceed to next question
          if (currentQuestion < getTotalQuestions() - 1) {
            generateMockResponse();
          } else {
            handleComplete();
          }
        }
      } else {
        // Standard mode - proceed to next question
        if (currentQuestion < getTotalQuestions() - 1) {
          generateMockResponse();
        } else {
          handleComplete();
        }
      }
    }
  }, [transcript, isSpeechRecording, isSpeechProcessing, isProcessingResponse, transcriptSubmitted, currentQuestion, responses, isAiMode, aiSessionId]);

  // Add questions and responses to chat history
  const addToChatHistory = (type: 'question' | 'answer', content: string, isFollowUp = false, withTyping = false) => {
    const newMessage = {
      type,
      content,
      timestamp: new Date(),
      isFollowUp,
      isTyping: withTyping && type === 'question',
      displayedContent: withTyping && type === 'question' ? '' : content
    };

    setChatHistory(prev => {
      const newHistory = [...prev, newMessage];
      
      // If this is a typing question, start the typing animation
      if (withTyping && type === 'question') {
        setCurrentlyTypingIndex(newHistory.length - 1);
      }
      
      return newHistory;
    });
  };

  // Typing animation effect
  useEffect(() => {
    if (currentlyTypingIndex === null) return;

    const messageIndex = currentlyTypingIndex;
    const message = chatHistory[messageIndex];
    
    if (!message || !message.isTyping) return;

    const fullContent = message.content;
    const currentLength = message.displayedContent?.length || 0;

    if (currentLength < fullContent.length) {
      const timer = setTimeout(() => {
        setChatHistory(prev => {
          const newHistory = [...prev];
          const targetMessage = newHistory[messageIndex];
          if (targetMessage && targetMessage.isTyping) {
            targetMessage.displayedContent = fullContent.substring(0, currentLength + 1);
          }
          return newHistory;
        });
      }, typingSpeed);

      return () => clearTimeout(timer);
    } else {
      // Typing complete
      setChatHistory(prev => {
        const newHistory = [...prev];
        const targetMessage = newHistory[messageIndex];
        if (targetMessage) {
          targetMessage.isTyping = false;
          targetMessage.displayedContent = fullContent;
        }
        return newHistory;
      });
      setCurrentlyTypingIndex(null);
    }
  }, [currentlyTypingIndex, chatHistory, typingSpeed]);

  // Auto-scroll to bottom when chat history changes
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory]);

  // Update chat history when questions change
  useEffect(() => {
    if (isAiMode && aiQuestions[currentQuestion] && interviewStarted) {
      // Concatenate human response with the question if it exists
      const questionText = aiQuestions[currentQuestion].text;
      const fullQuestionText = humanResponse 
        ? `"${humanResponse}"\n\n${questionText}`
        : questionText;
      
      addToChatHistory('question', fullQuestionText, isFollowUp, true); // Enable typing animation
      
      // Clear human response after using it
      if (humanResponse) {
        setHumanResponse('');
      }
    } else if (!isAiMode && interviewStarted) {
      addToChatHistory('question', getCurrentQuestion(), false, true); // Enable typing animation
    }
  }, [currentQuestion, aiQuestions, interviewStarted, isFollowUp, isAiMode, humanResponse]);

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
    if (isSpeechRecording) {
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
  }, [isSpeechRecording]);

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
      if (isAiMode && resumeAnalysis) {
        startContextualAiInterview(resumeAnalysis);
      }
    }
  }, [isAiMode, resumeAnalysis, aiSessionId, isLoading]);

  // Start AI interview with resume analysis
  // Start contextual AI interview
  const startContextualAiInterview = async (analysis: ResumeAnalysis) => {
    try {
      console.log('Starting contextual AI interview with analysis:', analysis);
      const session = await aiInterviewAPI.startContextualInterview(analysis);
      console.log('Contextual AI interview session started:', session);
      
      if (session && session.firstQuestion) {
        setAiSessionId(session.sessionId);
        setAiQuestions([session.firstQuestion]);
        setCurrentQuestion(0);
        
        console.log('First contextual AI question set:', session.firstQuestion);
      } else {
        throw new Error('No first question received from contextual AI service');
      }
    } catch (error) {
      console.error('Contextual AI interview start error:', error);
      alert(`Failed to start contextual AI interview: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      // Fallback to standard interview mode if contextual AI fails
      console.log('Falling back to standard interview mode');
    }
  };

  // Submit contextual AI interview answer
  const submitContextualAiAnswer = async (answer: string) => {
    if (!aiSessionId) return;

    try {
      setIsProcessingResponse(true);
      
      const result = await aiInterviewAPI.submitContextualAnswer(aiSessionId, answer);
      
      // Handle human-like response from interviewer
      if (result.humanResponse) {
        setHumanResponse(result.humanResponse);
        // Note: humanResponse will be cleared when the question is added to chat history
      }
      
      // Update conversation context
      if (result.conversationContext) {
        setConversationContext(result.conversationContext);
      }
      
      // Set follow-up flag
      setIsFollowUp(result.isFollowUp || false);
      
      if (result.nextQuestion) {
        setAiQuestions(prev => [...prev, result.nextQuestion!]);
        setCurrentQuestion(prev => prev + 1);
      } else if (result.isComplete || !result.shouldContinue) {
        // Interview completed
        handleComplete();
      }
    } catch (error) {
      console.error('Contextual answer submission error:', error);
      
      let errorMessage = 'Failed to submit answer to contextual AI';
      if (error instanceof Error) {
        if (error.message.includes('Failed to fetch')) {
          errorMessage = 'Connection error. Please check if the server is running and try again.';
        } else {
          errorMessage = error.message;
        }
      }
      
      alert(`${errorMessage}\n\nYour response was: "${answer}"\n\nYou can try speaking again.`);
      
      // Reset transcript submission state to allow retry
      setTranscriptSubmitted(false);
      
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
    if (isSpeechRecording) {
      // Stop recording and process
      await stopSpeechRecording();
    } else {
      // Start recording - reset transcript states for new recording
      clearTranscript();
      setDisplayedTranscript('');
      setTranscriptSubmitted(false);
      
      const success = await startSpeechRecording();
      if (!success) {
        alert('Failed to start recording. Please check your microphone permissions.');
      }
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
    <div className="h-screen overflow-hidden flex flex-col">
      <div className="flex-1 flex h-full">
        {/* Left Panel - User Video */}
        <div className="w-1/2 bg-black relative flex flex-col overflow-hidden h-full">
          {/* Timer */}
          {interviewStarted && (
            <div className="absolute top-4 right-4 text-white text-lg font-semibold z-20">
              {formatTime(timeElapsed)}
            </div>
          )}

          {/* User Video Stream */}
          <div className="flex-1 relative">
            <video
              ref={setUserVideoRef}
              className="w-full h-full object-cover"
              muted
              playsInline
              autoPlay
            />
            
            {/* Overlay when no video */}
            {!userVideoStream && (
              <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
                <div className="text-center text-white">
                  <div className="w-24 h-24 bg-gray-700 rounded-full flex items-center justify-center mb-4 mx-auto">
                    <span className="text-3xl">👤</span>
                  </div>
                  <p className="text-gray-300">Camera not accessible</p>
                </div>
              </div>
            )}

            {/* Interview Title Overlay */}
            {!interviewStarted && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                <div className="text-center text-white">
                  <h1 className="text-4xl font-bold mb-2">Live Interview</h1>
                  <p className="text-xl text-gray-200">
                    {isAiMode ? 'AI-Powered Contextual Interview' : 'Interactive Interview Experience'}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Controls Section */}
          <div className="bg-gray-900 p-6 flex-shrink-0">
            {/* Progress Indicator */}
            {interviewStarted && (
              <div className="mb-4">
                <div className="text-sm text-gray-400 mb-2">
                  {isAiMode ? (
                    <>
                      Question {currentQuestion + 1}
                      <span className="ml-2 text-green-400">• AI Contextual</span>
                    </>
                  ) : (
                    <>
                      Question {currentQuestion + 1} of {getTotalQuestions()}
                    </>
                  )}
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ 
                      width: isAiMode 
                        ? `${Math.min((currentQuestion + 1) / 12 * 100, 100)}%`
                        : `${((currentQuestion + 1) / getTotalQuestions()) * 100}%` 
                    }}
                  />
                </div>
              </div>
            )}

            {/* Current Transcript Display */}
            {interviewStarted && (
              <div className="mb-4">
                <div className="bg-gray-800 rounded-lg p-4 min-h-[100px]">
                  <div className="text-xs text-gray-400 mb-2">Your Response:</div>
                  <div className="text-white">
                    {isProcessingResponse ? (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span className="text-gray-400">Processing your answer...</span>
                      </div>
                    ) : displayedTranscript || (
                      <span className="text-gray-500 italic">
                        {isSpeechRecording ? "Listening..." : "Click the microphone to start speaking"}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Microphone Button */}
            {interviewStarted ? (
              <div className="flex justify-center">
                <button
                  onClick={handleMicClick}
                  disabled={isProcessingResponse || isSpeechProcessing}
                  className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-200 ${
                    isSpeechRecording
                      ? 'bg-red-500 hover:bg-red-600 scale-110'
                      : 'bg-blue-500 hover:bg-blue-600'
                  } ${(isProcessingResponse || isSpeechProcessing) ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isSpeechRecording ? (
                    <MicOff className="h-8 w-8 text-white" />
                  ) : (
                    <Mic className="h-8 w-8 text-white" />
                  )}
                </button>
              </div>
            ) : (
              <div className="flex justify-center">
                <button
                  onClick={startInterview}
                  disabled={isLoading}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold flex items-center space-x-2 transition-all duration-200"
                >
                  <span>Start Interview</span>
                  <ArrowRight className="h-5 w-5" />
                </button>
              </div>
            )}

            {/* Speech Error Display */}
            {speechError && (
              <div className="mt-4 p-3 bg-red-900 bg-opacity-50 border border-red-500 rounded-lg">
                <div className="text-red-300 text-sm">
                  <strong>Speech Recognition Error:</strong> {speechError}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Chat Interface */}
        <div className="w-1/2 bg-white border-l border-gray-200 flex flex-col h-full">
          {/* Chat Header */}
          <div className="bg-gray-50 border-b border-gray-200 p-4 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Interview Conversation</h2>
                <p className="text-sm text-gray-600">
                  {isAiMode ? 'AI-powered contextual interview' : 'Standard interview questions'}
                </p>
              </div>
              {conversationContext && (
                <div className="text-xs text-gray-500">
                  <div>Messages: {conversationContext.totalMessages}</div>
                  <div>Topics: {conversationContext.topicsCovered.slice(-2).join(', ')}</div>
                </div>
              )}
            </div>
          </div>

          {/* Chat Messages */}
          <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
            {chatHistory.length === 0 ? (
              <div className="text-center text-gray-500 mt-8">
                <div className="text-4xl mb-4">💬</div>
                <p>Interview conversation will appear here</p>
                <p className="text-sm mt-2">Start the interview to begin</p>
              </div>
            ) : (
              chatHistory.map((message, index) => (
                <div key={index} className={`flex ${message.type === 'answer' ? 'justify-end' : 'justify-start'}`}>
                  <div 
                    className={`max-w-[80%] rounded-lg px-4 py-3 ${
                      message.type === 'question' 
                        ? 'bg-gray-100 text-gray-900' 
                        : 'bg-black text-white'
                    }`}
                  >
                    <div className="flex items-center mb-1">
                      <span className={`text-xs font-medium ${
                        message.type === 'question' ? 'text-gray-600' : 'text-gray-300'
                      }`}>
                        {message.type === 'question' ? 'Interviewer' : 'You'}
                      </span>
                      {message.isFollowUp && (
                        <span className="ml-2 text-xs bg-orange-100 text-orange-800 px-2 py-0.5 rounded">
                          Follow-up
                        </span>
                      )}
                      <span className={`ml-auto text-xs ${
                        message.type === 'answer' ? 'text-gray-300' : 'text-gray-500'
                      }`}>
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="text-sm whitespace-pre-line">
                      {message.type === 'question' ? (
                        <div>
                          {(() => {
                            const contentToShow = message.isTyping ? (message.displayedContent || '') : message.content;
                            
                            if (contentToShow.startsWith('"')) {
                              // If the content starts with a quote, it contains feedback
                              const parts = contentToShow.split('\n\n');
                              const feedbackPart = parts[0] || '';
                              const questionPart = parts.slice(1).join('\n\n') || '';
                              
                              return (
                                <div>
                                  <div className="text-blue-800 italic mb-2 pb-2 border-b border-gray-300">
                                    {feedbackPart}
                                    {message.isTyping && !questionPart && <span className="animate-pulse">|</span>}
                                  </div>
                                  {questionPart && (
                                    <div>
                                      {questionPart}
                                      {message.isTyping && <span className="animate-pulse">|</span>}
                                    </div>
                                  )}
                                </div>
                              );
                            } else {
                              return (
                                <div>
                                  {contentToShow}
                                  {message.isTyping && <span className="animate-pulse">|</span>}
                                </div>
                              );
                            }
                          })()}
                        </div>
                      ) : (
                        message.content
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveInterview;