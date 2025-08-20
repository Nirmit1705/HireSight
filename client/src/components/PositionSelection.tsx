import React, { useState, useEffect } from 'react';
import { ArrowRight, Code, Database, Briefcase, PieChart, Users, Settings } from 'lucide-react';
import { PageType } from '../App';
import { metadataAPI, Position, Domain } from '../services/metadataAPI';

interface PositionSelectionProps {
  onNavigate: (page: PageType) => void;
  selectedPosition: string;
  setSelectedPosition: (position: string) => void;
  selectedDomain: string;
  setSelectedDomain: (domain: string) => void;
  isAssessmentMode?: boolean;
}

const PositionSelection: React.FC<PositionSelectionProps> = ({
  onNavigate,
  selectedPosition,
  setSelectedPosition,
  selectedDomain,
  setSelectedDomain,
  isAssessmentMode = false
}) => {
  const [positions, setPositions] = useState<Position[]>([]);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const handleProceed = () => {
    if (selectedPosition && selectedDomain) {
      // If in assessment mode, skip directly to interview
      onNavigate(isAssessmentMode ? 'interview' : 'aptitude');
    }
  };

  return (
    <div className="min-h-screen pt-20 pb-12">
      <div className="container mx-auto px-6 pt-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Select Your Target Role
            </h1>
            <p className="text-xl text-gray-600">
              {isAssessmentMode 
                ? 'Choose your position and domain for the interview assessment'
                : 'Choose your position and domain to get personalized interview preparation'
              }
            </p>
            {isAssessmentMode && (
              <div className="mt-4 bg-gray-100 border border-black rounded-lg p-3 max-w-md mx-auto">
                <p className="text-sm text-black">
                  Using your previous aptitude score - proceeding directly to interview
                </p>
              </div>
            )}
          </div>

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

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleProceed}
              disabled={!selectedPosition || !selectedDomain || loading}
              className={`px-8 py-4 rounded-lg font-semibold flex items-center justify-center space-x-2 transition-all duration-200 ${
                selectedPosition && selectedDomain && !loading
                  ? 'bg-black hover:bg-gray-800 text-white hover:scale-105'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <span>{isAssessmentMode ? 'Start Interview' : 'Start Aptitude Test'}</span>
              <ArrowRight className="h-5 w-5" />
            </button>
            
          </div>

          {/* Selection Summary */}
          {(selectedPosition || selectedDomain) && (
            <div className="mt-12 bg-gray-50 border-2 border-gray-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">Your Selection</h3>
              <div className="space-y-2">
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
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PositionSelection;