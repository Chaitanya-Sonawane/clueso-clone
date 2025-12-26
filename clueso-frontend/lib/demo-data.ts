/**
 * Demo Data Service for Clueso Frontend
 * 
 * Provides realistic dummy data for screencast demonstrations
 * including projects, recordings, collaboration features, and translations
 */

export interface DemoUser {
  id: string;
  email: string;
  fullName: string;
  username: string;
  avatarUrl: string;
  role: 'admin' | 'user';
}

export interface DemoProject {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  status: 'active' | 'archived' | 'draft';
  visibility: 'private' | 'team' | 'public';
  category: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  recordingCount: number;
  collaboratorCount: number;
  lastActivity: string;
}

export interface DemoRecording {
  sessionId: string;
  projectId: string;
  title: string;
  description: string;
  duration: number;
  status: 'completed' | 'processing' | 'failed';
  thumbnailUrl: string;
  videoUrl: string;
  audioUrl: string;
  transcript: string;
  confidence: number;
  language: string;
  speakerCount: number;
  keyPhrases: string[];
  createdAt: string;
  metadata: {
    recordingQuality: 'high' | 'medium' | 'low';
    hasVideo: boolean;
    hasAudio: boolean;
    hasTranscript: boolean;
    fileSize: number;
  };
}

export interface DemoComment {
  id: string;
  demoId: string;
  userId: string | null;
  userInfo?: DemoUser;
  comment: string;
  timestamp: number;
  aiGenerated: boolean;
  resolved: boolean;
  type: 'positive' | 'suggestion' | 'issue' | 'enhancement';
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
}

export interface DemoLanguage {
  demoId: string;
  language: string;
  languageInfo: {
    name: string;
    nativeName: string;
    flag: string;
    rtl: boolean;
  };
  subtitles: Array<{
    start: number;
    end: number;
    text: string;
  }>;
  translatedTitle: string;
  translatedSummary: string;
  ctaText: {
    watchDemo: string;
    learnMore: string;
  };
  translationQuality: number;
  isDefault: boolean;
}

export interface DemoAISuggestion {
  id: string;
  demoId: string;
  type: 'improvement' | 'optimization' | 'accessibility' | 'enhancement';
  title: string;
  description: string;
  timestamp?: number;
  priority: 'low' | 'medium' | 'high';
  implemented: boolean;
  confidence: number;
  createdAt: string;
}

export interface DemoAIReview {
  demoId: string;
  overallScore: number;
  insights: string[];
  suggestions: DemoAISuggestion[];
  status: 'pending' | 'completed' | 'failed';
  createdAt: string;
  metadata: {
    analysisTime: number;
    model: string;
    version: string;
  };
}

class DemoDataService {
  private users: DemoUser[] = [
    {
      id: 'user-1',
      email: 'demo@clueso.com',
      fullName: 'Demo User',
      username: 'demo_user',
      avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=Demo User',
      role: 'admin'
    },
    {
      id: 'user-2',
      email: 'sarah.product@company.com',
      fullName: 'Sarah Johnson',
      username: 'sarah_pm',
      avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=Sarah Johnson',
      role: 'user'
    },
    {
      id: 'user-3',
      email: 'mike.dev@company.com',
      fullName: 'Mike Chen',
      username: 'mike_dev',
      avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=Mike Chen',
      role: 'user'
    },
    {
      id: 'user-4',
      email: 'anna.design@company.com',
      fullName: 'Anna Rodriguez',
      username: 'anna_ux',
      avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=Anna Rodriguez',
      role: 'user'
    }
  ];

  private projects: DemoProject[] = [
    {
      id: 'project-1',
      name: 'Product Demo - Mobile App',
      description: 'Comprehensive demo of our new mobile application features including user onboarding, core functionality, and advanced features.',
      ownerId: 'user-1',
      status: 'active',
      visibility: 'team',
      category: 'product_demo',
      tags: ['mobile', 'demo', 'onboarding'],
      createdAt: '2024-12-20T10:00:00Z',
      updatedAt: '2024-12-26T15:30:00Z',
      recordingCount: 3,
      collaboratorCount: 4,
      lastActivity: '2024-12-26T14:20:00Z'
    },
    {
      id: 'project-2',
      name: 'API Documentation Tutorial',
      description: 'Step-by-step tutorial showing developers how to integrate with our REST API, including authentication, endpoints, and best practices.',
      ownerId: 'user-2',
      status: 'active',
      visibility: 'public',
      category: 'tutorial',
      tags: ['api', 'documentation', 'developer'],
      createdAt: '2024-12-19T14:30:00Z',
      updatedAt: '2024-12-26T12:15:00Z',
      recordingCount: 2,
      collaboratorCount: 2,
      lastActivity: '2024-12-26T11:45:00Z'
    },
    {
      id: 'project-3',
      name: 'Customer Onboarding Flow',
      description: 'Complete walkthrough of the customer onboarding process, from signup to first successful use of the platform.',
      ownerId: 'user-3',
      status: 'active',
      visibility: 'team',
      category: 'onboarding',
      tags: ['onboarding', 'customer', 'flow'],
      createdAt: '2024-12-18T09:15:00Z',
      updatedAt: '2024-12-25T16:45:00Z',
      recordingCount: 4,
      collaboratorCount: 3,
      lastActivity: '2024-12-25T16:30:00Z'
    },
    {
      id: 'project-4',
      name: 'Feature Release - Dashboard 2.0',
      description: 'Showcase of the new dashboard features including analytics, customization options, and improved user experience.',
      ownerId: 'user-4',
      status: 'active',
      visibility: 'team',
      category: 'feature_release',
      tags: ['dashboard', 'analytics', 'ui'],
      createdAt: '2024-12-17T11:20:00Z',
      updatedAt: '2024-12-24T13:10:00Z',
      recordingCount: 2,
      collaboratorCount: 5,
      lastActivity: '2024-12-24T12:55:00Z'
    }
  ];

  private recordings: DemoRecording[] = [
    {
      sessionId: 'session_1766659357717_demo1',
      projectId: 'project-1',
      title: 'Mobile App Navigation Demo',
      description: 'Walkthrough of the main navigation features and user interface',
      duration: 180,
      status: 'completed',
      thumbnailUrl: '/api/recordings/session_1766659357717_demo1/thumbnail.jpg',
      videoUrl: '/api/recordings/session_1766659357717_demo1/video.webm',
      audioUrl: '/api/recordings/session_1766659357717_demo1/audio.webm',
      transcript: 'Welcome to our mobile application. Let me show you how to navigate through the main features. First, we\'ll start with the dashboard where you can see all your recent activities. Notice the clean, intuitive design that makes it easy to find what you need. Now, let\'s explore the menu options.',
      confidence: 0.94,
      language: 'en',
      speakerCount: 1,
      keyPhrases: ['mobile application', 'main features', 'dashboard', 'recent activities', 'menu options'],
      createdAt: '2024-12-26T10:30:00Z',
      metadata: {
        recordingQuality: 'high',
        hasVideo: true,
        hasAudio: true,
        hasTranscript: true,
        fileSize: 25600000 // 25.6 MB
      }
    },
    {
      sessionId: 'session_1766659357718_demo2',
      projectId: 'project-2',
      title: 'API Authentication Setup',
      description: 'How to set up API authentication and make your first request',
      duration: 240,
      status: 'completed',
      thumbnailUrl: '/api/recordings/session_1766659357718_demo2/thumbnail.jpg',
      videoUrl: '/api/recordings/session_1766659357718_demo2/video.webm',
      audioUrl: '/api/recordings/session_1766659357718_demo2/audio.webm',
      transcript: 'In this tutorial, I\'ll walk you through integrating with our REST API. First, you\'ll need to obtain your API key from the developer dashboard. Once you have your credentials, you can start making requests to our endpoints.',
      confidence: 0.91,
      language: 'en',
      speakerCount: 1,
      keyPhrases: ['REST API', 'API key', 'developer dashboard', 'credentials', 'endpoints'],
      createdAt: '2024-12-26T09:15:00Z',
      metadata: {
        recordingQuality: 'high',
        hasVideo: true,
        hasAudio: true,
        hasTranscript: true,
        fileSize: 32100000 // 32.1 MB
      }
    },
    {
      sessionId: 'session_1766659357719_demo3',
      projectId: 'project-3',
      title: 'User Onboarding Experience',
      description: 'Complete new user onboarding flow from signup to first use',
      duration: 200,
      status: 'completed',
      thumbnailUrl: '/api/recordings/session_1766659357719_demo3/thumbnail.jpg',
      videoUrl: '/api/recordings/session_1766659357719_demo3/video.webm',
      audioUrl: '/api/recordings/session_1766659357719_demo3/audio.webm',
      transcript: 'Let\'s go through the complete customer onboarding experience. When new users first sign up, they\'re greeted with this welcome screen. The onboarding process is designed to be quick and engaging.',
      confidence: 0.89,
      language: 'en',
      speakerCount: 1,
      keyPhrases: ['customer onboarding', 'new users', 'welcome screen', 'onboarding process', 'quick and engaging'],
      createdAt: '2024-12-25T16:45:00Z',
      metadata: {
        recordingQuality: 'high',
        hasVideo: true,
        hasAudio: true,
        hasTranscript: true,
        fileSize: 28900000 // 28.9 MB
      }
    }
  ];

  private comments: DemoComment[] = [
    {
      id: 'comment-1',
      demoId: 'session_1766659357717_demo1',
      userId: 'user-2',
      comment: 'Great demo! The navigation flow is very intuitive. I especially like how the search functionality works.',
      timestamp: 45,
      aiGenerated: false,
      resolved: false,
      type: 'positive',
      priority: 'low',
      createdAt: '2024-12-26T11:00:00Z'
    },
    {
      id: 'comment-2',
      demoId: 'session_1766659357717_demo1',
      userId: 'user-3',
      comment: 'Could we add a tooltip here to explain what this button does? New users might find it confusing.',
      timestamp: 78,
      aiGenerated: false,
      resolved: false,
      type: 'suggestion',
      priority: 'medium',
      createdAt: '2024-12-26T11:15:00Z'
    },
    {
      id: 'comment-3',
      demoId: 'session_1766659357717_demo1',
      userId: null,
      comment: 'Consider adding loading indicators during transitions to improve user experience and set expectations.',
      timestamp: 120,
      aiGenerated: true,
      resolved: false,
      type: 'enhancement',
      priority: 'medium',
      createdAt: '2024-12-26T11:30:00Z'
    },
    {
      id: 'comment-4',
      demoId: 'session_1766659357718_demo2',
      userId: 'user-4',
      comment: 'The API documentation is clear and well-structured. This will help developers get started quickly.',
      timestamp: 156,
      aiGenerated: false,
      resolved: false,
      type: 'positive',
      priority: 'low',
      createdAt: '2024-12-26T10:30:00Z'
    }
  ];

  private languages: DemoLanguage[] = [
    {
      demoId: 'session_1766659357717_demo1',
      language: 'es',
      languageInfo: {
        name: 'Spanish',
        nativeName: 'Español',
        flag: '🇪🇸',
        rtl: false
      },
      subtitles: [
        { start: 0, end: 5, text: 'Bienvenido a nuestra aplicación móvil.' },
        { start: 5, end: 12, text: 'Permíteme mostrarte cómo navegar por las características principales.' },
        { start: 12, end: 20, text: 'Primero, comenzaremos con el panel donde puedes ver todas tus actividades recientes.' }
      ],
      translatedTitle: 'Demostración de Navegación de Aplicación Móvil',
      translatedSummary: 'Bienvenido a nuestra aplicación móvil. Permíteme mostrarte cómo navegar por las características principales.',
      ctaText: {
        watchDemo: 'Ver Demo',
        learnMore: 'Aprender Más'
      },
      translationQuality: 0.92,
      isDefault: false
    },
    {
      demoId: 'session_1766659357717_demo1',
      language: 'fr',
      languageInfo: {
        name: 'French',
        nativeName: 'Français',
        flag: '🇫🇷',
        rtl: false
      },
      subtitles: [
        { start: 0, end: 5, text: 'Bienvenue dans notre application mobile.' },
        { start: 5, end: 12, text: 'Laissez-moi vous montrer comment naviguer dans les fonctionnalités principales.' },
        { start: 12, end: 20, text: 'D\'abord, nous commencerons par le tableau de bord où vous pouvez voir toutes vos activités récentes.' }
      ],
      translatedTitle: 'Démonstration de Navigation d\'Application Mobile',
      translatedSummary: 'Bienvenue dans notre application mobile. Laissez-moi vous montrer comment naviguer dans les fonctionnalités principales.',
      ctaText: {
        watchDemo: 'Voir la Démo',
        learnMore: 'En Savoir Plus'
      },
      translationQuality: 0.89,
      isDefault: false
    },
    {
      demoId: 'session_1766659357717_demo1',
      language: 'de',
      languageInfo: {
        name: 'German',
        nativeName: 'Deutsch',
        flag: '🇩🇪',
        rtl: false
      },
      subtitles: [
        { start: 0, end: 5, text: 'Willkommen in unserer mobilen Anwendung.' },
        { start: 5, end: 12, text: 'Lassen Sie mich Ihnen zeigen, wie Sie durch die Hauptfunktionen navigieren.' },
        { start: 12, end: 20, text: 'Zuerst beginnen wir mit dem Dashboard, wo Sie alle Ihre aktuellen Aktivitäten sehen können.' }
      ],
      translatedTitle: 'Mobile App Navigation Demo',
      translatedSummary: 'Willkommen in unserer mobilen Anwendung. Lassen Sie mich Ihnen zeigen, wie Sie durch die Hauptfunktionen navigieren.',
      ctaText: {
        watchDemo: 'Demo Ansehen',
        learnMore: 'Mehr Erfahren'
      },
      translationQuality: 0.87,
      isDefault: false
    }
  ];

  private aiSuggestions: DemoAISuggestion[] = [
    {
      id: 'ai-suggestion-1',
      demoId: 'session_1766659357717_demo1',
      type: 'improvement',
      title: 'Add Loading Indicators',
      description: 'Consider adding loading indicators during transitions to improve user experience and set expectations.',
      timestamp: 45,
      priority: 'medium',
      implemented: false,
      confidence: 0.85,
      createdAt: '2024-12-26T11:30:00Z'
    },
    {
      id: 'ai-suggestion-2',
      demoId: 'session_1766659357717_demo1',
      type: 'accessibility',
      title: 'Improve Color Contrast',
      description: 'Some text elements may not meet WCAG accessibility standards. Consider increasing color contrast for better readability.',
      timestamp: 78,
      priority: 'high',
      implemented: false,
      confidence: 0.92,
      createdAt: '2024-12-26T11:35:00Z'
    },
    {
      id: 'ai-suggestion-3',
      demoId: 'session_1766659357718_demo2',
      type: 'enhancement',
      title: 'Add Code Examples',
      description: 'Include more interactive code examples to help developers understand the API integration better.',
      timestamp: 120,
      priority: 'medium',
      implemented: false,
      confidence: 0.88,
      createdAt: '2024-12-26T10:45:00Z'
    }
  ];

  private aiReviews: DemoAIReview[] = [
    {
      demoId: 'session_1766659357717_demo1',
      overallScore: 8.7,
      insights: [
        'Overall presentation flow is excellent and engaging',
        'Visual quality meets professional standards',
        'Audio clarity is good throughout the recording',
        'Content structure follows best practices for demos',
        'Pacing allows viewers to follow along easily'
      ],
      suggestions: this.aiSuggestions.filter(s => s.demoId === 'session_1766659357717_demo1'),
      status: 'completed',
      createdAt: '2024-12-26T12:00:00Z',
      metadata: {
        analysisTime: 45,
        model: 'clueso-ai-v2.1',
        version: '2.1.0'
      }
    },
    {
      demoId: 'session_1766659357718_demo2',
      overallScore: 8.2,
      insights: [
        'Technical content is accurate and well-explained',
        'Code examples are clear and practical',
        'Documentation structure is logical',
        'Could benefit from more interactive elements',
        'Good use of visual aids and diagrams'
      ],
      suggestions: this.aiSuggestions.filter(s => s.demoId === 'session_1766659357718_demo2'),
      status: 'completed',
      createdAt: '2024-12-26T10:50:00Z',
      metadata: {
        analysisTime: 52,
        model: 'clueso-ai-v2.1',
        version: '2.1.0'
      }
    }
  ];

  // Public methods to get demo data
  getUsers(): DemoUser[] {
    return [...this.users];
  }

  getUser(id: string): DemoUser | undefined {
    return this.users.find(user => user.id === id);
  }

  getProjects(): DemoProject[] {
    return [...this.projects];
  }

  getProject(id: string): DemoProject | undefined {
    return this.projects.find(project => project.id === id);
  }

  getProjectsByOwner(ownerId: string): DemoProject[] {
    return this.projects.filter(project => project.ownerId === ownerId);
  }

  getRecordings(): DemoRecording[] {
    return [...this.recordings];
  }

  getRecording(sessionId: string): DemoRecording | undefined {
    return this.recordings.find(recording => recording.sessionId === sessionId);
  }

  getRecordingsByProject(projectId: string): DemoRecording[] {
    return this.recordings.filter(recording => recording.projectId === projectId);
  }

  getComments(demoId: string): DemoComment[] {
    return this.comments
      .filter(comment => comment.demoId === demoId)
      .map(comment => ({
        ...comment,
        userInfo: comment.userId ? this.getUser(comment.userId) : undefined
      }));
  }

  getLanguages(demoId: string): DemoLanguage[] {
    return this.languages.filter(lang => lang.demoId === demoId);
  }

  getLanguage(demoId: string, languageCode: string): DemoLanguage | undefined {
    return this.languages.find(lang => lang.demoId === demoId && lang.language === languageCode);
  }

  getAISuggestions(demoId: string): DemoAISuggestion[] {
    return this.aiSuggestions.filter(suggestion => suggestion.demoId === demoId);
  }

  getAIReview(demoId: string): DemoAIReview | undefined {
    return this.aiReviews.find(review => review.demoId === demoId);
  }

  // Utility methods for demo scenarios
  getDashboardStats() {
    return {
      totalProjects: this.projects.length,
      totalRecordings: this.recordings.length,
      totalComments: this.comments.length,
      totalLanguages: this.languages.length,
      activeCollaborators: this.users.length,
      avgRecordingDuration: Math.round(
        this.recordings.reduce((sum, r) => sum + r.duration, 0) / this.recordings.length
      ),
      completionRate: Math.round(
        (this.recordings.filter(r => r.status === 'completed').length / this.recordings.length) * 100
      ),
      translationCoverage: Math.round(
        (this.languages.length / this.recordings.length) * 100
      )
    };
  }

  getRecentActivity() {
    const activities = [
      ...this.comments.map(c => ({ type: 'comment', data: c, timestamp: c.createdAt })),
      ...this.recordings.map(r => ({ type: 'recording', data: r, timestamp: r.createdAt })),
      ...this.languages.map(l => ({ type: 'translation', data: l, timestamp: '2024-12-26T12:00:00Z' }))
    ];

    return activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10);
  }

  // Mock API responses for development
  async mockApiCall<T>(data: T, delay: number = 500): Promise<{ success: boolean; data: T }> {
    await new Promise(resolve => setTimeout(resolve, delay));
    return { success: true, data };
  }
}

export const demoDataService = new DemoDataService();