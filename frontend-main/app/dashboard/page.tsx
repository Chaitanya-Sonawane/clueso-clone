'use client';

import { useState, useEffect } from 'react';
import { useProjectsStore } from '@/lib/projects-store';
import { useAuthStore } from '@/lib/auth-store';
import DashboardLayout from '@/components/DashboardLayout';
import NewProjectModal from '@/components/NewProjectModal';
import toast from 'react-hot-toast';

export default function Dashboard() {
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const { projects, isLoading, error, fetchProjects } = useProjectsStore();
  const { isAuthenticated } = useAuthStore();

  // Fetch projects on mount if authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchProjects();
    }
  }, [isAuthenticated, fetchProjects]);

  // Show error toast if there's an error
  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getUserInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <DashboardLayout>
      <div className="p-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-white mb-2">Make something awesome</h1>
              <p className="text-gray-400">Create stunning product videos and docs</p>
            </div>
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setShowNewProjectModal(true)}
                className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-6 py-2 rounded-lg font-medium hover:from-pink-600 hover:to-purple-700 transition-all"
              >
                + New video
              </button>
            </div>
          </div>

          {/* Hero Banner */}
          <div className="bg-gradient-to-r from-purple-600 via-pink-500 to-purple-700 rounded-2xl p-8 mb-8 relative overflow-hidden">
            <div className="relative z-10">
              <h2 className="text-3xl font-bold text-white mb-4">Create a new video</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <div 
                  onClick={() => setShowNewProjectModal(true)}
                  className="bg-white/10 backdrop-blur-sm rounded-lg p-4 cursor-pointer hover:bg-white/20 transition-all"
                >
                  <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center mb-3">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-white font-semibold mb-1">Record screen</h3>
                  <p className="text-white/80 text-sm">Turn a screen recording into a studio-style video</p>
                </div>

                <div 
                  onClick={() => setShowNewProjectModal(true)}
                  className="bg-white/10 backdrop-blur-sm rounded-lg p-4 cursor-pointer hover:bg-white/20 transition-all"
                >
                  <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center mb-3">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  <h3 className="text-white font-semibold mb-1">Upload a video</h3>
                  <p className="text-white/80 text-sm">Upload a screen recording out of Clueso-style video</p>
                </div>

                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 cursor-pointer hover:bg-white/20 transition-all">
                  <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center mb-3">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-white font-semibold mb-1">Upload a slide deck</h3>
                  <p className="text-white/80 text-sm">Turn any PDF or PPT into a narrated video</p>
                </div>
              </div>
            </div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-white/10 to-transparent rounded-full -translate-y-32 translate-x-32"></div>
          </div>
        </div>

        {/* AI Tools Section */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <h2 className="text-lg font-semibold text-white">AI tools</h2>
            <span className="bg-purple-600 text-white text-xs px-2 py-1 rounded-full">NEW</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
              <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center mb-3">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-white font-semibold mb-1">Cuts</h3>
              <p className="text-gray-400 text-sm mb-2">Boost watch time by cutting out awkward gaps and filler</p>
              <span className="text-xs text-purple-400">AI</span>
            </div>

            <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center mb-3">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <h3 className="text-white font-semibold mb-1">Auto-update</h3>
              <p className="text-gray-400 text-sm mb-2">Update content when your product changes</p>
              <span className="text-xs text-blue-400">AI</span>
            </div>

            <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
              <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center mb-3">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                </svg>
              </div>
              <h3 className="text-white font-semibold mb-1">Translator</h3>
              <p className="text-gray-400 text-sm mb-2">Dub in over 30+ languages</p>
              <span className="text-xs text-green-400">AI</span>
            </div>
          </div>
        </div>

        {/* Recent Projects */}
        <div>
          <h2 className="text-lg font-semibold text-white mb-4">Recent projects</h2>
          
          <div className="bg-gray-800/30 rounded-lg overflow-hidden">
            <div className="grid grid-cols-4 gap-4 p-4 border-b border-gray-700 text-sm font-medium text-gray-400">
              <div>Project</div>
              <div>Creator</div>
              <div>Updated</div>
              <div>Created</div>
            </div>
            
            {isLoading ? (
              <div className="p-8 text-center">
                <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-400">Loading projects...</p>
              </div>
            ) : projects.length === 0 ? (
              <div className="p-8 text-center">
                <svg className="w-16 h-16 text-gray-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-300 mb-2">No projects yet</h3>
                <p className="text-gray-500 mb-4">Create your first project to get started</p>
                <button
                  onClick={() => setShowNewProjectModal(true)}
                  className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-6 py-2 rounded-lg font-medium hover:from-pink-600 hover:to-purple-700 transition-all"
                >
                  Create Project
                </button>
              </div>
            ) : (
              projects.map((project) => (
                <div key={project.id} className="grid grid-cols-4 gap-4 p-4 border-b border-gray-700/50 hover:bg-gray-800/50 transition-colors">
                  <div className="text-white font-medium">{project.name}</div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-pink-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                      {getUserInitials(project.owner_id)}
                    </div>
                    <div>
                      <div className="text-white text-sm">Project Owner</div>
                      <div className="text-gray-400 text-xs">{project.owner_id}</div>
                    </div>
                  </div>
                  <div className="text-gray-400">{formatDate(project.updated_at)}</div>
                  <div className="text-gray-400">{formatDate(project.created_at)}</div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Getting Started Section */}
        <div className="mt-12">
          <h2 className="text-lg font-semibold text-white mb-4">Getting started</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-700">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-white font-semibold">Introduction</h3>
                  <p className="text-gray-400 text-sm">Learn the basics</p>
                </div>
              </div>
            </div>

            <div 
              onClick={() => setShowNewProjectModal(true)}
              className="bg-gray-800/30 rounded-lg p-4 border border-gray-700 cursor-pointer hover:border-purple-500 transition-colors"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-pink-600 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-white font-semibold">Create your first video</h3>
                  <p className="text-gray-400 text-sm">Get started with recording</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Team Invite Section */}
        <div className="mt-8 bg-gray-800/30 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-white font-semibold">Invite team members</h3>
                <p className="text-gray-400 text-sm">Create great content with your team</p>
              </div>
            </div>
            <button className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-6 py-2 rounded-lg font-medium hover:from-pink-600 hover:to-purple-700 transition-all">
              Add users
            </button>
          </div>
        </div>
      </div>

      {/* New Project Modal */}
      {showNewProjectModal && (
        <NewProjectModal onClose={() => setShowNewProjectModal(false)} />
      )}
    </DashboardLayout>
  );
}