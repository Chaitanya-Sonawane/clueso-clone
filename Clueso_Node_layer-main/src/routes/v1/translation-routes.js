const express = require('express');
const { TranslationController } = require('../../controllers');

const router = express.Router();

/**
 * 12+ Multi-Language Translation API Routes
 * 
 * Production-ready translation endpoints with comprehensive language support,
 * proper validation, error handling, and documentation.
 */

// Get supported languages
router.get('/languages', TranslationController.getSupportedLanguages);

// Translate text
router.post('/translate', TranslationController.translateText);

// Batch translate multiple texts
router.post('/translate/batch', TranslationController.batchTranslate);

// Detect language from text
router.post('/detect', TranslationController.detectLanguage);

// Demo-specific translation routes
router.post('/demos/:demoId/translate', TranslationController.translateDemo);
router.get('/demos/:demoId/languages', TranslationController.getDemoLanguages);
router.get('/demos/:demoId/languages/:language', TranslationController.getDemoLanguage);

// Health check for translation service
router.get('/health', TranslationController.healthCheck);

module.exports = router;