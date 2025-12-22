#!/usr/bin/env node

/**
 * Add Comprehensive Dummy Data to Clueso SQLite Database
 * This script adds realistic dummy data for all features including collaboration
 */

const { models, sequelize } = require('./src/config/database');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

console.log('🚀 Adding comprehensive dummy data to SQLite database...\n');

// Dummy data generators
const generateComments = (sessionIds) => [
  {
    id: uuidv4(),
    demoId: sessionIds[0],
    userId: 'user_john_doe',
    username: 'John Doe',
    timestamp: 45.2,
    comment: 'This section could use more explanation about the checkout process. Users might get confused here.',
    position: { x: 300, y: 150 },
    status: 'open',
    aiGenerated: false,
    suggestionType: null,
    metadata: { priority: 'medium', category: 'ux' }
  },
  {
    id: uuidv4(),
    demoId: sessionIds[0],
    userId: 'ai_assistant',
    username: 'AI Assistant',
    timestamp: 47.8,
    comment: 'Consider adding a visual callout here to highlight the "Add to Cart" button for better user guidance.',
    position: { x: 450, y: 200 },
    status: 'open',
    aiGenerated: true,
    suggestionType: 'clarify',
    metadata: { confidence: 0.87, reasoning: 'Button visibility analysis' }
  },
  {
    id: uuidv4(),
    demoId: sessionIds[0],
    userId: 'user_jane_smith',
    username: 'Jane Smith',
    timestamp: 120.5,
    comment: 'Great demonstration of the shopping cart functionality! The animation is smooth.',
    position: null,
    status: 'resolved',
    aiGenerated: false,
    suggestionType: null,
    metadata: { sentiment: 'positive' }
  },
  {
    id: uuidv4(),
    demoId: sessionIds[1],
    userId: 'ai_assistant',
    username: 'AI Assistant',
    timestamp: 180.0,
    comment: 'This code example is quite long. Consider breaking it into smaller, more digestible chunks.',
    position: null,
    status: 'open',
    aiGenerated: true,
    suggestionType: 'trim',
    metadata: { confidence: 0.92, reasoning: 'Content length analysis' }
  },
  {
    id: uuidv4(),
    demoId: sessionIds[1],
    userId: 'user_mike_wilson',
    username: 'Mike Wilson',
    timestamp: 240.3,
    comment: 'The API authentication flow is well explained. Maybe add error handling examples?',
    position: { x: 600, y: 300 },
    status: 'open',
    aiGenerated: false,
    suggestionType: null,
    metadata: { category: 'technical', priority: 'high' }
  },
  {
    id: uuidv4(),
    demoId: sessionIds[2],
    userId: 'user_sarah_johnson',
    username: 'Sarah Johnson',
    timestamp: 60.0,
    comment: 'This bug is critical for mobile users. We need to prioritize this fix.',
    position: { x: 200, y: 400 },
    status: 'open',
    aiGenerated: false,
    suggestionType: null,
    metadata: { severity: 'critical', platform: 'mobile' }
  },
  {
    id: uuidv4(),
    demoId: sessionIds[2],
    userId: 'ai_assistant',
    username: 'AI Assistant',
    timestamp: 180.5,
    comment: 'Based on the error pattern, this appears to be a viewport-related CSS issue specific to iOS Safari.',
    position: null,
    status: 'open',
    aiGenerated: true,
    suggestionType: 'general',
    metadata: { confidence: 0.78, reasoning: 'Error pattern analysis' }
  },
  {
    id: uuidv4(),
    demoId: sessionIds[3],
    userId: 'user_john_doe',
    username: 'John Doe',
    timestamp: 90.7,
    comment: 'The AI assistant response time is impressive! How does it handle complex queries?',
    position: { x: 500, y: 250 },
    status: 'open',
    aiGenerated: false,
    suggestionType: null,
    metadata: { category: 'performance', interest_level: 'high' }
  },
  {
    id: uuidv4(),
    demoId: sessionIds[4],
    userId: 'ai_assistant',
    username: 'AI Assistant',
    timestamp: 300.0,
    comment: 'The onboarding flow could benefit from progress indicators to show users how many steps remain.',
    position: { x: 100, y: 50 },
    status: 'open',
    aiGenerated: true,
    suggestionType: 'cta',
    metadata: { confidence: 0.91, reasoning: 'UX best practices analysis' }
  },
  {
    id: uuidv4(),
    demoId: sessionIds[4],
    userId: 'user_jane_smith',
    username: 'Jane Smith',
    timestamp: 450.2,
    comment: 'Love the interactive tutorials! This will definitely improve user adoption.',
    position: null,
    status: 'resolved',
    aiGenerated: false,
    suggestionType: null,
    metadata: { sentiment: 'very_positive', feature: 'interactive_tutorials' }
  }
];

const generateDemoLanguages = (sessionIds) => [
  {
    id: uuidv4(),
    demoId: sessionIds[0],
    language: 'es',
    subtitles: [
      { start: 0, end: 30, text: 'Hola a todos, bienvenidos a nuestra demostración integral de la plataforma de comercio electrónico.' },
      { start: 30, end: 120, text: 'Hoy les mostraré nuestro nuevo proceso de pago que hemos rediseñado completamente.' },
      { start: 120, end: 240, text: 'Comencemos navegando por nuestro catálogo de productos. Como pueden ver, tenemos una interfaz limpia e intuitiva.' },
      { start: 240, end: 480, text: 'Ahora agreguemos algunos artículos a nuestro carrito y procedamos al pago.' },
      { start: 480, end: 600, text: 'Noten lo suave que es la transición y cómo hemos minimizado el número de pasos requeridos.' }
    ],
    translatedSummary: 'Demostración integral del nuevo proceso de pago de la plataforma de comercio electrónico, destacando la experiencia de usuario mejorada, pasos simplificados y opciones de pago mejoradas.',
    translatedTitle: 'Demo del Producto - Plataforma de Comercio Electrónico',
    ctaText: {
      button: 'Ver Demo',
      link: 'Más Información',
      signup: 'Registrarse Ahora'
    },
    translationQuality: 0.94,
    isDefault: false
  },
  {
    id: uuidv4(),
    demoId: sessionIds[0],
    language: 'fr',
    subtitles: [
      { start: 0, end: 30, text: 'Bonjour tout le monde, bienvenue à notre démonstration complète de la plateforme e-commerce.' },
      { start: 30, end: 120, text: 'Aujourd\'hui, je vais vous montrer notre nouveau processus de commande que nous avons complètement repensé.' },
      { start: 120, end: 240, text: 'Commençons par naviguer dans notre catalogue de produits. Comme vous pouvez le voir, nous avons une interface propre et intuitive.' },
      { start: 240, end: 480, text: 'Maintenant, ajoutons quelques articles à notre panier et procédons au paiement.' },
      { start: 480, end: 600, text: 'Remarquez comme la transition est fluide et comment nous avons minimisé le nombre d\'étapes requises.' }
    ],
    translatedSummary: 'Démonstration complète du nouveau processus de commande de la plateforme e-commerce, mettant en évidence l\'expérience utilisateur améliorée, les étapes simplifiées et les options de paiement améliorées.',
    translatedTitle: 'Démo Produit - Plateforme E-commerce',
    ctaText: {
      button: 'Voir la Démo',
      link: 'Plus d\'Informations',
      signup: 'S\'inscrire Maintenant'
    },
    translationQuality: 0.91,
    isDefault: false
  },
  {
    id: uuidv4(),
    demoId: sessionIds[1],
    language: 'es',
    subtitles: [
      { start: 0, end: 180, text: 'Bienvenidos a nuestro tutorial de integración de API para desarrolladores de React.' },
      { start: 180, end: 360, text: 'En esta sesión, cubriremos todo lo que necesitan saber para integrar exitosamente nuestra API REST.' },
      { start: 360, end: 600, text: 'Primero, configuremos el proyecto e instalemos las dependencias necesarias.' },
      { start: 600, end: 780, text: 'Usaremos axios para las peticiones HTTP y nuestro SDK oficial para una integración más fácil.' },
      { start: 780, end: 900, text: 'Ahora veamos la autenticación - esto es crucial para el acceso seguro a la API.' }
    ],
    translatedSummary: 'Tutorial paso a paso que cubre la integración de API de React, implementación de autenticación, manejo de errores y mejores prácticas para desarrolladores.',
    translatedTitle: 'Tutorial - Guía de Integración de API',
    ctaText: {
      button: 'Ver Tutorial',
      link: 'Documentación',
      signup: 'Comenzar Gratis'
    },
    translationQuality: 0.89,
    isDefault: false
  },
  {
    id: uuidv4(),
    demoId: sessionIds[2],
    language: 'es',
    subtitles: [
      { start: 0, end: 60, text: 'Estoy documentando un error crítico que afecta a los usuarios de iOS Safari durante el proceso de inicio de sesión.' },
      { start: 60, end: 180, text: 'Permítanme reproducir el problema paso a paso.' },
      { start: 180, end: 240, text: 'Primero, navegaré a la página de inicio de sesión en iOS Safari.' },
      { start: 240, end: 300, text: 'Como pueden ver, la página se carga normalmente. Ahora ingresaré credenciales válidas y tocaré el botón de inicio de sesión.' }
    ],
    translatedSummary: 'Documentación de un error crítico de inicio de sesión que afecta a los usuarios de iOS Safari, incluyendo pasos de reproducción y comportamiento esperado vs real.',
    translatedTitle: 'Reporte de Error - Problema de Flujo de Inicio de Sesión',
    ctaText: {
      button: 'Ver Reporte',
      link: 'Más Detalles',
      signup: 'Reportar Error'
    },
    translationQuality: 0.87,
    isDefault: false
  }
];

const generateAIReviews = (sessionIds) => [
  {
    id: uuidv4(),
    demoId: sessionIds[0],
    reviewType: 'on_demand',
    insights: [
      'The demo effectively showcases the e-commerce checkout process with clear navigation',
      'Visual flow is intuitive and follows standard e-commerce patterns',
      'Audio quality is excellent with clear narration throughout',
      'The pacing allows viewers to follow along without feeling rushed',
      'Good use of real-world examples that users can relate to'
    ],
    commonIssues: [
      'Multiple reviewers mentioned the need for more explanation during the checkout process',
      'Some users found the transition between cart and checkout too quick',
      'AI analysis suggests adding visual callouts for better guidance'
    ],
    translationWarnings: [
      'Spanish translation maintains 94% accuracy with minor grammatical adjustments needed',
      'French translation is 91% accurate with some technical terms requiring review',
      'Consider cultural adaptation for payment method preferences in different regions'
    ],
    overallScore: 8.7,
    status: 'completed'
  },
  {
    id: uuidv4(),
    demoId: sessionIds[1],
    reviewType: 'pre_publish',
    insights: [
      'Comprehensive coverage of API integration concepts for React developers',
      'Code examples are practical and well-structured',
      'Good progression from basic setup to advanced error handling',
      'Technical depth is appropriate for the target audience',
      'Clear explanations of authentication flow and security considerations'
    ],
    commonIssues: [
      'AI suggests breaking down longer code segments for better comprehension',
      'Some developers requested more error handling examples',
      'Pacing could be slightly slower during complex code explanations'
    ],
    translationWarnings: [
      'Technical terminology in Spanish translation needs developer review',
      'Code comments should remain in English for consistency',
      'Consider providing language-specific SDK documentation links'
    ],
    overallScore: 9.1,
    status: 'completed'
  },
  {
    id: uuidv4(),
    demoId: sessionIds[2],
    reviewType: 'on_demand',
    insights: [
      'Clear documentation of the iOS Safari login bug with systematic reproduction',
      'Good use of step-by-step approach for bug demonstration',
      'Effective comparison between expected and actual behavior',
      'Concise presentation suitable for development team review',
      'Proper categorization as critical issue for mobile users'
    ],
    commonIssues: [
      'Bug severity correctly identified as critical',
      'Reproduction steps are clear and repeatable',
      'AI analysis confirms viewport-related CSS issue pattern'
    ],
    translationWarnings: [
      'Technical error descriptions maintain accuracy in Spanish',
      'Browser-specific terminology translated appropriately',
      'Consider adding localized error message examples'
    ],
    overallScore: 8.9,
    status: 'completed'
  },
  {
    id: uuidv4(),
    demoId: sessionIds[3],
    reviewType: 'on_demand',
    insights: [
      'Excellent showcase of AI assistant capabilities with real-time demonstrations',
      'Natural language processing features are clearly highlighted',
      'Good variety of use cases from simple queries to complex analysis',
      'Response times are impressive and well-documented',
      'User interface is intuitive and encourages exploration'
    ],
    commonIssues: [
      'Users are curious about handling of complex queries - consider adding examples',
      'Performance metrics could be more prominently displayed',
      'Some viewers want to see error handling scenarios'
    ],
    translationWarnings: [
      'AI-generated content translations need accuracy verification',
      'Natural language examples should be culturally appropriate',
      'Consider regional variations in query patterns and responses'
    ],
    overallScore: 9.3,
    status: 'completed'
  },
  {
    id: uuidv4(),
    demoId: sessionIds[4],
    reviewType: 'pre_publish',
    insights: [
      'Outstanding onboarding flow design with excellent user experience',
      'Interactive tutorials are engaging and educational',
      'Progress tracking provides clear sense of advancement',
      'Personalization features enhance user engagement',
      'Smooth transitions between onboarding steps'
    ],
    commonIssues: [
      'AI suggests adding progress indicators for better user orientation',
      'Some users want more customization options during setup',
      'Consider adding skip options for experienced users'
    ],
    translationWarnings: [
      'Onboarding text translations are culturally appropriate',
      'Interactive element labels maintain consistency across languages',
      'Progress indicators and achievement text properly localized'
    ],
    overallScore: 9.5,
    status: 'completed'
  }
];

// Main insertion function
async function insertDummyData() {
  try {
    console.log('🔄 Syncing database...');
    await sequelize.sync({ force: false, alter: true });
    console.log('✅ Database synced successfully\n');

    // Generate session IDs (these should match existing recording sessions)
    const sessionIds = [
      'session_ecommerce_demo_001',
      'session_api_tutorial_001', 
      'session_bug_report_001',
      'session_ai_demo_001',
      'session_onboarding_001'
    ];

    // Generate dummy data
    const comments = generateComments(sessionIds);
    const demoLanguages = generateDemoLanguages(sessionIds);
    const aiReviews = generateAIReviews(sessionIds);

    // Insert Comments
    console.log('💬 Inserting collaboration comments...');
    for (const comment of comments) {
      await models.Comment.upsert(comment);
    }
    console.log(`✅ Inserted ${comments.length} comments`);

    // Insert Demo Languages
    console.log('🌍 Inserting multi-language support...');
    for (const language of demoLanguages) {
      await models.DemoLanguage.upsert(language);
    }
    console.log(`✅ Inserted ${demoLanguages.length} language translations`);

    // Insert AI Reviews
    console.log('🤖 Inserting AI reviews...');
    for (const review of aiReviews) {
      await models.AIReview.upsert(review);
    }
    console.log(`✅ Inserted ${aiReviews.length} AI reviews`);

    console.log('\n🎉 All dummy data inserted successfully!');
    
    // Print summary
    console.log('\n📊 Collaboration Features Data Summary:');
    console.log(`💬 Comments: ${comments.length} (${comments.filter(c => c.aiGenerated).length} AI-generated)`);
    console.log(`🌍 Languages: ${demoLanguages.length} translations across ${new Set(demoLanguages.map(l => l.language)).size} languages`);
    console.log(`🤖 AI Reviews: ${aiReviews.length} comprehensive reviews`);
    
    console.log('\n🎯 Feature Coverage:');
    console.log('✅ Timestamped Comments with Position Tracking');
    console.log('✅ AI-Generated Suggestions (trim, clarify, CTA, pace, general)');
    console.log('✅ Comment Status Management (open/resolved)');
    console.log('✅ Multi-Language Subtitle Generation');
    console.log('✅ Translation Quality Scoring');
    console.log('✅ Localized CTA Text');
    console.log('✅ Comprehensive AI Reviews');
    console.log('✅ Content Analysis and Recommendations');
    console.log('✅ Translation Warnings and Insights');

    console.log('\n🧪 Test the features:');
    console.log('1. Start the servers (backend + frontend)');
    console.log('2. Navigate to a demo session');
    console.log('3. View existing comments and add new ones');
    console.log('4. Switch between languages to see translations');
    console.log('5. Generate AI reviews and suggestions');
    console.log('6. Test real-time collaboration features');

    return true;

  } catch (error) {
    console.error('❌ Error inserting dummy data:', error);
    return false;
  }
}

// Run if called directly
if (require.main === module) {
  insertDummyData()
    .then((success) => {
      if (success) {
        console.log('\n🚀 Ready to test all collaboration features!');
        process.exit(0);
      } else {
        console.log('\n❌ Setup failed');
        process.exit(1);
      }
    })
    .catch(console.error);
}

module.exports = { insertDummyData };