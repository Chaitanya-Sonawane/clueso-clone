'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import NewProjectModal from '@/components/NewProjectModal';

export default function ProjectsPage() {
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);

  const projects = [
    {
      id: '1',
      name: 'Manage Courses and Users on the Learning Platform',
      creator: 'Chaitanya Sonawane',
      creatorEmail: 'chaitanya.sonawane@gmail.com',
      updated: '22 Dec 2025',
      created: '22 Dec 2025'
    },
    {
      id: '2',
      name: 'Manage Users and Courses in LMS Academy',
      creator: 'Chaitanya Sonawane',
      creatorEmail: 'chaitanya.sonawane@gmail.com',
      updated: '22 Dec 2025',
      created: '22 Dec 2025'
    },
    {
      id: '3',
      name: 'Untitled (3)',
      creator: 'Chaitanya Sonawane',
      creatorEmail: 'chaitanya.sonawane@gmail.com',
      updated: '22 Dec 2025',
      created: '22 Dec 2025'
    }
  ];

  return (
    <DashboardLayout>
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
            <h1 className="text-2xl font-bold text-white">Projects</h1>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mb-8">
          <button 
            onClick={() => setShowNewProjectModal(true)}
            className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-6 py-2 rounded-lg font-medium hover:from-pink-600 hover:to-purple-700 transition-all flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Video
          </button>
          <button className="bg-gray-700 text-white px-6 py-2 rounded-lg font-medium hover:bg-gray-600 transition-all flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
            New Folder
          </button>
        </div>

        {/* Projects Section */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">Projects</h2>
          
          <div className="bg-gray-800/30 rounded-lg overflow-hidden border border-gray-700">
            {/* Table Header */}
            <div className="grid grid-cols-4 gap-4 p-4 border-b border-gray-700 text-sm font-medium text-gray-400 bg-gray-800/50">
              <div>Project</div>
              <div>Creator</div>
              <div>Updated</div>
              <div>Created</div>
            </div>
            
            {/* Table Rows */}
            {projects.map((project) => (
              <div key={project.id} className="grid grid-cols-4 gap-4 p-4 border-b border-gray-700/50 hover:bg-gray-800/50 transition-colors group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-white font-medium hover:text-purple-400 cursor-pointer transition-colors">
                      {project.name}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-pink-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                    {project.creator.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <div className="text-white text-sm">{project.creator}</div>
                    <div className="text-gray-400 text-xs">{project.creatorEmail}</div>
                  </div>
                </div>
                
                <div className="flex items-center text-gray-400">
                  {project.updated}
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">{project.created}</span>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="text-gray-400 hover:text-white p-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Empty State for when no projects */}
        {projects.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No projects yet</h3>
            <p className="text-gray-400 mb-6">Create your first project to get started</p>
            <button 
              onClick={() => setShowNewProjectModal(true)}
              className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:from-pink-600 hover:to-purple-700 transition-all"
            >
              Create Project
            </button>
          </div>
        )}
      </div>

      {/* New Project Modal */}
      {showNewProjectModal && (
        <NewProjectModal onClose={() => setShowNewProjectModal(false)} />
      )}
    </DashboardLayout>
  );
}