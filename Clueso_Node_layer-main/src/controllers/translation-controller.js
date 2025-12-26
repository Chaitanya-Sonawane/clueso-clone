const TranslationService = require('../services/translation-service');
const CollaborationService = require('../services/collaboration-service');
const { StatusCodes } = require('http-status-codes');
const { Logger } = require('../config');
const Joi = require('joi');

/**
 * 12+ Multi-Language Translation API Controller
 * 
 * Handles all translation-related endpoints with proper validation,
 * error handling, and response formatting.
 */
class TranslationController {

    /**
     * Get all supported languages with metadata
     * GET /api/translation/languages
     */
    async getSupportedLanguages(req, res) {
        try {
            const languages = TranslationService.getSupportedLanguages();
            
            res.status(StatusCodes.OK).json({
                success: true,
                message: '12+ Multi-Language Translation API - Supported Languages',
                data: languages,
                meta: {
                    version: '1.0.0',
                    totalLanguages: languages.count,
                    features: [
                        'Real-time translation',
                        'Auto language detection',
                        'Batch translation',
                        'Subtitle generation',
                        'RTL language support',
                        'Quality scoring'
                    ]
                }
            });
        } catch (error) {
            Logger.error('[Translation Controller] Get languages error:', error);
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: 'Failed to retrieve supported languages',
                error: error.message
            });
        }
    }

    /**
     * Translate text between languages
     * POST /api/translation/translate
     */
    async translateText(req, res) {
        try {
            // Validation schema
            const schema = Joi.object({
                sourceText: Joi.string().required().min(1).max(10000),
                sourceLanguage: Joi.string().optional().length(2),
                targetLanguage: Joi.string().required().length(2),
                options: Joi.object({
                    preserveFormatting: Joi.boolean().default(true),
                    detectLanguage: Joi.boolean().default(false)
                }).optional().default({})
            });

            const { error, value } = schema.validate(req.body);
            if (error) {
                return res.status(StatusCodes.BAD_REQUEST).json({
                    success: false,
                    message: 'Invalid request parameters',
                    errors: error.details.map(d => d.message)
                });
            }

            const { sourceText, sourceLanguage, targetLanguage, options } = value;

            // Validate language codes
            if (sourceLanguage && !TranslationService.isLanguageSupported(sourceLanguage)) {
                return res.status(StatusCodes.BAD_REQUEST).json({
                    success: false,
                    message: `Unsupported source language: ${sourceLanguage}`,
                    supportedLanguages: Object.keys(TranslationService.getSupportedLanguages().languages)
                });
            }

            if (!TranslationService.isLanguageSupported(targetLanguage)) {
                return res.status(StatusCodes.BAD_REQUEST).json({
                    success: false,
                    message: `Unsupported target language: ${targetLanguage}`,
                    supportedLanguages: Object.keys(TranslationService.getSupportedLanguages().languages)
                });
            }

            const result = await TranslationService.translateText({
                sourceText,
                sourceLanguage,
                targetLanguage,
                options
            });

            const statusCode = result.success ? StatusCodes.OK : StatusCodes.PARTIAL_CONTENT;

            res.status(statusCode).json({
                success: result.success,
                message: result.success ? 'Translation completed successfully' : 'Translation completed with fallback',
                data: result,
                meta: {
                    api: '12+ Multi-Language Translation API',
                    version: '1.0.0',
                    timestamp: new Date().toISOString()
                }
            });

        } catch (error) {
            Logger.error('[Translation Controller] Translate text error:', error);
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: 'Translation service error',
                error: error.message
            });
        }
    }

    /**
     * Batch translate multiple texts
     * POST /api/translation/translate/batch
     */
    async batchTranslate(req, res) {
        try {
            const schema = Joi.object({
                texts: Joi.array().items(
                    Joi.object({
                        text: Joi.string().required().min(1).max(10000),
                        targetLanguage: Joi.string().required().length(2),
                        options: Joi.object().optional()
                    })
                ).required().min(1).max(50),
                sourceLanguage: Joi.string().optional().length(2)
            });

            const { error, value } = schema.validate(req.body);
            if (error) {
                return res.status(StatusCodes.BAD_REQUEST).json({
                    success: false,
                    message: 'Invalid batch request parameters',
                    errors: error.details.map(d => d.message)
                });
            }

            const { texts, sourceLanguage } = value;

            // Validate all target languages
            for (const item of texts) {
                if (!TranslationService.isLanguageSupported(item.targetLanguage)) {
                    return res.status(StatusCodes.BAD_REQUEST).json({
                        success: false,
                        message: `Unsupported target language: ${item.targetLanguage}`,
                        supportedLanguages: Object.keys(TranslationService.getSupportedLanguages().languages)
                    });
                }
            }

            const results = await TranslationService.batchTranslate(texts, sourceLanguage);

            const successCount = results.filter(r => r.success).length;
            const failureCount = results.length - successCount;

            res.status(StatusCodes.OK).json({
                success: true,
                message: `Batch translation completed: ${successCount} successful, ${failureCount} failed`,
                data: {
                    results,
                    summary: {
                        total: results.length,
                        successful: successCount,
                        failed: failureCount,
                        successRate: Math.round((successCount / results.length) * 100)
                    }
                },
                meta: {
                    api: '12+ Multi-Language Translation API',
                    version: '1.0.0',
                    timestamp: new Date().toISOString()
                }
            });

        } catch (error) {
            Logger.error('[Translation Controller] Batch translate error:', error);
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: 'Batch translation service error',
                error: error.message
            });
        }
    }

    /**
     * Detect language from text
     * POST /api/translation/detect
     */
    async detectLanguage(req, res) {
        try {
            const schema = Joi.object({
                text: Joi.string().required().min(1).max(10000)
            });

            const { error, value } = schema.validate(req.body);
            if (error) {
                return res.status(StatusCodes.BAD_REQUEST).json({
                    success: false,
                    message: 'Invalid detection request parameters',
                    errors: error.details.map(d => d.message)
                });
            }

            const { text } = value;
            const result = TranslationService.detectLanguage(text);

            res.status(StatusCodes.OK).json({
                success: true,
                message: 'Language detection completed',
                data: {
                    ...result,
                    languageInfo: TranslationService.getSupportedLanguages().languages[result.detectedLanguage]
                },
                meta: {
                    api: '12+ Multi-Language Translation API',
                    version: '1.0.0',
                    timestamp: new Date().toISOString()
                }
            });

        } catch (error) {
            Logger.error('[Translation Controller] Detect language error:', error);
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: 'Language detection service error',
                error: error.message
            });
        }
    }

    /**
     * Translate entire demo content
     * POST /api/translation/demos/:demoId/translate
     */
    async translateDemo(req, res) {
        try {
            const { demoId } = req.params;
            
            const schema = Joi.object({
                targetLanguage: Joi.string().required().length(2),
                originalTranscript: Joi.string().required().min(1),
                metadata: Joi.object({
                    title: Joi.string().optional(),
                    ctaText: Joi.string().optional(),
                    duration: Joi.number().positive().optional()
                }).optional().default({})
            });

            const { error, value } = schema.validate(req.body);
            if (error) {
                return res.status(StatusCodes.BAD_REQUEST).json({
                    success: false,
                    message: 'Invalid demo translation parameters',
                    errors: error.details.map(d => d.message)
                });
            }

            const { targetLanguage, originalTranscript, metadata } = value;

            if (!TranslationService.isLanguageSupported(targetLanguage)) {
                return res.status(StatusCodes.BAD_REQUEST).json({
                    success: false,
                    message: `Unsupported target language: ${targetLanguage}`,
                    supportedLanguages: Object.keys(TranslationService.getSupportedLanguages().languages)
                });
            }

            const result = await TranslationService.translateDemo({
                demoId,
                targetLanguage,
                originalTranscript,
                metadata
            });

            if (result.success) {
                // Store translation in database via collaboration service
                try {
                    await CollaborationService.addLanguage(demoId, {
                        language: targetLanguage,
                        subtitles: result.subtitles,
                        translatedTitle: result.translatedTitle,
                        translatedSummary: result.translatedSummary,
                        ctaText: result.ctaText,
                        translationQuality: result.translationQuality,
                        isDefault: false
                    });
                } catch (dbError) {
                    Logger.warn('[Translation Controller] Failed to store translation in database:', dbError);
                    // Continue with response even if DB storage fails
                }
            }

            const statusCode = result.success ? StatusCodes.OK : StatusCodes.PARTIAL_CONTENT;

            res.status(statusCode).json({
                success: result.success,
                message: result.success ? 'Demo translation completed successfully' : 'Demo translation completed with errors',
                data: result,
                meta: {
                    api: '12+ Multi-Language Translation API',
                    version: '1.0.0',
                    timestamp: new Date().toISOString()
                }
            });

        } catch (error) {
            Logger.error('[Translation Controller] Translate demo error:', error);
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: 'Demo translation service error',
                error: error.message
            });
        }
    }

    /**
     * Get all languages for a demo
     * GET /api/translation/demos/:demoId/languages
     */
    async getDemoLanguages(req, res) {
        try {
            const { demoId } = req.params;

            const languages = await CollaborationService.getLanguages(demoId);

            res.status(StatusCodes.OK).json({
                success: true,
                message: 'Demo languages retrieved successfully',
                data: {
                    demoId,
                    languages,
                    count: languages.length,
                    supportedLanguages: TranslationService.getSupportedLanguages()
                },
                meta: {
                    api: '12+ Multi-Language Translation API',
                    version: '1.0.0',
                    timestamp: new Date().toISOString()
                }
            });

        } catch (error) {
            Logger.error('[Translation Controller] Get demo languages error:', error);
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: 'Failed to retrieve demo languages',
                error: error.message
            });
        }
    }

    /**
     * Get specific language data for a demo
     * GET /api/translation/demos/:demoId/languages/:language
     */
    async getDemoLanguage(req, res) {
        try {
            const { demoId, language } = req.params;

            if (!TranslationService.isLanguageSupported(language)) {
                return res.status(StatusCodes.BAD_REQUEST).json({
                    success: false,
                    message: `Unsupported language: ${language}`,
                    supportedLanguages: Object.keys(TranslationService.getSupportedLanguages().languages)
                });
            }

            const languageData = await CollaborationService.getSubtitles(demoId, language);

            if (!languageData) {
                return res.status(StatusCodes.NOT_FOUND).json({
                    success: false,
                    message: `Language ${language} not found for demo ${demoId}`
                });
            }

            res.status(StatusCodes.OK).json({
                success: true,
                message: 'Demo language data retrieved successfully',
                data: {
                    demoId,
                    language,
                    languageInfo: TranslationService.getSupportedLanguages().languages[language],
                    ...languageData
                },
                meta: {
                    api: '12+ Multi-Language Translation API',
                    version: '1.0.0',
                    timestamp: new Date().toISOString()
                }
            });

        } catch (error) {
            Logger.error('[Translation Controller] Get demo language error:', error);
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: 'Failed to retrieve demo language data',
                error: error.message
            });
        }
    }

    /**
     * Health check for translation service
     * GET /api/translation/health
     */
    async healthCheck(req, res) {
        try {
            const supportedLanguages = TranslationService.getSupportedLanguages();
            
            // Test basic translation functionality
            const testResult = await TranslationService.translateText({
                sourceText: 'Hello world',
                sourceLanguage: 'en',
                targetLanguage: 'es'
            });

            const isHealthy = testResult.success || testResult.fallback;

            res.status(isHealthy ? StatusCodes.OK : StatusCodes.SERVICE_UNAVAILABLE).json({
                success: isHealthy,
                message: isHealthy ? '12+ Multi-Language Translation API is healthy' : 'Translation service is experiencing issues',
                data: {
                    status: isHealthy ? 'healthy' : 'degraded',
                    supportedLanguages: supportedLanguages.count,
                    features: {
                        textTranslation: testResult.success,
                        languageDetection: true,
                        batchTranslation: true,
                        demoTranslation: true,
                        fallbackMode: testResult.fallback || false
                    },
                    lastCheck: new Date().toISOString()
                },
                meta: {
                    api: '12+ Multi-Language Translation API',
                    version: '1.0.0',
                    uptime: process.uptime()
                }
            });

        } catch (error) {
            Logger.error('[Translation Controller] Health check error:', error);
            res.status(StatusCodes.SERVICE_UNAVAILABLE).json({
                success: false,
                message: 'Translation service health check failed',
                error: error.message,
                meta: {
                    api: '12+ Multi-Language Translation API',
                    version: '1.0.0',
                    timestamp: new Date().toISOString()
                }
            });
        }
    }
}

module.exports = new TranslationController();