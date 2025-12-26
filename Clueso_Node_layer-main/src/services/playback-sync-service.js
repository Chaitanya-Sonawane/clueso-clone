const { Logger } = require('../config');

class PlaybackSyncService {
    constructor() {
        // Track playback state per video session
        this.playbackStates = new Map(); // videoId -> playback state
        // Track users in each video session
        this.videoSessions = new Map(); // videoId -> Set of socketIds
        // Track socket to user mapping
        this.socketUsers = new Map(); // socketId -> { userId, username, videoId }
    }

    /**
     * Initialize playback sync for a video
     * @param {string} videoId - Video identifier
     * @param {object} videoMetadata - Video metadata with duration info
     */
    initializeVideo(videoId, videoMetadata) {
        if (!this.playbackStates.has(videoId)) {
            this.playbackStates.set(videoId, {
                videoId,
                currentTime: 0,
                isPlaying: false,
                playbackRate: 1.0,
                lastUpdate: Date.now(),
                originalDuration: videoMetadata.originalDuration || 0,
                hasAudio: videoMetadata.hasAudio || false,
                audioTrackDuration: videoMetadata.audioTrackDuration || 0,
                // User-specific states
                userStates: new Map(), // userId -> { isMuted, volume, lastSeen }
                // Control permissions
                controlledBy: null, // userId who has control
                allowedControllers: new Set(), // userIds who can control
                // Session info
                createdAt: new Date().toISOString(),
                activeUsers: 0
            });
            
            Logger.info(`[Playback Sync] Initialized video session: ${videoId}`);
        }
        
        return this.playbackStates.get(videoId);
    }

    /**
     * Join a user to a video session
     * @param {string} videoId - Video identifier
     * @param {string} socketId - Socket identifier
     * @param {object} user - User info { userId, username }
     * @param {object} io - Socket.IO instance
     */
    joinVideoSession(videoId, socketId, user, io) {
        // Initialize video session if needed
        if (!this.videoSessions.has(videoId)) {
            this.videoSessions.set(videoId, new Set());
        }
        
        // Add user to session
        this.videoSessions.get(videoId).add(socketId);
        this.socketUsers.set(socketId, { ...user, videoId });
        
        // Update playback state
        const playbackState = this.playbackStates.get(videoId);
        if (playbackState) {
            playbackState.activeUsers = this.videoSessions.get(videoId).size;
            
            // Initialize user-specific state
            if (!playbackState.userStates.has(user.userId)) {
                playbackState.userStates.set(user.userId, {
                    isMuted: false,
                    volume: 1.0,
                    lastSeen: Date.now(),
                    joinedAt: new Date().toISOString()
                });
            }
            
            // Grant control if first user or no controller
            if (!playbackState.controlledBy || playbackState.activeUsers === 1) {
                playbackState.controlledBy = user.userId;
                playbackState.allowedControllers.add(user.userId);
            }
        }
        
        // Send current state to joining user
        const socket = io.sockets.sockets.get(socketId);
        if (socket && playbackState) {
            socket.emit('playback_state', {
                ...this.getPublicPlaybackState(videoId),
                isController: playbackState.controlledBy === user.userId,
                userState: playbackState.userStates.get(user.userId)
            });
        }
        
        // Notify other users
        this.broadcastToVideoSession(videoId, io, 'user_joined', {
            user: user,
            activeUsers: playbackState ? playbackState.activeUsers : 1
        }, socketId);
        
        Logger.info(`[Playback Sync] User ${user.username} joined video ${videoId}`);
        
        return playbackState;
    }

    /**
     * Remove user from video session
     * @param {string} socketId - Socket identifier
     * @param {object} io - Socket.IO instance
     */
    leaveVideoSession(socketId, io) {
        const userInfo = this.socketUsers.get(socketId);
        if (!userInfo) return;
        
        const { videoId, userId, username } = userInfo;
        
        // Remove from session
        if (this.videoSessions.has(videoId)) {
            this.videoSessions.get(videoId).delete(socketId);
            
            const playbackState = this.playbackStates.get(videoId);
            if (playbackState) {
                playbackState.activeUsers = this.videoSessions.get(videoId).size;
                
                // Transfer control if leaving user was controller
                if (playbackState.controlledBy === userId && playbackState.activeUsers > 0) {
                    const remainingSockets = Array.from(this.videoSessions.get(videoId));
                    if (remainingSockets.length > 0) {
                        const nextController = this.socketUsers.get(remainingSockets[0]);
                        if (nextController) {
                            playbackState.controlledBy = nextController.userId;
                            playbackState.allowedControllers.add(nextController.userId);
                            
                            // Notify new controller
                            const socket = io.sockets.sockets.get(remainingSockets[0]);
                            if (socket) {
                                socket.emit('control_granted', {
                                    message: 'You now have playback control'
                                });
                            }
                        }
                    } else {
                        playbackState.controlledBy = null;
                    }
                }
                
                // Clean up empty sessions
                if (playbackState.activeUsers === 0) {
                    this.videoSessions.delete(videoId);
                    this.playbackStates.delete(videoId);
                    Logger.info(`[Playback Sync] Cleaned up empty video session: ${videoId}`);
                }
            }
        }
        
        this.socketUsers.delete(socketId);
        
        // Notify remaining users
        this.broadcastToVideoSession(videoId, io, 'user_left', {
            user: { userId, username },
            activeUsers: this.playbackStates.get(videoId)?.activeUsers || 0
        });
        
        Logger.info(`[Playback Sync] User ${username} left video ${videoId}`);
    }

    /**
     * Handle playback control events
     * @param {string} socketId - Socket identifier
     * @param {string} action - Action type (play, pause, seek, rate_change)
     * @param {object} data - Action data
     * @param {object} io - Socket.IO instance
     */
    handlePlaybackControl(socketId, action, data, io) {
        const userInfo = this.socketUsers.get(socketId);
        if (!userInfo) {
            Logger.warn(`[Playback Sync] Unknown socket attempted control: ${socketId}`);
            return false;
        }
        
        const { videoId, userId, username } = userInfo;
        const playbackState = this.playbackStates.get(videoId);
        
        if (!playbackState) {
            Logger.warn(`[Playback Sync] No playback state for video: ${videoId}`);
            return false;
        }
        
        // Check permissions
        if (!this.canControlPlayback(userId, playbackState)) {
            Logger.warn(`[Playback Sync] User ${username} denied playback control for ${videoId}`);
            const socket = io.sockets.sockets.get(socketId);
            if (socket) {
                socket.emit('control_denied', {
                    message: 'You do not have permission to control playback'
                });
            }
            return false;
        }
        
        const timestamp = Date.now();
        let broadcastData = {
            action,
            videoId,
            timestamp,
            initiatedBy: { userId, username }
        };
        
        // Handle different actions
        switch (action) {
            case 'play':
                playbackState.isPlaying = true;
                playbackState.lastUpdate = timestamp;
                broadcastData.currentTime = data.currentTime || playbackState.currentTime;
                playbackState.currentTime = broadcastData.currentTime;
                break;
                
            case 'pause':
                playbackState.isPlaying = false;
                playbackState.lastUpdate = timestamp;
                broadcastData.currentTime = data.currentTime || playbackState.currentTime;
                playbackState.currentTime = broadcastData.currentTime;
                break;
                
            case 'seek':
                const seekTime = Math.max(0, Math.min(data.currentTime, playbackState.originalDuration));
                playbackState.currentTime = seekTime;
                playbackState.lastUpdate = timestamp;
                broadcastData.currentTime = seekTime;
                break;
                
            case 'rate_change':
                const newRate = Math.max(0.25, Math.min(data.playbackRate, 2.0));
                playbackState.playbackRate = newRate;
                playbackState.lastUpdate = timestamp;
                broadcastData.playbackRate = newRate;
                broadcastData.currentTime = data.currentTime || playbackState.currentTime;
                break;
                
            case 'time_update':
                // Periodic time updates from controlling client
                if (Math.abs(data.currentTime - playbackState.currentTime) > 1.0) {
                    // Significant time difference, sync all clients
                    playbackState.currentTime = data.currentTime;
                    playbackState.lastUpdate = timestamp;
                    broadcastData.currentTime = data.currentTime;
                } else {
                    // Minor update, don't broadcast
                    playbackState.currentTime = data.currentTime;
                    playbackState.lastUpdate = timestamp;
                    return true;
                }
                break;
                
            default:
                Logger.warn(`[Playback Sync] Unknown action: ${action}`);
                return false;
        }
        
        // Broadcast to all users in session
        this.broadcastToVideoSession(videoId, io, 'playback_control', broadcastData);
        
        Logger.info(`[Playback Sync] ${username} ${action} video ${videoId} at ${broadcastData.currentTime}s`);
        return true;
    }

    /**
     * Check if user can control playback
     * @param {string} userId - User identifier
     * @param {object} playbackState - Playback state object
     * @returns {boolean} Can control
     */
    canControlPlayback(userId, playbackState) {
        return playbackState.controlledBy === userId || 
               playbackState.allowedControllers.has(userId);
    }

    /**
     * Grant control to a user
     * @param {string} videoId - Video identifier
     * @param {string} userId - User to grant control
     * @param {string} grantedBy - User granting control
     */
    grantControl(videoId, userId, grantedBy) {
        const playbackState = this.playbackStates.get(videoId);
        if (!playbackState) return false;
        
        // Only current controller can grant control
        if (playbackState.controlledBy !== grantedBy) return false;
        
        playbackState.controlledBy = userId;
        playbackState.allowedControllers.add(userId);
        
        Logger.info(`[Playback Sync] Control granted to ${userId} for video ${videoId}`);
        return true;
    }

    /**
     * Get public playback state (without sensitive info)
     * @param {string} videoId - Video identifier
     * @returns {object} Public state
     */
    getPublicPlaybackState(videoId) {
        const state = this.playbackStates.get(videoId);
        if (!state) return null;
        
        return {
            videoId: state.videoId,
            currentTime: state.currentTime,
            isPlaying: state.isPlaying,
            playbackRate: state.playbackRate,
            originalDuration: state.originalDuration,
            hasAudio: state.hasAudio,
            audioTrackDuration: state.audioTrackDuration,
            activeUsers: state.activeUsers,
            lastUpdate: state.lastUpdate
        };
    }

    /**
     * Broadcast message to all users in video session
     * @param {string} videoId - Video identifier
     * @param {object} io - Socket.IO instance
     * @param {string} event - Event name
     * @param {object} data - Event data
     * @param {string} excludeSocket - Socket to exclude from broadcast
     */
    broadcastToVideoSession(videoId, io, event, data, excludeSocket = null) {
        const sockets = this.videoSessions.get(videoId);
        if (!sockets) return;
        
        sockets.forEach(socketId => {
            if (socketId !== excludeSocket) {
                const socket = io.sockets.sockets.get(socketId);
                if (socket) {
                    socket.emit(event, data);
                }
            }
        });
    }

    /**
     * Get session statistics
     * @returns {object} Statistics
     */
    getStats() {
        return {
            activeSessions: this.playbackStates.size,
            totalUsers: this.socketUsers.size,
            sessionsWithUsers: Array.from(this.playbackStates.entries()).map(([videoId, state]) => ({
                videoId,
                activeUsers: state.activeUsers,
                isPlaying: state.isPlaying,
                duration: state.originalDuration
            }))
        };
    }
}

module.exports = new PlaybackSyncService();