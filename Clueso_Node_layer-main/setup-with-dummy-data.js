#!/usr/bin/env node

/**
 * Clueso Complete Setup with Dummy Data
 * This script sets up the database and adds comprehensive dummy data for all features
 */

const { supabaseAdmin } = require('./src/config/supabase');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

console.log('🚀 Setting up Clueso with comprehensive dummy data...\n');

// Dummy data generators
const generateUsers = () => [
  {
    id: uuidv4(),
    email: 'john.doe@example.com',
    password: 'password123',
    full_name: 'John Doe',
    username: 'johndoe',
    avatar_url: 'https://api.dicebear.com/7.x/initials/svg?seed=John%20Doe'
  },
  {
    id: uuidv4(),
    email: 'jane.smith@example.com',
    password: 'password123',
    full_name: 'Jane Smith',
    username: 'janesmith',
    avatar_url: 'https://api.dicebear.com/7.x/initials/svg?seed=Jane%20Smith'
  },
  {
    id: uuidv4(),
    email: 'mike.wilson@example.com',
    password: 'password123',
    full_name: 'Mike Wilson',
    username: 'mikewilson',
    avatar_url: 'https://api.dicebear.com/7.x/initials/svg?seed=Mike%20Wilson'
  },
  {
    id: uuidv4(),
    email: 'sarah.johnson@example.com',
    password: 'password123',
    full_name: 'Sarah Johnson',
    username: 'sarahjohnson',
    avatar_url: 'https://api.dicebear.com/7.x/initials/svg?seed=Sarah%20Johnson'
  },
  {
    id: uuidv4(),
    email: 'test@example.com',
    password: 'testpass123',
    full_name: 'Test User',
    username: 'testuser',
    avatar_url: 'https://api.dicebear.com/7.x/initials/svg?seed=Test%20User'
  }
];

const generateProjects = (users) => [
  {
    id: uuidv4(),
    name: 'Product Demo - E-commerce Platform',
    description: 'Comprehensive demo of our new e-commerce platform features including checkout, inventory management, and analytics dashboard.',
    owner_id: users[0].id
  },
  {
    id: uuidv4(),
    name: 'Tutorial - API Integration Guide',
    description: 'Step-by-step tutorial showing how to integrate our REST API with common frameworks like React, Vue, and Angular.',
    owner_id: users[0].id
  },
  {
    id: uuidv4(),
    name: 'Bug Report - Login Flow Issue',
    description: 'Demonstration of the login flow bug affecting mobile users on iOS Safari browser.',
    owner_id: users[1].id
  },
  {
    id: uuidv4(),
    name: 'Feature Showcase - AI Assistant',
    description: 'Showcasing the new AI assistant features including natural language queries and automated report generation.',
    owner_id: users[1].id
  },
  {
    id: uuidv4(),
    name: 'Onboarding Flow - New User Experience',
    description: 'Complete walkthrough of the new user onboarding process with interactive tutorials and progress tracking.',
    owner_id: users[2].id
  },
  {
    id: uuidv4(),
    name: 'Performance Testing - Dashboard Load Times',
    description: 'Performance analysis of dashboard loading times under different user loads and data volumes.',
    owner_id: users[2].id
  }
];

const generateRecordingSessions = (projects, users) => [
  {
    id: 'session_' + Date.now() + '_demo1',
    project_id: projects[0].id,
    user_id: users[0].id,
    session_name: 'E-commerce Checkout Demo',
    status: 'completed',
    start_time: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    end_time: new Date(Date.now() - 3000000).toISOString(), // 50 minutes ago
    duration: 600, // 10 minutes
    file_path: '/recordings/ecommerce_demo.webm',
    metadata: {
      url: 'https://demo.ecommerce.com',
      viewport: { width: 1920, height: 1080 },
      browser: 'Chrome 120.0',
      template: 'demo',
      processed: true,
      thumbnails: [
        '/processed/thumbnails/demo1_thumb1.jpg',
        '/processed/thumbnails/demo1_thumb2.jpg',
        '/processed/thumbnails/demo1_thumb3.jpg',
        '/processed/thumbnails/demo1_thumb4.jpg'
      ],
      chapters: [
        { index: 0, title: 'Introduction', start: 0, end: 30 },
        { index: 1, title: 'Product Catalog', start: 30, end: 120 },
        { index: 2, title: 'Shopping Cart', start: 120, end: 240 },
        { index: 3, title: 'Checkout Process', start: 240, end: 480 },
        { index: 4, title: 'Order Confirmation', start: 480, end: 600 }
      ]
    }
  },
  {
    id: 'session_' + Date.now() + '_tutorial1',
    project_id: projects[1].id,
    user_id: users[0].id,
    session_name: 'API Integration Tutorial - React',
    status: 'completed',
    start_time: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
    end_time: new Date(Date.now() - 6600000).toISOString(), // 1h 50m ago
    duration: 900, // 15 minutes
    file_path: '/recordings/api_tutorial_react.webm',
    metadata: {
      url: 'https://docs.api.example.com',
      viewport: { width: 1920, height: 1080 },
      browser: 'Chrome 120.0',
      template: 'tutorial',
      processed: true,
      thumbnails: [
        '/processed/thumbnails/tutorial1_thumb1.jpg',
        '/processed/thumbnails/tutorial1_thumb2.jpg',
        '/processed/thumbnails/tutorial1_thumb3.jpg',
        '/processed/thumbnails/tutorial1_thumb4.jpg'
      ],
      chapters: [
        { index: 0, title: 'Setup & Installation', start: 0, end: 180 },
        { index: 1, title: 'Authentication', start: 180, end: 360 },
        { index: 2, title: 'Making API Calls', start: 360, end: 600 },
        { index: 3, title: 'Error Handling', start: 600, end: 780 },
        { index: 4, title: 'Best Practices', start: 780, end: 900 }
      ]
    }
  },
  {
    id: 'session_' + Date.now() + '_bug1',
    project_id: projects[2].id,
    user_id: users[1].id,
    session_name: 'iOS Safari Login Bug Reproduction',
    status: 'completed',
    start_time: new Date(Date.now() - 10800000).toISOString(), // 3 hours ago
    end_time: new Date(Date.now() - 10200000).toISOString(), // 2h 50m ago
    duration: 300, // 5 minutes
    file_path: '/recordings/ios_safari_bug.webm',
    metadata: {
      url: 'https://app.example.com/login',
      viewport: { width: 375, height: 812 },
      browser: 'Safari iOS 17.0',
      template: 'bug_report',
      processed: true,
      issue_id: 'BUG-2024-001',
      severity: 'high',
      thumbnails: [
        '/processed/thumbnails/bug1_thumb1.jpg',
        '/processed/thumbnails/bug1_thumb2.jpg'
      ],
      chapters: [
        { index: 0, title: 'Bug Setup', start: 0, end: 60 },
        { index: 1, title: 'Reproduction Steps', start: 60, end: 180 },
        { index: 2, title: 'Error Demonstration', start: 180, end: 240 },
        { index: 3, title: 'Expected vs Actual', start: 240, end: 300 }
      ]
    }
  },
  {
    id: 'session_' + Date.now() + '_ai1',
    project_id: projects[3].id,
    user_id: users[1].id,
    session_name: 'AI Assistant Feature Demo',
    status: 'processing',
    start_time: new Date(Date.now() - 1800000).toISOString(), // 30 minutes ago
    end_time: null,
    duration: null,
    file_path: '/recordings/ai_assistant_demo.webm',
    metadata: {
      url: 'https://app.example.com/ai-assistant',
      viewport: { width: 1920, height: 1080 },
      browser: 'Chrome 120.0',
      template: 'demo',
      processed: false,
      processing_progress: 75
    }
  },
  {
    id: 'session_' + Date.now() + '_onboarding1',
    project_id: projects[4].id,
    user_id: users[2].id,
    session_name: 'New User Onboarding Flow',
    status: 'completed',
    start_time: new Date(Date.now() - 14400000).toISOString(), // 4 hours ago
    end_time: new Date(Date.now() - 13800000).toISOString(), // 3h 50m ago
    duration: 720, // 12 minutes
    file_path: '/recordings/onboarding_flow.webm',
    metadata: {
      url: 'https://app.example.com/onboarding',
      viewport: { width: 1920, height: 1080 },
      browser: 'Chrome 120.0',
      template: 'presentation',
      processed: true,
      thumbnails: [
        '/processed/thumbnails/onboarding1_thumb1.jpg',
        '/processed/thumbnails/onboarding1_thumb2.jpg',
        '/processed/thumbnails/onboarding1_thumb3.jpg',
        '/processed/thumbnails/onboarding1_thumb4.jpg'
      ],
      chapters: [
        { index: 0, title: 'Welcome Screen', start: 0, end: 90 },
        { index: 1, title: 'Profile Setup', start: 90, end: 240 },
        { index: 2, title: 'Feature Tour', start: 240, end: 480 },
        { index: 3, title: 'First Project', start: 480, end: 600 },
        { index: 4, title: 'Completion', start: 600, end: 720 }
      ]
    }
  }
];

const generateFiles = (sessions, users) => {
  const files = [];
  
  sessions.forEach((session, index) => {
    // Video file
    files.push({
      id: uuidv4(),
      user_id: session.user_id,
      project_id: session.project_id,
      recording_session_id: session.id,
      filename: `video_${session.id}.webm`,
      original_name: `${session.session_name}_video.webm`,
      file_type: 'video/webm',
      file_size: Math.floor(Math.random() * 50000000) + 10000000, // 10-60MB
      file_path: `/recordings/videos/${session.id}_video.webm`,
      storage_url: `https://storage.supabase.co/recordings/videos/${session.id}_video.webm`,
      metadata: {
        duration: session.duration,
        width: session.metadata?.viewport?.width || 1920,
        height: session.metadata?.viewport?.height || 1080,
        fps: 30,
        codec: 'vp9'
      }
    });

    // Audio file
    files.push({
      id: uuidv4(),
      user_id: session.user_id,
      project_id: session.project_id,
      recording_session_id: session.id,
      filename: `audio_${session.id}.webm`,
      original_name: `${session.session_name}_audio.webm`,
      file_type: 'audio/webm',
      file_size: Math.floor(Math.random() * 5000000) + 1000000, // 1-6MB
      file_path: `/recordings/audio/${session.id}_audio.webm`,
      storage_url: `https://storage.supabase.co/recordings/audio/${session.id}_audio.webm`,
      metadata: {
        duration: session.duration,
        sampleRate: 44100,
        channels: 2,
        codec: 'opus'
      }
    });

    // Processed video (if completed)
    if (session.status === 'completed') {
      files.push({
        id: uuidv4(),
        user_id: session.user_id,
        project_id: session.project_id,
        recording_session_id: session.id,
        filename: `processed_${session.id}.mp4`,
        original_name: `${session.session_name}_processed.mp4`,
        file_type: 'video/mp4',
        file_size: Math.floor(Math.random() * 80000000) + 20000000, // 20-100MB
        file_path: `/processed/videos/${session.id}_processed.mp4`,
        storage_url: `https://storage.supabase.co/processed/videos/${session.id}_processed.mp4`,
        metadata: {
          duration: session.duration,
          width: 1920,
          height: 1080,
          fps: 30,
          codec: 'h264',
          template: session.metadata?.template,
          processed: true
        }
      });
    }
  });

  return files;
};

const generateAIAnalysis = (sessions) => {
  const analyses = [];
  
  sessions.forEach(session => {
    if (session.status === 'completed') {
      // Transcription analysis
      analyses.push({
        id: uuidv4(),
        recording_session_id: session.id,
        analysis_type: 'transcription',
        result: {
          transcript: generateTranscript(session.session_name),
          words: generateWordTimings(),
          summary: generateSummary(session.session_name),
          keyPoints: generateKeyPoints(session.session_name),
          fillerWords: Math.floor(Math.random() * 20) + 5,
          speakingPace: Math.floor(Math.random() * 50) + 120 // words per minute
        },
        confidence_score: 0.85 + Math.random() * 0.14, // 0.85-0.99
        processing_time: Math.floor(Math.random() * 30000) + 5000 // 5-35 seconds
      });

      // Sentiment analysis
      analyses.push({
        id: uuidv4(),
        recording_session_id: session.id,
        analysis_type: 'sentiment',
        result: {
          overall_sentiment: ['positive', 'neutral', 'confident'][Math.floor(Math.random() * 3)],
          sentiment_score: 0.6 + Math.random() * 0.4, // 0.6-1.0
          emotions: {
            confidence: 0.7 + Math.random() * 0.3,
            enthusiasm: 0.6 + Math.random() * 0.4,
            clarity: 0.8 + Math.random() * 0.2
          },
          tone_analysis: {
            professional: 0.8 + Math.random() * 0.2,
            friendly: 0.7 + Math.random() * 0.3,
            engaging: 0.6 + Math.random() * 0.4
          }
        },
        confidence_score: 0.78 + Math.random() * 0.20,
        processing_time: Math.floor(Math.random() * 15000) + 3000
      });

      // Content analysis
      analyses.push({
        id: uuidv4(),
        recording_session_id: session.id,
        analysis_type: 'content_analysis',
        result: {
          topics: generateTopics(session.session_name),
          complexity_score: 0.4 + Math.random() * 0.6,
          engagement_score: 0.6 + Math.random() * 0.4,
          clarity_score: 0.7 + Math.random() * 0.3,
          pacing_analysis: {
            too_fast_segments: Math.floor(Math.random() * 3),
            too_slow_segments: Math.floor(Math.random() * 2),
            optimal_segments: Math.floor(Math.random() * 8) + 5
          },
          recommendations: generateRecommendations(session.session_name)
        },
        confidence_score: 0.82 + Math.random() * 0.16,
        processing_time: Math.floor(Math.random() * 25000) + 8000
      });
    }
  });

  return analyses;
};

// Helper functions for generating realistic content
function generateTranscript(sessionName) {
  const transcripts = {
    'E-commerce Checkout Demo': "Hello everyone, welcome to our comprehensive e-commerce platform demo. Today I'll be walking you through our new checkout process that we've completely redesigned based on user feedback. Let's start by browsing our product catalog. As you can see, we have a clean, intuitive interface that makes it easy for customers to find what they're looking for. Now let's add a few items to our cart and proceed to checkout. Notice how smooth the transition is, and how we've minimized the number of steps required. The checkout process now includes real-time inventory checking, multiple payment options, and instant order confirmation.",
    
    'API Integration Tutorial - React': "Welcome to our API integration tutorial for React developers. In this session, we'll cover everything you need to know to successfully integrate our REST API into your React applications. First, let's set up the project and install the necessary dependencies. We'll be using axios for HTTP requests and our official SDK for easier integration. Now let's look at authentication - this is crucial for secure API access. We'll implement JWT token handling and automatic token refresh. Next, we'll make our first API call to fetch user data and handle both success and error responses properly.",
    
    'iOS Safari Login Bug Reproduction': "I'm documenting a critical bug affecting iOS Safari users during the login process. Let me reproduce the issue step by step. First, I'll navigate to the login page on iOS Safari. As you can see, the page loads normally. Now I'll enter valid credentials and tap the login button. Notice how the button appears to work, but then the page refreshes instead of redirecting to the dashboard. This happens consistently on iOS Safari versions 16 and 17. The expected behavior is a successful login and redirect to the user dashboard.",
    
    'AI Assistant Feature Demo': "Today I'm excited to show you our new AI assistant feature that's revolutionizing how users interact with our platform. The AI assistant can understand natural language queries and provide intelligent responses. Let me demonstrate by asking it to generate a sales report for the last quarter. As you can see, it not only generates the report but also provides insights and recommendations. The assistant can also help with data analysis, answer questions about platform features, and even suggest optimizations for better performance.",
    
    'New User Onboarding Flow': "Welcome to our redesigned user onboarding experience. We've created an interactive flow that guides new users through the platform's key features. The onboarding starts with a personalized welcome screen that adapts based on the user's role and industry. Next, we help users set up their profile with smart suggestions and auto-completion. The feature tour is now interactive, allowing users to try features as they learn about them. Finally, we guide users through creating their first project, ensuring they have a successful initial experience."
  };
  
  return transcripts[sessionName] || "This is a sample transcript for the recording session. The content includes detailed explanations of the features being demonstrated, step-by-step instructions, and helpful commentary to guide viewers through the process.";
}

function generateWordTimings() {
  const words = ["Hello", "everyone", "welcome", "to", "our", "demo", "today", "we'll", "be", "showing"];
  return words.map((word, index) => ({
    word,
    start: index * 0.5,
    end: (index + 1) * 0.5,
    confidence: 0.8 + Math.random() * 0.2
  }));
}

function generateSummary(sessionName) {
  const summaries = {
    'E-commerce Checkout Demo': "Comprehensive demonstration of the new e-commerce checkout process, highlighting improved user experience, streamlined steps, and enhanced payment options.",
    'API Integration Tutorial - React': "Step-by-step tutorial covering React API integration, authentication implementation, error handling, and best practices for developers.",
    'iOS Safari Login Bug Reproduction': "Documentation of a critical login bug affecting iOS Safari users, including reproduction steps and expected vs actual behavior.",
    'AI Assistant Feature Demo': "Showcase of the new AI assistant capabilities including natural language processing, report generation, and intelligent recommendations.",
    'New User Onboarding Flow': "Walkthrough of the redesigned user onboarding experience featuring personalized welcome screens, interactive tutorials, and guided project creation."
  };
  
  return summaries[sessionName] || "Summary of the recording session covering key features and demonstrations.";
}

function generateKeyPoints(sessionName) {
  const keyPoints = {
    'E-commerce Checkout Demo': [
      "Streamlined checkout process with fewer steps",
      "Real-time inventory checking",
      "Multiple payment options integration",
      "Improved mobile responsiveness",
      "Enhanced security features"
    ],
    'API Integration Tutorial - React': [
      "Project setup and dependency installation",
      "JWT authentication implementation",
      "Error handling best practices",
      "API response caching strategies",
      "Testing API integrations"
    ],
    'iOS Safari Login Bug Reproduction': [
      "Bug affects iOS Safari versions 16-17",
      "Login button triggers page refresh instead of redirect",
      "Issue occurs with valid credentials",
      "Desktop Safari works correctly",
      "Workaround: use different browser"
    ],
    'AI Assistant Feature Demo': [
      "Natural language query processing",
      "Automated report generation",
      "Intelligent data insights",
      "Feature recommendation engine",
      "Performance optimization suggestions"
    ],
    'New User Onboarding Flow': [
      "Personalized welcome experience",
      "Interactive feature tutorials",
      "Smart profile setup assistance",
      "Guided first project creation",
      "Progress tracking and achievements"
    ]
  };
  
  return keyPoints[sessionName] || [
    "Key feature demonstration",
    "User experience improvements",
    "Technical implementation details",
    "Best practices and recommendations"
  ];
}

function generateTopics(sessionName) {
  const topics = {
    'E-commerce Checkout Demo': ["e-commerce", "checkout", "payment processing", "user experience", "conversion optimization"],
    'API Integration Tutorial - React': ["API integration", "React development", "authentication", "error handling", "best practices"],
    'iOS Safari Login Bug Reproduction': ["bug reporting", "iOS Safari", "login issues", "browser compatibility", "troubleshooting"],
    'AI Assistant Feature Demo': ["artificial intelligence", "natural language processing", "automation", "data analysis", "user assistance"],
    'New User Onboarding Flow': ["user onboarding", "user experience", "tutorial design", "user engagement", "product adoption"]
  };
  
  return topics[sessionName] || ["product demo", "feature showcase", "user guide", "technical documentation"];
}

function generateRecommendations(sessionName) {
  return [
    "Consider adding more pauses between key points for better comprehension",
    "The pacing is good overall, but slow down slightly during technical explanations",
    "Add visual callouts to highlight important UI elements",
    "Include a brief summary at the end to reinforce key takeaways",
    "Consider breaking longer sections into smaller, digestible segments"
  ];
}

// Database setup functions
async function setupDatabase() {
  console.log('📊 Setting up database tables...');
  
  try {
    // Check if we can connect to Supabase
    const { data, error } = await supabaseAdmin.from('users').select('count').limit(1);
    
    if (error && error.code === '42P01') {
      console.log('❌ Database tables not found. Please run the Supabase schema first.');
      console.log('📋 Go to your Supabase dashboard > SQL Editor and run:');
      console.log('   Clueso_Node_layer-main/database/supabase-schema.sql');
      return false;
    }
    
    console.log('✅ Database connection successful');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
}

async function insertDummyData() {
  console.log('📝 Inserting comprehensive dummy data...\n');
  
  try {
    // Generate all dummy data
    const users = generateUsers();
    const projects = generateProjects(users);
    const sessions = generateRecordingSessions(projects, users);
    const files = generateFiles(sessions, users);
    const analyses = generateAIAnalysis(sessions);

    // Hash passwords for users
    for (let user of users) {
      user.password = await bcrypt.hash(user.password, 12);
    }

    // Insert users
    console.log('👥 Inserting users...');
    const { data: insertedUsers, error: usersError } = await supabaseAdmin
      .from('users')
      .upsert(users.map(u => ({
        id: u.id,
        email: u.email,
        full_name: u.full_name,
        username: u.username,
        avatar_url: u.avatar_url
      })), { onConflict: 'email' });
    
    if (usersError) {
      console.log('⚠️  Users insert warning:', usersError.message);
    } else {
      console.log(`✅ Inserted ${users.length} users`);
    }

    // Insert projects
    console.log('📁 Inserting projects...');
    const { data: insertedProjects, error: projectsError } = await supabaseAdmin
      .from('projects')
      .upsert(projects, { onConflict: 'id' });
    
    if (projectsError) {
      console.log('⚠️  Projects insert warning:', projectsError.message);
    } else {
      console.log(`✅ Inserted ${projects.length} projects`);
    }

    // Insert recording sessions
    console.log('🎥 Inserting recording sessions...');
    const { data: insertedSessions, error: sessionsError } = await supabaseAdmin
      .from('recording_sessions')
      .upsert(sessions, { onConflict: 'id' });
    
    if (sessionsError) {
      console.log('⚠️  Sessions insert warning:', sessionsError.message);
    } else {
      console.log(`✅ Inserted ${sessions.length} recording sessions`);
    }

    // Insert files
    console.log('📄 Inserting files...');
    const { data: insertedFiles, error: filesError } = await supabaseAdmin
      .from('files')
      .upsert(files, { onConflict: 'id' });
    
    if (filesError) {
      console.log('⚠️  Files insert warning:', filesError.message);
    } else {
      console.log(`✅ Inserted ${files.length} files`);
    }

    // Insert AI analyses
    console.log('🤖 Inserting AI analyses...');
    const { data: insertedAnalyses, error: analysesError } = await supabaseAdmin
      .from('ai_analysis')
      .upsert(analyses, { onConflict: 'id' });
    
    if (analysesError) {
      console.log('⚠️  AI analyses insert warning:', analysesError.message);
    } else {
      console.log(`✅ Inserted ${analyses.length} AI analyses`);
    }

    console.log('\n🎉 Dummy data insertion completed!');
    
    // Print summary
    console.log('\n📊 Data Summary:');
    console.log(`👥 Users: ${users.length}`);
    console.log(`📁 Projects: ${projects.length}`);
    console.log(`🎥 Recording Sessions: ${sessions.length}`);
    console.log(`📄 Files: ${files.length}`);
    console.log(`🤖 AI Analyses: ${analyses.length}`);
    
    // Print test credentials
    console.log('\n🔑 Test User Credentials:');
    users.forEach(user => {
      console.log(`   📧 ${user.email} / 🔒 password123`);
    });

    return { users, projects, sessions, files, analyses };
    
  } catch (error) {
    console.error('❌ Error inserting dummy data:', error);
    return null;
  }
}

// Main setup function
async function main() {
  const dbReady = await setupDatabase();
  
  if (!dbReady) {
    console.log('\n❌ Setup failed. Please set up the database first.');
    process.exit(1);
  }
  
  const dummyData = await insertDummyData();
  
  if (dummyData) {
    console.log('\n✅ Setup completed successfully!');
    console.log('\n🚀 Next steps:');
    console.log('1. Start the backend: npm run dev');
    console.log('2. Start the frontend: cd ../Clueso_Frontend_layer-main && npm run dev:webpack');
    console.log('3. Visit http://localhost:3001 and login with test credentials');
    console.log('4. Run tests: node test-all-features.js');
  } else {
    console.log('\n❌ Setup failed during data insertion.');
    process.exit(1);
  }
}

// Run setup if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main, insertDummyData };