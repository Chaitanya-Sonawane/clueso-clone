#!/usr/bin/env node

/**
 * Add Comprehensive Dummy Data to SQLite Database
 * For real-time testing and demonstration
 */

const { sequelize, models } = require('./src/config/database');

console.log('🗄️  Adding comprehensive dummy data to SQLite database...\n');

const dummyComments = [
  {
    demoId: 'demo_ecommerce_checkout',
    userId: 'user_john_doe',
    username: 'John Doe',
    timestamp: 15.5,
    comment: 'The checkout button could be more prominent. Consider making it larger or using a different color.',
    position: { x: 450, y: 320 },
    status: 'open',
    aiGenerated: false,
    suggestionType: null
  },
  {
    demoId: 'demo_ecommerce_checkout',
    userId: 'ai_assistant',
    username: 'AI Assistant',
    timestamp: 18.2,
    comment: 'Consider adding a loading indicator here to show users that the payment is being processed.',
    position: { x: 500, y: 280 },
    status: 'open',
    aiGenerated: true,
    suggestionType: 'clarify'
  },
  {
    demoId: 'demo_ecommerce_checkout',
    userId: 'user_jane_smith',
    username: 'Jane Smith',
    timestamp: 45.8,
    comment: 'This section moves too quickly. New users might not understand what\'s happening.',
    position: { x: 300, y: 150 },
    status: 'resolved',
    aiGenerated: false,
    suggestionType: null
  },
  {
    demoId: 'demo_api_tutorial',
    userId: 'user_mike_wilson',
    username: 'Mike Wilson',
    timestamp: 120.5,
    comment: 'Great explanation of the authentication flow! Very clear and easy to follow.',
    position: { x: 600, y: 200 },
    status: 'open',
    aiGenerated: false,
    suggestionType: null
  },
  {
    demoId: 'demo_api_tutorial',
    userId: 'ai_assistant',
    username: 'AI Assistant',
    timestamp: 125.0,
    comment: 'Consider adding error handling examples for common API failure scenarios.',
    position: { x: 400, y: 350 },
    status: 'open',
    aiGenerated: true,
    suggestionType: 'general'
  },
  {
    demoId: 'demo_bug_report_ios',
    userId: 'user_sarah_johnson',
    username: 'Sarah Johnson',
    timestamp: 60.3,
    comment: 'I can reproduce this bug on iOS 17.1 as well. It seems to be a Safari-specific issue.',
    position: { x: 200, y: 400 },
    status: 'open',
    aiGenerated: false,
    suggestionType: null
  },
  {
    demoId: 'demo_ai_assistant',
    userId: 'ai_assistant',
    username: 'AI Assistant',
    timestamp: 30.0,
    comment: 'This demo effectively showcases the AI capabilities. Consider adding more complex query examples.',
    position: { x: 350, y: 250 },
    status: 'open',
    aiGenerated: true,
    suggestionType: 'general'
  },
  {
    demoId: 'demo_onboarding_flow',
    userId: 'user_test_user',
    username: 'Test User',
    timestamp: 90.7,
    comment: 'The onboarding flow is intuitive, but step 3 could use more explanation.',
    position: { x: 480, y: 180 },
    status: 'resolved',
    aiGenerated: false,
    suggestionType: null
  },
  {
    demoId: 'demo_onboarding_flow',
    userId: 'ai_assistant',
    username: 'AI Assistant',
    timestamp: 95.2,
    comment: 'Consider adding progress indicators to show users how many steps remain in the onboarding.',
    position: { x: 520, y: 160 },
    status: 'open',
    aiGenerated: true,
    suggestionType: 'clarify'
  },
  {
    demoId: 'demo_performance_test',
    userId: 'user_performance_tester',
    username: 'Performance Tester',
    timestamp: 180.0,
    comment: 'Dashboard load time is impressive! Under 2 seconds even with large datasets.',
    position: { x: 400, y: 300 },
    status: 'open',
    aiGenerated: false,
    suggestionType: null
  }
];

const dummyLanguages = [
  {
    demoId: 'demo_ecommerce_checkout',
    language: 'es',
    subtitles: [
      { start: 0, end: 15, text: 'Bienvenidos a nuestra demostración de comercio electrónico.' },
      { start: 15, end: 30, text: 'Hoy mostraremos el proceso de pago mejorado.' },
      { start: 30, end: 45, text: 'Comenzemos agregando productos al carrito.' },
      { start: 45, end: 60, text: 'Ahora procederemos al proceso de pago.' }
    ],
    translatedSummary: 'Demostración completa del proceso de pago de comercio electrónico con características mejoradas.',
    translatedTitle: 'Demo de Pago - Plataforma de Comercio Electrónico',
    ctaText: {
      button: 'Ver Demo',
      link: 'Más Información',
      signup: 'Registrarse Ahora'
    },
    translationQuality: 0.94,
    isDefault: false
  },
  {
    demoId: 'demo_ecommerce_checkout',
    language: 'fr',
    subtitles: [
      { start: 0, end: 15, text: 'Bienvenue à notre démonstration de commerce électronique.' },
      { start: 15, end: 30, text: 'Aujourd\'hui nous montrerons le processus de paiement amélioré.' },
      { start: 30, end: 45, text: 'Commençons par ajouter des produits au panier.' },
      { start: 45, end: 60, text: 'Maintenant nous procéderons au processus de paiement.' }
    ],
    translatedSummary: 'Démonstration complète du processus de paiement e-commerce avec fonctionnalités améliorées.',
    translatedTitle: 'Démo de Paiement - Plateforme E-commerce',
    ctaText: {
      button: 'Voir Démo',
      link: 'Plus d\'Informations',
      signup: 'S\'inscrire Maintenant'
    },
    translationQuality: 0.91,
    isDefault: false
  },
  {
    demoId: 'demo_api_tutorial',
    language: 'de',
    subtitles: [
      { start: 0, end: 20, text: 'Willkommen zum API-Integrations-Tutorial.' },
      { start: 20, end: 40, text: 'Wir zeigen Ihnen, wie Sie unsere REST-API integrieren.' },
      { start: 40, end: 60, text: 'Beginnen wir mit der Projekteinrichtung.' },
      { start: 60, end: 80, text: 'Als nächstes implementieren wir die Authentifizierung.' }
    ],
    translatedSummary: 'Schritt-für-Schritt-Tutorial zur API-Integration mit React und anderen Frameworks.',
    translatedTitle: 'Tutorial - API-Integrationsleitfaden',
    ctaText: {
      button: 'Demo Ansehen',
      link: 'Mehr Informationen',
      signup: 'Jetzt Registrieren'
    },
    translationQuality: 0.87,
    isDefault: false
  }
];

const dummyAIReviews = [
  {
    demoId: 'demo_ecommerce_checkout',
    reviewType: 'pre_publish',
    insights: [
      'The demo effectively communicates the checkout process improvements',
      'Visual flow is intuitive and follows e-commerce best practices',
      'Audio quality is clear and professional throughout the demonstration',
      'Pacing allows viewers to follow along comfortably without rushing'
    ],
    commonIssues: [
      'Some users mentioned the checkout button could be more prominent',
      'Consider adding loading indicators for better user feedback',
      'Mobile responsiveness demonstration would be valuable'
    ],
    translationWarnings: [
      'Payment terminology may need localization for different regions',
      'Currency symbols should adapt to target market',
      'Legal compliance text requires regional adaptation'
    ],
    overallScore: 8.5,
    status: 'completed'
  },
  {
    demoId: 'demo_api_tutorial',
    reviewType: 'on_demand',
    insights: [
      'Excellent technical depth with clear explanations',
      'Code examples are practical and well-structured',
      'Authentication flow is explained comprehensively',
      'Error handling examples add significant value'
    ],
    commonIssues: [
      'Could benefit from more complex query examples',
      'Consider adding performance optimization tips',
      'Testing strategies could be covered in more detail'
    ],
    translationWarnings: [
      'Technical terminology requires careful translation',
      'Code comments should remain in English for consistency',
      'API endpoint names should not be translated'
    ],
    overallScore: 9.2,
    status: 'completed'
  },
  {
    demoId: 'demo_bug_report_ios',
    reviewType: 'periodic',
    insights: [
      'Clear reproduction steps make the bug easy to understand',
      'Browser-specific issue is well documented',
      'Expected vs actual behavior is clearly demonstrated',
      'Concise presentation keeps viewer attention'
    ],
    commonIssues: [
      'Could include more browser version details',
      'Workaround solutions would be helpful',
      'Impact assessment on user experience needed'
    ],
    translationWarnings: [
      'Technical error messages should remain in original language',
      'Browser names and versions should not be translated',
      'Bug tracking terminology needs consistency'
    ],
    overallScore: 7.8,
    status: 'completed'
  },
  {
    demoId: 'demo_ai_assistant',
    reviewType: 'pre_publish',
    insights: [
      'AI capabilities are showcased effectively',
      'Natural language processing examples are compelling',
      'Report generation feature demonstrates clear value',
      'User interaction flow is smooth and intuitive'
    ],
    commonIssues: [
      'More complex query examples would strengthen the demo',
      'Error handling scenarios should be demonstrated',
      'Performance metrics could add credibility'
    ],
    translationWarnings: [
      'AI responses may vary in different languages',
      'Natural language queries need cultural adaptation',
      'Technical AI terminology requires expert translation'
    ],
    overallScore: 8.9,
    status: 'completed'
  },
  {
    demoId: 'demo_onboarding_flow',
    reviewType: 'on_demand',
    insights: [
      'Onboarding flow is well-structured and logical',
      'Interactive elements enhance user engagement',
      'Progress tracking provides clear guidance',
      'Personalization features add significant value'
    ],
    commonIssues: [
      'Step 3 explanation could be more detailed',
      'Progress indicators would improve user experience',
      'Skip options for experienced users might be useful'
    ],
    translationWarnings: [
      'Onboarding text should be culturally appropriate',
      'Form field labels need careful localization',
      'Help text should match local user expectations'
    ],
    overallScore: 8.3,
    status: 'completed'
  }
];

async function addDummyData() {
  try {
    console.log('📝 Adding dummy comments...');
    await models.Comment.bulkCreate(dummyComments, { 
      ignoreDuplicates: true,
      updateOnDuplicate: ['comment', 'status', 'updatedAt']
    });
    console.log(`✅ Added ${dummyComments.length} comments`);

    console.log('🌍 Adding dummy language data...');
    await models.DemoLanguage.bulkCreate(dummyLanguages, { 
      ignoreDuplicates: true,
      updateOnDuplicate: ['subtitles', 'translationQuality', 'updatedAt']
    });
    console.log(`✅ Added ${dummyLanguages.length} language translations`);

    console.log('🤖 Adding dummy AI reviews...');
    await models.AIReview.bulkCreate(dummyAIReviews, { 
      ignoreDuplicates: true,
      updateOnDuplicate: ['insights', 'overallScore', 'status', 'updatedAt']
    });
    console.log(`✅ Added ${dummyAIReviews.length} AI reviews`);

    console.log('\n🎉 Dummy data added successfully!');
    
    console.log('\n📊 Database Summary:');
    const commentCount = await models.Comment.count();
    const languageCount = await models.DemoLanguage.count();
    const reviewCount = await models.AIReview.count();
    
    console.log(`💬 Total Comments: ${commentCount}`);
    console.log(`🌍 Total Languages: ${languageCount}`);
    console.log(`🤖 Total AI Reviews: ${reviewCount}`);
    
    console.log('\n🎯 Available Demo Sessions:');
    console.log('• demo_ecommerce_checkout - E-commerce checkout process');
    console.log('• demo_api_tutorial - API integration tutorial');
    console.log('• demo_bug_report_ios - iOS Safari bug report');
    console.log('• demo_ai_assistant - AI assistant features');
    console.log('• demo_onboarding_flow - User onboarding experience');
    console.log('• demo_performance_test - Performance testing');
    
    console.log('\n🚀 Ready for real-time testing!');
    console.log('Use these demo IDs in your API calls to see populated data.');
    
  } catch (error) {
    console.error('❌ Error adding dummy data:', error);
  } finally {
    await sequelize.close();
  }
}

addDummyData();