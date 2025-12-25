/**
 * Comprehensive Dummy Data for Clueso Frontend Testing
 * Use this when backend database is not available
 */

export interface User {
  id: string;
  email: string;
  fullName: string;
  username: string;
  avatarUrl: string;
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  recordingSessions?: RecordingSession[];
}

export interface RecordingSession {
  id: string;
  projectId: string;
  sessionName: string;
  status: 'active' | 'paused' | 'completed' | 'processing';
  startTime: string;
  endTime?: string;
  duration?: number;
  metadata: {
    url?: string;
    viewport?: { width: number; height: number };
    template?: string;
    processed?: boolean;
    thumbnails?: string[];
    chapters?: Chapter[];
  };
}

export interface Chapter {
  index: number;
  title: string;
  start: number;
  end: number;
}

export interface Comment {
  id: string;
  demoId: string;
  userId: string;
  username: string;
  timestamp: number;
  comment: string;
  position?: { x: number; y: number };
  status: 'open' | 'resolved';
  aiGenerated: boolean;
  suggestionType?: 'trim' | 'clarify' | 'cta' | 'pace' | 'general';
  createdAt: string;
  metadata?: any;
}

export interface Language {
  id: string;
  demoId: string;
  language: string;
  subtitles: Array<{ start: number; end: number; text: string }>;
  translatedSummary: string;
  translatedTitle: string;
  ctaText: { button: string; link: string; signup?: string };
  translationQuality: number;
  isDefault: boolean;
}

export interface AIReview {
  id: string;
  demoId: string;
  reviewType: 'pre_publish' | 'periodic' | 'on_demand';
  insights: string[];
  commonIssues: string[];
  translationWarnings: string[];
  overallScore: number;
  recommendations: string[];
  publishReadiness: 'ready' | 'needs_work' | 'major_issues';
  status: 'pending' | 'completed' | 'dismissed';
  createdAt: string;
}

// Dummy Users
export const dummyUsers: User[] = [
  {
    id: 'user_john_doe',
    email: 'john.doe@example.com',
    fullName: 'John Doe',
    username: 'johndoe',
    avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=John%20Doe',
    createdAt: '2024-12-20T10:00:00Z'
  },
  {
    id: 'user_jane_smith',
    email: 'jane.smith@example.com',
    fullName: 'Jane Smith',
    username: 'janesmith',
    avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=Jane%20Smith',
    createdAt: '2024-12-19T14:30:00Z'
  },
  {
    id: 'user_mike_wilson',
    email: 'mike.wilson@example.com',
    fullName: 'Mike Wilson',
    username: 'mikewilson',
    avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=Mike%20Wilson',
    createdAt: '2024-12-18T09:15:00Z'
  }
];

// Dummy Projects
export const dummyProjects: Project[] = [
  {
    id: 'project_ecommerce_001',
    name: 'Product Demo - E-commerce Platform',
    description: 'Comprehensive demo of our new e-commerce platform features including checkout, inventory management, and analytics dashboard.',
    ownerId: 'user_john_doe',
    createdAt: '2024-12-22T08:00:00Z',
    updatedAt: '2024-12-22T16:30:00Z'
  },
  {
    id: 'project_api_tutorial_001',
    name: 'Tutorial - API Integration Guide',
    description: 'Step-by-step tutorial showing how to integrate our REST API with common frameworks like React, Vue, and Angular.',
    ownerId: 'user_john_doe',
    createdAt: '2024-12-21T10:15:00Z',
    updatedAt: '2024-12-22T14:20:00Z'
  },
  {
    id: 'project_bug_report_001',
    name: 'Bug Report - Login Flow Issue',
    description: 'Demonstration of the login flow bug affecting mobile users on iOS Safari browser.',
    ownerId: 'user_jane_smith',
    createdAt: '2024-12-20T15:45:00Z',
    updatedAt: '2024-12-21T11:30:00Z'
  },
  {
    id: 'project_ai_assistant_001',
    name: 'Feature Showcase - AI Assistant',
    description: 'Showcasing the new AI assistant features and capabilities.',
    ownerId: 'user_john_doe',
    createdAt: '2024-12-22T09:00:00Z',
    updatedAt: '2024-12-22T09:00:00Z'
  }
];