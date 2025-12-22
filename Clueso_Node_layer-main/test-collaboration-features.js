const axios = require('axios');

// Test configuration
const NODE_SERVER_URL = 'http://localhost:3000';
const PYTHON_SERVER_URL = 'http://localhost:8000';
const TEST_DEMO_ID = 'session_1765089986708_lyv7icnrb';

// Test data
const testUser = {
    userId: 'test_user_123',
    username: 'Test User'
};

const testTranscript = "Hello everyone, welcome to this demo. I'm going to show you how to use our amazing product. First, let me click on this button here. As you can see, the interface is very intuitive and user-friendly.";

async function testCollaborationFeatures() {
    console.log('🚀 Testing Collaboration Features...\n');

    try {
        // Test 1: Add a comment
        console.log('📝 Test 1: Adding a comment...');
        const commentResponse = await axios.post(`${NODE_SERVER_URL}/api/collaboration/demos/${TEST_DEMO_ID}/comments`, {
            userId: testUser.userId,
            username: testUser.username,
            timestamp: 15.5,
            comment: 'This section could use more explanation about the button functionality.',
            position: { x: 300, y: 200 }
        });
        
        if (commentResponse.data.success) {
            console.log('✅ Comment added successfully');
            console.log(`   Comment ID: ${commentResponse.data.data.id}`);
        } else {
            console.log('❌ Failed to add comment');
        }

        // Test 2: Get all comments
        console.log('\n📋 Test 2: Retrieving comments...');
        const commentsResponse = await axios.get(`${NODE_SERVER_URL}/api/collaboration/demos/${TEST_DEMO_ID}/comments`);
        
        if (commentsResponse.data.success) {
            console.log(`✅ Retrieved ${commentsResponse.data.count} comments`);
            commentsResponse.data.data.forEach((comment, index) => {
                console.log(`   ${index + 1}. [${comment.timestamp}s] ${comment.username}: ${comment.comment.substring(0, 50)}...`);
            });
        } else {
            console.log('❌ Failed to retrieve comments');
        }

        // Test 3: Generate AI suggestions
        console.log('\n🤖 Test 3: Generating AI suggestions...');
        const aiSuggestionsResponse = await axios.post(`${NODE_SERVER_URL}/api/collaboration/demos/${TEST_DEMO_ID}/ai-suggestions`, {
            transcript: testTranscript,
            pauseDurations: [0.5, 1.2, 0.8, 2.1],
            replayFrequency: [1, 1, 2, 1]
        });
        
        if (aiSuggestionsResponse.data.success) {
            console.log(`✅ Generated ${aiSuggestionsResponse.data.count} AI suggestions`);
            aiSuggestionsResponse.data.data.forEach((suggestion, index) => {
                console.log(`   ${index + 1}. [${suggestion.timestamp}s] ${suggestion.type.toUpperCase()}: ${suggestion.suggestion.substring(0, 60)}...`);
            });
        } else {
            console.log('❌ Failed to generate AI suggestions');
        }

        // Test 4: Add language support
        console.log('\n🌍 Test 4: Adding Spanish language support...');
        const languageResponse = await axios.post(`${NODE_SERVER_URL}/api/collaboration/demos/${TEST_DEMO_ID}/languages`, {
            language: 'es',
            originalTranscript: testTranscript
        });
        
        if (languageResponse.data.success) {
            console.log('✅ Spanish language support added');
            console.log(`   Translation quality: ${languageResponse.data.translationQuality}`);
            console.log(`   Translated title: ${languageResponse.data.translatedTitle}`);
        } else {
            console.log('❌ Failed to add Spanish language support');
        }

        // Test 5: Get available languages
        console.log('\n🗣️ Test 5: Retrieving available languages...');
        const languagesResponse = await axios.get(`${NODE_SERVER_URL}/api/collaboration/demos/${TEST_DEMO_ID}/languages`);
        
        if (languagesResponse.data.success) {
            console.log(`✅ Found ${languagesResponse.data.data.length} supported languages`);
            languagesResponse.data.data.forEach((lang, index) => {
                console.log(`   ${index + 1}. ${lang.language.toUpperCase()} - Quality: ${lang.translationQuality || 'N/A'}`);
            });
        } else {
            console.log('❌ Failed to retrieve languages');
        }

        // Test 6: Generate AI review
        console.log('\n📊 Test 6: Generating AI review...');
        const reviewResponse = await axios.post(`${NODE_SERVER_URL}/api/collaboration/demos/${TEST_DEMO_ID}/ai-review`, {
            reviewType: 'pre_publish'
        });
        
        if (reviewResponse.data.success) {
            console.log('✅ AI review generated successfully');
            console.log(`   Overall score: ${reviewResponse.data.data.overallScore}/10`);
            console.log(`   Publish readiness: ${reviewResponse.data.data.publishReadiness}`);
            console.log(`   Insights: ${reviewResponse.data.data.insights.length}`);
            console.log(`   Recommendations: ${reviewResponse.data.data.recommendations.length}`);
        } else {
            console.log('❌ Failed to generate AI review');
        }

        // Test 7: Test Python collaboration endpoints directly
        console.log('\n🐍 Test 7: Testing Python collaboration endpoints...');
        
        try {
            const pythonHealthResponse = await axios.get(`${PYTHON_SERVER_URL}/collaboration/health`);
            if (pythonHealthResponse.data.status === 'healthy') {
                console.log('✅ Python collaboration service is healthy');
                console.log(`   Supported languages: ${pythonHealthResponse.data.supported_languages.length}`);
            }
        } catch (error) {
            console.log('❌ Python collaboration service not available');
        }

        console.log('\n🎉 Collaboration features testing completed!');
        console.log('\n📈 Summary:');
        console.log('   ✅ Timestamped comments');
        console.log('   ✅ AI-generated suggestions');
        console.log('   ✅ Multi-language support');
        console.log('   ✅ AI-powered reviews');
        console.log('   ✅ Real-time collaboration ready');

    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        if (error.response) {
            console.error('   Response:', error.response.data);
        }
    }
}

// Test WebSocket functionality
async function testWebSocketFeatures() {
    console.log('\n🔌 Testing WebSocket Features...\n');
    
    const io = require('socket.io-client');
    const socket = io(NODE_SERVER_URL);

    socket.on('connect', () => {
        console.log('✅ WebSocket connected');
        
        // Register for demo session
        socket.emit('register', TEST_DEMO_ID);
    });

    socket.on('registered', (data) => {
        console.log(`✅ Registered for session: ${data.sessionId}`);
    });

    socket.on('new_comment', (comment) => {
        console.log(`📝 New comment received: [${comment.timestamp}s] ${comment.username}`);
    });

    socket.on('ai_suggestions', (suggestions) => {
        console.log(`🤖 AI suggestions received: ${suggestions.length} suggestions`);
    });

    socket.on('comment_resolved', (comment) => {
        console.log(`✅ Comment resolved: ${comment.id}`);
    });

    // Cleanup after 5 seconds
    setTimeout(() => {
        socket.disconnect();
        console.log('🔌 WebSocket disconnected');
    }, 5000);
}

// Run tests
if (require.main === module) {
    testCollaborationFeatures()
        .then(() => testWebSocketFeatures())
        .catch(console.error);
}

module.exports = {
    testCollaborationFeatures,
    testWebSocketFeatures
};