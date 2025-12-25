const { Server } = require("socket.io");
const { Logger } = require("../config");

class FrontendService {
    constructor() {
        this.io = null;
        this.sessions = new Map(); // sessionId -> socket
        this.messageQueue = new Map(); // sessionId -> [messages]
        this.sessionDomEvents = new Map(); // sessionId -> DOM events array (for fallback)
        this.pythonInstructionsReceived = new Map(); // sessionId -> boolean (track if Python sent instructions)
    }

    /**
     * Initialize Socket.IO server
     * @param {object} httpServer - HTTP server instance
     */
    initialize(httpServer) {
        this.io = new Server(httpServer, {
            cors: {
                origin: "*", // Configure this based on your frontend URL
                methods: ["GET", "POST"]
            }
        });

        this.io.on("connection", (socket) => {
            Logger.info(`[Frontend Service] Client connected: ${socket.id}`);

            // 🛡️ WEBSOCKET MESSAGE SAFETY
            socket.on("register", (data) => {
                let sessionId; // Declare sessionId at the function scope
                
                try {
                    // Handle both string and object data safely
                    if (typeof data === 'string') {
                        sessionId = data;
                    } else if (data && typeof data === 'object' && data.sessionId) {
                        sessionId = data.sessionId;
                    } else {
                        Logger.warn(`[Frontend Service] Client ${socket.id} sent invalid registration data`);
                        socket.emit("error", { message: "Invalid session data format" });
                        return;
                    }

                    if (!sessionId || typeof sessionId !== 'string') {
                        Logger.warn(`[Frontend Service] Client ${socket.id} tried to register without valid sessionId`);
                        socket.emit("error", { message: "Session ID is required" });
                        return;
                    }

                } catch (error) {
                    Logger.warn(`[Frontend Service] Client ${socket.id} sent invalid registration data:`, error);
                    socket.emit("error", { message: "Invalid session data format" });
                    return;
                }

                // Check if session already has a client
                if (this.sessions.has(sessionId)) {
                    const existingSocket = this.sessions.get(sessionId);
                    Logger.warn(`[Frontend Service] Session ${sessionId} already has a client, disconnecting old client`);
                    existingSocket.disconnect();
                }

                // Register new session
                this.sessions.set(sessionId, socket);
                socket.sessionId = sessionId;
                Logger.info(`[Frontend Service] Client ${socket.id} registered for session: ${sessionId}`);

                socket.emit("registered", { sessionId, message: "Successfully registered" });

                // Flush queued messages
                this._flushQueue(sessionId, socket);

                // DISABLED: Don't automatically send existing files - only show uploaded videos
                // this._sendExistingFiles(sessionId, socket);

                // DISABLED: Don't auto-send demo data - only show uploaded videos
                // Auto-send demo data for test session
                // const DEMO_SESSION_ID = 'session_1765089986708_lyv7icnrb';
                // if (sessionId === DEMO_SESSION_ID) {
                //     Logger.info(`[Frontend Service] Demo session detected, auto-sending demo data...`);
                //     // Trigger demo data send after a short delay to ensure client is ready
                //     setTimeout(() => {
                //         this._sendDemoData(sessionId);
                //     }, 500);
                // }
            });

            // Handle disconnect with error protection
            socket.on("disconnect", (reason) => {
                try {
                    if (socket.sessionId) {
                        this.sessions.delete(socket.sessionId);
                        Logger.info(`[Frontend Service] Client disconnected (${reason}) and removed from session: ${socket.sessionId}`);
                    } else {
                        Logger.info(`[Frontend Service] Unregistered client disconnected (${reason}): ${socket.id}`);
                    }
                } catch (error) {
                    Logger.error(`[Frontend Service] Error handling disconnect:`, error);
                }
            });

            // Handle errors
            socket.on("error", (error) => {
                Logger.error(`[Frontend Service] Socket error for ${socket.id}:`, error);
            });
        });

        Logger.info("[Frontend Service] Socket.IO server initialized");
    }

    /**
     * Send processing status updates to frontend
     * @param {string} sessionId - Session ID
     * @param {object} status - Processing status data
     */
    sendProcessingStatus(sessionId, status) {
        try {
            if (!sessionId || typeof sessionId !== 'string') {
                Logger.error(`[Frontend Service] Invalid sessionId provided to sendProcessingStatus`);
                return false;
            }

            if (!status || typeof status !== 'object') {
                Logger.error(`[Frontend Service] Invalid status provided to sendProcessingStatus`);
                return false;
            }

            const socket = this.sessions.get(sessionId);

            if (!socket) {
                Logger.warn(`[Frontend Service] No client connected for session: ${sessionId}. Buffering processing status.`);
                this._queueMessage(sessionId, "processing_status", status);
                return true;
            }

            Logger.info(`[Frontend Service] Sending processing status to session: ${sessionId} - ${status.currentStep} (${status.progress}%)`);
            socket.emit("processing_status", status);
            return true;
        } catch (error) {
            Logger.error(`[Frontend Service] Error sending processing status:`, error);
            return false;
        }
    }

    /**
     * Send processing completion notification to frontend
     * @param {string} sessionId - Session ID
     * @param {object} result - Processing result data
     */
    sendProcessingComplete(sessionId, result) {
        try {
            if (!sessionId || typeof sessionId !== 'string') {
                Logger.error(`[Frontend Service] Invalid sessionId provided to sendProcessingComplete`);
                return false;
            }

            if (!result || typeof result !== 'object') {
                Logger.error(`[Frontend Service] Invalid result provided to sendProcessingComplete`);
                return false;
            }

            const socket = this.sessions.get(sessionId);

            if (!socket) {
                Logger.warn(`[Frontend Service] No client connected for session: ${sessionId}. Buffering processing complete.`);
                this._queueMessage(sessionId, "processing_complete", result);
                return true;
            }

            Logger.info(`[Frontend Service] Sending processing complete to session: ${sessionId}`);
            socket.emit("processing_complete", result);
            return true;
        } catch (error) {
            Logger.error(`[Frontend Service] Error sending processing complete:`, error);
            return false;
        }
    }

    /**
     * Send processing error notification to frontend
     * @param {string} sessionId - Session ID
     * @param {object} error - Error data
     */
    sendProcessingError(sessionId, error) {
        try {
            if (!sessionId || typeof sessionId !== 'string') {
                Logger.error(`[Frontend Service] Invalid sessionId provided to sendProcessingError`);
                return false;
            }

            if (!error || typeof error !== 'object') {
                Logger.error(`[Frontend Service] Invalid error provided to sendProcessingError`);
                return false;
            }

            const socket = this.sessions.get(sessionId);

            if (!socket) {
                Logger.warn(`[Frontend Service] No client connected for session: ${sessionId}. Buffering processing error.`);
                this._queueMessage(sessionId, "processing_error", error);
                return true;
            }

            Logger.info(`[Frontend Service] Sending processing error to session: ${sessionId}`);
            socket.emit("processing_error", error);
            return true;
        } catch (error) {
            Logger.error(`[Frontend Service] Error sending processing error:`, error);
            return false;
        }
    }

    /**
     * Send video data to frontend client
     * @param {string} sessionId - Session ID
     * @param {object} videoData - Video data (filename, path, metadata, etc.)
     */
    sendVideo(sessionId, videoData) {
        try {
            if (!sessionId || typeof sessionId !== 'string') {
                Logger.error(`[Frontend Service] Invalid sessionId provided to sendVideo`);
                return false;
            }

            if (!videoData || typeof videoData !== 'object') {
                Logger.error(`[Frontend Service] Invalid videoData provided to sendVideo`);
                return false;
            }

            const socket = this.sessions.get(sessionId);

            if (!socket) {
                Logger.warn(`[Frontend Service] No client connected for session: ${sessionId}. Buffering video data.`);
                this._queueMessage(sessionId, "video", videoData);
                return true;
            }

            Logger.info(`[Frontend Service] Sending video data to session: ${sessionId} - ${videoData.filename}`);
            socket.emit("video", videoData);
            return true;
        } catch (error) {
            Logger.error(`[Frontend Service] Error sending video data:`, error);
            return false;
        }
    }

    /**
     * Send instructions to frontend client
     * @param {string} sessionId - Session ID
     * @param {object} instructions - Instructions data from Python or DOM events
     * @param {string} source - Source of instructions: 'python' or 'dom' (default: 'python')
     */
    sendInstructions(sessionId, instructions, source = 'python') {
        try {
            // 🛡️ INPUT VALIDATION (CRITICAL)
            if (!sessionId || typeof sessionId !== 'string') {
                Logger.error(`[Frontend Service] Invalid sessionId provided to sendInstructions`);
                return false;
            }

            if (!instructions || typeof instructions !== 'object') {
                Logger.error(`[Frontend Service] Invalid instructions provided to sendInstructions`);
                return false;
            }

            const socket = this.sessions.get(sessionId);

            if (!socket) {
                Logger.warn(`[Frontend Service] No client connected for session: ${sessionId}. Buffering instructions.`);
                this._queueMessage(sessionId, "instructions", instructions);
                return true; // Return true because we buffered it
            }

            // Track if Python instructions were received
            if (source === 'python') {
                this.pythonInstructionsReceived.set(sessionId, true);
                Logger.info(`[Frontend Service] Sending Python-processed instructions to session: ${sessionId}`);
            } else {
                Logger.info(`[Frontend Service] Sending DOM event as instruction to session: ${sessionId} (fallback)`);
            }

            socket.emit("instructions", instructions);
            return true;
        } catch (error) {
            Logger.error(`[Frontend Service] Error sending instructions:`, error);
            return false;
        }
    }

    /**
     * Send audio data to frontend client
     * @param {string} sessionId - Session ID
     * @param {object} audioData - Audio data from Python (filename, text, etc.)
     */
    sendAudio(sessionId, audioData) {
        const socket = this.sessions.get(sessionId);

        if (!socket) {
            Logger.warn(`[Frontend Service] No client connected for session: ${sessionId}. Buffering audio.`);
            this._queueMessage(sessionId, "audio", audioData);
            return true;
        }

        Logger.info(`[Frontend Service] Sending audio to session: ${sessionId}`);
        socket.emit("audio", audioData);
        return true;
    }

    /**
     * Send screen recording video to frontend client
     * @param {string} sessionId - Session ID
     * @param {object} videoData - Video data from Python (filename, path, etc.)
     */
    sendVideo(sessionId, videoData) {
        const socket = this.sessions.get(sessionId);

        if (!socket) {
            Logger.warn(`[Frontend Service] No client connected for session: ${sessionId}. Buffering video.`);
            this._queueMessage(sessionId, "video", videoData);
            return true;
        }

        Logger.info(`[Frontend Service] Sending screen recording to session: ${sessionId}`);
        socket.emit("video", videoData);
        return true;
    }

    /**
     * Send video processing status update to frontend client
     * @param {string} sessionId - Session ID
     * @param {object} statusData - Processing status data
     */
    sendVideoProcessingStatus(sessionId, statusData) {
        const socket = this.sessions.get(sessionId);

        if (!socket) {
            Logger.warn(`[Frontend Service] No client connected for session: ${sessionId}. Buffering processing status.`);
            this._queueMessage(sessionId, "processing_status", statusData);
            return true;
        }

        Logger.info(`[Frontend Service] Sending processing status to session: ${sessionId}`);
        socket.emit("processing_status", statusData);
        return true;
    }

    /**
     * Send video processing completion notification to frontend client
     * @param {string} sessionId - Session ID
     * @param {object} completionData - Processing completion data
     */
    sendVideoProcessingComplete(sessionId, completionData) {
        const socket = this.sessions.get(sessionId);

        if (!socket) {
            Logger.warn(`[Frontend Service] No client connected for session: ${sessionId}. Buffering processing completion.`);
            this._queueMessage(sessionId, "processing_complete", completionData);
            return true;
        }

        Logger.info(`[Frontend Service] Sending processing completion to session: ${sessionId}`);
        socket.emit("processing_complete", completionData);
        return true;
    }

    /**
     * Broadcast collaboration events to all clients in a demo session
     * @param {string} demoId - Demo/Session ID
     * @param {string} eventType - Type of event (new_comment, comment_updated, etc.)
     * @param {object} data - Event data
     */
    broadcastToDemo(demoId, eventType, data) {
        // For now, treat demoId as sessionId since we're using session-based connections
        const socket = this.sessions.get(demoId);

        if (!socket) {
            Logger.warn(`[Frontend Service] No client connected for demo: ${demoId}. Buffering collaboration event.`);
            this._queueMessage(demoId, eventType, data);
            return true;
        }

        Logger.info(`[Frontend Service] Broadcasting ${eventType} to demo: ${demoId}`);
        socket.emit(eventType, data);
        return true;
    }

    /**
     * Send new comment notification
     * @param {string} demoId - Demo/Session ID
     * @param {object} comment - Comment data
     */
    sendNewComment(demoId, comment) {
        return this.broadcastToDemo(demoId, 'new_comment', comment);
    }

    /**
     * Send comment update notification
     * @param {string} demoId - Demo/Session ID
     * @param {object} comment - Updated comment data
     */
    sendCommentUpdate(demoId, comment) {
        return this.broadcastToDemo(demoId, 'comment_updated', comment);
    }

    /**
     * Send comment resolved notification
     * @param {string} demoId - Demo/Session ID
     * @param {object} comment - Resolved comment data
     */
    sendCommentResolved(demoId, comment) {
        return this.broadcastToDemo(demoId, 'comment_resolved', comment);
    }

    /**
     * Send AI suggestions notification
     * @param {string} demoId - Demo/Session ID
     * @param {array} suggestions - AI suggestions array
     */
    sendAISuggestions(demoId, suggestions) {
        return this.broadcastToDemo(demoId, 'ai_suggestions', { suggestions });
    }

    /**
     * Send language support notification
     * @param {string} demoId - Demo/Session ID
     * @param {object} languageData - Language support data
     */
    sendLanguageSupport(demoId, languageData) {
        return this.broadcastToDemo(demoId, 'language_added', languageData);
    }

    /**
     * Send AI review notification
     * @param {string} demoId - Demo/Session ID
     * @param {object} review - AI review data
     */
    sendAIReview(demoId, review) {
        return this.broadcastToDemo(demoId, 'ai_review_generated', review);
    }

    /**
     * Helper to queue messages
     */
    _queueMessage(sessionId, type, data) {
        if (!this.messageQueue.has(sessionId)) {
            this.messageQueue.set(sessionId, []);
        }
        this.messageQueue.get(sessionId).push({ type, data, timestamp: Date.now() });
        Logger.info(`[Frontend Service] Buffered ${type} message for session: ${sessionId}. Queue size: ${this.messageQueue.get(sessionId).length}`);
    }

    /**
     * Helper to flush queued messages
     */
    _flushQueue(sessionId, socket) {
        if (this.messageQueue.has(sessionId)) {
            const queue = this.messageQueue.get(sessionId);
            if (queue.length > 0) {
                Logger.info(`[Frontend Service] Flushing ${queue.length} buffered messages for session: ${sessionId}`);

                queue.forEach(msg => {
                    Logger.info(`[Frontend Service] Sending buffered ${msg.type} to session: ${sessionId}`);
                    socket.emit(msg.type, msg.data);
                });

                // Clear queue
                this.messageQueue.delete(sessionId);
            }
        }
    }

    /**
     * Check if a session has an active connection
     * @param {string} sessionId - Session ID
     * @returns {boolean}
     */
    isSessionActive(sessionId) {
        return this.sessions.has(sessionId);
    }

    /**
     * Get count of active sessions
     * @returns {number}
     */
    getActiveSessionCount() {
        return this.sessions.size;
    }

    /**
     * Disconnect a specific session
     * @param {string} sessionId - Session ID
     */
    disconnectSession(sessionId) {
        const socket = this.sessions.get(sessionId);
        if (socket) {
            socket.disconnect();
            this.sessions.delete(sessionId);
            // Clean up session data
            this.sessionDomEvents.delete(sessionId);
            this.pythonInstructionsReceived.delete(sessionId);
            Logger.info(`[Frontend Service] Manually disconnected session: ${sessionId}`);
            return true;
        }
        return false;
    }

    /**
     * Store DOM events for a session (for fallback)
     * @param {string} sessionId - Session ID
     * @param {Array} events - Array of DOM events
     */
    storeDomEvents(sessionId, events) {
        if (!events || !Array.isArray(events)) {
            Logger.warn(`[Frontend Service] Invalid events provided for session: ${sessionId}`);
            return false;
        }

        this.sessionDomEvents.set(sessionId, events);
        Logger.info(`[Frontend Service] Stored ${events.length} DOM events for session: ${sessionId}`);
        return true;
    }

    /**
     * Get stored DOM events for a session
     * @param {string} sessionId - Session ID
     * @returns {Array|null} - DOM events or null if not found
     */
    getDomEvents(sessionId) {
        return this.sessionDomEvents.get(sessionId) || null;
    }

    /**
     * Check if Python instructions were received for a session
     * @param {string} sessionId - Session ID
     * @returns {boolean}
     */
    hasPythonInstructions(sessionId) {
        return this.pythonInstructionsReceived.get(sessionId) || false;
    }

    /**
     * Send DOM events as fallback instructions
     * @param {string} sessionId - Session ID
     * @returns {boolean} - True if events were sent, false otherwise
     */
    sendDomEventsAsFallback(sessionId) {
        const domEvents = this.getDomEvents(sessionId);

        if (!domEvents || domEvents.length === 0) {
            Logger.warn(`[Frontend Service] No DOM events available for fallback for session: ${sessionId}`);
            return false;
        }

        // Check if Python instructions were already received
        if (this.hasPythonInstructions(sessionId)) {
            Logger.info(`[Frontend Service] Python instructions already received for session: ${sessionId}, skipping fallback`);
            return false;
        }

        Logger.info(`[Frontend Service] Using DOM events as fallback for session: ${sessionId} (${domEvents.length} events)`);

        // Send each DOM event as an instruction
        domEvents.forEach((event, index) => {
            this.sendInstructions(sessionId, event, 'dom');
        });

        return true;
    }

    /**
     * Check for existing video/audio files and send them to newly connected client
     * @param {string} sessionId - Session ID
     * @param {object} socket - Socket instance
     */
    _sendExistingFiles(sessionId, socket) {
        try {
            const fs = require('fs');
            const path = require('path');

            // Check both old and new recording directories
            const recordingsDirs = [
                path.join(__dirname, '../../recordings'), // New location
                path.join(__dirname, '../recordings')     // Old location (src/recordings)
            ];

            let videoPath = null;
            let audioPath = null;
            let eventsPath = null;

            // Look for files in both directories
            for (const dir of recordingsDirs) {
                const videoFile = path.join(dir, `recording_${sessionId}_video.webm`);
                const audioFile = path.join(dir, `recording_${sessionId}_audio.webm`);

                if (fs.existsSync(videoFile)) {
                    videoPath = videoFile;
                    Logger.info(`[Frontend Service] Found existing video: ${videoFile}`);
                }
                if (fs.existsSync(audioFile)) {
                    audioPath = audioFile;
                    Logger.info(`[Frontend Service] Found existing audio: ${audioFile}`);
                }

                // Find events file with glob pattern
                try {
                    const files = fs.readdirSync(dir);
                    const eventFile = files.find(f => f.startsWith(`recording_${sessionId}_`) && f.endsWith('.json'));
                    if (eventFile) {
                        eventsPath = path.join(dir, eventFile);
                        Logger.info(`[Frontend Service] Found existing events: ${eventsPath}`);
                    }
                } catch (err) {
                    // Directory doesn't exist, continue
                }
            }

            // Send video if found
            if (videoPath) {
                const videoFilename = path.basename(videoPath);
                const videoData = {
                    filename: videoFilename,
                    path: `/recordings/${videoFilename}`,
                    metadata: { sessionId },
                    timestamp: new Date().toISOString()
                };
                
                // Send directly to this socket
                socket.emit('video', videoData);
                Logger.info(`[Frontend Service] Sent existing video to client: ${videoFilename}`);
            }

            // Send audio if found
            if (audioPath) {
                const audioFilename = path.basename(audioPath);
                
                // Try to load transcript from events file
                let transcriptText = '';
                if (eventsPath && fs.existsSync(eventsPath)) {
                    try {
                        const eventsData = JSON.parse(fs.readFileSync(eventsPath, 'utf8'));
                        transcriptText = eventsData.transcription?.text || '';
                    } catch (err) {
                        Logger.warn(`[Frontend Service] Could not load transcript from events file: ${err.message}`);
                    }
                }

                const audioData = {
                    filename: audioFilename,
                    path: `/recordings/${audioFilename}`,
                    text: transcriptText,
                    timestamp: new Date().toISOString()
                };
                
                // Send directly to this socket
                socket.emit('audio', audioData);
                Logger.info(`[Frontend Service] Sent existing audio to client: ${audioFilename}`);
            }

            // Send instructions if found
            if (eventsPath && fs.existsSync(eventsPath)) {
                try {
                    const eventsData = JSON.parse(fs.readFileSync(eventsPath, 'utf8'));
                    const events = eventsData.events || [];
                    
                    if (events.length > 0) {
                        // Send events as instructions
                        events.forEach((event) => {
                            socket.emit('instructions', event);
                        });
                        Logger.info(`[Frontend Service] Sent ${events.length} existing instructions to client`);
                    }
                } catch (err) {
                    Logger.warn(`[Frontend Service] Could not load events from file: ${err.message}`);
                }
            }

            // If no files found, log it
            if (!videoPath && !audioPath) {
                Logger.info(`[Frontend Service] No existing files found for session: ${sessionId}`);
            }

        } catch (err) {
            Logger.error(`[Frontend Service] Error sending existing files for session ${sessionId}:`, err);
        }
    }

    /**
     * Send demo data for testing (auto-triggered for demo session)
     * @param {string} sessionId - Session ID
     */
    _sendDemoData(sessionId) {
        try {
            const path = require('path');
            const fs = require('fs');

            // Configuration - Use existing session files
            const TEST_SESSION = {
                sessionId: 'session_1765089986708_lyv7icnrb',
                videoFile: 'recording_session_1765089986708_lyv7icnrb_video.webm',
                audioFile: 'processed_audio_session_1765089986708_lyv7icnrb_1765090041930.webm',
                eventsFile: 'recording_session_1765089986708_lyv7icnrb_1765090028574.json'
            };

            // File paths
            const VIDEO_PATH = path.join(__dirname, '../../src/recordings', TEST_SESSION.videoFile);
            const AUDIO_PATH = path.join(__dirname, '../../recordings', TEST_SESSION.audioFile);
            const EVENTS_PATH = path.join(__dirname, '../../src/recordings', TEST_SESSION.eventsFile);

            Logger.info('[Frontend Service] Auto-sending demo data...');

            // Verify files exist
            if (!fs.existsSync(VIDEO_PATH) || !fs.existsSync(AUDIO_PATH) || !fs.existsSync(EVENTS_PATH)) {
                Logger.error('[Frontend Service] Demo files not found');
                return;
            }

            // Load events from JSON file
            const eventsData = JSON.parse(fs.readFileSync(EVENTS_PATH, 'utf8'));
            const events = eventsData.events || [];
            const metadata = {
                sessionId: eventsData.sessionId,
                startTime: eventsData.startTime,
                endTime: eventsData.endTime,
                url: eventsData.url,
                viewport: eventsData.viewport
            };

            // 1. Send Video
            const videoData = {
                filename: TEST_SESSION.videoFile,
                path: `/recordings/${TEST_SESSION.videoFile}`,
                metadata: metadata,
                timestamp: new Date().toISOString()
            };
            this.sendVideo(sessionId, videoData);
            Logger.info('[Frontend Service] Auto-sent video');

            // 2. Send Audio
            const audioData = {
                filename: TEST_SESSION.audioFile,
                path: `/recordings/${TEST_SESSION.audioFile}`,
                text: "Hello, guys. This is Tushar, and this is my website on Vercel.",
                timestamp: new Date().toISOString()
            };
            this.sendAudio(sessionId, audioData);
            Logger.info('[Frontend Service] Auto-sent audio');

            // 3. Send Instructions (Events)
            events.forEach((event) => {
                this.sendInstructions(sessionId, event);
            });
            Logger.info(`[Frontend Service] Auto-sent ${events.length} instructions`);

        } catch (err) {
            Logger.error('[Frontend Service] Error auto-sending demo data:', err);
        }
    }
}

// Export singleton instance
module.exports = new FrontendService();
