const { supabaseAdmin } = require('./src/config/supabase');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

/**
 * Comprehensive Demo Data Setup for Clueso Screencast
 * 
 * Creates realistic dummy data for:
 * - Users and authentication
 * - Projects and recordings
 * - Collaboration features (comments, languages, AI suggestions)
 * - Translation data for 12+ languages
 * - Audio transcriptions and video files
 * - Real-time collaboration scenarios
 */

class DemoDataSetup {
    constructor() {
        this.users = [];
        this.projects = [];
        this.recordings = [];
        this.demoSessions = [];
    }

    async setupAll() {
        console.log('🎬 Setting up comprehensive demo data for Clueso screencast...\n');

        try {
            // 1. Setup users
            await this.setupUsers();
            
            // 2. Setup projects
            await this.setupProjects();
            
            // 3. Setup demo sessions with recordings
            await this.setupDemoSessions();
            
            // 4. Setup collaboration data
            await this.setupCollaborationData();
            
            // 5. Setup translation data
            await this.setupTranslationData();
            
            // 6. Setup AI suggestions and reviews
            await this.setupAIData();
            
            // 7. Create mock files
            await this.createMockFiles();

            console.log('\n🎉 Demo data setup completed successfully!');
            console.log('\n📋 Demo Scenario Summary:');
            console.log(`   👥 Users: ${this.users.length}`);
            console.log(`   📁 Projects: ${this.projects.length}`);
            console.log(`   🎥 Demo Sessions: ${this.demoSessions.length}`);
            console.log(`   🌍 Languages: 12+ supported`);
            console.log(`   💬 Comments: Multiple per demo`);
            console.log(`   🤖 AI Features: Suggestions & Reviews`);
            
            this.printDemoCredentials();

        } catch (error) {
            console.error('❌ Error setting up demo data:', error);
            throw error;
        }
    }

    async setupUsers() {
        console.log('👥 Setting up demo users...');

        const demoUsers = [
            {
                email: 'demo@clueso.com',
                password: 'demo123',
                fullName: 'Demo User',
                username: 'demo_user',
                role: 'admin'
            },
            {
                email: 'sarah.product@company.com',
                password: 'sarah123',
                fullName: 'Sarah Johnson',
                username: 'sarah_pm',
                role: 'user'
            },
            {
                email: 'mike.dev@company.com',
                password: 'mike123',
                fullName: 'Mike Chen',
                username: 'mike_dev',
                role: 'user'
            },
            {
                email: 'anna.design@company.com',
                password: 'anna123',
                fullName: 'Anna Rodriguez',
                username: 'anna_ux',
                role: 'user'
            },
            {
                email: 'john.marketing@company.com',
                password: 'john123',
                fullName: 'John Smith',
                username: 'john_marketing',
                role: 'user'
            }
        ];

        for (const userData of demoUsers) {
            try {
                const hashedPassword = await bcrypt.hash(userData.password, 12);
                const userId = uuidv4();

                const { data: user, error } = await supabaseAdmin
                    .from('users')
                    .insert({
                        id: userId,
                        email: userData.email,
                        password: hashedPassword,
                        full_name: userData.fullName,
                        username: userData.username,
                        avatar_url: `https://api.dicebear.com/7.x/initials/svg?seed=${userData.fullName}`,
                        role: userData.role,
                        is_active: true,
                        email_verified: true,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    })
                    .select()
                    .single();

                if (error) {
                    console.log(`   ⚠️  User ${userData.email} might already exist, skipping...`);
                } else {
                    this.users.push({ ...user, originalPassword: userData.password });
                    console.log(`   ✅ Created user: ${userData.fullName} (${userData.email})`);
                }
            } catch (error) {
                console.log(`   ⚠️  Error creating user ${userData.email}:`, error.message);
            }
        }
    }

    async setupProjects() {
        console.log('\n📁 Setting up demo projects...');

        const projectTemplates = [
            {
                name: 'Product Demo - Mobile App',
                description: 'Comprehensive demo of our new mobile application features including user onboarding, core functionality, and advanced features.',
                category: 'product_demo'
            },
            {
                name: 'API Documentation Tutorial',
                description: 'Step-by-step tutorial showing developers how to integrate with our REST API, including authentication, endpoints, and best practices.',
                category: 'tutorial'
            },
            {
                name: 'Customer Onboarding Flow',
                description: 'Complete walkthrough of the customer onboarding process, from signup to first successful use of the platform.',
                category: 'onboarding'
            },
            {
                name: 'Feature Release - Dashboard 2.0',
                description: 'Showcase of the new dashboard features including analytics, customization options, and improved user experience.',
                category: 'feature_release'
            },
            {
                name: 'Sales Demo - Enterprise Features',
                description: 'Professional sales demonstration highlighting enterprise-level features, security, and scalability options.',
                category: 'sales_demo'
            }
        ];

        for (let i = 0; i < projectTemplates.length; i++) {
            const template = projectTemplates[i];
            const owner = this.users[i % this.users.length];

            if (!owner) continue;

            try {
                const projectId = uuidv4();
                const createdAt = new Date(Date.now() - (i * 24 * 60 * 60 * 1000)); // Stagger creation dates

                const { data: project, error } = await supabaseAdmin
                    .from('projects')
                    .insert({
                        id: projectId,
                        name: template.name,
                        description: template.description,
                        owner_id: owner.id,
                        status: 'active',
                        visibility: 'team',
                        settings: {
                            category: template.category,
                            tags: ['demo', 'screencast', template.category],
                            recording_quality: 'high',
                            auto_transcription: true,
                            collaboration_enabled: true
                        },
                        created_at: createdAt.toISOString(),
                        updated_at: new Date().toISOString()
                    })
                    .select()
                    .single();

                if (error) {
                    console.log(`   ⚠️  Error creating project: ${error.message}`);
                } else {
                    this.projects.push(project);
                    console.log(`   ✅ Created project: ${template.name}`);
                }
            } catch (error) {
                console.log(`   ⚠️  Error creating project ${template.name}:`, error.message);
            }
        }
    }

    async setupDemoSessions() {
        console.log('\n🎥 Setting up demo sessions with recordings...');

        const sessionTemplates = [
            {
                title: 'Mobile App Navigation Demo',
                transcript: 'Welcome to our mobile application. Let me show you how to navigate through the main features. First, we\'ll start with the dashboard where you can see all your recent activities. Notice the clean, intuitive design that makes it easy to find what you need. Now, let\'s explore the menu options. Here you can access your profile, settings, and various tools. The search functionality is particularly powerful - you can find any content quickly using natural language queries.',
                duration: 180,
                type: 'product_demo'
            },
            {
                title: 'API Integration Tutorial',
                transcript: 'In this tutorial, I\'ll walk you through integrating with our REST API. First, you\'ll need to obtain your API key from the developer dashboard. Once you have your credentials, you can start making requests to our endpoints. Let me show you a simple example using curl. Here\'s how to authenticate and make your first API call. Notice how we return structured JSON responses with clear error messages when something goes wrong.',
                duration: 240,
                type: 'tutorial'
            },
            {
                title: 'Customer Onboarding Walkthrough',
                transcript: 'Let\'s go through the complete customer onboarding experience. When new users first sign up, they\'re greeted with this welcome screen. The onboarding process is designed to be quick and engaging. We collect only essential information initially, then gradually introduce more advanced features. Notice how we use progressive disclosure to avoid overwhelming new users. Each step includes helpful tips and examples.',
                duration: 200,
                type: 'onboarding'
            },
            {
                title: 'Dashboard 2.0 Feature Showcase',
                transcript: 'I\'m excited to show you our new Dashboard 2.0 features. The redesigned interface offers much better customization options. Users can now drag and drop widgets to create their perfect workspace. The new analytics section provides deeper insights with interactive charts and real-time data. We\'ve also improved the performance significantly - everything loads much faster now.',
                duration: 160,
                type: 'feature_demo'
            },
            {
                title: 'Enterprise Security Overview',
                transcript: 'For our enterprise customers, security is paramount. Let me demonstrate our comprehensive security features. We offer single sign-on integration with all major identity providers. All data is encrypted both in transit and at rest using industry-standard protocols. Our audit logging captures every action for compliance purposes. The role-based access control system allows fine-grained permissions management.',
                duration: 220,
                type: 'enterprise_demo'
            }
        ];

        for (let i = 0; i < sessionTemplates.length; i++) {
            const template = sessionTemplates[i];
            const project = this.projects[i % this.projects.length];

            if (!project) continue;

            try {
                const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                const createdAt = new Date(Date.now() - (i * 12 * 60 * 60 * 1000)); // Stagger by 12 hours

                const sessionData = {
                    sessionId,
                    projectId: project.id,
                    title: template.title,
                    transcript: template.transcript,
                    duration: template.duration,
                    type: template.type,
                    status: 'completed',
                    metadata: {
                        recordingQuality: 'high',
                        hasVideo: true,
                        hasAudio: true,
                        hasTranscript: true,
                        speakerCount: 1,
                        language: 'en',
                        confidence: 0.92 + (Math.random() * 0.08), // 0.92-1.0
                        keyPhrases: this.generateKeyPhrases(template.transcript),
                        createdAt: createdAt.toISOString()
                    }
                };

                this.demoSessions.push(sessionData);
                console.log(`   ✅ Created session: ${template.title} (${sessionId})`);

            } catch (error) {
                console.log(`   ⚠️  Error creating session ${template.title}:`, error.message);
            }
        }
    }

    async setupCollaborationData() {
        console.log('\n💬 Setting up collaboration data (comments, discussions)...');

        const commentTemplates = [
            {
                text: 'Great demo! The navigation flow is very intuitive. I especially like how the search functionality works.',
                timestamp: 45,
                type: 'positive'
            },
            {
                text: 'Could we add a tooltip here to explain what this button does? New users might find it confusing.',
                timestamp: 78,
                type: 'suggestion'
            },
            {
                text: 'The loading time seems a bit slow in this section. Can we optimize this?',
                timestamp: 120,
                type: 'issue'
            },
            {
                text: 'This is perfect for our sales presentations. The visual quality is excellent.',
                timestamp: 156,
                type: 'positive'
            },
            {
                text: 'We should mention the keyboard shortcuts available here.',
                timestamp: 89,
                type: 'enhancement'
            }
        ];

        for (const session of this.demoSessions) {
            try {
                // Add 2-4 comments per session
                const commentCount = 2 + Math.floor(Math.random() * 3);
                
                for (let i = 0; i < commentCount; i++) {
                    const template = commentTemplates[i % commentTemplates.length];
                    const commenter = this.users[Math.floor(Math.random() * this.users.length)];
                    
                    if (!commenter) continue;

                    const commentId = uuidv4();
                    const timestamp = Math.floor(Math.random() * session.duration);

                    const { error } = await supabaseAdmin
                        .from('demo_comments')
                        .insert({
                            id: commentId,
                            demo_id: session.sessionId,
                            user_id: commenter.id,
                            comment: template.text,
                            timestamp: timestamp,
                            ai_generated: false,
                            resolved: Math.random() > 0.7, // 30% chance of being resolved
                            metadata: {
                                type: template.type,
                                priority: Math.random() > 0.5 ? 'medium' : 'low'
                            },
                            created_at: new Date().toISOString(),
                            updated_at: new Date().toISOString()
                        });

                    if (!error) {
                        console.log(`   ✅ Added comment to ${session.title}`);
                    }
                }
            } catch (error) {
                console.log(`   ⚠️  Error adding comments to ${session.title}:`, error.message);
            }
        }
    }

    async setupTranslationData() {
        console.log('\n🌍 Setting up multi-language translation data...');

        const supportedLanguages = [
            { code: 'es', name: 'Spanish' },
            { code: 'fr', name: 'French' },
            { code: 'de', name: 'German' },
            { code: 'it', name: 'Italian' },
            { code: 'pt', name: 'Portuguese' },
            { code: 'ja', name: 'Japanese' },
            { code: 'ko', name: 'Korean' },
            { code: 'zh', name: 'Chinese' }
        ];

        const translationSamples = {
            'es': {
                'Mobile App Navigation Demo': 'Demostración de Navegación de Aplicación Móvil',
                'Welcome to our mobile application': 'Bienvenido a nuestra aplicación móvil'
            },
            'fr': {
                'Mobile App Navigation Demo': 'Démonstration de Navigation d\'Application Mobile',
                'Welcome to our mobile application': 'Bienvenue dans notre application mobile'
            },
            'de': {
                'Mobile App Navigation Demo': 'Mobile App Navigation Demo',
                'Welcome to our mobile application': 'Willkommen in unserer mobilen Anwendung'
            },
            'ja': {
                'Mobile App Navigation Demo': 'モバイルアプリナビゲーションデモ',
                'Welcome to our mobile application': '私たちのモバイルアプリケーションへようこそ'
            }
        };

        for (const session of this.demoSessions.slice(0, 3)) { // Add translations for first 3 sessions
            try {
                // Add 3-4 languages per session
                const languagesToAdd = supportedLanguages.slice(0, 3 + Math.floor(Math.random() * 2));
                
                for (const lang of languagesToAdd) {
                    const translatedTitle = translationSamples[lang.code]?.[session.title] || `${session.title} (${lang.name})`;
                    const translatedText = translationSamples[lang.code]?.['Welcome to our mobile application'] || 
                                         `[${lang.name} translation of: ${session.transcript.substring(0, 100)}...]`;

                    const subtitles = this.generateSubtitles(translatedText, session.duration);

                    const { error } = await supabaseAdmin
                        .from('demo_languages')
                        .insert({
                            id: uuidv4(),
                            demo_id: session.sessionId,
                            language: lang.code,
                            subtitles: subtitles,
                            translated_title: translatedTitle,
                            translated_summary: translatedText,
                            cta_text: {
                                watchDemo: lang.code === 'es' ? 'Ver Demo' : 
                                          lang.code === 'fr' ? 'Voir la Démo' :
                                          lang.code === 'de' ? 'Demo Ansehen' :
                                          lang.code === 'ja' ? 'デモを見る' : 'Watch Demo',
                                learnMore: lang.code === 'es' ? 'Aprender Más' :
                                          lang.code === 'fr' ? 'En Savoir Plus' :
                                          lang.code === 'de' ? 'Mehr Erfahren' :
                                          lang.code === 'ja' ? 'もっと詳しく' : 'Learn More'
                            },
                            translation_quality: 0.85 + (Math.random() * 0.15), // 0.85-1.0
                            is_default: false,
                            created_at: new Date().toISOString(),
                            updated_at: new Date().toISOString()
                        });

                    if (!error) {
                        console.log(`   ✅ Added ${lang.name} translation for ${session.title}`);
                    }
                }
            } catch (error) {
                console.log(`   ⚠️  Error adding translations for ${session.title}:`, error.message);
            }
        }
    }

    async setupAIData() {
        console.log('\n🤖 Setting up AI suggestions and reviews...');

        const aiSuggestionTemplates = [
            {
                type: 'improvement',
                title: 'Add Loading Indicators',
                description: 'Consider adding loading indicators during transitions to improve user experience and set expectations.',
                priority: 'medium'
            },
            {
                type: 'accessibility',
                title: 'Improve Color Contrast',
                description: 'Some text elements may not meet WCAG accessibility standards. Consider increasing color contrast.',
                priority: 'high'
            },
            {
                type: 'optimization',
                title: 'Reduce Animation Duration',
                description: 'The current animations might be too slow for power users. Consider reducing duration or adding skip options.',
                priority: 'low'
            },
            {
                type: 'enhancement',
                title: 'Add Keyboard Navigation',
                description: 'Enable keyboard navigation for better accessibility and power user efficiency.',
                priority: 'medium'
            }
        ];

        for (const session of this.demoSessions) {
            try {
                // Add 2-3 AI suggestions per session
                const suggestionCount = 2 + Math.floor(Math.random() * 2);
                
                for (let i = 0; i < suggestionCount; i++) {
                    const template = aiSuggestionTemplates[i % aiSuggestionTemplates.length];
                    const timestamp = Math.floor(Math.random() * session.duration);

                    const { error } = await supabaseAdmin
                        .from('demo_comments')
                        .insert({
                            id: uuidv4(),
                            demo_id: session.sessionId,
                            user_id: null, // AI-generated
                            comment: template.description,
                            timestamp: timestamp,
                            ai_generated: true,
                            resolved: false,
                            metadata: {
                                type: template.type,
                                title: template.title,
                                priority: template.priority,
                                confidence: 0.8 + (Math.random() * 0.2)
                            },
                            created_at: new Date().toISOString(),
                            updated_at: new Date().toISOString()
                        });

                    if (!error) {
                        console.log(`   ✅ Added AI suggestion to ${session.title}`);
                    }
                }

                // Add AI review
                const reviewScore = 7.5 + (Math.random() * 2); // 7.5-9.5
                const insights = [
                    'Overall presentation flow is excellent and engaging',
                    'Visual quality meets professional standards',
                    'Audio clarity is good throughout the recording',
                    'Content structure follows best practices for demos',
                    'Pacing allows viewers to follow along easily'
                ];

                // Store AI review data (you might need to create this table)
                console.log(`   ✅ Generated AI review for ${session.title} (Score: ${reviewScore.toFixed(1)}/10)`);

            } catch (error) {
                console.log(`   ⚠️  Error adding AI data for ${session.title}:`, error.message);
            }
        }
    }

    async createMockFiles() {
        console.log('\n📁 Creating mock recording files...');

        const recordingsDir = path.join(__dirname, 'recordings');
        if (!fs.existsSync(recordingsDir)) {
            fs.mkdirSync(recordingsDir, { recursive: true });
        }

        for (const session of this.demoSessions) {
            try {
                // Create mock video file
                const videoPath = path.join(recordingsDir, `recording_${session.sessionId}_video.webm`);
                const mockVideoContent = `Mock video content for ${session.title}\nSession ID: ${session.sessionId}\nDuration: ${session.duration}s`;
                fs.writeFileSync(videoPath, mockVideoContent);

                // Create mock audio file
                const audioPath = path.join(recordingsDir, `recording_${session.sessionId}_audio.webm`);
                const mockAudioContent = `Mock audio content for ${session.title}\nTranscript: ${session.transcript.substring(0, 100)}...`;
                fs.writeFileSync(audioPath, mockAudioContent);

                // Create session metadata file
                const metadataPath = path.join(recordingsDir, `recording_${session.sessionId}_metadata.json`);
                const metadata = {
                    sessionId: session.sessionId,
                    title: session.title,
                    transcript: session.transcript,
                    duration: session.duration,
                    events: this.generateMockEvents(session.duration),
                    transcription: {
                        text: session.transcript,
                        confidence: session.metadata.confidence,
                        language: 'en',
                        speakers: 1
                    },
                    createdAt: session.metadata.createdAt
                };
                fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));

                console.log(`   ✅ Created mock files for ${session.title}`);

            } catch (error) {
                console.log(`   ⚠️  Error creating files for ${session.title}:`, error.message);
            }
        }
    }

    generateKeyPhrases(transcript) {
        const words = transcript.toLowerCase().split(/\s+/);
        const phrases = [];
        
        // Simple key phrase extraction
        for (let i = 0; i < words.length - 1; i++) {
            if (words[i].length > 4 && words[i + 1].length > 4) {
                phrases.push(`${words[i]} ${words[i + 1]}`);
            }
        }
        
        return phrases.slice(0, 5); // Return top 5 phrases
    }

    generateSubtitles(text, duration) {
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
        const subtitles = [];
        const avgDuration = duration / sentences.length;

        sentences.forEach((sentence, index) => {
            const start = index * avgDuration;
            const end = Math.min((index + 1) * avgDuration, duration);
            
            subtitles.push({
                start: Math.round(start * 1000) / 1000,
                end: Math.round(end * 1000) / 1000,
                text: sentence.trim()
            });
        });

        return subtitles;
    }

    generateMockEvents(duration) {
        const events = [];
        const eventTypes = ['click', 'scroll', 'hover', 'type', 'navigate'];
        const eventCount = Math.floor(duration / 10); // One event every 10 seconds on average

        for (let i = 0; i < eventCount; i++) {
            const timestamp = (i * duration) / eventCount + Math.random() * (duration / eventCount);
            const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
            
            events.push({
                timestamp: Math.round(timestamp * 1000) / 1000,
                type: eventType,
                target: `#element-${Math.floor(Math.random() * 10)}`,
                data: { x: Math.floor(Math.random() * 1920), y: Math.floor(Math.random() * 1080) }
            });
        }

        return events;
    }

    printDemoCredentials() {
        console.log('\n🔑 Demo User Credentials:');
        console.log('=' .repeat(50));
        
        this.users.forEach(user => {
            console.log(`📧 ${user.email}`);
            console.log(`🔒 ${user.originalPassword}`);
            console.log(`👤 ${user.full_name} (${user.role})`);
            console.log('-'.repeat(30));
        });

        console.log('\n🎬 Demo Sessions Created:');
        console.log('=' .repeat(50));
        
        this.demoSessions.forEach((session, index) => {
            console.log(`${index + 1}. ${session.title}`);
            console.log(`   📝 ${session.transcript.substring(0, 80)}...`);
            console.log(`   ⏱️  Duration: ${session.duration}s`);
            console.log(`   🆔 Session ID: ${session.sessionId}`);
            console.log('-'.repeat(30));
        });

        console.log('\n🌟 Ready for Screencast Demo!');
        console.log('You can now demonstrate:');
        console.log('• User registration and login');
        console.log('• Project creation and management');
        console.log('• Video recording and playback');
        console.log('• Real-time collaboration features');
        console.log('• Multi-language translation (12+ languages)');
        console.log('• AI-powered suggestions and reviews');
        console.log('• Comment system and discussions');
        console.log('• Dashboard and analytics');
    }
}

// Run the setup
async function main() {
    const setup = new DemoDataSetup();
    await setup.setupAll();
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = DemoDataSetup;