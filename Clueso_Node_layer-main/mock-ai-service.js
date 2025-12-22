#!/usr/bin/env node

/**
 * Mock AI Service for Clueso
 * Provides AI functionality when Python service is not available
 */

const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 8000;

app.use(cors());
app.use(express.json());

// Mock AI suggestions endpoint
app.post('/ai-suggestions', (req, res) => {
  const { demoId, transcript, pauseDurations, replayFrequency } = req.body;
  
  console.log(`[Mock AI] Generating suggestions for demo: ${demoId}`);
  
  // Generate realistic AI suggestions based on input
  const suggestions = [];
  
  if (transcript && transcript.length > 500) {
    suggestions.push({
      timestamp: Math.random() * 100,
      type: 'trim',
      suggestion: 'This section is quite long. Consider breaking it into smaller, more digestible segments.',
      confidence: 0.85 + Math.random() * 0.14,
      reasoning: 'Content length analysis indicates viewer attention may decrease'
    });
  }
  
  if (pauseDurations && pauseDurations.some(p => p > 2)) {
    suggestions.push({
      timestamp: Math.random() * 100,
      type: 'pace',
      suggestion: 'Consider reducing the pause duration here to maintain viewer engagement.',
      confidence: 0.78 + Math.random() * 0.20,
      reasoning: 'Extended pauses detected that may impact viewer retention'
    });
  }
  
  if (transcript && transcript.toLowerCase().includes('click') && !transcript.toLowerCase().includes('here')) {
    suggestions.push({
      timestamp: Math.random() * 100,
      type: 'clarify',
      suggestion: 'Add visual callouts to highlight the clickable elements for better user guidance.',
      confidence: 0.82 + Math.random() * 0.16,
      reasoning: 'UI interaction references without clear visual indicators'
    });
  }
  
  // Always add at least one general suggestion
  suggestions.push({
    timestamp: Math.random() * 100,
    type: 'general',
    suggestion: 'Consider adding a brief summary at the end to reinforce key takeaways.',
    confidence: 0.75 + Math.random() * 0.20,
    reasoning: 'Content structure analysis suggests summary would improve comprehension'
  });
  
  res.json({
    success: true,
    suggestions: suggestions.slice(0, 3) // Limit to 3 suggestions
  });
});

// Mock translation endpoint
app.post('/translate-demo', (req, res) => {
  const { demoId, targetLanguage, originalTranscript } = req.body;
  
  console.log(`[Mock AI] Translating demo ${demoId} to ${targetLanguage}`);
  
  // Mock translations
  const translations = {
    es: {
      translatedTranscript: 'Hola, bienvenidos a nuestra demostración. Hoy mostraremos las características principales de nuestra plataforma.',
      subtitles: [
        { start: 0, end: 30, text: 'Hola, bienvenidos a nuestra demostración.' },
        { start: 30, end: 60, text: 'Hoy mostraremos las características principales.' },
        { start: 60, end: 90, text: 'Comenzemos con la funcionalidad principal.' }
      ],
      quality: 0.92,
      ctaText: {
        button: 'Ver Demo',
        link: 'Más Información',
        signup: 'Registrarse'
      }
    },
    fr: {
      translatedTranscript: 'Bonjour, bienvenue à notre démonstration. Aujourd\'hui nous montrerons les fonctionnalités principales de notre plateforme.',
      subtitles: [
        { start: 0, end: 30, text: 'Bonjour, bienvenue à notre démonstration.' },
        { start: 30, end: 60, text: 'Aujourd\'hui nous montrerons les fonctionnalités principales.' },
        { start: 60, end: 90, text: 'Commençons par la fonctionnalité principale.' }
      ],
      quality: 0.89,
      ctaText: {
        button: 'Voir Démo',
        link: 'Plus d\'Informations',
        signup: 'S\'inscrire'
      }
    },
    de: {
      translatedTranscript: 'Hallo, willkommen zu unserer Demonstration. Heute zeigen wir die Hauptfunktionen unserer Plattform.',
      subtitles: [
        { start: 0, end: 30, text: 'Hallo, willkommen zu unserer Demonstration.' },
        { start: 30, end: 60, text: 'Heute zeigen wir die Hauptfunktionen.' },
        { start: 60, end: 90, text: 'Beginnen wir mit der Hauptfunktionalität.' }
      ],
      quality: 0.87,
      ctaText: {
        button: 'Demo Ansehen',
        link: 'Mehr Informationen',
        signup: 'Registrieren'
      }
    }
  };
  
  const translation = translations[targetLanguage] || translations.es;
  
  res.json({
    success: true,
    ...translation
  });
});

// Mock AI review endpoint
app.post('/ai-review', (req, res) => {
  const { demoId, reviewType } = req.body;
  
  console.log(`[Mock AI] Generating ${reviewType} review for demo: ${demoId}`);
  
  const review = {
    overallScore: 7.5 + Math.random() * 2, // 7.5-9.5
    insights: [
      'The demo effectively communicates the key value propositions',
      'Visual flow is intuitive and follows best practices',
      'Audio quality is clear and professional throughout',
      'Pacing allows viewers to follow along comfortably'
    ],
    commonIssues: [
      'Some sections could benefit from visual callouts',
      'Consider adding more context for technical terms',
      'Transitions between sections could be smoother'
    ],
    translationWarnings: [
      'Technical terminology may need localization review',
      'Cultural adaptation recommended for global audiences',
      'CTA text should be tested with target demographics'
    ],
    recommendations: [
      'Add interactive elements to increase engagement',
      'Include captions for accessibility compliance',
      'Consider creating shorter versions for social media',
      'Test with target audience for feedback validation'
    ],
    publishReadiness: Math.random() > 0.3 ? 'ready' : 'needs_work'
  };
  
  res.json({
    success: true,
    review
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'Mock AI Service', version: '1.0.0' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🤖 Mock AI Service running on http://localhost:${PORT}`);
  console.log('📋 Available endpoints:');
  console.log('   POST /ai-suggestions - Generate AI suggestions');
  console.log('   POST /translate-demo - Translate demo content');
  console.log('   POST /ai-review - Generate AI review');
  console.log('   GET /health - Health check');
  console.log('\n✅ Ready to handle AI requests from Clueso backend');
});

module.exports = app;