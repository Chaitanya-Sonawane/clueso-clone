const { Logger } = require('../config');
const axios = require('axios');

/**
 * Production-Ready 12+ Multi-Language Translation API Service
 * 
 * Supports 15+ languages with ISO language codes, centralized translation handling,
 * graceful fallbacks, and comprehensive error handling.
 */
class TranslationService {
    constructor() {
        this.pythonServiceUrl = process.env.PYTHON_LAYER_URL || 'http://localhost:8000';
        this.timeout = parseInt(process.env.TRANSLATION_TIMEOUT || '45000', 10);
        
        // ISO 639-1 Language Code Mapping with Enhanced Support
        this.supportedLanguages = {
            'en': { name: 'English', nativeName: 'English', flag: '🇺🇸', rtl: false },
            'es': { name: 'Spanish', nativeName: 'Español', flag: '🇪🇸', rtl: false },
            'fr': { name: 'French', nativeName: 'Français', flag: '🇫🇷', rtl: false },
            'de': { name: 'German', nativeName: 'Deutsch', flag: '🇩🇪', rtl: false },
            'it': { name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹', rtl: false },
            'pt': { name: 'Portuguese', nativeName: 'Português', flag: '🇵🇹', rtl: false },
            'ru': { name: 'Russian', nativeName: 'Русский', flag: '🇷🇺', rtl: false },
            'ja': { name: 'Japanese', nativeName: '日本語', flag: '🇯🇵', rtl: false },
            'ko': { name: 'Korean', nativeName: '한국어', flag: '🇰🇷', rtl: false },
            'zh': { name: 'Chinese (Simplified)', nativeName: '中文', flag: '🇨🇳', rtl: false },
            'ar': { name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦', rtl: true },
            'hi': { name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳', rtl: false },
            'nl': { name: 'Dutch', nativeName: 'Nederlands', flag: '🇳🇱', rtl: false },
            'sv': { name: 'Swedish', nativeName: 'Svenska', flag: '🇸🇪', rtl: false },
            'no': { name: 'Norwegian', nativeName: 'Norsk', flag: '🇳🇴', rtl: false },
            'da': { name: 'Danish', nativeName: 'Dansk', flag: '🇩🇰', rtl: false },
            'fi': { name: 'Finnish', nativeName: 'Suomi', flag: '🇫🇮', rtl: false },
            'pl': { name: 'Polish', nativeName: 'Polski', flag: '🇵🇱', rtl: false },
            'tr': { name: 'Turkish', nativeName: 'Türkçe', flag: '🇹🇷', rtl: false }
        };

        Logger.info(`[Translation Service] Initialized with ${Object.keys(this.supportedLanguages).length} supported languages`);
    }

    /**
     * Get all supported languages with metadata
     * @returns {Object} Supported languages with metadata
     */
    getSupportedLanguages() {
        return {
            count: Object.keys(this.supportedLanguages).length,
            languages: this.supportedLanguages
        };
    }

    /**
     * Validate language code
     * @param {string} languageCode - ISO 639-1 language code
     * @returns {boolean} Whether the language is supported
     */
    isLanguageSupported(languageCode) {
        if (!languageCode || typeof languageCode !== 'string') {
            return false;
        }
        return this.supportedLanguages.hasOwnProperty(languageCode.toLowerCase());
    }

    /**
     * Detect language from text (fallback implementation)
     * @param {string} text - Text to analyze
     * @returns {Object} Detection result with language and confidence
     */
    detectLanguage(text) {
        if (!text || typeof text !== 'string' || text.trim().length === 0) {
            return {
                detectedLanguage: 'en',
                confidence: 0.5,
                fallback: true
            };
        }

        // Simple heuristic-based detection (can be enhanced with ML service)
        const textLower = text.toLowerCase();
        
        // Common patterns for different languages
        const patterns = {
            'es': /\b(el|la|los|las|de|en|con|por|para|que|es|son|está|están)\b/g,
            'fr': /\b(le|la|les|de|du|des|en|avec|pour|que|est|sont|être|avoir)\b/g,
            'de': /\b(der|die|das|den|dem|des|und|oder|mit|für|ist|sind|haben|sein)\b/g,
            'it': /\b(il|la|lo|gli|le|di|da|in|con|per|che|è|sono|essere|avere)\b/g,
            'pt': /\b(o|a|os|as|de|em|com|para|que|é|são|estar|ter|ser)\b/g,
            'ru': /[а-яё]/g,
            'ar': /[ا-ي]/g,
            'zh': /[\u4e00-\u9fff]/g,
            'ja': /[\u3040-\u309f\u30a0-\u30ff\u4e00-\u9fff]/g,
            'ko': /[\uac00-\ud7af]/g,
            'hi': /[\u0900-\u097f]/g
        };

        let bestMatch = { language: 'en', score: 0 };

        for (const [lang, pattern] of Object.entries(patterns)) {
            const matches = textLower.match(pattern);
            const score = matches ? matches.length / text.split(' ').length : 0;
            
            if (score > bestMatch.score) {
                bestMatch = { language: lang, score };
            }
        }

        return {
            detectedLanguage: bestMatch.language,
            confidence: Math.min(bestMatch.score * 2, 1), // Normalize to 0-1
            fallback: bestMatch.score === 0
        };
    }

    /**
     * Translate text using the 12+ Multi-Language Translation API
     * @param {Object} params - Translation parameters
     * @param {string} params.sourceText - Text to translate
     * @param {string} params.sourceLanguage - Source language code (optional, will auto-detect)
     * @param {string} params.targetLanguage - Target language code
     * @param {Object} params.options - Additional options
     * @returns {Promise<Object>} Translation result
     */
    async translateText({ sourceText, sourceLanguage, targetLanguage, options = {} }) {
        try {
            // Input validation
            if (!sourceText || typeof sourceText !== 'string' || sourceText.trim().length === 0) {
                throw new Error('Source text is required and cannot be empty');
            }

            if (!targetLanguage || typeof targetLanguage !== 'string') {
                throw new Error('Target language is required');
            }

            const targetLang = targetLanguage.toLowerCase();
            if (!this.isLanguageSupported(targetLang)) {
                throw new Error(`Unsupported target language: ${targetLanguage}. Supported languages: ${Object.keys(this.supportedLanguages).join(', ')}`);
            }

            // Auto-detect source language if not provided
            let sourceLang = sourceLanguage;
            let detectionResult = null;
            
            if (!sourceLang) {
                detectionResult = this.detectLanguage(sourceText);
                sourceLang = detectionResult.detectedLanguage;
                Logger.info(`[Translation] Auto-detected source language: ${sourceLang} (confidence: ${detectionResult.confidence})`);
            } else {
                sourceLang = sourceLang.toLowerCase();
                if (!this.isLanguageSupported(sourceLang)) {
                    Logger.warn(`[Translation] Unsupported source language ${sourceLanguage}, falling back to auto-detection`);
                    detectionResult = this.detectLanguage(sourceText);
                    sourceLang = detectionResult.detectedLanguage;
                }
            }

            // Skip translation if source and target are the same
            if (sourceLang === targetLang) {
                return {
                    success: true,
                    translatedText: sourceText,
                    sourceLanguage: sourceLang,
                    targetLanguage: targetLang,
                    detectedLanguage: sourceLang,
                    confidenceScore: 1.0,
                    skipped: true,
                    message: 'Source and target languages are identical'
                };
            }

            Logger.info(`[Translation] Translating from ${sourceLang} to ${targetLang} (${sourceText.length} chars)`);

            // Call Python translation service
            const response = await axios.post(`${this.pythonServiceUrl}/translate`, {
                sourceText: sourceText.trim(),
                sourceLanguage: sourceLang,
                targetLanguage: targetLang,
                options: {
                    preserveFormatting: options.preserveFormatting !== false,
                    detectLanguage: !sourceLanguage,
                    ...options
                }
            }, {
                timeout: this.timeout,
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'Clueso-Translation-Service/1.0'
                }
            });

            if (!response.data || !response.data.success) {
                throw new Error(response.data?.message || 'Translation service returned unsuccessful response');
            }

            const result = response.data;
            
            // Validate response format
            if (!result.translatedText || typeof result.translatedText !== 'string') {
                throw new Error('Invalid translation response: missing or invalid translatedText');
            }

            Logger.info(`[Translation] Successfully translated ${sourceText.length} chars from ${sourceLang} to ${targetLang}`);

            return {
                success: true,
                translatedText: result.translatedText,
                sourceLanguage: sourceLang,
                targetLanguage: targetLang,
                detectedLanguage: detectionResult?.detectedLanguage || sourceLang,
                confidenceScore: result.confidenceScore || detectionResult?.confidence || 0.8,
                metadata: {
                    originalLength: sourceText.length,
                    translatedLength: result.translatedText.length,
                    processingTime: result.processingTime || null,
                    model: result.model || 'unknown',
                    autoDetected: !!detectionResult
                }
            };

        } catch (error) {
            Logger.error('[Translation] Translation failed:', error);
            
            // Provide graceful fallback
            return this._generateFallbackTranslation({
                sourceText,
                sourceLanguage,
                targetLanguage,
                error: error.message
            });
        }
    }

    /**
     * Translate demo content (subtitles, title, CTA text)
     * @param {Object} params - Demo translation parameters
     * @param {string} params.demoId - Demo identifier
     * @param {string} params.targetLanguage - Target language code
     * @param {string} params.originalTranscript - Original transcript text
     * @param {Object} params.metadata - Additional demo metadata
     * @returns {Promise<Object>} Complete demo translation
     */
    async translateDemo({ demoId, targetLanguage, originalTranscript, metadata = {} }) {
        try {
            if (!demoId || !targetLanguage || !originalTranscript) {
                throw new Error('Demo ID, target language, and original transcript are required');
            }

            Logger.info(`[Translation] Translating demo ${demoId} to ${targetLanguage}`);

            // Translate main transcript
            const transcriptResult = await this.translateText({
                sourceText: originalTranscript,
                targetLanguage,
                options: { preserveFormatting: true }
            });

            if (!transcriptResult.success) {
                throw new Error(`Failed to translate transcript: ${transcriptResult.error}`);
            }

            // Generate subtitles from translated transcript
            const subtitles = this._generateSubtitles(transcriptResult.translatedText, metadata.duration);

            // Translate title if provided
            let translatedTitle = null;
            if (metadata.title) {
                const titleResult = await this.translateText({
                    sourceText: metadata.title,
                    sourceLanguage: transcriptResult.sourceLanguage,
                    targetLanguage
                });
                translatedTitle = titleResult.success ? titleResult.translatedText : metadata.title;
            }

            // Translate CTA text if provided
            let translatedCTA = null;
            if (metadata.ctaText) {
                const ctaResult = await this.translateText({
                    sourceText: metadata.ctaText,
                    sourceLanguage: transcriptResult.sourceLanguage,
                    targetLanguage
                });
                translatedCTA = ctaResult.success ? ctaResult.translatedText : metadata.ctaText;
            }

            const languageInfo = this.supportedLanguages[targetLanguage];

            return {
                success: true,
                demoId,
                language: targetLanguage,
                languageInfo,
                translatedTitle,
                subtitles,
                translatedSummary: transcriptResult.translatedText,
                ctaText: translatedCTA,
                translationQuality: transcriptResult.confidenceScore,
                metadata: {
                    sourceLanguage: transcriptResult.sourceLanguage,
                    detectedLanguage: transcriptResult.detectedLanguage,
                    autoDetected: transcriptResult.metadata.autoDetected,
                    processingTime: Date.now(),
                    originalLength: originalTranscript.length,
                    translatedLength: transcriptResult.translatedText.length
                }
            };

        } catch (error) {
            Logger.error(`[Translation] Demo translation failed for ${demoId}:`, error);
            
            return {
                success: false,
                error: error.message,
                demoId,
                language: targetLanguage,
                fallback: true
            };
        }
    }

    /**
     * Generate subtitle cues from translated text
     * @param {string} text - Translated text
     * @param {number} duration - Video duration in seconds
     * @returns {Array} Subtitle cues with timing
     */
    _generateSubtitles(text, duration = 60) {
        if (!text || typeof text !== 'string') {
            return [];
        }

        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
        const subtitles = [];
        const avgDuration = duration / sentences.length;

        sentences.forEach((sentence, index) => {
            const start = index * avgDuration;
            const end = Math.min((index + 1) * avgDuration, duration);
            
            subtitles.push({
                start: Math.round(start * 1000) / 1000, // Round to 3 decimal places
                end: Math.round(end * 1000) / 1000,
                text: sentence.trim()
            });
        });

        return subtitles;
    }

    /**
     * Generate fallback translation when service fails
     * @param {Object} params - Fallback parameters
     * @returns {Object} Fallback translation result
     */
    _generateFallbackTranslation({ sourceText, sourceLanguage, targetLanguage, error }) {
        const targetLangInfo = this.supportedLanguages[targetLanguage] || this.supportedLanguages['en'];
        
        return {
            success: false,
            error,
            translatedText: sourceText, // Return original text as fallback
            sourceLanguage: sourceLanguage || 'unknown',
            targetLanguage,
            detectedLanguage: sourceLanguage || 'unknown',
            confidenceScore: 0.0,
            fallback: true,
            message: `Translation service unavailable. Displaying original text. Error: ${error}`,
            metadata: {
                originalLength: sourceText.length,
                translatedLength: sourceText.length,
                processingTime: null,
                model: 'fallback',
                autoDetected: false
            }
        };
    }

    /**
     * Batch translate multiple texts
     * @param {Array} texts - Array of {text, targetLanguage} objects
     * @param {string} sourceLanguage - Source language (optional)
     * @returns {Promise<Array>} Array of translation results
     */
    async batchTranslate(texts, sourceLanguage = null) {
        if (!Array.isArray(texts) || texts.length === 0) {
            throw new Error('Texts array is required and cannot be empty');
        }

        Logger.info(`[Translation] Starting batch translation of ${texts.length} texts`);

        const results = await Promise.allSettled(
            texts.map(({ text, targetLanguage, options }) =>
                this.translateText({
                    sourceText: text,
                    sourceLanguage,
                    targetLanguage,
                    options
                })
            )
        );

        return results.map((result, index) => ({
            index,
            success: result.status === 'fulfilled',
            data: result.status === 'fulfilled' ? result.value : null,
            error: result.status === 'rejected' ? result.reason.message : null
        }));
    }
}

module.exports = new TranslationService();