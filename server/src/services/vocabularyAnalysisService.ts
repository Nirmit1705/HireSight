/**
 * Vocabulary Analysis Service
 * Analyzes vocabulary sophistication using Type-Token Ratio (TTR) and other NLP metrics
 */

export interface VocabularyAnalysis {
  totalWords: number;
  uniqueWords: number;
  typeTokenRatio: number; // TTR = unique_words / total_words
  vocabularyScore: number; // 0-100 scale based on TTR
  vocabularyComplexity: 'basic' | 'intermediate' | 'advanced' | 'expert';
  averageWordLength: number;
  longWords: number; // Words with 6+ characters
  longWordPercentage: number;
  readabilityScore: number; // Simple readability metric
}

export class VocabularyAnalysisService {
  // Common filler words and stop words to exclude from vocabulary analysis
  private readonly FILLER_WORDS = new Set([
    'um', 'uh', 'ah', 'er', 'hmm', 'well', 'so', 'like', 'you know', 
    'kind of', 'sort of', 'i mean', 'basically', 'actually', 'really',
    'just', 'maybe', 'i think', 'i guess', 'probably', 'definitely'
  ]);

  private readonly STOP_WORDS = new Set([
    'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i', 'it',
    'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at', 'this',
    'but', 'his', 'by', 'from', 'they', 'she', 'or', 'an', 'will', 'my',
    'one', 'all', 'would', 'there', 'their', 'what', 'so', 'up', 'out',
    'if', 'about', 'who', 'get', 'which', 'go', 'me', 'when', 'make',
    'can', 'like', 'time', 'no', 'just', 'him', 'know', 'take', 'people',
    'into', 'year', 'your', 'good', 'some', 'could', 'them', 'see', 'other',
    'than', 'then', 'now', 'look', 'only', 'come', 'its', 'over', 'think',
    'also', 'back', 'after', 'use', 'two', 'how', 'our', 'work', 'first',
    'well', 'way', 'even', 'new', 'want', 'because', 'any', 'these', 'give',
    'day', 'most', 'us'
  ]);

  /**
   * Analyze vocabulary sophistication using Type-Token Ratio (TTR) and other metrics
   */
  analyzeVocabulary(text: string): VocabularyAnalysis {
    if (!text || text.trim().length === 0) {
      return this.getDefaultAnalysis();
    }

    // Clean and tokenize the text
    const cleanedText = text.toLowerCase().replace(/[^\w\s]/g, ' ');
    const allWords = cleanedText.split(/\s+/).filter(word => word.length > 0);
    
    // Filter out filler words and stop words for vocabulary analysis
    const contentWords = allWords.filter(word => 
      !this.FILLER_WORDS.has(word) && 
      !this.STOP_WORDS.has(word) &&
      word.length > 2 // Exclude very short words
    );

    const uniqueWords = new Set(contentWords);
    const ttr = contentWords.length > 0 ? (uniqueWords.size / contentWords.length) : 0;

    // Calculate average word length
    const totalCharacters = contentWords.reduce((sum, word) => sum + word.length, 0);
    const averageWordLength = contentWords.length > 0 ? totalCharacters / contentWords.length : 0;

    // Count long words (6+ characters)
    const longWords = contentWords.filter(word => word.length >= 6).length;
    const longWordPercentage = contentWords.length > 0 ? (longWords / contentWords.length) * 100 : 0;

    // Calculate vocabulary score based on TTR and word complexity
    // TTR typically ranges from 0.3-0.8 for normal speech
    // We need a more realistic scoring curve that doesn't max out too easily
    
    // TTR scoring (0-70 points max)
    // 0.3 TTR = 20 points, 0.5 TTR = 50 points, 0.7 TTR = 70 points
    let ttrScore;
    if (ttr <= 0.3) {
      ttrScore = ttr * 66.67; // 0-20 points for 0-0.3 TTR
    } else if (ttr <= 0.5) {
      ttrScore = 20 + (ttr - 0.3) * 150; // 20-50 points for 0.3-0.5 TTR
    } else if (ttr <= 0.7) {
      ttrScore = 50 + (ttr - 0.5) * 100; // 50-70 points for 0.5-0.7 TTR
    } else {
      ttrScore = 70; // Cap at 70 points for TTR > 0.7
    }

    // Word complexity bonus (0-20 points max)
    const complexityBonus = Math.min(20, longWordPercentage * 0.8);

    // Word count factor (0-10 points max) - reward substantial responses
    let lengthBonus;
    if (contentWords.length < 10) {
      lengthBonus = 0; // Too short to properly assess
    } else if (contentWords.length < 25) {
      lengthBonus = 2; // Very short response
    } else if (contentWords.length < 50) {
      lengthBonus = 5; // Short response
    } else if (contentWords.length < 100) {
      lengthBonus = 8; // Good length
    } else {
      lengthBonus = 10; // Comprehensive response
    }

    const vocabularyScore = Math.round(Math.min(100, ttrScore + complexityBonus + lengthBonus));

    // Determine complexity level
    const vocabularyComplexity = this.determineComplexity(ttr, uniqueWords.size, longWordPercentage);

    // Debug logging
    console.log('=== VOCABULARY ANALYSIS DEBUG ===');
    console.log(`Text length: ${text.length} chars`);
    console.log(`Total words: ${allWords.length}, Content words: ${contentWords.length}, Unique: ${uniqueWords.size}`);
    console.log(`TTR: ${ttr.toFixed(4)} | TTR Score: ${ttrScore.toFixed(1)}`);
    console.log(`Long words: ${longWords}/${contentWords.length} (${longWordPercentage.toFixed(1)}%)`);
    console.log(`Complexity bonus: ${complexityBonus.toFixed(1)} | Length bonus: ${lengthBonus.toFixed(1)}`);
    console.log(`Final vocabulary score: ${vocabularyScore}/100`);
    console.log(`Complexity level: ${vocabularyComplexity}`);
    console.log('=====================================');

    // Simple readability score (lower is more complex/sophisticated)
    const readabilityScore = this.calculateReadabilityScore(averageWordLength, longWordPercentage);

    return {
      totalWords: allWords.length,
      uniqueWords: uniqueWords.size,
      typeTokenRatio: Math.round(ttr * 10000) / 10000, // Round to 4 decimal places
      vocabularyScore,
      vocabularyComplexity,
      averageWordLength: Math.round(averageWordLength * 100) / 100,
      longWords,
      longWordPercentage: Math.round(longWordPercentage * 100) / 100,
      readabilityScore
    };
  }

  /**
   * Determine vocabulary complexity level based on multiple factors
   */
  private determineComplexity(
    ttr: number, 
    uniqueWords: number, 
    longWordPercentage: number
  ): 'basic' | 'intermediate' | 'advanced' | 'expert' {
    // Expert level: Exceptional vocabulary diversity and sophistication
    if ((ttr >= 0.65 && uniqueWords >= 40 && longWordPercentage >= 25) || 
        (ttr >= 0.7 && uniqueWords >= 30) ||
        (ttr >= 0.6 && uniqueWords >= 60)) {
      return 'expert';
    }
    
    // Advanced level: High vocabulary diversity with good complexity
    if ((ttr >= 0.55 && uniqueWords >= 25 && longWordPercentage >= 20) || 
        (ttr >= 0.6 && uniqueWords >= 20) ||
        (ttr >= 0.5 && uniqueWords >= 45)) {
      return 'advanced';
    }
    
    // Intermediate level: Moderate vocabulary sophistication
    if ((ttr >= 0.45 && uniqueWords >= 15 && longWordPercentage >= 15) || 
        (ttr >= 0.5 && uniqueWords >= 12) ||
        (ttr >= 0.4 && uniqueWords >= 30) ||
        (longWordPercentage >= 15 && ttr >= 0.35)) {
      return 'intermediate';
    }
    
    // Basic level: Limited vocabulary diversity
    return 'basic';
  }

  /**
   * Calculate a simple readability score
   * Higher scores indicate more complex/sophisticated language
   */
  private calculateReadabilityScore(averageWordLength: number, longWordPercentage: number): number {
    // Simple formula: combine average word length and percentage of long words
    // Scale to 0-100 where higher = more sophisticated
    const lengthScore = Math.min(50, averageWordLength * 10);
    const complexityScore = Math.min(50, longWordPercentage * 2);
    return Math.round(lengthScore + complexityScore);
  }

  /**
   * Get default analysis for empty input
   */
  private getDefaultAnalysis(): VocabularyAnalysis {
    return {
      totalWords: 0,
      uniqueWords: 0,
      typeTokenRatio: 0,
      vocabularyScore: 0,
      vocabularyComplexity: 'basic',
      averageWordLength: 0,
      longWords: 0,
      longWordPercentage: 0,
      readabilityScore: 0
    };
  }

  /**
   * Get vocabulary insights and suggestions based on analysis
   */
  getVocabularyInsights(analysis: VocabularyAnalysis): string[] {
    const insights: string[] = [];

    if (analysis.vocabularyComplexity === 'basic') {
      insights.push("Try using more varied vocabulary to demonstrate your knowledge depth");
    }

    if (analysis.typeTokenRatio < 0.4) {
      insights.push("Consider using more diverse terminology to avoid repetition");
    }

    if (analysis.longWordPercentage < 15) {
      insights.push("Include more technical or sophisticated terms relevant to the topic");
    }

    if (analysis.vocabularyScore >= 80) {
      insights.push("Excellent vocabulary sophistication! Your word choice demonstrates expertise");
    } else if (analysis.vocabularyScore >= 60) {
      insights.push("Good vocabulary usage with room for more technical terminology");
    }

    if (analysis.averageWordLength < 4) {
      insights.push("Try incorporating longer, more descriptive terms when appropriate");
    }

    return insights;
  }
}
