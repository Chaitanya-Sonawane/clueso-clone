const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Mock AI Suggestions endpoint
app.post('/ai-suggestions', (req, res) => {
    const { demoId, transcript, pauseDurations, replayFrequency } = req.body;
    
    console.log(`[Mock AI] Generating suggestions for demo ${demoId}`);
    
    // Generate mock suggestions based on input
    const suggestions = [];
    
    if (transcript && transcript.length > 100) {
        suggestions.push({
            id: `suggestion_${Date.now()}_1`,
            type: 'improvement',
            title: 'Add Visual Callouts',
            description: 'Consider adding visual callouts to highlight important UI elements during the demonstration.',
            timestamp: Math.floor(Math.random() * 30),
            priority: 'medium',
            implemented: false
        });
    }
    
    if (pauseDurations && pauseDurations.some(p => p > 2)) {
        suggestions.push({
            id: `suggestion_${Date.now()}_2`,
            type: 'optimization',
            title: 'Reduce Pause Duration',
            description: 'Long pauses detected. Consider editing to maintain viewer engagement.',
            timestamp: Math.floor(Math.random() * 60),
            priority: 'high',
            implemented: false
        });
    }
    
    suggestions.push({
        id: `suggestion_${Date.now()}_3`,
        type: 'accessibility',
        title: 'Add Captions',
        description: 'Adding captions would improve accessibility for hearing-impaired users.',
        timestamp: Math.floor(Math.random() * 45),
        priority: 'low',
        implemented: false
    });
    
    res.json({
        success: true,
        suggestions
    });
});

// Mock Translation endpoint
app.post('/translate-demo', (req, res) => {
    const { demoId, targetLanguage, originalTranscript } = req.body;
    
    console.log(`[Mock AI] Translating demo ${demoId} to ${targetLanguage}`);
    
    // Mock translation data
    const translations = {
        spanish: {
            subtitles: 'Hola, bienvenidos a esta demostración. Vamos a mostrar cómo usar esta aplicación paso a paso.',
            translatedSummary: 'Una demostración completa de la aplicación con explicaciones detalladas.',
            translatedTitle: 'Demostración de la Aplicación',
            ctaText: 'Comenzar Ahora',
            translationQuality: 0.92
        },
        french: {
            subtitles: 'Bonjour, bienvenue dans cette démonstration. Nous allons montrer comment utiliser cette application étape par étape.',
            translatedSummary: 'Une démonstration complète de l\'application avec des explications détaillées.',
            translatedTitle: 'Démonstration de l\'Application',
            ctaText: 'Commencer Maintenant',
            translationQuality: 0.89
        },
        german: {
            subtitles: 'Hallo, willkommen zu dieser Demonstration. Wir zeigen Ihnen, wie Sie diese Anwendung Schritt für Schritt verwenden.',
            translatedSummary: 'Eine vollständige Demonstration der Anwendung mit detaillierten Erklärungen.',
            translatedTitle: 'Anwendungsdemonstration',
            ctaText: 'Jetzt Beginnen',
            translationQuality: 0.91
        }
    };
    
    const languageKey = targetLanguage.toLowerCase();
    const translationData = translations[languageKey] || {
        subtitles: `[${targetLanguage}] Welcome to this demonstration. We will show how to use this application step by step.`,
        translatedSummary: `[${targetLanguage}] A complete demonstration of the application with detailed explanations.`,
        translatedTitle: `[${targetLanguage}] Application Demonstration`,
        ctaText: `[${targetLanguage}] Get Started`,
        translationQuality: 0.85
    };
    
    res.json({
        success: true,
        ...translationData
    });
});

// Mock AI Review endpoint
app.post('/ai-review', (req, res) => {
    const { demoId, comments, languages, reviewType } = req.body;
    
    console.log(`[Mock AI] Generating ${reviewType} review for demo ${demoId}`);
    
    const humanComments = comments.filter(c => !c.aiGenerated);
    const aiComments = comments.filter(c => c.aiGenerated);
    const openComments = comments.filter(c => c.status === 'open');
    
    // Calculate score based on various factors
    let score = 8.0;
    
    // Deduct points for open issues
    score -= openComments.length * 0.5;
    
    // Add points for language support
    if (languages && languages.length > 1) {
        score += 0.5;
    }
    
    // Add points for AI suggestions being addressed
    const resolvedAI = aiComments.filter(c => c.status === 'resolved').length;
    if (resolvedAI > 0) {
        score += 0.3;
    }
    
    score = Math.max(1, Math.min(10, score));
    
    const insights = [
        `Demo has ${comments.length} total comments (${humanComments.length} human, ${aiComments.length} AI-generated)`,
        `${openComments.length} issues remain unresolved`,
        languages && languages.length > 1 ? `Multi-language support available (${languages.length} languages)` : 'Single language demo',
        score >= 8 ? 'Demo is ready for publication' : score >= 6 ? 'Demo needs minor improvements' : 'Demo requires significant improvements'
    ];
    
    const recommendations = [];
    
    if (openComments.length > 0) {
        recommendations.push('Address remaining open comments before publishing');
    }
    
    if (!languages || languages.length === 1) {
        recommendations.push('Consider adding multi-language support for broader reach');
    }
    
    if (score < 7) {
        recommendations.push('Review AI suggestions and implement high-priority improvements');
    }
    
    res.json({
        success: true,
        review: {
            overallScore: Math.round(score * 10) / 10,
            insights,
            recommendations,
            commonIssues: openComments.map(c => c.comment).slice(0, 3),
            translationWarnings: languages && languages.length > 1 ? ['Verify translation accuracy for technical terms'] : [],
            publishReadiness: score >= 7
        }
    });
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'healthy', service: 'Mock AI Collaboration Service' });
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
    console.log(`🤖 Mock AI Collaboration Service running on port ${PORT}`);
    console.log('Available endpoints:');
    console.log('  POST /ai-suggestions - Generate AI suggestions');
    console.log('  POST /translate-demo - Translate demo content');
    console.log('  POST /ai-review - Generate AI review');
    console.log('  GET /health - Health check');
});