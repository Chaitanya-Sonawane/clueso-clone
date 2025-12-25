const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { Logger } = require('../../config');

/**
 * Session status and polling endpoints for WebSocket fallback
 */

/**
 * Get session status and progress
 * GET /api/session/:sessionId/status
 */
router.get('/:sessionId/status', async (req, res) => {
    try {
        const { sessionId } = req.params;
        
        Logger.info(`[Session API] Status request for session: ${sessionId}`);
        
        // Check for existing files in both recording directories
        const recordingsDirs = [
            path.join(__dirname, '../../../recordings'), // New location
            path.join(__dirname, '../../recordings')     // Old location (src/recordings)
        ];

        let videoPath = null;
        let audioPath = null;
        let eventsPath = null;
        let transcriptText = '';
        let hasInstructions = false;

        // Look for files in both directories
        for (const dir of recordingsDirs) {
            const videoFile = path.join(dir, `recording_${sessionId}_video.webm`);
            const audioFile = path.join(dir, `recording_${sessionId}_audio.webm`);

            if (fs.existsSync(videoFile)) {
                videoPath = videoFile;
            }
            if (fs.existsSync(audioFile)) {
                audioPath = audioFile;
            }

            // Find events file with glob pattern
            try {
                const files = fs.readdirSync(dir);
                const eventFile = files.find(f => f.startsWith(`recording_${sessionId}_`) && f.endsWith('.json'));
                if (eventFile) {
                    eventsPath = path.join(dir, eventFile);
                    
                    // Load transcript and instructions
                    const eventsData = JSON.parse(fs.readFileSync(eventsPath, 'utf8'));
                    transcriptText = eventsData.transcription?.text || '';
                    hasInstructions = eventsData.events && eventsData.events.length > 0;
                }
            } catch (err) {
                // Directory doesn't exist or file read error, continue
            }
        }

        // Determine session status based on available files
        let status = 'UPLOADED';
        let progress = 0;
        let message = 'Session initialized';

        if (videoPath && audioPath && transcriptText && hasInstructions) {
            status = 'READY';
            progress = 100;
            message = 'Processing complete';
        } else if (videoPath && audioPath && transcriptText) {
            status = 'AI_PROCESSING';
            progress = 80;
            message = 'Generating AI insights...';
        } else if (videoPath && audioPath) {
            status = 'TRANSCRIBING';
            progress = 60;
            message = 'Transcribing audio...';
        } else if (videoPath) {
            status = 'PROCESSING';
            progress = 30;
            message = 'Processing video...';
        }

        const response = {
            success: true,
            sessionId,
            status,
            progress,
            message,
            timestamp: new Date().toISOString(),
            files: {
                hasVideo: !!videoPath,
                hasAudio: !!audioPath,
                hasTranscript: !!transcriptText,
                hasInstructions
            }
        };

        Logger.info(`[Session API] Status response for ${sessionId}: ${status} (${progress}%)`);
        res.json(response);

    } catch (error) {
        Logger.error(`[Session API] Error getting session status:`, error);
        res.status(500).json({
            success: false,
            error: 'Failed to get session status',
            message: error.message
        });
    }
});

/**
 * Get session transcript
 * GET /api/session/:sessionId/transcript
 */
router.get('/:sessionId/transcript', async (req, res) => {
    try {
        const { sessionId } = req.params;
        
        Logger.info(`[Session API] Transcript request for session: ${sessionId}`);
        
        // Check for transcript in events files
        const recordingsDirs = [
            path.join(__dirname, '../../../recordings'),
            path.join(__dirname, '../../recordings')
        ];

        let transcriptData = null;

        for (const dir of recordingsDirs) {
            try {
                const files = fs.readdirSync(dir);
                const eventFile = files.find(f => f.startsWith(`recording_${sessionId}_`) && f.endsWith('.json'));
                
                if (eventFile) {
                    const eventsPath = path.join(dir, eventFile);
                    const eventsData = JSON.parse(fs.readFileSync(eventsPath, 'utf8'));
                    
                    if (eventsData.transcription?.text) {
                        transcriptData = {
                            text: eventsData.transcription.text,
                            segments: eventsData.transcription.segments || [],
                            confidence: eventsData.transcription.confidence || 0.8,
                            language: eventsData.transcription.language || 'en',
                            timestamp: eventsData.transcription.timestamp || new Date().toISOString()
                        };
                        break;
                    }
                }
            } catch (err) {
                // Continue to next directory
            }
        }

        if (transcriptData) {
            Logger.info(`[Session API] Transcript found for ${sessionId}: ${transcriptData.text.length} characters`);
            res.json({
                success: true,
                sessionId,
                transcript: transcriptData,
                timestamp: new Date().toISOString()
            });
        } else {
            Logger.info(`[Session API] No transcript found for ${sessionId}`);
            res.json({
                success: true,
                sessionId,
                transcript: null,
                message: 'Transcript not yet available',
                timestamp: new Date().toISOString()
            });
        }

    } catch (error) {
        Logger.error(`[Session API] Error getting transcript:`, error);
        res.status(500).json({
            success: false,
            error: 'Failed to get transcript',
            message: error.message
        });
    }
});

/**
 * Get session AI insights
 * GET /api/session/:sessionId/insights
 */
router.get('/:sessionId/insights', async (req, res) => {
    try {
        const { sessionId } = req.params;
        
        Logger.info(`[Session API] Insights request for session: ${sessionId}`);
        
        // Check for AI insights in events files
        const recordingsDirs = [
            path.join(__dirname, '../../../recordings'),
            path.join(__dirname, '../../recordings')
        ];

        let insightsData = null;

        for (const dir of recordingsDirs) {
            try {
                const files = fs.readdirSync(dir);
                const eventFile = files.find(f => f.startsWith(`recording_${sessionId}_`) && f.endsWith('.json'));
                
                if (eventFile) {
                    const eventsPath = path.join(dir, eventFile);
                    const eventsData = JSON.parse(fs.readFileSync(eventsPath, 'utf8'));
                    
                    if (eventsData.events && eventsData.events.length > 0) {
                        insightsData = {
                            instructions: eventsData.events,
                            summary: eventsData.summary || 'AI analysis complete',
                            confidence: eventsData.aiConfidence || 0.85,
                            timestamp: eventsData.aiTimestamp || new Date().toISOString()
                        };
                        break;
                    }
                }
            } catch (err) {
                // Continue to next directory
            }
        }

        if (insightsData) {
            Logger.info(`[Session API] Insights found for ${sessionId}: ${insightsData.instructions.length} instructions`);
            res.json({
                success: true,
                sessionId,
                insights: insightsData,
                timestamp: new Date().toISOString()
            });
        } else {
            Logger.info(`[Session API] No insights found for ${sessionId}`);
            res.json({
                success: true,
                sessionId,
                insights: null,
                message: 'AI insights not yet available',
                timestamp: new Date().toISOString()
            });
        }

    } catch (error) {
        Logger.error(`[Session API] Error getting insights:`, error);
        res.status(500).json({
            success: false,
            error: 'Failed to get insights',
            message: error.message
        });
    }
});

/**
 * Trigger manual retry for session processing
 * POST /api/session/:sessionId/retry
 */
router.post('/:sessionId/retry', async (req, res) => {
    try {
        const { sessionId } = req.params;
        const { step } = req.body; // 'transcript' or 'ai'
        
        Logger.info(`[Session API] Manual retry requested for ${sessionId}, step: ${step}`);
        
        // Here you would trigger the appropriate processing step
        // For now, just return success - implement actual retry logic as needed
        
        res.json({
            success: true,
            sessionId,
            step,
            message: `Retry triggered for ${step} processing`,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        Logger.error(`[Session API] Error triggering retry:`, error);
        res.status(500).json({
            success: false,
            error: 'Failed to trigger retry',
            message: error.message
        });
    }
});

module.exports = router;