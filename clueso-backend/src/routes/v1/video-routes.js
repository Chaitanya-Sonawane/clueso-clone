const express = require('express');
const { VideoController, videoUpload } = require('../../controllers/video-controller');
const { authenticateToken } = require('../../middlewares/auth');

const router = express.Router();

// All video routes require authentication
router.use(authenticateToken);

// Video upload and processing
router.post('/projects/:projectId/videos/upload', 
  videoUpload.fields([
    { name: 'video', maxCount: 1 },
    { name: 'audio', maxCount: 1 }
  ]), 
  VideoController.uploadVideo
);

// Get all videos in a project
router.get('/projects/:projectId/videos', VideoController.getProjectVideos);

// Get specific video details with enhanced metadata
router.get('/projects/:projectId/videos/:sessionId', VideoController.getVideoDetails);

// Get video metadata (duration, audio info, etc.) - CRITICAL for timeline sync
router.get('/videos/:sessionId/metadata', VideoController.getVideoMetadata);

// Update playback state (REST fallback for WebSocket)
router.put('/videos/:sessionId/playback', VideoController.updatePlaybackState);

// Get processing status
router.get('/processing/:sessionId/status', VideoController.getProcessingStatus);

// Reprocess video with different template
router.post('/projects/:projectId/videos/:sessionId/reprocess', VideoController.reprocessVideo);

// Delete video
router.delete('/projects/:projectId/videos/:sessionId', VideoController.deleteVideo);

module.exports = router;