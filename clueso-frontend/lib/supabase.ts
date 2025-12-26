import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Backend API configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Helper function to make API calls with proper error handling
async function apiCall(endpoint: string, options: RequestInit = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    // Check if response is JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.error('Non-JSON response:', text);
      throw new Error(`Server returned non-JSON response: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || data.error || `HTTP error! status: ${response.status}`);
    }
    
    return data;
  } catch (error) {
    console.error(`API call failed for ${endpoint}:`, error);
    
    // Handle specific error types
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Unable to connect to server. Please check if the backend is running.');
    }
    
    if (error instanceof Error && error.message.includes('JSON')) {
      throw new Error('Server returned invalid response. Please try again.');
    }
    
    throw error;
  }
}

// Auth API functions
export const authAPI = {
  async login(email: string, password: string) {
    return apiCall('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  async register(userData: {
    email: string;
    password: string;
    fullName: string;
    username?: string;
  }) {
    return apiCall('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  async getProfile(token: string) {
    return apiCall('/api/auth/profile', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  },

  async updateProfile(token: string, userData: any) {
    return apiCall('/api/auth/profile', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(userData),
    });
  }
};

// Projects API functions
export const projectsAPI = {
  async getProjects(token: string) {
    return apiCall('/api/projects', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  },

  async createProject(token: string, projectData: { name: string; description: string }) {
    return apiCall('/api/projects', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(projectData),
    });
  },

  async getProject(token: string, projectId: string) {
    return apiCall(`/api/projects/${projectId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  },

  async updateProject(token: string, projectId: string, projectData: any) {
    return apiCall(`/api/projects/${projectId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(projectData),
    });
  },

  async deleteProject(token: string, projectId: string) {
    return apiCall(`/api/projects/${projectId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  },

  async getProjectRecordings(token: string, projectId: string) {
    return apiCall(`/api/projects/${projectId}/recordings`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  },

  async startRecording(token: string, projectId: string) {
    return apiCall(`/api/projects/${projectId}/recordings/start`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  },

  async stopRecording(token: string, projectId: string, sessionId: string) {
    return apiCall(`/api/projects/${projectId}/recordings/${sessionId}/stop`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  }
};

// Recording API functions
export const recordingAPI = {
  async uploadVideoChunk(sessionId: string, sequence: number, chunk: Blob) {
    const formData = new FormData();
    formData.append('sessionId', sessionId);
    formData.append('sequence', sequence.toString());
    formData.append('chunk', chunk);

    return fetch(`${API_BASE_URL}/api/recording/video-chunk`, {
      method: 'POST',
      body: formData,
    }).then(res => res.json());
  },

  async uploadAudioChunk(sessionId: string, sequence: number, chunk: Blob) {
    const formData = new FormData();
    formData.append('sessionId', sessionId);
    formData.append('sequence', sequence.toString());
    formData.append('chunk', chunk);

    return fetch(`${API_BASE_URL}/api/recording/audio-chunk`, {
      method: 'POST',
      body: formData,
    }).then(res => res.json());
  },

  async processRecording(sessionId: string, events: any[], video: File, audio: File, metadata: any) {
    const formData = new FormData();
    formData.append('sessionId', sessionId);
    formData.append('events', JSON.stringify(events));
    formData.append('video', video);
    formData.append('audio', audio);
    formData.append('metadata', JSON.stringify(metadata));

    return fetch(`${API_BASE_URL}/api/recording/process-recording`, {
      method: 'POST',
      body: formData,
    }).then(res => res.json());
  }
};

// Collaboration API functions
export const collaborationAPI = {
  async getComments(demoId: string) {
    return apiCall(`/api/collaboration/demos/${demoId}/comments`);
  },

  async addComment(demoId: string, commentData: {
    comment: string;
    timestamp: number;
    userId?: string;
    aiGenerated?: boolean;
    metadata?: any;
  }) {
    return apiCall(`/api/collaboration/demos/${demoId}/comments`, {
      method: 'POST',
      body: JSON.stringify(commentData),
    });
  },

  async resolveComment(commentId: string) {
    return apiCall(`/api/collaboration/comments/${commentId}/resolve`, {
      method: 'PATCH',
    });
  },

  async getLanguages(demoId: string) {
    return apiCall(`/api/collaboration/demos/${demoId}/languages`);
  },

  async addLanguage(demoId: string, languageData: {
    language: string;
    subtitles?: string;
    translatedTitle?: string;
    ctaText?: string;
    isDefault?: boolean;
  }) {
    return apiCall(`/api/collaboration/demos/${demoId}/languages`, {
      method: 'POST',
      body: JSON.stringify(languageData),
    });
  },

  async getSubtitles(demoId: string, language: string) {
    return apiCall(`/api/collaboration/demos/${demoId}/languages/${language}/subtitles`);
  },

  async generateAISuggestions(demoId: string, context?: any) {
    return apiCall(`/api/collaboration/demos/${demoId}/ai-suggestions`, {
      method: 'POST',
      body: JSON.stringify({ context }),
    });
  },

  async generateAIReview(demoId: string, context?: any) {
    return apiCall(`/api/collaboration/demos/${demoId}/ai-review`, {
      method: 'POST',
      body: JSON.stringify({ context }),
    });
  },

  async getAIReview(demoId: string) {
    return apiCall(`/api/collaboration/demos/${demoId}/ai-review`);
  }
};

// AI API functions (direct to Python service)
export const aiAPI = {
  async processVideo(videoPath: string, audioPath: string) {
    const AI_BASE_URL = process.env.NEXT_PUBLIC_AI_URL || 'http://localhost:8000';
    
    return fetch(`${AI_BASE_URL}/process-video`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ videoPath, audioPath }),
    }).then(res => res.json());
  },

  async generateInstructions(events: any[], metadata: any) {
    const AI_BASE_URL = process.env.NEXT_PUBLIC_AI_URL || 'http://localhost:8000';
    
    return fetch(`${AI_BASE_URL}/generate-instructions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ events, metadata }),
    }).then(res => res.json());
  }
};

// Health check
export const healthAPI = {
  async checkHealth() {
    return apiCall('/api/health');
  }
};