const { Logger } = require('../config');
const axios = require('axios');

class AIService {
    constructor() {
        this.pythonServiceUrl = process.env.PYTHON_LAYER_URL || 'http://localhost:8000';
    }

    /**
     * Generate AI suggestions for demo improvement
     */
    async generateDemoSuggestions({ demoId, transcript, pauseDurations, replayFrequency }) {
        try {
            Logger.info(`[AI Service] Generating suggestions for demo ${demoId}`);

            const response = await axios.post(`${this.pythonServiceUrl}/ai-suggestions`, {
                demoId,
                transcript,
                pauseDurations,
                replayFrequency
            }, {
                timeout: 30000
            });

            const suggestions = response.data.suggestions || [];
            
            Logger.info(`[AI Service] Generated ${suggestions.length} suggestions for demo ${demoId}`);
            return suggestions;

        } catch (error) {
            Logger.error('[AI Service] Generate suggestions error:', error);
            
            // Fallback to rule-based suggestions if AI fails
            return this._generateFallbackSuggestions({ transcript, pauseDurations, replayFrequency });
        }
    }

    /**
     * Generate language support (translation + subtitles)
     */
    async generateLanguageSupport({ demoId, language, originalTranscript }) {
        try {
            Logger.info(`[AI Service] Generating ${language} support for demo ${demoId}`);

            const response = await axios.post(`${this.pythonServiceUrl}/translate-demo`, {
                demoId,
                targetLanguage: language,
                originalTranscript
            }, {
                timeout: 45000
            });

            const languageData = response.data;
            
            Logger.info(`[AI Service] Generated ${language} support for demo ${demoId}`);
            return {
                subtitles: languageData.subtitles,
                translatedSummary: languageData.translatedSummary,
                translatedTitle: languageData.translatedTitle,
                ctaText: languageData.ctaText,
                translationQuality: languageData.translationQuality
            };

        } catch (error) {
            Logger.error(`[AI Service] Generate ${language} support error:`, error);
            throw new Error(`Failed to generate ${language} support`);
        }
    }

    /**
     * Generate comprehensive AI review of demo
     */
    async generateDemoReview({ demoId, comments, languages, reviewType }) {
        try {
            Logger.info(`[AI Service] Generating ${reviewType} review for demo ${demoId}`);

            const response = await axios.post(`${this.pythonServiceUrl}/ai-review`, {
                demoId,
                comments,
                languages,
                reviewType
            }, {
                timeout: 60000
            });

            const reviewData = response.data.review || response.data;
            
            Logger.info(`[AI Service] Generated review for demo ${demoId} with score ${reviewData.overallScore}`);
            return {
                insights: reviewData.insights,
                commonIssues: reviewData.commonIssues,
                translationWarnings: reviewData.translationWarnings,
                recommendations: reviewData.recommendations,
                publishReadiness: reviewData.publishReadiness,
                overallScore: reviewData.overallScore
            };

        } catch (error) {
            Logger.error('[AI Service] Generate review error:', error);
            
            // Fallback to basic analysis
            return this._generateFallbackReview({ comments, languages });
        }
    }

    /**
     * Fallback suggestions when AI service is unavailable
     */
    _generateFallbackSuggestions({ transcript, pauseDurations, replayFrequency }) {
        const suggestions = [];

        // Check for long pauses
        if (pauseDurations && pauseDurations.some(pause => pause > 3)) {
            suggestions.push({
                timestamp: pauseDurations.findIndex(pause => pause > 3) * 1, // Rough estimate
                type: 'trim',
                suggestion: 'Consider trimming this long pause to maintain viewer engagement',
                metadata: { confidence: 0.8, pauseDuration: Math.max(...pauseDurations) }
            });
        }

        // Check transcript length
        if (transcript && transcript.length < 50) {
            suggestions.push({
                timestamp: 0,
                type: 'clarify',
                suggestion: 'Consider adding more explanation to help viewers understand the process',
                metadata: { confidence: 0.7, transcriptLength: transcript.length }
            });
        }

        // Check for filler words
        const fillerWords = ['um', 'uh', 'like', 'you know'];
        const fillerCount = fillerWords.reduce((count, word) => {
            return count + (transcript.toLowerCase().split(word).length - 1);
        }, 0);

        if (fillerCount > 5) {
            suggestions.push({
                timestamp: 0,
                type: 'pace',
                suggestion: 'Consider re-recording to reduce filler words for a more professional presentation',
                metadata: { confidence: 0.6, fillerCount }
            });
        }

        Logger.info(`[AI Service] Generated ${suggestions.length} fallback suggestions`);
        return suggestions;
    }

    /**
     * Fallback review when AI service is unavailable
     */
    _generateFallbackReview({ comments, languages }) {
        const humanComments = comments.filter(c => !c.aiGenerated);
        const aiComments = comments.filter(c => c.aiGenerated);
        
        const commonIssues = [];
        const insights = [];

        // Analyze comment patterns
        if (humanComments.length > 0) {
            const resolvedCount = humanComments.filter(c => c.status === 'resolved').length;
            const resolutionRate = resolvedCount / humanComments.length;
            
            insights.push(`${humanComments.length} human comments received`);
            insights.push(`${Math.round(resolutionRate * 100)}% of comments have been resolved`);
        }

        if (aiComments.length > 0) {
            insights.push(`${aiComments.length} AI suggestions generated`);
        }

        // Language analysis
        if (languages && languages.length > 1) {
            insights.push(`Demo supports ${languages.length} languages`);
        }

        const overallScore = Math.max(1, 10 - (humanComments.filter(c => c.status === 'open').length * 0.5));

        return {
            insights,
            commonIssues,
            translationWarnings: [],
            overallScore: Math.min(10, overallScore)
        };
    }
}

module.exports = new AIService();