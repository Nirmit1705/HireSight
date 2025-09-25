/**
 * Speech Analysis Service
 * Analyzes speech patterns for confidence metrics including filler words and pauses
 */

export interface WordTimestamp {
  word: string;
  start: number;
  end: number;
  confidence: number;
  punctuated_word?: string;
}

export interface PauseAnalysis {
  duration: number; // in seconds
  position: number; // position between words (0-based index)
  type: 'short' | 'medium' | 'long' | 'excessive';
}

export interface FillerWordAnalysis {
  word: string;
  count: number;
  positions: number[]; // word positions where fillers occur
  percentage: number; // percentage of total words
}

export interface ConfidenceMetrics {
  overallScore: number; // 0-100 scale
  fillerWordScore: number; // 0-100 scale (lower filler words = higher score)
  pauseScore: number; // 0-100 scale (optimal pauses = higher score)
  fluencyScore: number; // 0-100 scale (combination of above)
  breakdown: {
    totalWords: number;
    fillerWords: FillerWordAnalysis[];
    pauses: PauseAnalysis[];
    averagePauseDuration: number;
    speechRate: number; // words per minute
    totalSpeechTime: number; // total time speaking (excluding pauses)
    totalPauseTime: number; // total time in pauses
  };
}

export class SpeechAnalysisService {
  // Common filler words to detect
  private readonly FILLER_WORDS = new Set([
    'um', 'uh', 'ah', 'er', 'hmm', 'well', 'so', 'like', 'you know', 
    'kind of', 'sort of', 'i mean', 'basically', 'actually', 'really',
    'just', 'maybe', 'i think', 'i guess', 'probably', 'definitely'
  ]);

  // Pause duration thresholds (in seconds)
  private readonly PAUSE_THRESHOLDS = {
    SHORT: 0.5,    // 0.0 - 0.5s: Natural pause
    MEDIUM: 1.0,   // 0.5 - 1.0s: Thinking pause
    LONG: 2.0,     // 1.0 - 2.0s: Long pause (may indicate uncertainty)
    EXCESSIVE: 2.0 // 2.0s+: Excessive pause (indicates low confidence)
  };

  /**
   * Analyze confidence metrics from Deepgram word-level timestamps
   */
  analyzeConfidence(words: WordTimestamp[]): ConfidenceMetrics {
    if (!words || words.length === 0) {
      return this.getDefaultMetrics();
    }

    const fillerWords = this.analyzeFillerWords(words);
    const pauses = this.analyzePauses(words);
    const speechTiming = this.analyzeSpeechTiming(words, pauses);

    // Calculate individual scores
    const fillerWordScore = this.calculateFillerWordScore(fillerWords, words.length);
    const pauseScore = this.calculatePauseScore(pauses, speechTiming.totalSpeechTime);
    const fluencyScore = this.calculateFluencyScore(fillerWordScore, pauseScore);

    // Overall confidence score (weighted combination)
    const overallScore = Math.round(
      (fillerWordScore * 0.4) + 
      (pauseScore * 0.4) + 
      (fluencyScore * 0.2)
    );

    return {
      overallScore,
      fillerWordScore,
      pauseScore,
      fluencyScore,
      breakdown: {
        totalWords: words.length,
        fillerWords,
        pauses,
        averagePauseDuration: pauses.length > 0 
          ? pauses.reduce((sum, p) => sum + p.duration, 0) / pauses.length 
          : 0,
        speechRate: speechTiming.speechRate,
        totalSpeechTime: speechTiming.totalSpeechTime,
        totalPauseTime: speechTiming.totalPauseTime
      }
    };
  }

  /**
   * Analyze filler words in the transcript
   */
  private analyzeFillerWords(words: WordTimestamp[]): FillerWordAnalysis[] {
    const fillerAnalysis = new Map<string, { count: number; positions: number[] }>();

    words.forEach((word, index) => {
      const cleanWord = word.word.toLowerCase().replace(/[.,!?;]/g, '');
      
      if (this.FILLER_WORDS.has(cleanWord)) {
        if (!fillerAnalysis.has(cleanWord)) {
          fillerAnalysis.set(cleanWord, { count: 0, positions: [] });
        }
        
        const analysis = fillerAnalysis.get(cleanWord)!;
        analysis.count++;
        analysis.positions.push(index);
      }
    });

    return Array.from(fillerAnalysis.entries()).map(([word, data]) => ({
      word,
      count: data.count,
      positions: data.positions,
      percentage: (data.count / words.length) * 100
    }));
  }

  /**
   * Analyze pauses between words using timestamps
   */
  private analyzePauses(words: WordTimestamp[]): PauseAnalysis[] {
    const pauses: PauseAnalysis[] = [];

    for (let i = 0; i < words.length - 1; i++) {
      const currentWord = words[i];
      const nextWord = words[i + 1];
      
      // Calculate pause duration (gap between end of current word and start of next)
      const pauseDuration = nextWord.start - currentWord.end;
      
      // Only consider significant pauses (> 0.1s to filter out natural speech gaps)
      if (pauseDuration > 0.1) {
        let pauseType: PauseAnalysis['type'];
        
        if (pauseDuration <= this.PAUSE_THRESHOLDS.SHORT) {
          pauseType = 'short';
        } else if (pauseDuration <= this.PAUSE_THRESHOLDS.MEDIUM) {
          pauseType = 'medium';
        } else if (pauseDuration <= this.PAUSE_THRESHOLDS.LONG) {
          pauseType = 'long';
        } else {
          pauseType = 'excessive';
        }

        pauses.push({
          duration: pauseDuration,
          position: i,
          type: pauseType
        });
      }
    }

    return pauses;
  }

  /**
   * Calculate speech timing metrics
   */
  private analyzeSpeechTiming(words: WordTimestamp[], pauses: PauseAnalysis[]) {
    if (words.length === 0) {
      return { speechRate: 0, totalSpeechTime: 0, totalPauseTime: 0 };
    }

    const totalAudioDuration = words[words.length - 1].end - words[0].start;
    const totalPauseTime = pauses.reduce((sum, pause) => sum + pause.duration, 0);
    const totalSpeechTime = totalAudioDuration - totalPauseTime;
    
    // Calculate words per minute (WPM)
    const speechRate = totalSpeechTime > 0 
      ? (words.length / totalSpeechTime) * 60 
      : 0;

    return {
      speechRate,
      totalSpeechTime,
      totalPauseTime
    };
  }

  /**
   * Calculate filler word confidence score (0-100)
   */
  private calculateFillerWordScore(fillerWords: FillerWordAnalysis[], totalWords: number): number {
    const totalFillerWords = fillerWords.reduce((sum, filler) => sum + filler.count, 0);
    const fillerPercentage = (totalFillerWords / totalWords) * 100;

    // Score based on filler word percentage
    // 0-2%: Excellent (90-100)
    // 2-5%: Good (75-89)
    // 5-10%: Average (50-74)
    // 10-15%: Poor (25-49)
    // 15%+: Very poor (0-24)
    
    if (fillerPercentage <= 2) {
      return Math.max(90, 100 - (fillerPercentage * 5));
    } else if (fillerPercentage <= 5) {
      return Math.max(75, 90 - ((fillerPercentage - 2) * 5));
    } else if (fillerPercentage <= 10) {
      return Math.max(50, 75 - ((fillerPercentage - 5) * 5));
    } else if (fillerPercentage <= 15) {
      return Math.max(25, 50 - ((fillerPercentage - 10) * 5));
    } else {
      return Math.max(0, 25 - ((fillerPercentage - 15) * 2));
    }
  }

  /**
   * Calculate pause confidence score (0-100)
   */
  private calculatePauseScore(pauses: PauseAnalysis[], totalSpeechTime: number): number {
    if (pauses.length === 0) {
      return 85; // Good score for no excessive pauses, but not perfect
    }

    const longPauses = pauses.filter(p => p.type === 'long').length;
    const excessivePauses = pauses.filter(p => p.type === 'excessive').length;
    const averagePauseDuration = pauses.reduce((sum, p) => sum + p.duration, 0) / pauses.length;

    // Penalty for excessive pauses
    let score = 100;
    
    // Penalize long pauses
    score -= longPauses * 5;
    
    // Heavily penalize excessive pauses
    score -= excessivePauses * 15;
    
    // Penalize if average pause duration is too long
    if (averagePauseDuration > this.PAUSE_THRESHOLDS.MEDIUM) {
      score -= (averagePauseDuration - this.PAUSE_THRESHOLDS.MEDIUM) * 10;
    }

    // Bonus for optimal pause distribution (some pauses are natural and good)
    const pauseRate = pauses.length / (totalSpeechTime / 60); // pauses per minute
    if (pauseRate >= 5 && pauseRate <= 15) {
      score += 5; // Bonus for natural pause frequency
    }

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  /**
   * Calculate overall fluency score
   */
  private calculateFluencyScore(fillerWordScore: number, pauseScore: number): number {
    // Fluency is combination of smooth speech flow
    const baseScore = (fillerWordScore + pauseScore) / 2;
    
    // Bonus if both scores are high (synergistic effect)
    if (fillerWordScore >= 80 && pauseScore >= 80) {
      return Math.min(100, baseScore + 5);
    }
    
    // Penalty if one aspect is very poor
    if (fillerWordScore < 40 || pauseScore < 40) {
      return Math.max(0, baseScore - 10);
    }
    
    return Math.round(baseScore);
  }

  /**
   * Get default metrics for empty input
   */
  private getDefaultMetrics(): ConfidenceMetrics {
    return {
      overallScore: 0,
      fillerWordScore: 0,
      pauseScore: 0,
      fluencyScore: 0,
      breakdown: {
        totalWords: 0,
        fillerWords: [],
        pauses: [],
        averagePauseDuration: 0,
        speechRate: 0,
        totalSpeechTime: 0,
        totalPauseTime: 0
      }
    };
  }
}