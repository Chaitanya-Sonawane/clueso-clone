'use client';

import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import toast from 'react-hot-toast';

interface CollaborationModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId?: string;
  videoId?: string;
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

interface Participant {
  id: string;
  username: string;
  role: 'viewer' | 'editor' | 'admin';
  isController: boolean;
}

export default function CollaborationModal({ isOpen, onClose, projectId, videoId }: CollaborationModalProps) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isController, setIsController] = useState(false);
  const [playbackState, setPlaybackState] = useState<PlaybackState>({
    currentTime: 0,
    originalDuration: 120,
    isPlaying: false,
    playbackRate: 1.0,
    hasAudio: false,
    audioTrackDuration: 0,
    activeUsers: 0
  });
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'viewer' | 'editor' | 'admin'>('viewer');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [eventLog, setEventLog] = useState<Array<{message: string, type: string, timestamp: Date}>>([]);
  
  const timelineRef = useRef<HTMLDivElement>(null);

  const addLog = (message: string, type: string) => {
    setEventLog(prev => [...prev, { message, type, timestamp: new Date() }]);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

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
    const newSocket = io(process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3000');
    
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

    newSocket.on('user_joined', (data) => {
      updateParticipants();
      addLog(`${data.user.username} joined the session`, 'success');
    });

    newSocket.on('user_left', (data) => {
      updateParticipants();
      addLog(`${data.user.username} left the session`, 'warning');
    });

    newSocket.on('control_granted', () => {
      setIsController(true);
      addLog('You now have playback control', 'success');
      toast.success('You now have playback control');
    });

    newSocket.on('error', (error) => {
      toast.error(error.message);
      addLog(`Error: ${error.message}`, 'error');
    });

    setSocket(newSocket);
  };

  const authenticate = (socketInstance: Socket) => {
    const userId = 'user_' + Math.random().toString(36).substr(2, 9);
    const username = 'User' + Math.floor(Math.random() * 1000);
    
    socketInstance.emit('authenticate', {
      userId,
      username,
      token: 'demo_token'
    });
  };

  const joinVideoSession = () => {
    if (!socket || !isAuthenticated) {
      toast.error('Please connect first');
      return;
    }

    const currentVideoId = videoId || `video_${projectId || Date.now()}`;
    const videoMetadata = {
      originalDuration: playbackState.originalDuration,
      hasAudio: true,
      audioTrackDuration: playbackState.originalDuration
    };

    socket.emit('join_video', {
      videoId: currentVideoId,
      videoMetadata
    });

    addLog(`Joining video session: ${currentVideoId}`, 'info');
  };

  const handlePlaybackControl = (action: string, time?: number, rate?: number) => {
    if (!socket || !isController) {
      toast.error('You do not have playback control');
      return;
    }

    const controlData: any = {
      action,
      currentTime: time !== undefined ? time : playbackState.currentTime
    };

    if (rate !== undefined) {
      controlData.playbackRate = rate;
    }

    socket.emit('playback_control', controlData);
  };

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isController || !timelineRef.current) {
      return;
    }

    const rect = timelineRef.current.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const seekTime = percent * playbackState.originalDuration;
    
    handlePlaybackControl('seek', seekTime);
  };

  const sendInvite = async () => {
    if (!inviteEmail) {
      toast.error('Please enter an email address');
      return;
    }

    try {
      const response = await fetch('http://localhost:3000/api/collaboration/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: inviteEmail,
          role: inviteRole,
          projectId,
          sessionId
        })
      });

      if (response.ok) {
        toast.success(`Invite sent to ${inviteEmail} as ${inviteRole}`);
        addLog(`Invite sent to ${inviteEmail}`, 'success');
        setInviteEmail('');
      } else {
        throw new Error('Failed to send invite');
      }
    } catch (error) {
      toast.error('Failed to send invite');
      addLog('Failed to send invite', 'error');
    }
  };

  const createSession = () => {
    const newSessionId = 'session_' + Date.now();
    setSessionId(newSessionId);
    addLog(`Created collaboration session: ${newSessionId}`, 'success');
    toast.success('Collaboration session created');
  };

  const updateParticipants = () => {
    // Mock participants for demo - in real app, this would come from the server
    const participants = [
      { id: '1', username: 'You', role: 'admin' as const, isController }
    ];
    setParticipants(participants);
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">Team Collaboration</h2>
            <p className="text-gray-400">Real-time video synchronization and team collaboration</p>
            <div className="flex items-center gap-4">
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                isConnected ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
              }`}>
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                isAuthenticated ? 'bg-green-500 text-white' : 'bg-yellow-500 text-white'
              }`}>
                {isAuthenticated ? 'Authenticated' : 'Not Authenticated'}
              </span>
              <button
                onClick={onClose}
                className="w-6 h-6 text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Video Timeline & Audio Synchronization */}
          <div className="bg-slate-700 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
              🎬 Video Timeline & Audio Synchronization
            </h3>
            
            {/* Metadata Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-slate-800 p-3 rounded-lg">
                <div className="text-xs text-gray-400 mb-1">Duration</div>
                <div className="text-white font-semibold">{formatTime(playbackState.originalDuration)}</div>
              </div>
              <div className="bg-slate-800 p-3 rounded-lg">
                <div className="text-xs text-gray-400 mb-1">Current Time</div>
                <div className="text-white font-semibold">{formatTime(playbackState.currentTime)}</div>
              </div>
              <div className="bg-slate-800 p-3 rounded-lg">
                <div className="text-xs text-gray-400 mb-1">Playback Rate</div>
                <div className="text-white font-semibold">{playbackState.playbackRate}x</div>
              </div>
            </div>

            {/* Video Player Mock */}
            <div className="bg-black rounded-lg p-8 text-center mb-4">
              <div className="text-white mb-4">📹 Demo Video Player</div>
            </div>

            {/* Timeline */}
            <div 
              ref={timelineRef}
              className="w-full h-2 bg-slate-600 rounded-full cursor-pointer relative mb-4"
              onClick={handleTimelineClick}
            >
              <div 
                className="h-full bg-blue-500 rounded-full transition-all duration-100"
                style={{ width: `${(playbackState.currentTime / playbackState.originalDuration) * 100}%` }}
              />
              <div 
                className="absolute top-[-6px] w-4 h-4 bg-blue-600 rounded-full cursor-pointer transform -translate-x-1/2"
                style={{ left: `${(playbackState.currentTime / playbackState.originalDuration) * 100}%` }}
              />
            </div>

            {/* Playback Controls */}
            <div className="flex gap-3 flex-wrap">
              <button
                onClick={() => handlePlaybackControl('play')}
                disabled={!isController}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                ▶️ Play
              </button>
              <button
                onClick={() => handlePlaybackControl('pause')}
                disabled={!isController}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                ⏸️ Pause
              </button>
              <button
                onClick={() => handlePlaybackControl('seek', 30)}
                disabled={!isController}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                ⏭️ Seek to 30s
              </button>
              <button
                onClick={() => handlePlaybackControl('rate_change', playbackState.currentTime, 1.5)}
                disabled={!isController}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                🏃 1.5x Speed
              </button>
            </div>
          </div>

          {/* Team Collaboration & Invites */}
          <div className="bg-slate-700 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
              👥 Team Collaboration & Invites
            </h3>
            
            {/* Participants */}
            <div className="flex gap-2 flex-wrap mb-4">
              {participants.map(participant => (
                <div
                  key={participant.id}
                  className={`px-3 py-2 rounded-full text-sm flex items-center gap-2 ${
                    participant.isController ? 'bg-green-600 text-white' : 'bg-slate-600 text-gray-300'
                  }`}
                >
                  <div className="w-2 h-2 bg-green-400 rounded-full" />
                  {participant.username} {participant.isController && '(Controller)'}
                </div>
              ))}
            </div>

            {/* Invite Form */}
            <div className="flex gap-3 mb-4 flex-wrap">
              <input
                type="email"
                placeholder="Enter email to invite"
                className="flex-1 min-w-[200px] px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
              <select
                className="px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as 'viewer' | 'editor' | 'admin')}
              >
                <option value="viewer">Viewer</option>
                <option value="editor">Editor</option>
                <option value="admin">Admin</option>
              </select>
              <button
                onClick={sendInvite}
                disabled={!isAuthenticated}
                className="bg-pink-600 hover:bg-pink-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                📧 Send Invite
              </button>
            </div>

            {/* Session Controls */}
            <div className="flex gap-3 flex-wrap">
              <button
                onClick={createSession}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                🏗️ Create Session
              </button>
              <button
                onClick={joinVideoSession}
                disabled={!isAuthenticated}
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                🎥 Join Video Session
              </button>
            </div>
          </div>

          {/* Event Log */}
          <div className="bg-slate-700 rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                📋 Real-time Event Log
              </h3>
              <button
                onClick={() => setEventLog([])}
                className="text-gray-400 hover:text-white transition-colors"
              >
                🗑️ Clear Log
              </button>
            </div>
            <div className="bg-slate-800 rounded-lg p-4 h-48 overflow-y-auto font-mono text-sm">
              {eventLog.map((entry, index) => (
                <div
                  key={index}
                  className={`mb-1 ${
                    entry.type === 'success' ? 'text-green-400' : 
                    entry.type === 'error' ? 'text-red-400' : 
                    entry.type === 'warning' ? 'text-yellow-400' : 'text-blue-400'
                  }`}
                >
                  [{entry.timestamp.toLocaleTimeString()}] {entry.message}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}