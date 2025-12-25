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

            // 🛡️ INPUT VALIDATION (CRITICAL)
            if (!demoId || typeof demoId !== 'string') {
                throw new Error('Invalid demo ID');
            }

            // Validate and sanitize inputs
            const safeTranscript = transcript && typeof transcript === 'string' ? transcript : '';
            const safePauseDurations = Array.isArray(pauseDurations) ? pauseDurations : [];
            const safeReplayFrequency = typeof replayFrequency === 'number' ? replayFrequency : 0;

            const response = await axios.post(`${this.pythonServiceUrl}/ai-suggestions`, {
                demoId,
                transcript: safeTranscript,
                pauseDurations: safePauseDurations,
                replayFrequency: safeReplayFrequency
            }, {
                timeout: 30000
            });

            const suggestions = response.data?.suggestions || [];
            
            // Validate response format
            if (!Array.isArray(suggestions)) {
                Logger.warn('[AI Service] AI service returned non-array suggestions, using fallback');
                return this._generateFallbackSuggestions({ transcript: safeTranscript, pauseDurations: safePauseDurations, replayFrequency: safeReplayFrequency });
            }
            
            Logger.info(`[AI Service] Generated ${suggestions.length} suggestions for demo ${demoId}`);
            return suggestions;

        } catch (error) {
            Logger.error('[AI Service] Generate suggestions error:', error);
            
            // 🛡️ AI SERVICE FALLBACK (STABILITY) - Always return valid data
            const safeTranscript = transcript && typeof transcript === 'string' ? transcript : '';
            const safePauseDurations = Array.isArray(pauseDurations) ? pauseDurations : [];
            const safeReplayFrequency = typeof replayFrequency === 'number' ? replayFrequency : 0;
            
            return this._generateFallbackSuggestions({ 
                transcript: safeTranscript, 
                pauseDurations: safePauseDurations, 
                replayFrequency: safeReplayFrequency 
            });
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

            // 🛡️ INPUT VALIDATION (CRITICAL)
            if (!demoId || typeof demoId !== 'string') {
                throw new Error('Invalid demo ID');
            }

            // Validate and sanitize inputs
            const safeComments = Array.isArray(comments) ? comments : [];
            const safeLanguages = Array.isArray(languages) ? languages : [];
            const safeReviewType = reviewType && typeof reviewType === 'string' ? reviewType : 'on_demand';

            const response = await axios.post(`${this.pythonServiceUrl}/ai-review`, {
                demoId,
                comments: safeComments,
                languages: safeLanguages,
                reviewType: safeReviewType
            }, {
                timeout: 60000
            });

            const reviewData = response.data?.review || response.data;
            
            // Validate response format
            if (!reviewData || typeof reviewData !== 'object') {
                Logger.warn('[AI Service] AI service returned invalid review data, using fallback');
                return this._generateFallbackReview({ comments: safeComments, languages: safeLanguages });
            }
            
            Logger.info(`[AI Service] Generated review for demo ${demoId} with score ${reviewData.overallScore}`);
            
            // Ensure insights is never null or undefined with safe access
            const insights = Array.isArray(reviewData.insights) ? reviewData.insights : ['AI review completed'];
            
            return {
                insights,
                commonIssues: Array.isArray(reviewData.commonIssues) ? reviewData.commonIssues : [],
                translationWarnings: Array.isArray(reviewData.translationWarnings) ? reviewData.translationWarnings : [],
                recommendations: Array.isArray(reviewData.recommendations) ? reviewData.recommendations : [],
                publishReadiness: Boolean(reviewData.publishReadiness),
                overallScore: typeof reviewData.overallScore === 'number' ? reviewData.overallScore : 5.0
            };

        } catch (error) {
            Logger.error('[AI Service] Generate review error:', error);
            
            // 🛡️ AI SERVICE FALLBACK (STABILITY) - Always return valid data
            const safeComments = Array.isArray(comments) ? comments : [];
            const safeLanguages = Array.isArray(languages) ? languages : [];
            
            return this._generateFallbackReview({ comments: safeComments, languages: safeLanguages });
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
                id: `fallback_${Date.now()}_1`,
                type: 'optimization',
                title: 'Reduce Long Pauses',
                description: 'Consider trimming this long pause to maintain viewer engagement',
                timestamp: pauseDurations.findIndex(pause => pause > 3) * 1, // Rough estimate
                priority: 'high',
                implemented: false
            });
        }

        // Check transcript length
        if (transcript && transcript.length < 50) {
            suggestions.push({
                id: `fallback_${Date.now()}_2`,
                type: 'improvement',
                title: 'Add More Explanation',
                description: 'Consider adding more explanation to help viewers understand the process',
                timestamp: 0,
                priority: 'medium',
                implemented: false
            });
        }

        // Check for filler words
        if (transcript && typeof transcript === 'string') {
            const fillerWords = ['um', 'uh', 'like', 'you know'];
            const fillerCount = fillerWords.reduce((count, word) => {
                // 🛡️ Safe string operations with validation
                const lowerTranscript = transcript.toLowerCase();
                return count + (lowerTranscript.split(word).length - 1);
            }, 0);

            if (fillerCount > 5) {
                suggestions.push({
                    id: `fallback_${Date.now()}_3`,
                    type: 'optimization',
                    title: 'Reduce Filler Words',
                    description: 'Consider re-recording to reduce filler words for a more professional presentation',
                    timestamp: 0,
                    priority: 'low',
                    implemented: false
                });
            }
        }

        // Always provide at least one suggestion
        if (suggestions.length === 0) {
            suggestions.push({
                id: `fallback_${Date.now()}_default`,
                type: 'improvement',
                title: 'Add Visual Callouts',
                description: 'Consider adding visual callouts to highlight important UI elements',
                timestamp: 10,
                priority: 'medium',
                implemented: false
            });
        }

        Logger.info(`[AI Service] Generated ${suggestions.length} fallback suggestions`);
        return suggestions;
    }

    /**
     * Fallback review when AI service is unavailable
     */
    _generateFallbackReview({ comments, languages }) {
        // 🛡️ INPUT VALIDATION (CRITICAL)
        const safeComments = Array.isArray(comments) ? comments : [];
        const safeLanguages = Array.isArray(languages) ? languages : [];
        
        const humanComments = safeComments.filter(c => c && !c.aiGenerated);
        const aiComments = safeComments.filter(c => c && c.aiGenerated);
        
        const commonIssues = [];
        const insights = [];

        // Analyze comment patterns with safe access
        if (humanComments.length > 0) {
            const resolvedCount = humanComments.filter(c => c && c.status === 'resolved').length;
            const resolutionRate = resolvedCount / humanComments.length;
            
            insights.push(`${humanComments.length} human comments received`);
            insights.push(`${Math.round(resolutionRate * 100)}% of comments have been resolved`);
        }

        if (aiComments.length > 0) {
            insights.push(`${aiComments.length} AI suggestions generated`);
        }

        // Language analysis with safe access
        if (safeLanguages.length > 1) {
            insights.push(`Demo supports ${safeLanguages.length} languages`);
        }

        // Ensure we always have at least one insight
        if (insights.length === 0) {
            insights.push('Demo analysis completed');
        }

        const openComments = safeComments.filter(c => c && c.status === 'open');
        const overallScore = Math.max(1, 10 - (openComments.length * 0.5));

        return {
            insights,
            commonIssues,
            translationWarnings: [],
            recommendations: openComments.length > 0 ? ['Address remaining open comments'] : ['Demo is ready for review'],
            publishReadiness: overallScore >= 7,
            overallScore: Math.min(10, Math.round(overallScore * 10) / 10)
        };
    }
}

module.exports = new AIService();