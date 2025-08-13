import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Video, VideoOff, MessageSquare, CheckCircle, Clock, ArrowRight } from 'lucide-react';
import { PageType } from '../App';

interface LiveInterviewProps {
  onNavigate: (page: PageType) => void;
  setInterviewScore: (score: number) => void;
}

const LiveInterview: React.FC<LiveInterviewProps> = ({ onNavigate, setInterviewScore }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [responses, setResponses] = useState<string[]>([]);
  const [currentResponse, setCurrentResponse] = useState('');
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  const questions = [
    "Tell me about yourself and your background.",
    "What interests you most about this position?",
    "Describe a challenging project you've worked on.",
    "How do you handle working under pressure?",
    "What are your greatest strengths and weaknesses?",
    "Where do you see yourself in 5 years?",
    "Do you have any questions for us?",
  ];

  useEffect(() => {
    if (!isCompleted) {
      const timer = setTimeout(() => setTimeElapsed(timeElapsed + 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeElapsed, isCompleted]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleNext = () => {
    const newResponses = [...responses];
    newResponses[currentQuestion] = currentResponse;
    setResponses(newResponses);
    setCurrentResponse('');
    
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = () => {
    // Simulate interview scoring based on responses
    const score = Math.floor(Math.random() * 30) + 70; // Random score between 70-100
    setInterviewScore(score);
    setIsCompleted(true);
  };

  const progress = ((currentQuestion + 1) / questions.length) * 100;

  if (isCompleted) {
    return (
      <div className="min-h-screen pt-20 pb-12">
        <div className="container mx-auto px-6">
          <div className="max-w-2xl mx-auto text-center">
            <div className="bg-white border-2 border-gray-200 rounded-xl p-8 shadow-lg">
              <div className="mb-6">
                <CheckCircle className="h-16 w-16 text-black mx-auto mb-4" />
                <h2 className="text-3xl font-bold mb-2">Interview Completed!</h2>
                <p className="text-gray-600">Great job! Your interview has been processed.</p>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-6 mb-6 border border-gray-200">
                <div className="text-lg text-gray-700 mb-4">Interview Duration: {formatTime(timeElapsed)}</div>
                <div className="text-lg text-gray-700">Questions Answered: {questions.length}</div>
              </div>
              
              <button
                onClick={() => onNavigate('dashboard')}
                className="bg-black hover:bg-gray-800 text-white px-8 py-4 rounded-lg font-semibold flex items-center space-x-2 mx-auto transition-all duration-200 hover:scale-105"
              >
                <span>View Feedback</span>
                <ArrowRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-12">
      <div className="container mx-auto px-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-3xl font-bold">Live AI Interview</h1>
              <div className="flex items-center space-x-2 text-black">
                <Clock className="h-5 w-5" />
                <span className="text-lg font-semibold">{formatTime(timeElapsed)}</span>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-black h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <div className="text-sm text-gray-600 mt-2">
              Question {currentQuestion + 1} of {questions.length}
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Video Section */}
            <div className="lg:col-span-2 space-y-6">
              {/* AI Interviewer */}
              <div className="bg-white border-2 border-gray-200 rounded-xl p-6 shadow-lg">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center">
                    <MessageSquare className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold">AI Interviewer</h3>
                    <p className="text-sm text-gray-600">Sarah - Senior Technical Interviewer</p>
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4 mb-4 border border-gray-200">
                  <p className="text-lg">{questions[currentQuestion]}</p>
                </div>
                
                <div className="text-sm text-gray-600">
                  💡 Take your time to think and provide a comprehensive answer
                </div>
              </div>

              {/* Your Response */}
              <div className="bg-white border-2 border-gray-200 rounded-xl p-6 shadow-lg">
                <h3 className="font-semibold mb-4">Your Response</h3>
                <textarea
                  value={currentResponse}
                  onChange={(e) => setCurrentResponse(e.target.value)}
                  placeholder="Type your response here or use the microphone to record..."
                  className="w-full h-32 bg-gray-50 border border-gray-200 rounded-lg p-4 text-black placeholder-gray-500 focus:outline-none focus:border-black resize-none"
                />
                
                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => setIsRecording(!isRecording)}
                      className={`p-3 rounded-full transition-all duration-200 ${
                        isRecording 
                          ? 'bg-red-500 hover:bg-red-600 text-white' 
                          : 'bg-gray-200 hover:bg-gray-300 text-black'
                      }`}
                    >
                      {isRecording ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                    </button>
                    <button
                      onClick={() => setIsVideoOn(!isVideoOn)}
                      className={`p-3 rounded-full transition-all duration-200 ${
                        isVideoOn 
                          ? 'bg-gray-200 hover:bg-gray-300 text-black' 
                          : 'bg-red-500 hover:bg-red-600 text-white'
                      }`}
                    >
                      {isVideoOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
                    </button>
                  </div>
                  
                  <button
                    onClick={handleNext}
                    disabled={!currentResponse.trim()}
                    className={`px-6 py-3 rounded-lg font-semibold flex items-center space-x-2 transition-all duration-200 ${
                      currentResponse.trim()
                        ? 'bg-black hover:bg-gray-800 text-white hover:scale-105'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    <span>{currentQuestion === questions.length - 1 ? 'Complete' : 'Next'}</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Interview Progress */}
              <div className="bg-white border-2 border-gray-200 rounded-xl p-6 shadow-lg">
                <h3 className="font-semibold mb-4">Interview Progress</h3>
                <div className="space-y-3">
                  {questions.map((_, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm ${
                        index < currentQuestion
                          ? 'bg-black text-white'
                          : index === currentQuestion
                          ? 'bg-gray-400 text-white'
                          : 'bg-gray-200 text-gray-600'
                      }`}>
                        {index < currentQuestion ? '✓' : index + 1}
                      </div>
                      <span className={`text-sm ${
                        index <= currentQuestion ? 'text-black' : 'text-gray-500'
                      }`}>
                        Question {index + 1}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tips */}
              <div className="bg-white border-2 border-gray-200 rounded-xl p-6 shadow-lg">
                <h3 className="font-semibold mb-4">Interview Tips</h3>
                <div className="space-y-3 text-sm text-gray-600">
                  <div className="flex items-start space-x-2">
                    <span className="text-black">•</span>
                    <span>Speak clearly and maintain eye contact</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="text-black">•</span>
                    <span>Use specific examples in your answers</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="text-black">•</span>
                    <span>Take your time to think before answering</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="text-black">•</span>
                    <span>Ask clarifying questions if needed</span>
                  </div>
                </div>
              </div>

              {/* Recording Status */}
              {isRecording && (
                <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="text-red-600 font-medium">Recording in progress...</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveInterview;