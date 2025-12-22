// hooks/useWebSocketConnection.ts
import { useEffect, useState, useRef, useCallback } from 'react';
import { connectSocket, disconnectSocket, registerSession, onSocketEvent, offSocketEvent } from '@/lib/socket';
import { useCollaborationStore } from '@/lib/collaboration-store';
import { Socket } from 'socket.io-client';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';

export interface EventTarget {
    tag: string;
    id: string | null;
    classes: string[];
    text: string;
    selector: string;
    bbox: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
    attributes: Record<string, any>;
}

export interface Instruction {
    type: string;
    target: EventTarget;
    timestamp: number;
    metadata?: {
        url?: string;
        viewport?: {
            width: number;
            height: number;
        };
        [key: string]: any;
    };
}

export interface VideoData {
    filename: string;
    url: string;
    metadata: Record<string, any>;
    receivedAt: Date;
}

export interface AudioData {
    filename: string;
    url: string;
    text: string;
    receivedAt: Date;
}

export interface ErrorEvent {
    message: string;
    details?: string;
    timestamp: Date;
}

// Helper functions for localStorage
const getStorageKey = (sessionId: string, type: string) => `clueso_${sessionId}_${type}`;

const saveToStorage = (sessionId: string, type: string, data: any) => {
    try {
        localStorage.setItem(getStorageKey(sessionId, type), JSON.stringify(data));
    } catch (error) {
        console.error('[Storage] Failed to save:', error);
    }
};

const loadFromStorage = (sessionId: string, type: string) => {
    try {
        const data = localStorage.getItem(getStorageKey(sessionId, type));
        return data ? JSON.parse(data) : null;
    } catch (error) {
        console.error('[Storage] Failed to load:', error);
        return null;
    }
};

export const useWebSocketConnection = (sessionId: string | null) => {
    const [connectionState, setConnectionState] = useState<'disconnected' | 'connected'>('disconnected');
    const [videoData, setVideoData] = useState<VideoData | null>(null);
    const [audioData, setAudioData] = useState<AudioData | null>(null);
    const [instructions, setInstructions] = useState<Instruction[]>([]);
    const [errors, setErrors] = useState<ErrorEvent[]>([]);
    const [processingStatus, setProcessingStatus] = useState<string | null>(null);

    const socketRef = useRef<Socket | null>(null);
    const { setCurrentDemo, addComment } = useCollaborationStore();

    // Load data from localStorage on mount
    useEffect(() => {
        if (!sessionId) return;

        console.log('[Hook] Loading cached data from localStorage...');
        const cachedVideo = loadFromStorage(sessionId, 'video');
        const cachedAudio = loadFromStorage(sessionId, 'audio');
        const cachedInstructions = loadFromStorage(sessionId, 'instructions');

        if (cachedVideo) {
            console.log('[Hook] ✅ Restored video from cache');
            setVideoData({ ...cachedVideo, receivedAt: new Date(cachedVideo.receivedAt) });
        }
        if (cachedAudio) {
            console.log('[Hook] ✅ Restored audio from cache');
            setAudioData({ ...cachedAudio, receivedAt: new Date(cachedAudio.receivedAt) });
        }
        if (cachedInstructions) {
            console.log('[Hook] ✅ Restored instructions from cache');
            setInstructions(cachedInstructions);
        }
    }, [sessionId]);

    // Set up WebSocket connection and event handlers
    useEffect(() => {
        if (!sessionId) return;

        console.log('[Hook] Setting up WebSocket connection for session:', sessionId);
        
        // Connect socket and register session
        const socket = connectSocket();
        socketRef.current = socket;
        registerSession(sessionId);
        
        // Set current demo for collaboration features
        setCurrentDemo(sessionId);

        // Connection state handlers
        const handleConnect = () => {
            console.log('[Hook] ✅ WebSocket connected');
            setConnectionState('connected');
        };

        const handleDisconnect = () => {
            console.log('[Hook] ❌ WebSocket disconnected');
            setConnectionState('disconnected');
        };

        const handleConnectError = (error: any) => {
            console.error('[Hook] ❌ WebSocket connection error:', error);
            setConnectionState('disconnected');
            setErrors(prev => [...prev, {
                message: 'Connection failed',
                details: error.message,
                timestamp: new Date()
            }]);
        };

        // Recording event handlers
        const handleVideo = (data: any) => {
            console.log('[Hook] 📹 Video received:', data);
            
            const videoData: VideoData = {
                filename: data.filename,
                url: `${BACKEND_URL}${data.path}`,
                metadata: data.metadata || {},
                receivedAt: new Date()
            };
            
            setVideoData(videoData);
            saveToStorage(sessionId, 'video', videoData);
        };

        const handleAudio = (data: any) => {
            console.log('[Hook] 🎵 Audio received:', data);
            
            const audioData: AudioData = {
                filename: data.filename,
                url: `${BACKEND_URL}${data.path}`,
                text: data.text || '',
                receivedAt: new Date()
            };
            
            setAudioData(audioData);
            saveToStorage(sessionId, 'audio', audioData);
        };

        const handleInstructions = (data: any) => {
            console.log('[Hook] 📋 Instructions received:', data);
            
            let instructionsList: Instruction[] = [];
            
            if (Array.isArray(data)) {
                instructionsList = data;
            } else if (data.instructions && Array.isArray(data.instructions)) {
                instructionsList = data.instructions;
            } else if (data.type && data.target) {
                instructionsList = [data];
            }
            
            setInstructions(instructionsList);
            saveToStorage(sessionId, 'instructions', instructionsList);
        };

        // Collaboration event handlers
        const handleNewComment = (comment: any) => {
            console.log('[Hook] 💬 New comment received:', comment);
            // The collaboration store will handle this via its own socket listeners
        };

        const handleCommentResolved = (comment: any) => {
            console.log('[Hook] ✅ Comment resolved:', comment);
            // The collaboration store will handle this via its own socket listeners
        };

        const handleAISuggestions = (suggestions: any) => {
            console.log('[Hook] 🤖 AI suggestions received:', suggestions);
            // The collaboration store will handle this via its own socket listeners
        };

        const handleAIReviewGenerated = (review: any) => {
            console.log('[Hook] 📊 AI review generated:', review);
            // The collaboration store will handle this via its own socket listeners
        };

        const handleLanguageAdded = (language: any) => {
            console.log('[Hook] 🌍 Language added:', language);
            // The collaboration store will handle this via its own socket listeners
        };

        // Processing event handlers
        const handleProcessingStatus = (status: any) => {
            console.log('[Hook] ⚙️ Processing status:', status);
            setProcessingStatus(status.message || status.status);
        };

        const handleProcessingComplete = (result: any) => {
            console.log('[Hook] ✅ Processing complete:', result);
            setProcessingStatus('Processing complete');
            
            // Refresh data if new files are available
            if (result.videoPath) {
                handleVideo({
                    filename: result.filename || 'processed_video.webm',
                    path: result.videoPath,
                    metadata: result.metadata || {}
                });
            }
            
            if (result.audioPath) {
                handleAudio({
                    filename: result.audioFilename || 'processed_audio.wav',
                    path: result.audioPath,
                    text: result.transcript || ''
                });
            }
        };

        // Error handler
        const handleError = (error: any) => {
            console.error('[Hook] ❌ Socket error:', error);
            setErrors(prev => [...prev, {
                message: error.message || 'Unknown error',
                details: error.details,
                timestamp: new Date()
            }]);
        };

        // Register all event handlers
        onSocketEvent('connect', handleConnect);
        onSocketEvent('disconnect', handleDisconnect);
        onSocketEvent('connect_error', handleConnectError);
        onSocketEvent('video', handleVideo);
        onSocketEvent('audio', handleAudio);
        onSocketEvent('instructions', handleInstructions);
        onSocketEvent('new_comment', handleNewComment);
        onSocketEvent('comment_resolved', handleCommentResolved);
        onSocketEvent('ai_suggestions', handleAISuggestions);
        onSocketEvent('ai_review_generated', handleAIReviewGenerated);
        onSocketEvent('language_added', handleLanguageAdded);
        onSocketEvent('processing_status', handleProcessingStatus);
        onSocketEvent('processing_complete', handleProcessingComplete);
        onSocketEvent('error', handleError);

        // Cleanup function
        return () => {
            console.log('[Hook] 🧹 Cleaning up WebSocket connection');
            
            // Remove all event handlers
            offSocketEvent('connect', handleConnect);
            offSocketEvent('disconnect', handleDisconnect);
            offSocketEvent('connect_error', handleConnectError);
            offSocketEvent('video', handleVideo);
            offSocketEvent('audio', handleAudio);
            offSocketEvent('instructions', handleInstructions);
            offSocketEvent('new_comment', handleNewComment);
            offSocketEvent('comment_resolved', handleCommentResolved);
            offSocketEvent('ai_suggestions', handleAISuggestions);
            offSocketEvent('ai_review_generated', handleAIReviewGenerated);
            offSocketEvent('language_added', handleLanguageAdded);
            offSocketEvent('processing_status', handleProcessingStatus);
            offSocketEvent('processing_complete', handleProcessingComplete);
            offSocketEvent('error', handleError);
        };
    }, [sessionId, setCurrentDemo]);

    // Clear errors after 10 seconds
    useEffect(() => {
        if (errors.length > 0) {
            const timer = setTimeout(() => {
                setErrors(prev => prev.slice(0, -1));
            }, 10000);
            return () => clearTimeout(timer);
        }
    }, [errors]);

    return {
        connectionState,
        videoData,
        audioData,
        instructions,
        errors,
        processingStatus,
        socket: socketRef.current
    };
};
