import { create } from 'zustand';
import { collaborationAPI } from './supabase';

interface Comment {
  id: string;
  demoId: string;
  userId?: string;
  comment: string;
  status: 'open' | 'resolved';
  aiGenerated: boolean;
  timestamp: number;
  metadata?: any;
  createdAt: string;
}

interface Language {
  demoId: string;
  language: string;
  subtitles?: string;
  translatedTitle?: string;
  ctaText?: string;
  isDefault: boolean;
}

interface AISuggestion {
  id: string;
  type: 'improvement' | 'optimization' | 'accessibility';
  title: string;
  description: string;
  timestamp?: number;
  priority: 'low' | 'medium' | 'high';
  implemented: boolean;
}

interface AIReview {
  demoId: string;
  overallScore: number;
  insights: string[];
  status: 'pending' | 'completed' | 'failed';
  createdAt: string;
}

interface CollaborationState {
  // Comments
  comments: Comment[];
  commentsLoading: boolean;
  commentsError: string | null;
  
  // Languages
  languages: Language[];
  languagesLoading: boolean;
  languagesError: string | null;
  
  // AI Suggestions
  aiSuggestions: AISuggestion[];
  aiSuggestionsLoading: boolean;
  aiSuggestionsError: string | null;
  
  // AI Review
  aiReview: AIReview | null;
  aiReviewLoading: boolean;
  aiReviewError: string | null;
  
  // Current demo
  currentDemoId: string | null;
  
  // Actions
  setCurrentDemo: (demoId: string) => void;
  
  // Comment actions
  fetchComments: (demoId: string) => Promise<void>;
  addComment: (demoId: string, comment: string, timestamp: number, aiGenerated?: boolean) => Promise<void>;
  resolveComment: (commentId: string) => Promise<void>;
  
  // Language actions
  fetchLanguages: (demoId: string) => Promise<void>;
  addLanguage: (demoId: string, language: string, subtitles?: string) => Promise<void>;
  
  // AI actions
  generateAISuggestions: (demoId: string, context?: any) => Promise<void>;
  generateAIReview: (demoId: string, context?: any) => Promise<void>;
  fetchAIReview: (demoId: string) => Promise<void>;
  
  // Clear actions
  clearComments: () => void;
  clearLanguages: () => void;
  clearAISuggestions: () => void;
  clearAIReview: () => void;
  clearErrors: () => void;
}

export const useCollaborationStore = create<CollaborationState>((set, get) => ({
  // Initial state
  comments: [],
  commentsLoading: false,
  commentsError: null,
  
  languages: [],
  languagesLoading: false,
  languagesError: null,
  
  aiSuggestions: [],
  aiSuggestionsLoading: false,
  aiSuggestionsError: null,
  
  aiReview: null,
  aiReviewLoading: false,
  aiReviewError: null,
  
  currentDemoId: null,
  
  // Set current demo
  setCurrentDemo: (demoId: string) => {
    set({ currentDemoId: demoId });
    // Auto-fetch data for new demo
    const { fetchComments, fetchLanguages, fetchAIReview } = get();
    fetchComments(demoId);
    fetchLanguages(demoId);
    fetchAIReview(demoId);
  },
  
  // Comment actions
  fetchComments: async (demoId: string) => {
    set({ commentsLoading: true, commentsError: null });
    
    try {
      const response = await collaborationAPI.getComments(demoId);
      if (response.success) {
        set({ comments: response.data, commentsLoading: false });
      } else {
        set({ commentsError: response.message, commentsLoading: false });
      }
    } catch (error) {
      set({ 
        commentsError: error instanceof Error ? error.message : 'Failed to fetch comments', 
        commentsLoading: false 
      });
    }
  },
  
  addComment: async (demoId: string, comment: string, timestamp: number, aiGenerated = false) => {
    set({ commentsLoading: true, commentsError: null });
    
    try {
      const response = await collaborationAPI.addComment(demoId, {
        comment,
        timestamp,
        aiGenerated,
      });
      
      if (response.success) {
        const newComment = response.data;
        set(state => ({
          comments: [newComment, ...state.comments],
          commentsLoading: false
        }));
      } else {
        set({ commentsError: response.message, commentsLoading: false });
      }
    } catch (error) {
      set({ 
        commentsError: error instanceof Error ? error.message : 'Failed to add comment', 
        commentsLoading: false 
      });
    }
  },
  
  resolveComment: async (commentId: string) => {
    try {
      const response = await collaborationAPI.resolveComment(commentId);
      
      if (response.success) {
        set(state => ({
          comments: state.comments.map(comment =>
            comment.id === commentId 
              ? { ...comment, status: 'resolved' as const }
              : comment
          )
        }));
      }
    } catch (error) {
      console.error('Failed to resolve comment:', error);
    }
  },
  
  // Language actions
  fetchLanguages: async (demoId: string) => {
    set({ languagesLoading: true, languagesError: null });
    
    try {
      const response = await collaborationAPI.getLanguages(demoId);
      if (response.success) {
        set({ languages: response.data, languagesLoading: false });
      } else {
        set({ languagesError: response.message, languagesLoading: false });
      }
    } catch (error) {
      set({ 
        languagesError: error instanceof Error ? error.message : 'Failed to fetch languages', 
        languagesLoading: false 
      });
    }
  },
  
  addLanguage: async (demoId: string, language: string, subtitles?: string) => {
    set({ languagesLoading: true, languagesError: null });
    
    try {
      const response = await collaborationAPI.addLanguage(demoId, {
        language,
        subtitles,
        isDefault: false,
      });
      
      if (response.success) {
        const newLanguage = response.data;
        set(state => ({
          languages: [...state.languages, newLanguage],
          languagesLoading: false
        }));
      } else {
        set({ languagesError: response.message, languagesLoading: false });
      }
    } catch (error) {
      set({ 
        languagesError: error instanceof Error ? error.message : 'Failed to add language', 
        languagesLoading: false 
      });
    }
  },
  
  // AI actions
  generateAISuggestions: async (demoId: string, context?: any) => {
    set({ aiSuggestionsLoading: true, aiSuggestionsError: null });
    
    try {
      const response = await collaborationAPI.generateAISuggestions(demoId, context);
      if (response.success) {
        set({ aiSuggestions: response.data, aiSuggestionsLoading: false });
      } else {
        set({ aiSuggestionsError: response.message, aiSuggestionsLoading: false });
      }
    } catch (error) {
      set({ 
        aiSuggestionsError: error instanceof Error ? error.message : 'Failed to generate AI suggestions', 
        aiSuggestionsLoading: false 
      });
    }
  },
  
  generateAIReview: async (demoId: string, context?: any) => {
    set({ aiReviewLoading: true, aiReviewError: null });
    
    try {
      const response = await collaborationAPI.generateAIReview(demoId, context);
      if (response.success) {
        set({ aiReview: response.data, aiReviewLoading: false });
      } else {
        set({ aiReviewError: response.message, aiReviewLoading: false });
      }
    } catch (error) {
      set({ 
        aiReviewError: error instanceof Error ? error.message : 'Failed to generate AI review', 
        aiReviewLoading: false 
      });
    }
  },
  
  fetchAIReview: async (demoId: string) => {
    set({ aiReviewLoading: true, aiReviewError: null });
    
    try {
      const response = await collaborationAPI.getAIReview(demoId);
      if (response.success) {
        set({ aiReview: response.data, aiReviewLoading: false });
      } else {
        // Don't set error if review doesn't exist yet
        set({ aiReview: null, aiReviewLoading: false });
      }
    } catch (error) {
      set({ aiReview: null, aiReviewLoading: false });
    }
  },
  
  // Clear actions
  clearComments: () => set({ comments: [], commentsError: null }),
  clearLanguages: () => set({ languages: [], languagesError: null }),
  clearAISuggestions: () => set({ aiSuggestions: [], aiSuggestionsError: null }),
  clearAIReview: () => set({ aiReview: null, aiReviewError: null }),
  clearErrors: () => set({ 
    commentsError: null, 
    languagesError: null, 
    aiSuggestionsError: null, 
    aiReviewError: null 
  }),
}));