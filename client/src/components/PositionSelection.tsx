import React, { useState, useEffect } from 'react';
import { ArrowRight, Code, Database, Briefcase, PieChart, Users, Settings, FileText, Loader2, X, Upload } from 'lucide-react';
import { PageType } from '../App';
import { metadataAPI, Position, Domain } from '../services/metadataAPI';
import { aiInterviewAPI, ResumeAnalysis } from '../services/aiInterviewAPI';

interface PositionSelectionProps {
  onNavigate: (page: PageType) => void;
  selectedPosition: string;
  setSelectedPosition: (position: string) => void;
  selectedDomain: string;
  setSelectedDomain: (domain: string) => void;
  isAssessmentMode?: boolean;
  setResumeAnalysis?: (analysis: ResumeAnalysis | null) => void;
  setIsAiMode?: (isAi: boolean) => void;
}

const PositionSelection: React.FC<PositionSelectionProps> = ({
  onNavigate,
  selectedPosition,
  setSelectedPosition,
  selectedDomain,
  setSelectedDomain,
  isAssessmentMode = false,
  setResumeAnalysis,
  setIsAiMode
}) => {
  const [positions, setPositions] = useState<Position[]>([]);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Resume upload states
  const [selectionMode, setSelectionMode] = useState<'manual' | 'resume'>('manual');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isProcessingResume, setIsProcessingResume] = useState(false);
  const [resumeAnalysis, setLocalResumeAnalysis] = useState<ResumeAnalysis | null>(null);

  // Icon mapping for positions
  const iconMap: { [key: string]: any } = {
    'Code': Code,
    'Database': Database,
    'Settings': Settings,
    'PieChart': PieChart,
    'Briefcase': Briefcase,
    'Users': Users
  };

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        setLoading(true);
        const [positionsData, domainsData] = await Promise.all([
          metadataAPI.getPositions(),
          metadataAPI.getDomains()
        ]);
        setPositions(positionsData);
        setDomains(domainsData);
      } catch (err) {
        console.error('Error fetching metadata:', err);
        setError('Failed to load positions and domains');
      } finally {
        setLoading(false);
      }
    };

    fetchMetadata();
  }, []);

  // Handle resume file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/jpeg',
        'image/jpg',
        'image/png'
      ];
      
      if (allowedTypes.includes(file.type)) {
        setUploadedFile(file);
        processResume(file);
      } else {
        alert('Please upload a PDF, Word document, or image file.');
      }
    }
  };

  // Process uploaded resume
  const processResume = async (file: File) => {
    setIsProcessingResume(true);
    try {
      // Debug: Check if user is authenticated
      const token = localStorage.getItem('authToken');
      console.log('Token exists:', !!token);
      if (!token) {
        throw new Error('Please log in to upload resume');
      }
      
      const result = await aiInterviewAPI.uploadResume(file);
      setLocalResumeAnalysis(result.analysis);
      if (setResumeAnalysis) {
        setResumeAnalysis(result.analysis);
      }
      if (setIsAiMode) {
        setIsAiMode(true);
      }
    } catch (error) {
      console.error('Resume processing error:', error);
      alert(`Failed to process resume: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsProcessingResume(false);
    }
  };

  const handleRemoveFile = () => {
    setUploadedFile(null);
    setLocalResumeAnalysis(null);
    if (setResumeAnalysis) {
      setResumeAnalysis(null);
    }
    if (setIsAiMode) {
      setIsAiMode(false);
    }
  };

  const handleProceed = () => {
    if (selectionMode === 'manual' && selectedPosition && selectedDomain) {
      // Manual selection mode
      onNavigate(isAssessmentMode ? 'interview' : 'aptitude');
    } else if (selectionMode === 'resume' && resumeAnalysis) {
      // Resume-based mode - proceed directly to interview
      onNavigate('interview');
    }
  };

  const canProceed = () => {
    if (selectionMode === 'manual') {
      return selectedPosition && selectedDomain && !loading;
    } else {
      return resumeAnalysis && !isProcessingResume;
    }
  };

  return (
    <div className="min-h-screen pt-20 pb-12">
      <div className="container mx-auto px-6 pt-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Choose Your Interview Approach
            </h1>
            <p className="text-xl text-gray-600">
              Select your role manually or upload your resume for AI-powered personalized questions
            </p>
            {isAssessmentMode && (
              <div className="mt-4 bg-gray-100 border border-black rounded-lg p-3 max-w-md mx-auto">
                <p className="text-sm text-black">
                  Using your previous aptitude score - proceeding directly to interview
                </p>
              </div>
            )}
          </div>

          {/* Selection Mode Toggle */}
          <div className="mb-12">
            <div className="flex justify-center mb-8">
              <div className="bg-gray-100 p-1 rounded-lg flex">
                <button
                  onClick={() => setSelectionMode('manual')}
                  className={`px-6 py-3 rounded-md font-medium transition-all ${
                    selectionMode === 'manual'
                      ? 'bg-black text-white shadow-sm'
                      : 'text-gray-600 hover:text-black'
                  }`}
                >
                  Manual Selection
                </button>
                <button
                  onClick={() => setSelectionMode('resume')}
                  className={`px-6 py-3 rounded-md font-medium transition-all ${
                    selectionMode === 'resume'
                      ? 'bg-black text-white shadow-sm'
                      : 'text-gray-600 hover:text-black'
                  }`}
                >
                  Upload Resume
                </button>
              </div>
            </div>

            {/* Manual Selection Mode */}
            {selectionMode === 'manual' && (
              <>

          {/* Position Selection */}
          <div className="mb-12">
            <h2 className="text-2xl font-semibold mb-6">Position</h2>
            {loading ? (
              <div className="text-center">Loading positions...</div>
            ) : error ? (
              <div className="text-center text-red-600">{error}</div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {positions.map((position) => {
                  const IconComponent = iconMap[position.icon] || Code;
                  return (
                    <div
                      key={position.id}
                      onClick={() => setSelectedPosition(position.id)}
                      className={`cursor-pointer p-6 rounded-xl border-2 transition-all duration-200 hover:scale-105 hover:shadow-lg ${
                        selectedPosition === position.id
                          ? 'border-black bg-gray-50'
                          : 'border-gray-200 bg-white hover:border-gray-400'
                      }`}
                    >
                      <div className="flex items-center space-x-3 mb-3">
                        <div className={`p-2 rounded-lg ${
                          selectedPosition === position.id ? 'bg-black' : 'bg-gray-100'
                        }`}>
                          <IconComponent className={`h-6 w-6 ${
                            selectedPosition === position.id ? 'text-white' : 'text-black'
                          }`} />
                        </div>
                        <h3 className="text-lg font-semibold">{position.title}</h3>
                      </div>
                      <p className="text-gray-600 text-sm">{position.description}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Domain Selection */}
          <div className="mb-12">
            <h2 className="text-2xl font-semibold mb-6">Domain</h2>
            {loading ? (
              <div className="text-center">Loading domains...</div>
            ) : error ? (
              <div className="text-center text-red-600">{error}</div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {domains.map((domain) => (
                  <div
                    key={domain.id}
                    onClick={() => setSelectedDomain(domain.id)}
                    className={`cursor-pointer p-6 rounded-xl border-2 transition-all duration-200 hover:scale-105 hover:shadow-lg ${
                      selectedDomain === domain.id
                        ? 'border-black bg-gray-50'
                        : 'border-gray-200 bg-white hover:border-gray-400'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-4 h-4 rounded-full ${
                        selectedDomain === domain.id ? 'bg-black' : 'bg-gray-400'
                      }`}></div>
                      <h3 className="text-lg font-semibold">{domain.title}</h3>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
                </>
            )}

            {/* Resume Upload Mode */}
            {selectionMode === 'resume' && (
              <div className="mb-12">
                <h2 className="text-2xl font-semibold mb-6">Upload Your Resume</h2>
                
                {!uploadedFile && !isProcessingResume && (
                  <div className="max-w-2xl mx-auto">
                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center hover:border-gray-400 transition-colors">
                      <input
                        type="file"
                        id="resume-upload"
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <label
                        htmlFor="resume-upload"
                        className="cursor-pointer flex flex-col items-center space-y-4"
                      >
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                          <Upload className="h-8 w-8 text-gray-400" />
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold mb-2">Upload your resume</h3>
                          <p className="text-gray-600 mb-4">
                            Our AI will analyze your background and create personalized interview questions
                          </p>
                          <div className="bg-black text-white px-6 py-3 rounded-lg inline-block font-medium hover:bg-gray-800 transition-colors">
                            Choose File
                          </div>
                        </div>
                        <p className="text-sm text-gray-500">
                          Supported formats: PDF, Word documents, or images (JPG, PNG)
                        </p>
                      </label>
                    </div>
                  </div>
                )}

                {/* Processing State */}
                {isProcessingResume && (
                  <div className="max-w-2xl mx-auto">
                    <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-8 text-center">
                      <div className="flex justify-center mb-4">
                        <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
                      </div>
                      <h3 className="text-xl font-semibold text-blue-800 mb-2">
                        Processing your resume...
                      </h3>
                      <p className="text-blue-600">
                        Our AI is analyzing your background to create personalized interview questions.
                        This may take a few moments.
                      </p>
                    </div>
                  </div>
                )}

                {/* File Uploaded State */}
                {uploadedFile && !isProcessingResume && !resumeAnalysis && (
                  <div className="max-w-2xl mx-auto">
                    <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <FileText className="h-8 w-8 text-gray-600" />
                          <div>
                            <p className="font-medium">{uploadedFile.name}</p>
                            <p className="text-sm text-gray-500">
                              {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={handleRemoveFile}
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Resume Analysis Results */}
                {resumeAnalysis && (
                  <div className="max-w-2xl mx-auto">
                    <div className="bg-green-50 border-2 border-green-200 rounded-xl p-8">
                      <div className="text-center mb-6">
                        <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                          <span className="text-2xl text-white">✓</span>
                        </div>
                        <h3 className="text-xl font-semibold text-green-800 mb-2">
                          Resume Analysis Complete!
                        </h3>
                        <p className="text-green-600">
                          Your personalized AI interview is ready
                        </p>
                      </div>
                      
                      <div className="grid md:grid-cols-2 gap-6 text-sm">
                        <div>
                          <h4 className="font-semibold text-green-800 mb-2">Detected Domain</h4>
                          <p className="text-green-700 bg-green-100 px-3 py-1 rounded">
                            {resumeAnalysis.domain}
                          </p>
                        </div>
                        <div>
                          <h4 className="font-semibold text-green-800 mb-2">Experience Level</h4>
                          <p className="text-green-700 bg-green-100 px-3 py-1 rounded">
                            {resumeAnalysis.experience}
                          </p>
                        </div>
                        <div className="md:col-span-2">
                          <h4 className="font-semibold text-green-800 mb-2">Key Skills Identified</h4>
                          <div className="flex flex-wrap gap-2">
                            {resumeAnalysis.skills?.slice(0, 8).map((skill, index) => (
                              <span
                                key={index}
                                className="text-green-700 bg-green-100 px-2 py-1 rounded text-xs"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {uploadedFile && (
                        <div className="mt-6 pt-4 border-t border-green-200">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2 text-sm text-green-700">
                              <FileText className="h-4 w-4" />
                              <span>{uploadedFile.name}</span>
                            </div>
                            <button
                              onClick={handleRemoveFile}
                              className="text-green-600 hover:text-green-800 text-sm underline"
                            >
                              Upload different resume
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleProceed}
              disabled={!canProceed()}
              className={`px-8 py-4 rounded-lg font-semibold flex items-center justify-center space-x-2 transition-all duration-200 ${
                canProceed()
                  ? 'bg-black hover:bg-gray-800 text-white hover:scale-105'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <span>
                {selectionMode === 'resume' 
                  ? 'Start AI Interview' 
                  : (isAssessmentMode ? 'Start Interview' : 'Start Aptitude Test')
                }
              </span>
              <ArrowRight className="h-5 w-5" />
            </button>
          </div>

          {/* Selection Summary */}
          {((selectionMode === 'manual' && (selectedPosition || selectedDomain)) || 
            (selectionMode === 'resume' && resumeAnalysis)) && (
            <div className="mt-12 bg-gray-50 border-2 border-gray-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">Your Selection</h3>
              <div className="space-y-2">
                {selectionMode === 'manual' ? (
                  <>
                    {selectedPosition && (
                      <p className="text-gray-700">
                        <span className="text-black font-medium">Position:</span> {positions.find(p => p.id === selectedPosition)?.title}
                      </p>
                    )}
                    {selectedDomain && (
                      <p className="text-gray-700">
                        <span className="text-black font-medium">Domain:</span> {domains.find(d => d.id === selectedDomain)?.title}
                      </p>
                    )}
                    <p className="text-gray-700">
                      <span className="text-black font-medium">Interview Type:</span> Standard Interview
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-gray-700">
                      <span className="text-black font-medium">Domain:</span> {resumeAnalysis?.domain}
                    </p>
                    <p className="text-gray-700">
                      <span className="text-black font-medium">Experience:</span> {resumeAnalysis?.experience}
                    </p>
                    <p className="text-gray-700">
                      <span className="text-black font-medium">Interview Type:</span> AI-Powered Personalized Interview
                    </p>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PositionSelection;