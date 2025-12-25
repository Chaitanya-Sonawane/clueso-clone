import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001';

let socket: Socket | null = null;

export const getSocket = (): Socket => {
    if (!socket) {
        socket = io(SOCKET_URL, {
            transports: ['websocket', 'polling'],
            autoConnect: false,
            timeout: 20000,
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        });

        // Debug logging
        socket.on('connect', () => {
            console.log('[Socket] Connected:', socket?.id);
        });

        socket.on('disconnect', (reason) => {
            console.log('[Socket] Disconnected:', reason);
        });

        socket.on('connect_error', (error: any) => {
            console.error('[Socket] Connection error:', error);
        });

        socket.on('reconnect', (attemptNumber) => {
            console.log('[Socket] Reconnected after', attemptNumber, 'attempts');
        });

        socket.on('reconnect_error', (error) => {
            console.error('[Socket] Reconnection error:', error);
        });

        // Listen for session registration
        socket.on('registered', (data) => {
            console.log('[Socket] Registered for session:', data.sessionId);
        });

        // Listen for recording events
        socket.on('video', (data) => {
            console.log('[Socket] Video received:', data);
        });

        socket.on('audio', (data) => {
            console.log('[Socket] Audio received:', data);
        });

        socket.on('instructions', (data) => {
            console.log('[Socket] Instructions received:', data);
        });

        // Listen for collaboration events
        socket.on('new_comment', (comment) => {
            console.log('[Socket] New comment received:', comment);
        });

        socket.on('comment_resolved', (comment) => {
            console.log('[Socket] Comment resolved:', comment);
        });

        socket.on('ai_suggestions', (suggestions) => {
            console.log('[Socket] AI suggestions received:', suggestions);
        });

        socket.on('ai_review_generated', (review) => {
            console.log('[Socket] AI review generated:', review);
        });

        socket.on('language_added', (language) => {
            console.log('[Socket] Language added:', language);
        });

        // Listen for processing events
        socket.on('processing_status', (status) => {
            console.log('[Socket] Processing status:', status);
        });

        socket.on('processing_complete', (result) => {
            console.log('[Socket] Processing complete:', result);
        });

        // Listen for error events
        socket.on('error', (error) => {
            console.error('[Socket] Error received:', error);
        });
    }
    return socket;
};

export const connectSocket = (): Socket => {
    const socket = getSocket();

    if (!socket.connected) {
        console.log('[Socket] Connecting to:', SOCKET_URL);
        socket.connect();
    }

    return socket;
};

export const registerSession = (sessionId: string): void => {
    const socket = getSocket();

    if (socket.connected) {
        console.log('[Socket] Emitting register immediately for:', sessionId);
        socket.emit('register', sessionId);
    } else {
        console.log('[Socket] Waiting for connection before registering session:', sessionId);
        socket.once('connect', () => {
            console.log('[Socket] Connected, now registering session:', sessionId);
            socket.emit('register', sessionId);
        });
        
        // Connect if not already connected
        if (!socket.connected) {
            socket.connect();
        }
    }
};

export const disconnectSocket = (): void => {
    if (socket) {
        console.log('[Socket] Disconnecting...');
        socket.disconnect();
        socket = null;
    }
};

// Event listener helpers for components
export const onSocketEvent = (event: string, callback: (data: any) => void): void => {
    const socket = getSocket();
    socket.on(event, callback);
};

export const offSocketEvent = (event: string, callback?: (data: any) => void): void => {
    const socket = getSocket();
    if (callback) {
        socket.off(event, callback);
    } else {
        socket.off(event);
    }
};

export const emitSocketEvent = (event: string, data?: any): void => {
    const socket = getSocket();
    if (socket.connected) {
        socket.emit(event, data);
    } else {
        console.warn('[Socket] Cannot emit event - not connected:', event);
    }
};
