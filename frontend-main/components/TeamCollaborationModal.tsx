'use client';

import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import toast from 'react-hot-toast';

interface TeamCollaborationModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId?: string;
  videoId?: string;
}

interface Participant {
  id: string;
  username: string;
  email: string;
  role: 'owner' | 'admin' | 'editor' | 'viewer';
  isController: boolean;
  isOnline: boolean;
  joinedAt: string;
}

interface InviteData {
  email: string;
  role: 'admin' | 'editor' | 'viewer';
  permissions?: string[];
}

interface PlaybackState {
  currentTime: number;
  originalDuration: number;
  isPlaying: boolean;
  playbackRate: number;
  hasAudio: boolean;
  audioTrackDuration: number;
  activeUsers: number;
}

export default function TeamCollaborationModal({ 
  isOpen, 
  onClose, 
  projectId, 
  videoId 
}: TeamCollaborationModalProps) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'invite' | 'participants' | 'playback'>('invite');
  
  // Invite Management
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'editor' | 'viewer'>('viewer');
  const [isInviting, setIsInviting] = useState(false);
  const [inviteResults, setInviteResults] = useState<any[]>([]);
  
  // Participants
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isLoadingParticipants, setIsLoadingParticipants] = useState(false);
  
  // Playback Sync
  const [playbackState, setPlaybackState] = useState<PlaybackState>({
    currentTime: 0,
    originalDuration: 120,
    isPlaying: false,
    playbackRate: 1.0,
    hasAudio: false,
    audioTrackDuration: 0,
    activeUsers: 0
  });
  const [isController, setIsController] = useState(false);
  
  // Event Log
  const [eventLog, setEventLog] = useState<Array<{
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    timestamp: Date;
  }>>([]);

  const timelineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && !socket) {
      connectWebSocket();
    }
    
    return () => {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
    };
  }, [isOpen]);

  const connectWebSocket = () => {
    // Connect to the main backend on port 3000
    const newSocket = io('http://localhost:3000');
    
    newSocket.on('connect', () => {
      setIsConnected(true);
      addLog('Connected to collaboration server', 'success');
      authenticate(newSocket);
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
      setIsAuthenticated(false);
      addLog('Disconnected from server', 'error');
    });

    newSocket.on('authenticated', (data) => {
      setIsAuthenticated(true);
      addLog(`Authenticated as ${data.username}`, 'success');
      
      // Join video session if videoId is provided
      if (videoId) {
        joinVideoSession(newSocket);
      }
    });

    newSocket.on('session_created', (data) => {
      setSessionId(data.sessionId);
      addLog(`Collaboration session created: ${data.sessionId}`, 'success');
    });

    newSocket.on('participants_updated', (data) => {
      setParticipants(data.participants);
      addLog(`Participants updated: ${data.participants.length} members`, 'info');
    });

    newSocket.on('playback_state', (state: PlaybackState) => {
      setPlaybackState(state);
      addLog(`Playback state updated: ${state.isPlaying ? 'Playing' : 'Paused'} at ${state.currentTime.toFixed(1)}s`, 'info');
    });

    newSocket.on('playback_control', (data) => {
      if (data.currentTime !== undefined) {
        setPlaybackState(prev => ({ ...prev, currentTime: data.currentTime }));
      }
      if (data.playbackRate !== undefined) {
        setPlaybackState(prev => ({ ...prev, playbackRate: data.playbackRate }));
      }
      setPlaybackState(prev => ({ ...prev, isPlaying: data.action === 'play' }));
      addLog(`${data.initiatedBy?.username || 'Someone'} ${data.action} at ${data.currentTime?.toFixed(1) || 0}s`, 'info');
    });

    newSocket.on('control_granted', (data) => {
      setIsController(data.isController);
      addLog(`Playback control ${data.isController ? 'granted' : 'revoked'}`, 'info');
    });

    newSocket.on('user_joined', (data) => {
      addLog(`${data.username} joined the session`, 'success');
    });

    newSocket.on('user_left', (data) => {
      addLog(`${data.username} left the session`, 'warning');
    });

    newSocket.on('invite_sent', (data) => {
      addLog(`Invite sent to ${data.email}`, 'success');
    });

    newSocket.on('error', (error) => {
      addLog(`Error: ${error.message}`, 'error');
      toast.error(error.message);
    });

    setSocket(newSocket);
  };

  const authenticate = (socket: Socket) => {
    // Get user data from localStorage or auth store
    const userData = {
      userId: 'user_' + Math.random().toString(36).substr(2, 9),
      username: 'Team Member',
      token: 'demo_token'
    };
    
    socket.emit('authenticate', userData);
  };

  const joinVideoSession = (socket: Socket) => {
    if (!videoId) return;
    
    socket.emit('join_video', {
      videoId,
      videoMetadata: {
        title: `Project ${projectId}`,
        duration: 120,
        hasAudio: true
      }
    });
  };

  const createCollaborationSession = async () => {
    if (!videoId) {
      toast.error('Video ID is required to create collaboration session');
      return;
    }

    try {
      const response = await fetch(`http://localhost:3000/api/collaboration/videos/${videoId}/session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer demo_token`
        },
        body: JSON.stringify({
          sessionName: `Team Collaboration - Project ${projectId}`,
          allowComments: true,
          allowPlaybackControl: true,
          requireApproval: false,
          maxParticipants: 50
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setSessionId(data.data.id);
        addLog('Collaboration session created successfully', 'success');
        toast.success('Collaboration session created!');
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      addLog(`Failed to create session: ${errorMessage}`, 'error');
      toast.error('Failed to create collaboration session');
    }
  };

  const sendInvites = async () => {
    if (!sessionId || !inviteEmail.trim()) {
      toast.error('Session ID and email are required');
      return;
    }

    setIsInviting(true);
    
    try {
      const invites: InviteData[] = [{
        email: inviteEmail.trim(),
        role: inviteRole,
        permissions: getDefaultPermissions(inviteRole)
      }];

      const response = await fetch(`http://localhost:3000/api/collaboration/sessions/${sessionId}/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer demo_token`
        },
        body: JSON.stringify({ invites })
      });

      const data = await response.json();
      
      if (data.success) {
        setInviteResults(data.data.results);
        setInviteEmail('');
        addLog(`Invite sent to ${inviteEmail}`, 'success');
        toast.success(`Invite sent to ${inviteEmail}!`);
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      addLog(`Failed to send invite: ${errorMessage}`, 'error');
      toast.error('Failed to send invite');
    } finally {
      setIsInviting(false);
    }
  };

  const getDefaultPermissions = (role: string): string[] => {
    switch (role) {
      case 'admin':
        return ['view', 'comment', 'control_playback', 'invite_users', 'manage_participants'];
      case 'editor':
        return ['view', 'comment', 'control_playback'];
      case 'viewer':
      default:
        return ['view', 'comment'];
    }
  };

  const handlePlaybackControl = (action: string, data?: any) => {
    if (!socket || !isController) {
      toast.error('You need playback control to perform this action');
      return;
    }

    socket.emit('playback_control', {
      action,
      ...data
    });
  };

  const requestControl = () => {
    if (!socket) return;
    
    socket.emit('request_control', {
      videoId,
      reason: 'User requested playback control'
    });
  };

  const addLog = (message: string, type: 'info' | 'success' | 'warning' | 'error') => {
    setEventLog(prev => [...prev.slice(-19), {
      message,
      type,
      timestamp: new Date()
    }]);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Team Collaboration</h2>
              <p className="text-gray-400 text-sm">
                {isConnected ? (
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    Connected • {playbackState.activeUsers} active users
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                    Disconnected
                  </span>
                )}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex h-[600px]">
          {/* Left Panel - Tabs */}
          <div className="w-1/3 border-r border-gray-700">
            {/* Tab Navigation */}
            <div className="flex border-b border-gray-700">
              {[
                { id: 'invite', label: 'Invite', icon: 'user-add' },
                { id: 'participants', label: 'Team', icon: 'users' },
                { id: 'playback', label: 'Sync', icon: 'play' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'text-blue-400 border-b-2 border-blue-400 bg-gray-700/50'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="p-4 h-full overflow-y-auto">
              {activeTab === 'invite' && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-white font-semibold mb-3">Invite Team Members</h3>
                    <p className="text-gray-400 text-sm mb-4">
                      Invite colleagues to collaborate on this project in real-time.
                    </p>
                  </div>

                  {!sessionId && (
                    <div className="bg-blue-600/20 border border-blue-500/30 rounded-lg p-4 mb-4">
                      <p className="text-blue-400 text-sm mb-3">
                        Create a collaboration session to start inviting team members.
                      </p>
                      <button
                        onClick={createCollaborationSession}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                      >
                        Create Session
                      </button>
                    </div>
                  )}

                  {sessionId && (
                    <>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Email Address
                          </label>
                          <input
                            type="email"
                            value={inviteEmail}
                            onChange={(e) => setInviteEmail(e.target.value)}
                            placeholder="colleague@company.com"
                            className="w-full bg-gray-700 text-white px-3 py-2 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Role
                          </label>
                          <select
                            value={inviteRole}
                            onChange={(e) => setInviteRole(e.target.value as any)}
                            className="w-full bg-gray-700 text-white px-3 py-2 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                          >
                            <option value="viewer">Viewer - Can view and comment</option>
                            <option value="editor">Editor - Can control playback</option>
                            <option value="admin">Admin - Full permissions</option>
                          </select>
                        </div>

                        <button
                          onClick={sendInvites}
                          disabled={isInviting || !inviteEmail.trim()}
                          className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:from-pink-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isInviting ? 'Sending...' : 'Send Invite'}
                        </button>
                      </div>

                      {inviteResults.length > 0 && (
                        <div className="mt-4 space-y-2">
                          <h4 className="text-white font-medium">Recent Invites</h4>
                          {inviteResults.map((result, index) => (
                            <div
                              key={index}
                              className={`p-3 rounded-lg text-sm ${
                                result.status === 'sent'
                                  ? 'bg-green-600/20 border border-green-500/30 text-green-400'
                                  : 'bg-red-600/20 border border-red-500/30 text-red-400'
                              }`}
                            >
                              <div className="font-medium">{result.email}</div>
                              <div className="text-xs opacity-80">
                                {result.status === 'sent' ? 'Invite sent successfully' : result.error}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {activeTab === 'participants' && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-white font-semibold mb-3">Team Members</h3>
                    <p className="text-gray-400 text-sm mb-4">
                      {participants.length} member{participants.length !== 1 ? 's' : ''} in this session
                    </p>
                  </div>

                  <div className="space-y-2">
                    {participants.length === 0 ? (
                      <div className="text-center py-8">
                        <svg className="w-12 h-12 text-gray-500 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                        </svg>
                        <p className="text-gray-400 text-sm">No team members yet</p>
                        <p className="text-gray-500 text-xs">Invite colleagues to start collaborating</p>
                      </div>
                    ) : (
                      participants.map((participant) => (
                        <div
                          key={participant.id}
                          className="flex items-center gap-3 p-3 bg-gray-700/50 rounded-lg"
                        >
                          <div className="w-8 h-8 bg-pink-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                            {participant.username.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-white text-sm font-medium truncate">
                              {participant.username}
                            </div>
                            <div className="text-gray-400 text-xs truncate">
                              {participant.email}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              participant.role === 'owner' ? 'bg-purple-600/20 text-purple-400' :
                              participant.role === 'admin' ? 'bg-blue-600/20 text-blue-400' :
                              participant.role === 'editor' ? 'bg-green-600/20 text-green-400' :
                              'bg-gray-600/20 text-gray-400'
                            }`}>
                              {participant.role}
                            </span>
                            <div className={`w-2 h-2 rounded-full ${
                              participant.isOnline ? 'bg-green-500' : 'bg-gray-500'
                            }`}></div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'playback' && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-white font-semibold mb-3">Playback Sync</h3>
                    <p className="text-gray-400 text-sm mb-4">
                      Synchronized video playback for all team members.
                    </p>
                  </div>

                  {/* Playback Controls */}
                  <div className="bg-gray-700/50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-white text-sm">
                        {formatTime(playbackState.currentTime)} / {formatTime(playbackState.originalDuration)}
                      </div>
                      <div className="text-gray-400 text-xs">
                        {playbackState.playbackRate}x speed
                      </div>
                    </div>

                    {/* Timeline */}
                    <div
                      ref={timelineRef}
                      className="w-full h-2 bg-gray-600 rounded-full cursor-pointer mb-4"
                      onClick={(e) => {
                        if (!isController) return;
                        const rect = e.currentTarget.getBoundingClientRect();
                        const progress = (e.clientX - rect.left) / rect.width;
                        const newTime = progress * playbackState.originalDuration;
                        handlePlaybackControl('seek', { currentTime: newTime });
                      }}
                    >
                      <div
                        className="h-full bg-blue-500 rounded-full transition-all duration-100"
                        style={{
                          width: `${(playbackState.currentTime / playbackState.originalDuration) * 100}%`
                        }}
                      ></div>
                    </div>

                    {/* Control Buttons */}
                    <div className="flex items-center justify-center gap-3">
                      <button
                        onClick={() => handlePlaybackControl('seek', { 
                          currentTime: Math.max(0, playbackState.currentTime - 10) 
                        })}
                        disabled={!isController}
                        className="p-2 bg-gray-600 rounded-lg text-white hover:bg-gray-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0019 16V8a1 1 0 00-1.6-.8l-5.334 4zM4.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0011 16V8a1 1 0 00-1.6-.8l-5.334 4z" />
                        </svg>
                      </button>

                      <button
                        onClick={() => handlePlaybackControl(playbackState.isPlaying ? 'pause' : 'play')}
                        disabled={!isController}
                        className="p-3 bg-blue-600 rounded-lg text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {playbackState.isPlaying ? (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        )}
                      </button>

                      <button
                        onClick={() => handlePlaybackControl('seek', { 
                          currentTime: Math.min(playbackState.originalDuration, playbackState.currentTime + 10) 
                        })}
                        disabled={!isController}
                        className="p-2 bg-gray-600 rounded-lg text-white hover:bg-gray-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.933 12.8a1 1 0 000-1.6L6.6 7.2A1 1 0 005 8v8a1 1 0 001.6.8l5.333-4zM19.933 12.8a1 1 0 000-1.6l-5.333-4A1 1 0 0013 8v8a1 1 0 001.6.8l5.333-4z" />
                        </svg>
                      </button>
                    </div>

                    {!isController && (
                      <div className="mt-4 text-center">
                        <button
                          onClick={requestControl}
                          className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
                        >
                          Request Control
                        </button>
                        <p className="text-gray-400 text-xs mt-2">
                          Ask for permission to control playback
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Event Log */}
          <div className="w-2/3 flex flex-col">
            <div className="p-4 border-b border-gray-700">
              <h3 className="text-white font-semibold">Activity Log</h3>
              <p className="text-gray-400 text-sm">Real-time collaboration events</p>
            </div>
            
            <div className="flex-1 p-4 overflow-y-auto">
              <div className="space-y-2">
                {eventLog.length === 0 ? (
                  <div className="text-center py-8">
                    <svg className="w-12 h-12 text-gray-500 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-gray-400 text-sm">No activity yet</p>
                    <p className="text-gray-500 text-xs">Events will appear here as team members interact</p>
                  </div>
                ) : (
                  eventLog.map((event, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg text-sm ${
                        event.type === 'success' ? 'bg-green-600/20 border border-green-500/30 text-green-400' :
                        event.type === 'warning' ? 'bg-yellow-600/20 border border-yellow-500/30 text-yellow-400' :
                        event.type === 'error' ? 'bg-red-600/20 border border-red-500/30 text-red-400' :
                        'bg-blue-600/20 border border-blue-500/30 text-blue-400'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          {event.message}
                        </div>
                        <div className="text-xs opacity-60 ml-2">
                          {event.timestamp.toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}