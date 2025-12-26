'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import TeamCollaborationModal from '@/components/TeamCollaborationModal';
import toast from 'react-hot-toast';

export default function TeamPage() {
  const [activeTab, setActiveTab] = useState('active');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showCollaborationModal, setShowCollaborationModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [inviteMessage, setInviteMessage] = useState('');
  const [isInviting, setIsInviting] = useState(false);

  const activeMembers = [
    {
      id: '1',
      name: 'Chaitanya Sonawane',
      email: 'chaitanya.sonawane@gmail.com',
      role: 'Admin',
      joined: 'December 22, 2025',
      projects: 3,
      avatar: 'CS',
      isOnline: true,
      lastActive: 'Now'
    }
  ];

  const pendingInvites = [];

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inviteEmail.trim()) {
      toast.error('Email address is required');
      return;
    }

    setIsInviting(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success(`Invite sent to ${inviteEmail}!`);
      setInviteEmail('');
      setInviteRole('member');
      setInviteMessage('');
      setShowInviteModal(false);
    } catch (error) {
      toast.error('Failed to send invite');
    } finally {
      setIsInviting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Manage Users</h1>
              <p className="text-gray-400">Collaborate with your team on Clueso</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowCollaborationModal(true)}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-purple-700 transition-all flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Live Collaboration
            </button>
            <button 
              onClick={() => setShowInviteModal(true)}
              className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-6 py-2 rounded-lg font-medium hover:from-pink-600 hover:to-purple-700 transition-all flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Invite User
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-8 mb-8 border-b border-gray-700">
          <button
            onClick={() => setActiveTab('active')}
            className={`pb-4 px-1 text-sm font-medium transition-colors relative ${
              activeTab === 'active'
                ? 'text-white border-b-2 border-purple-500'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Active members
            <span className="ml-2 bg-gray-700 text-gray-300 px-2 py-1 rounded-full text-xs">
              {activeMembers.length} users
            </span>
          </button>
          <button
            onClick={() => setActiveTab('pending')}
            className={`pb-4 px-1 text-sm font-medium transition-colors relative ${
              activeTab === 'pending'
                ? 'text-white border-b-2 border-purple-500'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Pending invites
            <span className="ml-2 bg-gray-700 text-gray-300 px-2 py-1 rounded-full text-xs">
              {pendingInvites.length} users
            </span>
          </button>
        </div>

        {/* Active Members Tab */}
        {activeTab === 'active' && (
          <div className="bg-gray-800/30 rounded-lg overflow-hidden border border-gray-700">
            {/* Table Header */}
            <div className="grid grid-cols-5 gap-4 p-4 border-b border-gray-700 text-sm font-medium text-gray-400 bg-gray-800/50">
              <div>User</div>
              <div>Status</div>
              <div>Joined</div>
              <div>Role</div>
              <div>Projects</div>
            </div>
            
            {/* Table Rows */}
            {activeMembers.map((member) => (
              <div key={member.id} className="grid grid-cols-5 gap-4 p-4 border-b border-gray-700/50 hover:bg-gray-800/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 bg-pink-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                      {member.avatar}
                    </div>
                    <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-gray-800 ${
                      member.isOnline ? 'bg-green-500' : 'bg-gray-500'
                    }`}></div>
                  </div>
                  <div>
                    <div className="text-white font-medium">{member.name}</div>
                    <div className="text-gray-400 text-sm">{member.email}</div>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <span className={`flex items-center gap-2 text-sm ${
                    member.isOnline ? 'text-green-400' : 'text-gray-400'
                  }`}>
                    <div className={`w-2 h-2 rounded-full ${
                      member.isOnline ? 'bg-green-500' : 'bg-gray-500'
                    }`}></div>
                    {member.isOnline ? 'Online' : `Last seen ${member.lastActive}`}
                  </span>
                </div>
                
                <div className="flex items-center text-gray-400">
                  {member.joined}
                </div>
                
                <div className="flex items-center">
                  <span className="bg-purple-600/20 text-purple-400 px-3 py-1 rounded-full text-sm font-medium">
                    {member.role}
                  </span>
                </div>
                
                <div className="flex items-center text-gray-400">
                  {member.projects}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pending Invites Tab */}
        {activeTab === 'pending' && (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No pending invites</h3>
            <p className="text-gray-400 mb-6">Invite team members to collaborate on projects</p>
            <button 
              onClick={() => setShowInviteModal(true)}
              className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:from-pink-600 hover:to-purple-700 transition-all"
            >
              Invite User
            </button>
          </div>
        )}

        {/* Invite Modal */}
        {showInviteModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-2xl p-8 max-w-md w-full mx-4 border border-gray-700">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Invite team member</h2>
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSendInvite} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Email address
                  </label>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="Enter email address"
                    className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:border-purple-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Role
                  </label>
                  <select 
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:border-purple-500 focus:outline-none"
                  >
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Message (optional)
                  </label>
                  <textarea
                    value={inviteMessage}
                    onChange={(e) => setInviteMessage(e.target.value)}
                    placeholder="Add a personal message..."
                    rows={3}
                    className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:border-purple-500 focus:outline-none resize-none"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={isInviting}
                    className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 text-white py-3 px-6 rounded-lg font-medium hover:from-pink-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isInviting ? 'Sending...' : 'Send Invite'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowInviteModal(false)}
                    className="px-6 py-3 text-gray-300 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Team Collaboration Modal */}
        {showCollaborationModal && (
          <TeamCollaborationModal 
            isOpen={showCollaborationModal}
            onClose={() => setShowCollaborationModal(false)}
            projectId="team_project"
            videoId="team_video_123"
          />
        )}
      </div>
    </DashboardLayout>
  );
}