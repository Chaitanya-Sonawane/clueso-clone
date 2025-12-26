// hooks/useWebSocketConnection.ts
import { useEffect, useState, useRef, useCallback } from 'react';
import { connectSocket, disconnectSocket, registerSession, onSocketEvent, offSocketEvent } from '@/lib/socket';
import { useCollaborationStore } from '@/lib/collaboration-store';
import { Socket } from 'socket.io-client';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
const POLLING_INTERVAL = 4000; // 4 seconds
const MAX_POLLING_ATTEMPTS = 150; // 10 minutes max (150 * 4s = 600s)

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

export type SessionStatus = 'UPLOADED' | 'PROCESSING' | 'READY' | 'ERROR';

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
    const [connectionState, setConnectionState] = useState<'disconnected' | 'connected' | 'polling'>('disconnected');
    const [sessionStatus, setSessionStatus] = useState<SessionStatus>('UPLOADED');
    const [videoData, setVideoData] = useState<VideoData | null>(null);
    const [audioData, setAudioData] = useState<AudioData | null>(null);
    const [instructions, setInstructions] = useState<Instruction[]>([]);
    const [errors, setErrors] = useState<ErrorEvent[]>([]);
    const [processingStatus, setProcessingStatus] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [videoLoading, setVideoLoading] = useState(false);
    const [transcriptionLoading, setTranscriptionLoading] = useState(false);
    const [aiProcessingLoading, setAiProcessingLoading] = useState(false);

    const socketRef = useRef<Socket | null>(null);
    const pollingRef = useRef<NodeJS.Timeout | null>(null);
    const pollingAttemptsRef = useRef(0);
    const isPollingRef = useRef(false);
    const { setCurrentDemo, addComment } = useCollaborationStore();

    // HTTP Polling fallback functions
    const fetchSessionStatus = useCallback(async (sessionId: string) => {
        try {
            const response = await fetch(`${BACKEND_URL}/api/session/${sessionId}/status`);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error('[Polling] Failed to fetch session status:', error);
            return null;
        }
    }, []);

    const fetchTranscript = useCallback(async (sessionId: string) => {
        try {
            const response = await fetch(`${BACKEND_URL}/api/session/${sessionId}/transcript`);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error('[Polling] Failed to fetch transcript:', error);
            return null;
        }
    }, []);

    const fetchInsights = useCallback(async (sessionId: string) => {
        try {
            const response = await fetch(`${BACKEND_URL}/api/session/${sessionId}/insights`);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error('[Polling] Failed to fetch insights:', error);
            return null;
        }
    }, []);

    // Start HTTP polling when WebSocket fails
    const startPolling = useCallback((sessionId: string) => {
        if (isPollingRef.current) return;
        
        console.log('[Polling] Starting HTTP polling fallback for session:', sessionId);
        isPollingRef.current = true;
        pollingAttemptsRef.current = 0;
        setConnectionState('polling');

        const poll = async () => {
            if (!isPollingRef.current || pollingAttemptsRef.current >= MAX_POLLING_ATTEMPTS) {
                console.log('[Polling] Stopping polling - max attempts reached or disabled');
                stopPolling();
                return;
            }

            pollingAttemptsRef.current++;
            console.log(`[Polling] Attempt ${pollingAttemptsRef.current}/${MAX_POLLING_ATTEMPTS}`);

            // Fetch session status
            const statusData = await fetchSessionStatus(sessionId);
            if (statusData?.success) {
                console.log('[Polling] Status update:', statusData);
                
                // Update session status based on polling data
                setSessionStatus(statusData.status as SessionStatus);
                setProcessingStatus(statusData.message);
                
                // Update loading states based on status
                switch (statusData.status) {
                    case 'UPLOADED':
                        setVideoLoading(true);
                        setTranscriptionLoading(false);
                        setAiProcessingLoading(false);
                        break;
                    case 'PROCESSING':
                        setVideoLoading(false);
                        setTranscriptionLoading(true);
                        setAiProcessingLoading(false);
                        break;
                    case 'TRANSCRIBING':
                        setVideoLoading(false);
                        setTranscriptionLoading(true);
                        setAiProcessingLoading(false);
                        break;
                    case 'AI_PROCESSING':
                        setVideoLoading(false);
                        setTranscriptionLoading(false);
                        setAiProcessingLoading(true);
                        break;
                    case 'READY':
                        setVideoLoading(false);
                        setTranscriptionLoading(false);
                        setAiProcessingLoading(false);
                        setIsLoading(false);
                        break;
                }

                // Fetch transcript if available
                if (statusData.files?.hasTranscript && !audioData?.text) {
                    const transcriptData = await fetchTranscript(sessionId);
                    if (transcriptData?.success && transcriptData.transcript) {
                        const newAudioData: AudioData = {
                            filename: `${sessionId}_audio.webm`,
                            url: `${BACKEND_URL}/recordings/recording_${sessionId}_audio.webm`,
                            text: transcriptData.transcript.text,
                            receivedAt: new Date()
                        };
                        setAudioData(newAudioData);
                        saveToStorage(sessionId, 'audio', newAudioData);
                    }
                }

                // Fetch insights if available
                if (statusData.files?.hasInstructions && instructions.length === 0) {
                    const insightsData = await fetchInsights(sessionId);
                    if (insightsData?.success && insightsData.insights) {
                        setInstructions(insightsData.insights.instructions || []);
                        saveToStorage(sessionId, 'instructions', insightsData.insights.instructions || []);
                    }
                }

                // Set video data if available and not already set
                if (statusData.files?.hasVideo && !videoData) {
                    const newVideoData: VideoData = {
                        filename: `${sessionId}_video.webm`,
                        url: `${BACKEND_URL}/recordings/recording_${sessionId}_video.webm`,
                        metadata: { sessionId },
                        receivedAt: new Date()
                    };
                    setVideoData(newVideoData);
                    saveToStorage(sessionId, 'video', newVideoData);
                }

                // Stop polling if session is ready
                if (statusData.status === 'READY') {
                    console.log('[Polling] Session ready, stopping polling');
                    stopPolling();
                    return;
                }
            }

            // Schedule next poll
            if (isPollingRef.current) {
                pollingRef.current = setTimeout(poll, POLLING_INTERVAL);
            }
        };

        // Start first poll immediately
        poll();
    }, [fetchSessionStatus, fetchTranscript, fetchInsights, audioData, videoData, instructions]);

    const stopPolling = useCallback(() => {
        console.log('[Polling] Stopping HTTP polling');
        isPollingRef.current = false;
        if (pollingRef.current) {
            clearTimeout(pollingRef.current);
            pollingRef.current = null;
        }
        if (connectionState === 'polling') {
            setConnectionState('disconnected');
        }
    }, [connectionState]);

    // Pre-register session function for upload modal
    const registerSessionPreemptively = useCallback(async (sessionId: string) => {
        console.log('[Hook] Pre-registering session:', sessionId);
        
        if (!socketRef.current) {
            const socket = connectSocket();
            socketRef.current = socket;
        }
        
        await registerSession(sessionId);
        setSessionStatus('UPLOADED');
        setIsLoading(true);
        
        return Promise.resolve();
    }, []);

    // Load data from localStorage on mount
    useEffect(() => {
        if (!sessionId) return;

        console.log('[Hook] Loading cached data from localStorage...');
        const cachedVideo = loadFromStorage(sessionId, 'video');
        const cachedAudio = loadFromStorage(sessionId, 'audio');
        const cachedInstructions = loadFromStorage(sessionId, 'instructions');
        const cachedStatus = loadFromStorage(sessionId, 'status');

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
        if (cachedStatus) {
            setSessionStatus(cachedStatus);
        }

        // Determine session status and loading states based on available data
        if (cachedVideo && cachedAudio && cachedInstructions?.length > 0) {
            console.log('[Hook] Session fully ready from cache');
            setSessionStatus('READY');
            setIsLoading(false);
            setVideoLoading(false);
            setTranscriptionLoading(false);
            setAiProcessingLoading(false);
        } else if (cachedVideo && cachedAudio) {
            console.log('[Hook] Video and audio ready, waiting for AI processing');
            setSessionStatus('PROCESSING');
            setIsLoading(false);
            setVideoLoading(false);
            setTranscriptionLoading(false);
            setAiProcessingLoading(true);
            setProcessingStatus('Processing AI insights...');
        } else if (cachedVideo) {
            console.log('[Hook] Video ready, waiting for transcription');
            setSessionStatus('PROCESSING');
            setVideoLoading(false);
            setTranscriptionLoading(true);
            setAiProcessingLoading(false);
            setProcessingStatus('Transcribing audio...');
        } else {
            console.log('[Hook] No cached data, waiting for upload');
            setSessionStatus('UPLOADED');
            setVideoLoading(true);
            setTranscriptionLoading(false);
            setAiProcessingLoading(false);
            setProcessingStatus('Waiting for video upload...');
        }
    }, [sessionId]);

    // Set up WebSocket connection and event handlers
    useEffect(() => {
        if (!sessionId) return;

        console.log('[Hook] Setting up WebSocket connection for session:', sessionId);
        
        // Connect socket and register session if not already connected
        if (!socketRef.current) {
            const socket = connectSocket();
            socketRef.current = socket;
            registerSession(sessionId);
        }
        
        // Set current demo for collaboration features
        setCurrentDemo(sessionId);

        // Connection state handlers with polling fallback
        const handleConnect = () => {
            console.log('[Hook] ✅ WebSocket connected');
            setConnectionState('connected');
            stopPolling(); // Stop polling if WebSocket connects
        };

        const handleDisconnect = (reason: string) => {
            console.log('[Hook] ❌ WebSocket disconnected:', reason);
            setConnectionState('disconnected');
            
            // Start polling fallback after WebSocket disconnect
            if (sessionId && reason !== 'io client disconnect') {
                console.log('[Hook] Starting polling fallback due to WebSocket disconnect');
                setTimeout(() => startPolling(sessionId), 1000);
            }
        };

        const handleConnectError = (error: any) => {
            console.error('[Hook] ❌ WebSocket connection error:', error);
            setConnectionState('disconnected');
            
            // Start polling fallback on connection error
            if (sessionId) {
                console.log('[Hook] Starting polling fallback due to WebSocket error');
                setTimeout(() => startPolling(sessionId), 2000);
            }
            
            setErrors(prev => [...prev, {
                message: 'WebSocket connection failed, using polling fallback',
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
            
            // Video is ready, now waiting for transcription
            setSessionStatus('PROCESSING');
            setVideoLoading(false);
            setTranscriptionLoading(true);
            setProcessingStatus('Transcribing audio...');
            saveToStorage(sessionId, 'status', 'PROCESSING');
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
            
            // Audio transcription complete, now waiting for AI processing
            setTranscriptionLoading(false);
            setAiProcessingLoading(true);
            setProcessingStatus('Processing AI insights...');
            saveToStorage(sessionId, 'status', 'PROCESSING');
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
            
            // All processing complete - session is fully ready
            setSessionStatus('READY');
            setIsLoading(false);
            setAiProcessingLoading(false);
            setProcessingStatus('Ready');
            saveToStorage(sessionId, 'status', 'READY');
        };

        // Processing event handlers
        const handleProcessingStatus = (status: any) => {
            console.log('[Hook] ⚙️ Processing status:', status);
            setProcessingStatus(status.message || status.status);
            
            // Update specific loading states based on current step
            if (status.currentStep) {
                switch (status.currentStep) {
                    case 'initializing':
                    case 'preparing_files':
                    case 'extracting_metadata':
                        setVideoLoading(true);
                        setTranscriptionLoading(false);
                        setAiProcessingLoading(false);
                        break;
                    case 'transcribing':
                        setVideoLoading(false);
                        setTranscriptionLoading(true);
                        setAiProcessingLoading(false);
                        break;
                    case 'detecting_template':
                    case 'applying_template':
                    case 'generating_thumbnails':
                    case 'creating_chapters':
                    case 'saving_results':
                        setVideoLoading(false);
                        setTranscriptionLoading(false);
                        setAiProcessingLoading(true);
                        break;
                    case 'completed':
                        setVideoLoading(false);
                        setTranscriptionLoading(false);
                        setAiProcessingLoading(false);
                        setIsLoading(false);
                        setSessionStatus('READY');
                        break;
                }
            }
            
            if (status.status === 'processing' || status.message?.includes('processing')) {
                setSessionStatus('PROCESSING');
            }
        };

        const handleProcessingComplete = (result: any) => {
            console.log('[Hook] ✅ Processing complete:', result);
            setProcessingStatus('Processing complete');
            setSessionStatus('READY');
            setIsLoading(false);
            setVideoLoading(false);
            setTranscriptionLoading(false);
            setAiProcessingLoading(false);
            
            // Update data with processed results
            if (result.videoPath) {
                const videoData: VideoData = {
                    filename: result.filename || 'processed_video.webm',
                    url: `${BACKEND_URL}${result.videoPath}`,
                    metadata: result.metadata || {},
                    receivedAt: new Date()
                };
                setVideoData(videoData);
                saveToStorage(sessionId, 'video', videoData);
            }
            
            if (result.audioPath && result.transcription) {
                const audioData: AudioData = {
                    filename: result.audioFilename || 'processed_audio.wav',
                    url: `${BACKEND_URL}${result.audioPath}`,
                    text: result.transcription.text || '',
                    receivedAt: new Date()
                };
                setAudioData(audioData);
                saveToStorage(sessionId, 'audio', audioData);
            }

            // Handle AI instructions if available
            if (result.instructions) {
                let instructionsList: Instruction[] = [];
                if (Array.isArray(result.instructions)) {
                    instructionsList = result.instructions;
                } else if (result.instructions.type && result.instructions.target) {
                    instructionsList = [result.instructions];
                }
                setInstructions(instructionsList);
                saveToStorage(sessionId, 'instructions', instructionsList);
            }
        };

        const handleProcessingError = (error: any) => {
            console.error('[Hook] ❌ Processing error:', error);
            setSessionStatus('ERROR');
            setIsLoading(false);
            setVideoLoading(false);
            setTranscriptionLoading(false);
            setAiProcessingLoading(false);
            setProcessingStatus('Processing failed');
            setErrors(prev => [...prev, {
                message: error.error || 'Processing failed',
                details: error.details,
                timestamp: new Date()
            }]);
        };

        // Error handler
        const handleError = (error: any) => {
            console.error('[Hook] ❌ Socket error:', error);
            setSessionStatus('ERROR');
            setIsLoading(false);
            setVideoLoading(false);
            setTranscriptionLoading(false);
            setAiProcessingLoading(false);
            setProcessingStatus('Error occurred');
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
        onSocketEvent('processing_status', handleProcessingStatus);
        onSocketEvent('processing_complete', handleProcessingComplete);
        onSocketEvent('processing_error', handleProcessingError);
        onSocketEvent('error', handleError);

        // Cleanup function
        return () => {
            console.log('[Hook] 🧹 Cleaning up WebSocket connection');
            
            // Stop polling
            stopPolling();
            
            // Remove all event handlers
            offSocketEvent('connect', handleConnect);
            offSocketEvent('disconnect', handleDisconnect);
            offSocketEvent('connect_error', handleConnectError);
            offSocketEvent('video', handleVideo);
            offSocketEvent('audio', handleAudio);
            offSocketEvent('instructions', handleInstructions);
            offSocketEvent('processing_status', handleProcessingStatus);
            offSocketEvent('processing_complete', handleProcessingComplete);
            offSocketEvent('processing_error', handleProcessingError);
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

    // Cleanup polling on unmount
    useEffect(() => {
        return () => {
            stopPolling();
        };
    }, [stopPolling]);

    // Manual retry functions
    const retryTranscription = useCallback(async () => {
        if (!sessionId) return;
        
        try {
            console.log('[Hook] Retrying transcription for session:', sessionId);
            setTranscriptionLoading(true);
            setProcessingStatus('Retrying transcription...');
            
            const response = await fetch(`${BACKEND_URL}/api/session/${sessionId}/retry`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ step: 'transcript' })
            });
            
            if (response.ok) {
                // Start polling to check for updates
                startPolling(sessionId);
            } else {
                throw new Error('Retry request failed');
            }
        } catch (error) {
            console.error('[Hook] Transcription retry failed:', error);
            setErrors(prev => [...prev, {
                message: 'Failed to retry transcription',
                details: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date()
            }]);
            setTranscriptionLoading(false);
        }
    }, [sessionId, startPolling]);

    const retryAIProcessing = useCallback(async () => {
        if (!sessionId) return;
        
        try {
            console.log('[Hook] Retrying AI processing for session:', sessionId);
            setAiProcessingLoading(true);
            setProcessingStatus('Retrying AI processing...');
            
            const response = await fetch(`${BACKEND_URL}/api/session/${sessionId}/retry`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ step: 'ai' })
            });
            
            if (response.ok) {
                // Start polling to check for updates
                startPolling(sessionId);
            } else {
                throw new Error('Retry request failed');
            }
        } catch (error) {
            console.error('[Hook] AI processing retry failed:', error);
            setErrors(prev => [...prev, {
                message: 'Failed to retry AI processing',
                details: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date()
            }]);
            setAiProcessingLoading(false);
        }
    }, [sessionId, startPolling]);

    return {
        connectionState,
        sessionStatus,
        videoData,
        audioData,
        instructions,
        errors,
        processingStatus,
        isLoading,
        videoLoading,
        transcriptionLoading,
        aiProcessingLoading,
        socket: socketRef.current,
        registerSession: registerSessionPreemptively,
        retryTranscription,
        retryAIProcessing,
        isPolling: isPollingRef.current
    };
};
