import { create } from 'zustand';
import { projectsAPI } from './supabase';
import { useAuthStore } from './auth-store';

interface Project {
  id: string;
  name: string;
  description: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

interface ProjectsState {
  projects: Project[];
  currentProject: Project | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchProjects: () => Promise<void>;
  createProject: (projectData: { name: string; description: string }) => Promise<Project | null>;
  updateProject: (projectId: string, projectData: any) => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;
  setCurrentProject: (project: Project | null) => void;
  clearError: () => void;
}

export const useProjectsStore = create<ProjectsState>((set, get) => ({
  projects: [],
  currentProject: null,
  isLoading: false,
  error: null,

  fetchProjects: async () => {
    const { token } = useAuthStore.getState();
    if (!token) return;

    set({ isLoading: true, error: null });
    
    try {
      const response = await projectsAPI.getProjects(token);
      if (response.success) {
        set({ projects: response.data, isLoading: false });
      } else {
        set({ error: response.message, isLoading: false });
      }
    } catch (error) {
      set({ error: 'Failed to fetch projects', isLoading: false });
    }
  },

  createProject: async (projectData) => {
    const { token } = useAuthStore.getState();
    if (!token) return null;

    set({ isLoading: true, error: null });
    
    try {
      const response = await projectsAPI.createProject(token, projectData);
      if (response.success) {
        const newProject = response.data;
        set(state => ({ 
          projects: [newProject, ...state.projects], 
          isLoading: false 
        }));
        return newProject;
      } else {
        set({ error: response.message, isLoading: false });
        return null;
      }
    } catch (error) {
      set({ error: 'Failed to create project', isLoading: false });
      return null;
    }
  },

  updateProject: async (projectId, projectData) => {
    const { token } = useAuthStore.getState();
    if (!token) return;

    set({ isLoading: true, error: null });
    
    try {
      const response = await projectsAPI.updateProject(token, projectId, projectData);
      if (response.success) {
        set(state => ({
          projects: state.projects.map(p => 
            p.id === projectId ? { ...p, ...response.data } : p
          ),
          isLoading: false
        }));
      } else {
        set({ error: response.message, isLoading: false });
      }
    } catch (error) {
      set({ error: 'Failed to update project', isLoading: false });
    }
  },

  deleteProject: async (projectId) => {
    const { token } = useAuthStore.getState();
    if (!token) return;

    set({ isLoading: true, error: null });
    
    try {
      const response = await projectsAPI.deleteProject(token, projectId);
      if (response.success) {
        set(state => ({
          projects: state.projects.filter(p => p.id !== projectId),
          currentProject: state.currentProject?.id === projectId ? null : state.currentProject,
          isLoading: false
        }));
      } else {
        set({ error: response.message, isLoading: false });
      }
    } catch (error) {
      set({ error: 'Failed to delete project', isLoading: false });
    }
  },

  setCurrentProject: (project) => set({ currentProject: project }),
  clearError: () => set({ error: null }),
}));