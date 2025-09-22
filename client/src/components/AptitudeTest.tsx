import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle, AlertCircle, ArrowRight, ArrowLeft, BarChart3, Loader } from 'lucide-react';
import { PageType } from '../App';
import { aptitudeAPI, AptitudeQuestion, AptitudePracticeQuestion } from '../services/aptitudeAPI';

interface AptitudeTestProps {
  onNavigate: (page: PageType) => void;
  setTestScore: (score: number) => void;
  isPracticeMode?: boolean;
}

const AptitudeTest: React.FC<AptitudeTestProps> = ({ onNavigate, setTestScore, isPracticeMode = false }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [timeLeft, setTimeLeft] = useState(1800); // 30 minutes
  const [isCompleted, setIsCompleted] = useState(false);
  const [questions, setQuestions] = useState<(AptitudeQuestion | AptitudePracticeQuestion)[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState<boolean[]>([]);
  const [testId, setTestId] = useState<string | null>(null);
  const [detailedAnswers, setDetailedAnswers] = useState<any[]>([]);
  const [backendScore, setBackendScore] = useState<number | null>(null);

  // Load questions from API
  useEffect(() => {
    const loadQuestions = async () => {
      try {
        setLoading(true);
        setError(null);

        const position = 'FRONTEND_DEVELOPER'; // This could be passed as prop or from context
        
        if (isPracticeMode) {
          const practiceQuestions = await aptitudeAPI.getPracticeQuestions(position);
          setQuestions(practiceQuestions);
          setShowExplanation(new Array(practiceQuestions.length).fill(false));
          setTimeLeft(practiceQuestions.length * 120); // 2 minutes per question for practice
        } else {
          // For formal test, start the test session
          const testSession = await aptitudeAPI.startTest(position, false);
          setTestId(testSession.testId);
          
          const testQuestions = await aptitudeAPI.getQuestions(position);
          setQuestions(testQuestions);
          setTimeLeft(testSession.timeLimit * 60); // Convert minutes to seconds
        }

        setSelectedAnswers(new Array(questions.length).fill(undefined));
      } catch (err) {
        console.error('Error loading questions:', err);
        setError('Failed to load questions. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadQuestions();
  }, [isPracticeMode]);

  // Timer effect
  useEffect(() => {
    if (timeLeft > 0 && !isCompleted && !loading) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !loading) {
      handleSubmit();
    }
  }, [timeLeft, isCompleted, loading]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswerSelect = async (answerIndex: number) => {
    const newAnswers = [...selectedAnswers];
    newAnswers[currentQuestion] = answerIndex;
    setSelectedAnswers(newAnswers);

    if (isPracticeMode) {
      // In practice mode, show explanation immediately
      const newShowExplanation = [...showExplanation];
      newShowExplanation[currentQuestion] = true;
      setShowExplanation(newShowExplanation);
    } else if (testId) {
      // In formal test mode, submit answer to backend
      try {
        const currentQ = questions[currentQuestion];
        await aptitudeAPI.submitAnswer(testId, currentQ.id, answerIndex);
      } catch (error) {
        console.error('Error submitting answer:', error);
        // Continue even if submission fails - we'll rely on local state
      }
    }
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleSubmit = async () => {
    if (isPracticeMode) {
      // For practice mode, calculate score locally
      const practiceQuestions = questions as AptitudePracticeQuestion[];
      const score = selectedAnswers.reduce((total, answer, index) => {
        return total + (answer === practiceQuestions[index].correctOption ? 1 : 0);
      }, 0);
      const percentage = Math.round((score / questions.length) * 100);
      setTestScore(percentage);
    } else if (testId) {
      // For formal test, complete test on backend and fetch detailed results
      try {
        const timeTakenSeconds = 1800 - timeLeft; // Calculate time taken in seconds
        const results = await aptitudeAPI.completeTest(testId, timeTakenSeconds);
        setTestScore(results.overallScore);
        setBackendScore(results.overallScore); // Store the backend score
        
        // Fetch detailed results for feedback display
        const detailedResults = await aptitudeAPI.getTestResults(testId);
        setDetailedAnswers(detailedResults.answers);
      } catch (error) {
        console.error('Error completing test:', error);
        // Fallback to local calculation
        const score = selectedAnswers.reduce((total, answer) => {
          return total + (answer !== undefined ? 1 : 0); // Can't calculate accuracy without correct answers
        }, 0);
        const percentage = Math.round((score / questions.length) * 100);
        setTestScore(percentage);
      }
    }
    
    setIsCompleted(true);
  };

  const progress = questions.length > 0 ? ((currentQuestion + 1) / questions.length) * 100 : 0;

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen pt-20 pb-12 flex items-center justify-center">
        <div className="text-center">
          <Loader className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading {isPracticeMode ? 'practice' : 'test'} questions...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen pt-1 pb-12 flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-4">Error Loading Questions</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Completed state
  if (isCompleted) {
    const practiceQuestions = questions as AptitudePracticeQuestion[];
    
    // Calculate scores differently for practice vs formal tests
    let score, totalQuestions, percentage;
    
    if (isPracticeMode) {
      // For practice mode, calculate from local data
      score = selectedAnswers.reduce((total, answer, index) => {
        return total + (answer === practiceQuestions[index]?.correctOption ? 1 : 0);
      }, 0);
      totalQuestions = questions.length;
      percentage = Math.round((score / totalQuestions) * 100);
    } else {
      // For formal tests, use the backend score if available
      if (backendScore !== null) {
        // Use the score calculated by the backend
        percentage = backendScore;
        score = detailedAnswers.filter(answer => answer.isCorrect).length;
        totalQuestions = questions.length; // Use the total questions, not just answered ones
      } else if (detailedAnswers.length > 0) {
        // Fallback: calculate from detailed answers but use total questions
        score = detailedAnswers.filter(answer => answer.isCorrect).length;
        totalQuestions = questions.length;
        percentage = Math.round((score / totalQuestions) * 100);
      } else {
        // Final fallback if no data available
        score = selectedAnswers.filter(a => a !== undefined).length;
        totalQuestions = questions.length;
        percentage = Math.round((score / totalQuestions) * 100);
      }
    }

    return (
      <div className="min-h-screen pt-20 pb-12">
        <div className="container mx-auto px-6 pt-6">
          <div className="max-w-4xl mx-auto">
            {/* Overall Results */}
            <div className="text-center mb-8">
              <div className="bg-white border-2 border-gray-200 rounded-xl p-8 shadow-lg">
                <CheckCircle className="h-16 w-16 text-black mx-auto mb-4" />
                <h2 className="text-3xl font-bold mb-2">
                  {isPracticeMode ? 'Practice Completed!' : 'Test Completed!'}
                </h2>
                <p className="text-gray-600 mb-6">
                  {isPracticeMode 
                    ? "Here's your practice results - these won't affect your official scores" 
                    : "Here's your detailed breakdown"
                  }
                </p>
                
                {isPracticeMode && (
                  <div className="bg-gray-100 border border-black rounded-lg p-4 mb-6">
                    <p className="text-sm text-black">
                      This was a practice session. Your results are not saved to your profile.
                    </p>
                  </div>
                )}

                                <div className="bg-gray-50 rounded-lg p-6 mb-6 border border-gray-200">
                  <div className={`text-4xl font-bold mb-2 ${getScoreColor(percentage)}`}>{percentage}%</div>
                  <div className="text-gray-700 mb-2">Your Score</div>
                  <div className="text-sm text-gray-500">
                    {score} out of {totalQuestions} questions correct
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                    <div className="text-2xl font-bold text-green-600">{score}</div>
                    <div className="text-sm text-green-700">Correct</div>
                  </div>
                  <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                    <div className="text-2xl font-bold text-red-600">{totalQuestions - score}</div>
                    <div className="text-sm text-red-700">Incorrect</div>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <div className="text-2xl font-bold text-blue-600">{formatTime(1800 - timeLeft)}</div>
                    <div className="text-sm text-blue-700">Time Taken</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="text-2xl font-bold text-gray-600">
                      {Math.round((1800 - timeLeft) / totalQuestions)}s
                    </div>
                    <div className="text-sm text-gray-700">Avg/Question</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Detailed Question Breakdown - Show for both practice and formal tests */}
            <div className="bg-white border-2 border-gray-200 rounded-xl p-6 mb-8 shadow-lg">
              <h3 className="text-2xl font-bold mb-6 flex items-center">
                <BarChart3 className="h-6 w-6 mr-2" />
                Question-by-Question Breakdown
              </h3>
              
              <div className="space-y-6">
                {isPracticeMode ? (
                  // Practice mode: use practice questions with explanations
                  practiceQuestions.map((question, index) => {
                    const isCorrect = selectedAnswers[index] === question.correctOption;
                    const selectedOption = selectedAnswers[index];
                    
                    return (
                      <div key={index} className={`border-2 rounded-lg p-6 ${
                        isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                      }`}>
                        <div className="flex items-start justify-between mb-4">
                          <h4 className="font-semibold text-lg flex items-center">
                            <span className="mr-3">Q{index + 1}.</span>
                            {question.questionText}
                          </h4>
                          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                            isCorrect 
                              ? 'bg-green-100 text-green-800 border border-green-200' 
                              : 'bg-red-100 text-red-800 border border-red-200'
                          }`}>
                            {isCorrect ? 'Correct' : 'Incorrect'}
                          </div>
                        </div>
                        
                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <h5 className="font-medium text-gray-700 mb-3">Answer Options:</h5>
                            <div className="space-y-2">
                              {question.options.map((option, optIndex) => (
                                <div key={optIndex} className={`p-3 rounded border-2 text-sm ${
                                  optIndex === question.correctOption 
                                    ? 'border-green-400 bg-green-100 text-green-800' 
                                    : optIndex === selectedOption && !isCorrect
                                    ? 'border-red-400 bg-red-100 text-red-800'
                                    : 'border-gray-200 bg-white text-gray-700'
                                }`}>
                                  <div className="flex items-center space-x-2">
                                    <span className="font-medium">{String.fromCharCode(65 + optIndex)}.</span>
                                    <span>{option}</span>
                                    {optIndex === question.correctOption && (
                                      <CheckCircle className="h-4 w-4 text-green-600 ml-auto" />
                                    )}
                                    {optIndex === selectedOption && !isCorrect && (
                                      <AlertCircle className="h-4 w-4 text-red-600 ml-auto" />
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                          
                          <div>
                            <div className="space-y-3">
                              <div>
                                <span className="font-medium text-gray-700">Your Answer: </span>
                                <span className={`font-medium ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                                  {selectedOption !== undefined ? String.fromCharCode(65 + selectedOption) : 'Not answered'}
                                </span>
                              </div>
                              <div>
                                <span className="font-medium text-gray-700">Correct Answer: </span>
                                <span className="font-medium text-green-600">
                                  {String.fromCharCode(65 + question.correctOption)}
                                </span>
                              </div>
                              <div className="bg-gray-100 border border-black rounded p-3 mt-3">
                                <p className="text-sm text-black">
                                  <strong>Explanation:</strong> {question.explanation}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  // Formal test mode: use detailed answers from backend
                  detailedAnswers.length > 0 ? (
                    detailedAnswers.map((answer, index) => {
                      const isCorrect = answer.isCorrect;
                      const selectedOption = answer.selectedOption;
                      
                      return (
                        <div key={index} className={`border-2 rounded-lg p-6 ${
                          isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                        }`}>
                          <div className="flex items-start justify-between mb-4">
                            <h4 className="font-semibold text-lg flex items-center">
                              <span className="mr-3">Q{index + 1}.</span>
                              {answer.questionText}
                            </h4>
                            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                              isCorrect 
                                ? 'bg-green-100 text-green-800 border border-green-200' 
                                : 'bg-red-100 text-red-800 border border-red-200'
                            }`}>
                              {isCorrect ? 'Correct' : 'Incorrect'}
                            </div>
                          </div>
                          
                          <div className="grid md:grid-cols-2 gap-4">
                            <div>
                              <h5 className="font-medium text-gray-700 mb-3">Answer Options:</h5>
                              <div className="space-y-2">
                                {answer.options.map((option: string, optIndex: number) => (
                                  <div key={optIndex} className={`p-3 rounded border-2 text-sm ${
                                    optIndex === answer.correctOption 
                                      ? 'border-green-400 bg-green-100 text-green-800' 
                                      : optIndex === selectedOption && !isCorrect
                                      ? 'border-red-400 bg-red-100 text-red-800'
                                      : 'border-gray-200 bg-white text-gray-700'
                                  }`}>
                                    <div className="flex items-center space-x-2">
                                      <span className="font-medium">{String.fromCharCode(65 + optIndex)}.</span>
                                      <span>{option}</span>
                                      {optIndex === answer.correctOption && (
                                        <CheckCircle className="h-4 w-4 text-green-600 ml-auto" />
                                      )}
                                      {optIndex === selectedOption && !isCorrect && (
                                        <AlertCircle className="h-4 w-4 text-red-600 ml-auto" />
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                            
                            <div>
                              <div className="space-y-3">
                                <div>
                                  <span className="font-medium text-gray-700">Your Answer: </span>
                                  <span className={`font-medium ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                                    {selectedOption !== undefined ? String.fromCharCode(65 + selectedOption) : 'Not answered'}
                                  </span>
                                </div>
                                <div>
                                  <span className="font-medium text-gray-700">Correct Answer: </span>
                                  <span className="font-medium text-green-600">
                                    {String.fromCharCode(65 + answer.correctOption)}
                                  </span>
                                </div>
                                <div className="bg-gray-100 border border-black rounded p-3 mt-3">
                                  <p className="text-sm text-black">
                                    <strong>Category:</strong> {answer.category.replace('_', ' ')}
                                  </p>
                                  <p className="text-sm text-black mt-2">
                                    <strong>Explanation:</strong> The correct answer is "{answer.options[answer.correctOption]}" because it represents the most accurate solution for this {answer.category.toLowerCase().replace('_', ' ')} question.
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    // Fallback: Loading state for detailed results
                    <div className="text-center py-8">
                      <Loader className="h-8 w-8 animate-spin mx-auto mb-4" />
                      <p className="text-gray-600">Loading detailed results...</p>
                    </div>
                  )
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {isPracticeMode ? (
                <>
                  <button
                    onClick={() => window.location.reload()}
                    className="bg-black hover:bg-gray-800 text-white px-8 py-4 rounded-lg font-semibold flex items-center justify-center space-x-2 transition-all duration-200 hover:scale-105"
                  >
                    <span>Practice Again</span>
                    <ArrowRight className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => onNavigate('practice')}
                    className="bg-white hover:bg-gray-50 text-black px-8 py-4 rounded-lg font-semibold border-2 border-black flex items-center justify-center space-x-2 transition-all duration-200"
                  >
                    <span>Back to Practice</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => onNavigate('interview')}
                    className="bg-black hover:bg-gray-800 text-white px-8 py-4 rounded-lg font-semibold flex items-center justify-center space-x-2 transition-all duration-200 hover:scale-105"
                  >
                    <span>Proceed to Interview</span>
                    <ArrowRight className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => onNavigate('dashboard')}
                    className="bg-white hover:bg-gray-50 text-black px-8 py-4 rounded-lg font-semibold border-2 border-black flex items-center justify-center space-x-2 transition-all duration-200"
                  >
                    <span>Back to Dashboard</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-12">
      <div className="container mx-auto px-6 pt-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-3xl font-bold">
                {isPracticeMode ? 'Practice - Aptitude Test' : 'Aptitude Test'}
              </h1>
              <div className="flex items-center space-x-2 text-black">
                <Clock className="h-5 w-5" />
                <span className="text-lg font-semibold">{formatTime(timeLeft)}</span>
              </div>
            </div>

            {isPracticeMode && (
              <div className="bg-gray-100 border border-black rounded-lg p-3 mb-4">
                <p className="text-sm text-black">
                  Practice Mode: Take your time and learn from the explanations. Results won't be saved.
                </p>
              </div>
            )}
            
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

          {/* Question */}
          <div className="bg-white border-2 border-gray-200 rounded-xl p-8 mb-8 shadow-lg">
            <h2 className="text-xl font-semibold mb-6">{questions[currentQuestion]?.questionText}</h2>
            
            <div className="space-y-4">
              {questions[currentQuestion]?.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleAnswerSelect(index)}
                  className={`w-full p-4 rounded-lg border-2 text-left transition-all duration-200 ${
                    selectedAnswers[currentQuestion] === index
                      ? 'border-black bg-gray-50'
                      : 'border-gray-200 bg-white hover:border-gray-400 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-4 h-4 rounded-full border-2 ${
                      selectedAnswers[currentQuestion] === index
                        ? 'border-black bg-black'
                        : 'border-gray-400'
                    }`}></div>
                    <span>{option}</span>
                  </div>
                </button>
              ))}
            </div>

            {/* Show explanation in practice mode after selecting an answer */}
            {isPracticeMode && showExplanation[currentQuestion] && (
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-blue-800">Explanation</h3>
                    <p className="text-blue-700 mt-1">
                      <strong>Correct Answer:</strong> {questions[currentQuestion]?.options[(questions[currentQuestion] as AptitudePracticeQuestion)?.correctOption]}
                    </p>
                    <p className="text-blue-700 mt-2">
                      {(questions[currentQuestion] as AptitudePracticeQuestion)?.explanation}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center">
            <button
              onClick={handlePrevious}
              disabled={currentQuestion === 0}
              className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                currentQuestion === 0
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-white text-black hover:bg-gray-50 border-2 border-gray-200'
              }`}
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Previous</span>
            </button>

            <div className="flex space-x-4">
              {currentQuestion === questions.length - 1 ? (
                <button
                  onClick={handleSubmit}
                  className="bg-black hover:bg-gray-800 text-white px-8 py-3 rounded-lg font-semibold flex items-center space-x-2 transition-all duration-200 hover:scale-105"
                >
                  <span>Submit Test</span>
                  <CheckCircle className="h-4 w-4" />
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  className="bg-black hover:bg-gray-800 text-white px-6 py-3 rounded-lg font-semibold flex items-center space-x-2 transition-all duration-200 hover:scale-105"
                >
                  <span>Next</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Question Grid */}
          <div className="mt-8 bg-white border-2 border-gray-200 rounded-xl p-6 shadow-lg">
            <h3 className="text-lg font-semibold mb-4">Question Overview</h3>
            <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
              {questions.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentQuestion(index)}
                  className={`w-8 h-8 rounded-lg text-sm font-medium transition-all duration-200 ${
                    index === currentQuestion
                      ? 'bg-black text-white'
                      : selectedAnswers[index] !== undefined
                      ? 'bg-gray-400 text-white'
                      : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                  }`}
                >
                  {index + 1}
                </button>
              ))}
            </div>
            <div className="flex items-center space-x-6 mt-4 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-black rounded"></div>
                <span>Current</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-gray-400 rounded"></div>
                <span>Answered</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-gray-200 rounded"></div>
                <span>Unanswered</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AptitudeTest;