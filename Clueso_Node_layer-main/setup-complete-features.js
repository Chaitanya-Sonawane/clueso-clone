#!/usr/bin/env node

/**
 * Complete Feature Setup with Dummy Data
 * Sets up all features with realistic dummy data for testing
 */

const { models, sequelize } = require('./src/config/database');
const { v4: uuidv4 } = require('uuid');

console.log('🚀 Setting up complete Clueso features with dummy data...\n');

async function setupCompleteFeatures() {
  try {
    console.log('🔄 Initializing database...');
    await sequelize.sync({ force: true }); // Fresh start
    console.log('✅ Database initialized\n');

    // Session IDs for testing
    const sessionIds = [
      'session_1765089986708_lyv7icnrb', // Existing session from logs
      'session_demo_ecommerce_001',
      'session_tutorial_api_001',
      'session_bug_ios_001',
      'session_ai_assistant_001'
    ];

    console.log('💬 Adding collaboration comments...');
    
    // Comments with variety of types
    const comments = [
      {
        demoId: sessionIds[0],
        userId: 'user_john_doe',
        username: 'John Doe',
        timestamp: 45.2,
        comment: 'This section needs more explanation. Users might get confused here.',
        position: JSON.stringify({ x: 300, y: 150 }),
        status: 'open',
        aiGenerated: false,
        metadata: JSON.stringify({ priority: 'medium' })
      },
      {
        demoId: sessionIds[0],
        userId: 'ai_assistant',
        username: 'AI Assistant',
        timestamp: 47.8,
        comment: 'Consider adding a visual callout here to highlight the important button.',
        position: JSON.stringify({ x: 450, y: 200 }),
        status: 'open',
        aiGenerated: true,
        suggestionType: 'clarify',
        metadata: JSON.stringify({ confidence: 0.87 })
      },
      {
        demoId: sessionIds[1],
        userId: 'user_jane_smith',
        username: 'Jane Smith',
        timestamp: 120.5,
        comment: 'Great demonstration! The flow is very clear.',
        status: 'resolved',
        aiGenerated: false,
        metadata: JSON.stringify({ sentiment: 'positive' })
      },
      {
        demoId: sessionIds[1],
        userId: 'ai_assistant',
        username: 'AI Assistant',
        timestamp: 180.0,
        comment: 'This section is quite long. Consider breaking it into smaller chunks.',
        status: 'open',
        aiGenerated: true,
        suggestionType: 'trim',
        metadata: JSON.stringify({ confidence: 0.92 })
      },
      {
        demoId: sessionIds[2],
        userId: 'user_mike_wilson',
        username: 'Mike Wilson',
        timestamp: 60.0,
        comment: 'This bug is critical for mobile users. High priority fix needed.',
        position: JSON.stringify({ x: 200, y: 400 }),
        status: 'open',
        aiGenerated: false,
        metadata: JSON.stringify({ severity: 'critical' })
      }
    ];

    for (const comment of comments) {
      await models.Comment.create(comment);
    }
    console.log(`✅ Added ${comments.length} comments`);

    console.log('🌍 Adding multi-language support...');
    
    // Multi-language data
    const languages = [
      {
        demoId: sessionIds[0],
        language: 'es',
        subtitles: JSON.stringify([
          { start: 0, end: 30, text: 'Hola, bienvenidos a nuestra demostración.' },
          { start: 30, end: 60, text: 'Hoy mostraremos las nuevas características.' },
          { start: 60, end: 90, text: 'Comenzemos con el proceso de registro.' }
        ]),
        translatedSummary: 'Demostración completa de las nuevas características de la plataforma.',
        translatedTitle: 'Demo del Producto - Nuevas Características',
        ctaText: JSON.stringify({ button: 'Ver Demo', link: 'Más Info' }),
        translationQuality: 0.94,
        isDefault: false
      },
      {
        demoId: sessionIds[0],
        language: 'fr',
        subtitles: JSON.stringify([
          { start: 0, end: 30, text: 'Bonjour, bienvenue à notre démonstration.' },
          { start: 30, end: 60, text: 'Aujourd\'hui nous montrerons les nouvelles fonctionnalités.' },
          { start: 60, end: 90, text: 'Commençons par le processus d\'inscription.' }
        ]),
        translatedSummary: 'Démonstration complète des nouvelles fonctionnalités de la plateforme.',
        translatedTitle: 'Démo Produit - Nouvelles Fonctionnalités',
        ctaText: JSON.stringify({ button: 'Voir Démo', link: 'Plus d\'Info' }),
        translationQuality: 0.91,
        isDefault: false
      },
      {
        demoId: sessionIds[1],
        language: 'es',
        subtitles: JSON.stringify([
          { start: 0, end: 45, text: 'Tutorial de integración de API paso a paso.' },
          { start: 45, end: 90, text: 'Configuraremos el proyecto desde cero.' },
          { start: 90, end: 135, text: 'Implementaremos la autenticación JWT.' }
        ]),
        translatedSummary: 'Tutorial completo de integración de API con React.',
        translatedTitle: 'Tutorial - Integración de API',
        ctaText: JSON.stringify({ button: 'Ver Tutorial', link: 'Documentación' }),
        translationQuality: 0.89,
        isDefault: false
      }
    ];

    for (const lang of languages) {
      await models.DemoLanguage.create(lang);
    }
    console.log(`✅ Added ${languages.length} language translations`);

    console.log('🤖 Adding AI reviews...');
    
    // AI Reviews
    const reviews = [
      {
        demoId: sessionIds[0],
        reviewType: 'on_demand',
        insights: JSON.stringify([
          'The demo effectively showcases key features',
          'Audio quality is excellent throughout',
          'Visual flow is intuitive and easy to follow',
          'Good pacing allows viewers to understand each step'
        ]),
        commonIssues: JSON.stringify([
          'Some users mentioned needing more explanation in the middle section',
          'AI suggests adding visual callouts for better guidance'
        ]),
        translationWarnings: JSON.stringify([
          'Spanish translation is 94% accurate',
          'French translation needs minor grammatical review'
        ]),
        overallScore: 8.7,
        status: 'completed'
      },
      {
        demoId: sessionIds[1],
        reviewType: 'pre_publish',
        insights: JSON.stringify([
          'Comprehensive coverage of API integration',
          'Code examples are practical and well-structured',
          'Good progression from basic to advanced concepts'
        ]),
        commonIssues: JSON.stringify([
          'Consider breaking down longer code segments',
          'Add more error handling examples'
        ]),
        translationWarnings: JSON.stringify([
          'Technical terms in Spanish need developer review'
        ]),
        overallScore: 9.1,
        status: 'completed'
      },
      {
        demoId: sessionIds[2],
        reviewType: 'on_demand',
        insights: JSON.stringify([
          'Clear bug reproduction steps',
          'Good documentation for development team',
          'Proper severity classification'
        ]),
        commonIssues: JSON.stringify([
          'Bug correctly identified as critical',
          'Reproduction steps are clear and repeatable'
        ]),
        translationWarnings: JSON.stringify([
          'Technical error descriptions maintain accuracy'
        ]),
        overallScore: 8.9,
        status: 'completed'
      }
    ];

    for (const review of reviews) {
      await models.AIReview.create(review);
    }
    console.log(`✅ Added ${reviews.length} AI reviews`);

    console.log('\n🎉 All features set up successfully!');
    
    console.log('\n📊 Feature Summary:');
    console.log(`💬 Comments: ${comments.length} (including AI suggestions)`);
    console.log(`🌍 Languages: ${languages.length} translations`);
    console.log(`🤖 AI Reviews: ${reviews.length} comprehensive reviews`);
    
    console.log('\n🎯 Available Features:');
    console.log('✅ Timestamped Comments with Position Tracking');
    console.log('✅ AI-Generated Suggestions (5 types)');
    console.log('✅ Comment Status Management');
    console.log('✅ Multi-Language Subtitle Generation');
    console.log('✅ Translation Quality Scoring');
    console.log('✅ Comprehensive AI Reviews');
    console.log('✅ Real-time Collaboration via WebSocket');

    console.log('\n🧪 Test Session IDs:');
    sessionIds.forEach((id, index) => {
      console.log(`   ${index + 1}. ${id}`);
    });

    return true;

  } catch (error) {
    console.error('❌ Setup failed:', error);
    return false;
  }
}

// Run setup
if (require.main === module) {
  setupCompleteFeatures()
    .then((success) => {
      if (success) {
        console.log('\n🚀 Ready to test all features!');
        console.log('\n📋 Next Steps:');
        console.log('1. Restart the backend server');
        console.log('2. Run: node test-all-features.js');
        console.log('3. Test frontend collaboration features');
        process.exit(0);
      } else {
        process.exit(1);
      }
    })
    .catch(console.error);
}

module.exports = { setupCompleteFeatures };