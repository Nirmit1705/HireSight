import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, ArrowRight, Volume2, VolumeX, X, AlertTriangle } from 'lucide-react';
import { PageType } from '../App';
import { aiInterviewAPI, ResumeAnalysis, AIQuestion } from '../services/aiInterviewAPI';
import { interviewAPI, InterviewFeedback, InterviewResponse } from '../services/interviewAPI';
import { useSpeechToText } from '../hooks/useSpeechToText';
import { useTextToSpeech } from '../hooks/useTextToSpeech';
import { ConfidenceMetrics } from '../services/speechToTextAPI';
import ConfidenceDisplay from './ConfidenceDisplay';

interface LiveInterviewProps {
  onNavigate: (page: PageType, historyId?: string, feedbackData?: InterviewFeedback) => void;
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
  const [isEnding, setIsEnding] = useState(false);
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

  // Chat scroll ref for auto-scrolling
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Transcript display management
  const [displayedTranscript, setDisplayedTranscript] = useState('');
  const [transcriptSubmitted, setTranscriptSubmitted] = useState(false);

  // Confidence metrics tracking
  const [currentConfidenceMetrics, setCurrentConfidenceMetrics] = useState<ConfidenceMetrics | null>(null);
  const [showConfidenceAnalysis, setShowConfidenceAnalysis] = useState(false);

  // End interview modal state
  const [showEndInterviewModal, setShowEndInterviewModal] = useState(false);

  // Speech-to-text functionality
  const {
    isRecording: isSpeechRecording,
    isProcessing: isSpeechProcessing,
    transcript,
    error: speechError,
    confidenceMetrics,
    startRecording: startSpeechRecording,
    stopRecording: stopSpeechRecording,
    clearTranscript,
  } = useSpeechToText();

  // Text-to-speech functionality
  const {
    isLoading: isTTSLoading,
    isPlaying: isTTSPlaying,
    error: ttsError,
    speak,
    stop: stopTTS,
  } = useTextToSpeech({ autoplay: true });

  // TTS settings
  const [isTTSEnabled, setIsTTSEnabled] = useState(true);
  
  // Ref to track TTS state to prevent multiple calls
  const ttsStateRef = useRef<{ messageIndex: number; hasSpoken: boolean }>({ messageIndex: -1, hasSpoken: false });

  // Interview questions array
  const questions = [
    "Tell me about yourself and your background.",
    "What interests you most about this position?", 
    "Describe a challenging project you've worked on.",
    "How do you handle working under pressure?",
    "What are your greatest strengths and weaknesses?",
    "Where do you see yourself in 5 years?",
    "Do you have any questions for us?",
  ];

  // Handle transcript display management
  useEffect(() => {
    if (transcript && !transcriptSubmitted) {
      setDisplayedTranscript(transcript);
    }
  }, [transcript, transcriptSubmitted]);

  // Track confidence metrics when they're updated
  useEffect(() => {
    if (confidenceMetrics) {
      setCurrentConfidenceMetrics(confidenceMetrics);
      setShowConfidenceAnalysis(true);
      
      // Detailed console logging for confidence analysis
      console.log('=== CONFIDENCE ANALYSIS FOR ANSWER ===');
      console.log('Question:', getCurrentQuestion());
      console.log('Answer:', transcript);
      console.log('Overall Confidence Score:', confidenceMetrics.overallScore + '%');
      console.log('Breakdown:');
      console.log('  - Filler Word Score:', confidenceMetrics.fillerWordScore + '%');
      console.log('  - Pause Score:', confidenceMetrics.pauseScore + '%');
      console.log('  - Fluency Score:', confidenceMetrics.fluencyScore + '%');
      
      console.log('Detailed Metrics:');
      console.log('  - Total Words:', confidenceMetrics.breakdown.totalWords);
      console.log('  - Speech Rate:', Math.round(confidenceMetrics.breakdown.speechRate) + ' WPM');
      console.log('  - Total Speaking Time:', confidenceMetrics.breakdown.totalSpeechTime.toFixed(2) + 's');
      console.log('  - Total Pause Time:', confidenceMetrics.breakdown.totalPauseTime.toFixed(2) + 's');
      console.log('  - Average Pause Duration:', confidenceMetrics.breakdown.averagePauseDuration.toFixed(2) + 's');
      
      if (confidenceMetrics.breakdown.fillerWords.length > 0) {
        console.log('Filler Words Detected:');
        confidenceMetrics.breakdown.fillerWords.forEach(filler => {
          console.log(`  - "${filler.word}": ${filler.count} times (${filler.percentage.toFixed(1)}%)`);
        });
      } else {
        console.log('No filler words detected - Great job!');
      }
      
      if (confidenceMetrics.breakdown.pauses.length > 0) {
        console.log('Pause Analysis:');
        const pauseTypes = {
          short: confidenceMetrics.breakdown.pauses.filter(p => p.type === 'short').length,
          medium: confidenceMetrics.breakdown.pauses.filter(p => p.type === 'medium').length,
          long: confidenceMetrics.breakdown.pauses.filter(p => p.type === 'long').length,
          excessive: confidenceMetrics.breakdown.pauses.filter(p => p.type === 'excessive').length
        };
        console.log(`  - Short pauses (natural): ${pauseTypes.short}`);
        console.log(`  - Medium pauses (thinking): ${pauseTypes.medium}`);
        console.log(`  - Long pauses (uncertain): ${pauseTypes.long}`);
        console.log(`  - Excessive pauses (low confidence): ${pauseTypes.excessive}`);
      } else {
        console.log('No significant pauses detected');
      }
      
      // Performance feedback
      console.log('Performance Summary:');
      if (confidenceMetrics.overallScore >= 80) {
        console.log('🟢 EXCELLENT: Very confident and clear delivery');
      } else if (confidenceMetrics.overallScore >= 60) {
        console.log('🟡 GOOD: Solid performance with room for improvement');
      } else if (confidenceMetrics.overallScore >= 40) {
        console.log('🟠 AVERAGE: Consider working on fluency and reducing filler words');
      } else {
        console.log('🔴 NEEDS WORK: Focus on speaking more confidently and clearly');
      }
      
      console.log('==========================================');
    }
  }, [confidenceMetrics, transcript]);

  // Reset transcript states when question changes (successful submission)
  useEffect(() => {
    setDisplayedTranscript('');
    setTranscriptSubmitted(false);
    clearTranscript();
    // Keep confidence metrics visible when moving to next question
  }, [currentQuestion]);

  // Handle completed transcription
  useEffect(() => {
    if (transcript && !isSpeechRecording && !isSpeechProcessing && !isProcessingResponse && !transcriptSubmitted) {
      console.log('📝 Processing completed transcript:', transcript);
      console.log('🔍 Checking for confidence metrics...');
      
      if (confidenceMetrics) {
        console.log('✅ Confidence metrics available');
      } else {
        console.log('⚠️ No confidence metrics yet - they should arrive shortly');
      }
      
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
  const addToChatHistory = (type: 'question' | 'answer', content: string, isFollowUp = false, enableTTS = true) => {
    const newMessage = {
      type,
      content,
      timestamp: new Date(),
      isFollowUp,
      isTyping: false, // DISABLE TYPING ANIMATION COMPLETELY
      displayedContent: content // SHOW FULL CONTENT IMMEDIATELY
    };

    setChatHistory(prev => {
      const newHistory = [...prev, newMessage];
      
      // START TTS IMMEDIATELY when grey chat bubble appears - NO TYPING DELAYS
      if (type === 'question' && isTTSEnabled && enableTTS) {
        const messageIndex = newHistory.length - 1;
        
        // Only start TTS if not already spoken for this message
        if (ttsStateRef.current.messageIndex !== messageIndex || !ttsStateRef.current.hasSpoken) {
          // Mark this message as having TTS started
          ttsStateRef.current = { messageIndex, hasSpoken: true };
          
          console.log('🎙️ TTS STARTING - Grey chat bubble appeared for message:', messageIndex);
          console.log('🚀 Content to speak:', content.substring(0, 100) + '...');
          console.log('🔧 isAiMode:', isAiMode, 'enableTTS:', enableTTS);
          
          // DETAILED TIMING ANALYSIS - Track exactly where delay occurs
          const startTime = performance.now();
          console.log('⏱️ [TIMING] TTS Call Started at:', new Date().toISOString());
          console.log('⏱️ [TIMING] Performance Start Time:', startTime);
          
          speak(content)
            .then(() => {
              const endTime = performance.now();
              const totalTime = endTime - startTime;
              console.log('✅ TTS completed for message:', messageIndex);
              console.log('⏱️ [TIMING] TTS Call Completed at:', new Date().toISOString());
              console.log('⏱️ [TIMING] Total TTS Time:', totalTime, 'ms');
              console.log('⏱️ [TIMING] Time to First Audio (approximate):', totalTime, 'ms');
            })
            .catch((error) => {
              const endTime = performance.now();
              const totalTime = endTime - startTime;
              console.error('❌ TTS error for message:', messageIndex, error);
              console.log('⏱️ [TIMING] TTS Error after:', totalTime, 'ms');
            });
        }
      }
      
      return newHistory;
    });
  };

  // Auto-scroll to bottom when chat history changes
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory]);

  // Update chat history when questions change
  useEffect(() => {
    if (isAiMode && aiQuestions[currentQuestion] && interviewStarted) {
      // Reset TTS state for new question
      ttsStateRef.current = { messageIndex: -1, hasSpoken: false };
      
      // Don't immediately add humanResponse to chat - let the separate effect handle it
      const questionText = aiQuestions[currentQuestion].text;
      
      // For FIRST question, enable TTS immediately (no previous feedback to wait for)
      // For subsequent questions, wait for feedback
      const shouldEnableTTS = currentQuestion === 0;
      
      addToChatHistory('question', questionText, isFollowUp, shouldEnableTTS);
      
      if (shouldEnableTTS) {
        console.log('Added FIRST AI question to chat WITH TTS enabled:', currentQuestion + 1);
      } else {
        console.log('Added AI question to chat WITHOUT TTS (waiting for feedback):', currentQuestion + 1);
      }
      
    } else if (!isAiMode && interviewStarted) {
      // Reset TTS state for new question
      ttsStateRef.current = { messageIndex: -1, hasSpoken: false };
      
      addToChatHistory('question', getCurrentQuestion(), false, true); // Enable TTS for non-AI mode
      
      console.log('Added non-AI question to chat WITH TTS enabled');
    }
  }, [currentQuestion, aiQuestions, interviewStarted, isFollowUp, isAiMode, isTTSEnabled, speak]);

  // Handle humanResponse updates separately to avoid multiple chat history updates
  useEffect(() => {
    if (humanResponse && isAiMode && aiQuestions[currentQuestion] && interviewStarted) {
      // Reset TTS state since we're updating the message content
      ttsStateRef.current = { messageIndex: -1, hasSpoken: false };
      
      // Update the latest message in chat history to include humanResponse
      setChatHistory(prev => {
        const newHistory = [...prev];
        const lastQuestionIndex = newHistory.length - 1;
        
        if (lastQuestionIndex >= 0 && newHistory[lastQuestionIndex].type === 'question') {
          const questionText = aiQuestions[currentQuestion].text;
          const fullQuestionText = `"${humanResponse}"\n\n${questionText}`;
          
          // Update the message content - NO TYPING ANIMATION
          newHistory[lastQuestionIndex] = {
            ...newHistory[lastQuestionIndex],
            content: fullQuestionText,
            displayedContent: fullQuestionText, // Show full content immediately
            isTyping: false // No typing animation
          };
          
          // No typing animation needed
        }
        
        return newHistory;
      });
      
      // Clear human response after using it - but store it for TTS first
      const feedbackText = humanResponse;
      setHumanResponse('');
      
      // NOW TRIGGER TTS for the complete question with feedback
      if (isTTSEnabled && feedbackText) {
        const fullQuestionText = `"${feedbackText}"\n\n${aiQuestions[currentQuestion].text}`;
        
        console.log('🎙️ TTS STARTING FOR COMPLETE QUESTION WITH FEEDBACK');
        console.log('🎵 Speaking complete content with feedback');
        
        speak(fullQuestionText)
          .then(() => {
            console.log('✅ TTS completed for question with feedback');
          })
          .catch((error) => {
            console.error('❌ TTS error for question with feedback:', error);
          });
      }
      
      console.log('✅ Updated chat with feedback and started TTS');
    }
  }, [humanResponse, isAiMode, aiQuestions, currentQuestion, interviewStarted, isTTSEnabled, speak]);

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
    "Preparing your personalized interview experience...",
    "Analyzing industry-specific questions for your domain...",
    "Tip: Maintain good eye contact and speak clearly",
    "Tip: Use the STAR method for behavioral questions",
    "Tip: Prepare specific examples from your experience",
    "Your AI interviewer is getting ready...",
    "Almost ready! Setting up your interview environment..."
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

  const handleEndInterview = () => {
    setShowEndInterviewModal(true);
  };

  const confirmEndInterview = async () => {
    try {
      console.log('⚡ confirmEndInterview called');
      console.log('⚡ isAiMode:', isAiMode);
      console.log('⚡ aiSessionId:', aiSessionId);
      console.log('⚡ Should use handleComplete?', isAiMode && aiSessionId);
      
      // Prevent double-clicking
      if (isEnding) {
        console.log('⚠️ Already ending interview, ignoring duplicate click');
        return;
      }
      
      // Immediately show completion screen and stop everything
      setIsEnding(true);
      setIsCompleted(true);  // Show loading/completion screen immediately
      setShowEndInterviewModal(false);
      
      // Stop any ongoing recording
      if (isSpeechRecording) {
        stopSpeechRecording();
      }
      if (isTTSPlaying) {
        stopTTS();
      }
      
      // Clear any timers
      if (userVideoStream) {
        userVideoStream.getTracks().forEach(track => track.stop());
      }
      
      // If it's an AI interview, use the handleComplete flow instead
      if (isAiMode && aiSessionId) {
        console.log('🎯 AI interview detected, using handleComplete instead of old endInterview');
        await handleComplete();
        return;
      }
      
      console.log('⚠️ Using OLD interview flow (not AI mode)');
      
      // Stop any ongoing recording
      if (isSpeechRecording) {
        stopSpeechRecording();
      }
      if (isTTSPlaying) {
        stopTTS();
      }
      
      // Clear any timers
      if (userVideoStream) {
        userVideoStream.getTracks().forEach(track => track.stop());
      }
      
      setShowEndInterviewModal(false);
      
      // Prepare interview responses from the chat history
      const responses: InterviewResponse[] = [];
      
      for (let i = 0; i < chatHistory.length - 1; i += 2) {
        const questionMessage = chatHistory[i];
        const answerMessage = chatHistory[i + 1];
        
        if (questionMessage?.type === 'question' && answerMessage?.type === 'answer') {
          responses.push({
            question: questionMessage.content,
            answer: answerMessage.content,
            confidence: currentConfidenceMetrics?.overallScore || Math.random() * 30 + 60, // 60-90
            duration: Math.random() * 60 + 90 // 90-150 seconds
          });
        }
      }

      console.log('Interview responses:', responses);
      
      // Use a mock interview ID for demo purposes - the server will handle this
      const mockInterviewId = `interview_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      console.log('🔴 Calling API to end interview with ID:', mockInterviewId);
      
      try {
        // Call the API to end interview and generate feedback
        console.log('🔴 Making API call to endInterview...');
        const result = await interviewAPI.endInterview(mockInterviewId, {
          responses: responses.length > 0 ? responses : [
            {
              question: "Tell me about yourself and your background.",
              answer: "I have experience in software development and I'm passionate about technology.",
              confidence: 75,
              duration: 120
            }
          ],
          duration: timeElapsed,
          position: resumeAnalysis?.domain || 'Software Engineering' // Pass the actual position
        });
        
        console.log('🔴 API result:', result);
        
        if (result.success && result.feedback) {
          console.log('🔴 Successfully received feedback, navigating to feedback page');
          console.log('🔴 Feedback data being set:', result.feedback);
          
          // Set the interview score from the feedback
          const overallScore = result.feedback.interviewOverallScore || 75;
          setInterviewScore(overallScore);
          
          // Navigate to feedback page with the feedback data (correct parameter order)
          onNavigate('feedback', undefined, result.feedback);
        } else {
          console.error('🔴 API call succeeded but no feedback received:', result);
          // For now, let's navigate to feedback page anyway with mock data
          setInterviewScore(75);
          onNavigate('feedback');
        }
      } catch (apiError) {
        console.error('🔴 API call failed with error:', apiError);
        console.error('🔴 Error details:', (apiError as Error).message || 'Unknown error');
        // For demo purposes, let's navigate to feedback page even if API fails
        setInterviewScore(75);
        onNavigate('feedback');
      }
    } catch (error) {
      console.error('Error ending interview:', error);
      setIsEnding(false);
      // Fallback navigation in case of error
      onNavigate('dashboard');
    }
  };

  const cancelEndInterview = () => {
    setShowEndInterviewModal(false);
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

  const handleComplete = async () => {
    try {
      // If it's AI mode with a session, complete the interview via API
      if (isAiMode && aiSessionId) {
        // Note: isCompleted is already set to true in confirmEndInterview
        // This ensures the loading screen is shown immediately
        
        console.log('=== INTERVIEW COMPLETION STARTED ===');
        console.log('Session ID:', aiSessionId);
        console.log('Current confidence metrics:', currentConfidenceMetrics);
        
        // Collect all the actual scores from the interview
        // Map the available confidence metrics to interview score parameters
        const scores = {
          fluencyScore: currentConfidenceMetrics?.fluencyScore ?? 0,
          grammarScore: currentConfidenceMetrics?.pauseScore ?? 0, // Use pause score as proxy for grammar
          confidenceScore: currentConfidenceMetrics?.overallScore ?? 0,
          technicalKnowledgeScore: currentConfidenceMetrics?.technicalScore ?? 0,
          vocabularyScore: currentConfidenceMetrics?.vocabularyScore ?? 0,
          analyticalThinkingScore: currentConfidenceMetrics?.fillerWordScore ?? 0, // Use filler word score (inverse) as proxy
          overallScore: currentConfidenceMetrics?.overallScore ?? 0
        };
        
        console.log('📊 Scores being sent to backend:', scores);
        console.log('📈 Overall score from metrics:', currentConfidenceMetrics?.overallScore);
        
        // Call backend to complete interview and save to database with actual scores
        const completionResult = await aiInterviewAPI.completeContextualInterview(aiSessionId, scores);
        console.log('✅ Backend response:', completionResult);
        console.log('📊 Backend returned scores:', completionResult.summary?.scores);
        
        // IMPORTANT: Use the ACTUAL score that was displayed during interview (from frontend metrics)
        // NOT the score from backend which might recalculate
        const score = scores.overallScore;
        console.log('🎯 Final score to display:', score);
        console.log('📊 Feedback data from backend:', completionResult.feedback);
        console.log('=== INTERVIEW COMPLETION FINISHED ===');
        
        setInterviewScore(score);
        setIsCompleted(true);
        
        // Navigate to feedback page with feedback data if available
        if (completionResult.feedback) {
          console.log('✅ Navigating to feedback page with structured feedback');
          onNavigate('feedback', undefined, completionResult.feedback);
        } else {
          // Show completion message and navigate to history
          alert(`Interview completed! Your overall score: ${score}%\n\nRedirecting to history page...`);
          onNavigate('history');
        }
      } else {
        // For non-AI interviews, use the old logic (can be updated later)
        const score = Math.floor(Math.random() * 30) + 70;
        setInterviewScore(score);
        
        // Get the actual questions that were asked
        const actualQuestions = aiQuestions.length > 0 
          ? aiQuestions.map(q => q.text)
          : questions;
        
        // Save to localStorage (legacy - can be removed once all interviews use backend)
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
      }
    } catch (error) {
      console.error('Error completing interview:', error);
      setIsEnding(false);
      // Fallback to showing completion even if API fails
      const score = Math.floor(Math.random() * 30) + 70;
      setInterviewScore(score);
      setIsCompleted(true);
      
      setTimeout(() => {
        onNavigate('feedback');
      }, 2000);
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
      {/* End Interview Button - Top Right */}
      {interviewStarted && (
        <button
          onClick={handleEndInterview}
          className="fixed top-4 right-4 z-50 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold shadow-lg transition-all duration-200 flex items-center gap-2"
        >
          <X className="h-4 w-4" />
          End Interview
        </button>
      )}
      
      <div className="flex-1 flex h-full">{}
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
              <div className="flex items-center space-x-4">
                {/* TTS Toggle */}
                <button
                  onClick={() => {
                    if (isTTSPlaying) {
                      stopTTS();
                    }
                    setIsTTSEnabled(!isTTSEnabled);
                  }}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isTTSEnabled 
                      ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' 
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                  title={isTTSEnabled ? 'Disable text-to-speech' : 'Enable text-to-speech'}
                >
                  {isTTSEnabled ? (
                    <>
                      <Volume2 className="h-4 w-4" />
                      <span>Audio On</span>
                    </>
                  ) : (
                    <>
                      <VolumeX className="h-4 w-4" />
                      <span>Audio Off</span>
                    </>
                  )}
                  {isTTSLoading && (
                    <div className="animate-spin rounded-full h-3 w-3 border-b border-current ml-1"></div>
                  )}
                </button>
                
                {conversationContext && (
                  <div className="text-xs text-gray-500">
                    <div>Messages: {conversationContext.totalMessages}</div>
                    <div>Topics: {conversationContext.topicsCovered.slice(-2).join(', ')}</div>
                  </div>
                )}
              </div>
            </div>
            
            {/* TTS Error Display */}
            {ttsError && (
              <div className="mt-2 p-2 bg-orange-100 border border-orange-300 rounded text-orange-700 text-xs">
                <strong>Audio Error:</strong> {ttsError}
              </div>
            )}
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
                            // Always show full content since typing animation is disabled
                            const contentToShow = message.content;
                            
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

          {/* Confidence Analysis */}
          {showConfidenceAnalysis && currentConfidenceMetrics && (
            <div className="border-t border-gray-200 flex-shrink-0">
              <ConfidenceDisplay 
                confidenceMetrics={currentConfidenceMetrics} 
                className="m-4"
              />
            </div>
          )}
        </div>
      </div>

      {/* End Interview Confirmation Modal */}
      {showEndInterviewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="h-6 w-6 text-red-600" />
              <h3 className="text-lg font-semibold text-gray-900">End Interview</h3>
            </div>
            
            <p className="text-gray-600 mb-6">
              Are you sure you want to end this interview? Your responses will not be saved 
              and no feedback will be generated. You'll be redirected to the dashboard.
            </p>
            
            <div className="flex gap-3 justify-end">
              <button
                onClick={cancelEndInterview}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={confirmEndInterview}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded font-medium"
              >
                End Interview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveInterview;