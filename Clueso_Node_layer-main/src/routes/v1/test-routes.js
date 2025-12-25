const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { Logger } = require('../../config');

// Test endpoint to manually send video data for a session
router.get('/send-video/:sessionId', (req, res) => {
    try {
        const { sessionId } = req.params;
        const frontendService = require('../../services/frontend-service');
        
        Logger.info(`[Test Route] Manual video send requested for session: ${sessionId}`);
        
        // Check for existing files
        const recordingsDirs = [
            path.join(__dirname, '../../../recordings'), // New location
            path.join(__dirname, '../../recordings')     // Old location (src/recordings)
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
                Logger.info(`[Test Route] Found video: ${videoFile}`);
            }
            if (fs.existsSync(audioFile)) {
                audioPath = audioFile;
                Logger.info(`[Test Route] Found audio: ${audioFile}`);
            }

            // Find events file
            try {
                const files = fs.readdirSync(dir);
                const eventFile = files.find(f => f.startsWith(`recording_${sessionId}_`) && f.endsWith('.json'));
                if (eventFile) {
                    eventsPath = path.join(dir, eventFile);
                    Logger.info(`[Test Route] Found events: ${eventsPath}`);
                }
            } catch (err) {
                // Directory doesn't exist, continue
            }
        }

        if (!videoPath && !audioPath) {
            return res.status(404).json({
                success: false,
                message: `No files found for session: ${sessionId}`,
                searchedDirs: recordingsDirs
            });
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
            
            frontendService.sendVideo(sessionId, videoData);
            Logger.info(`[Test Route] Sent video: ${videoFilename}`);
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
                    Logger.warn(`[Test Route] Could not load transcript: ${err.message}`);
                }
            }

            const audioData = {
                filename: audioFilename,
                path: `/recordings/${audioFilename}`,
                text: transcriptText,
                timestamp: new Date().toISOString()
            };
            
            frontendService.sendAudio(sessionId, audioData);
            Logger.info(`[Test Route] Sent audio: ${audioFilename}`);
        }

        // Send instructions if found
        if (eventsPath && fs.existsSync(eventsPath)) {
            try {
                const eventsData = JSON.parse(fs.readFileSync(eventsPath, 'utf8'));
                const events = eventsData.events || [];
                
                if (events.length > 0) {
                    events.forEach((event) => {
                        frontendService.sendInstructions(sessionId, event);
                    });
                    Logger.info(`[Test Route] Sent ${events.length} instructions`);
                }
            } catch (err) {
                Logger.warn(`[Test Route] Could not load events: ${err.message}`);
            }
        }

        res.json({
            success: true,
            message: `Data sent for session: ${sessionId}`,
            files: {
                video: videoPath ? path.basename(videoPath) : null,
                audio: audioPath ? path.basename(audioPath) : null,
                events: eventsPath ? path.basename(eventsPath) : null
            }
        });

    } catch (error) {
        Logger.error(`[Test Route] Error:`, error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// List all available sessions
router.get('/sessions', (req, res) => {
    try {
        const recordingsDirs = [
            path.join(__dirname, '../../../recordings'),
            path.join(__dirname, '../../recordings')
        ];

        const sessions = new Set();

        for (const dir of recordingsDirs) {
            try {
                const files = fs.readdirSync(dir);
                files.forEach(file => {
                    const match = file.match(/recording_(session_[^_]+_[^_]+)_/);
                    if (match) {
                        sessions.add(match[1]);
                    }
                });
            } catch (err) {
                // Directory doesn't exist
            }
        }

        res.json({
            success: true,
            sessions: Array.from(sessions),
            count: sessions.size
        });

    } catch (error) {
        Logger.error(`[Test Route] Error listing sessions:`, error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router;