const VideoProcessingService = require('../services/video-processing-service');
const ProjectService = require('../services/project-service');
const { StatusCodes } = require('http-status-codes');
const { Logger } = require('../config');
const multer = require('multer');
const path = require('path');

// Configure multer for video uploads
const videoUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = path.join(__dirname, '../../uploads/videos');
      const fs = require('fs');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const sessionId = req.body.sessionId || Date.now();
      const extension = path.extname(file.originalname);
      cb(null, `${sessionId}_${file.fieldname}${extension}`);
    }
  }),
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept video and audio files
    if (file.mimetype.startsWith('video/') || file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Only video and audio files are allowed'));
    }
  }
});

class VideoController {
  async uploadVideo(req, res) {
    try {
      const { projectId } = req.params;
      const { sessionId, title, description, template } = req.body;
      const userId = req.user.id;

      // Verify user has access to project
      const project = await ProjectService.getProject(projectId, userId);
      if (!project) {
        return res.status(StatusCodes.NOT_FOUND).json({
          success: false,
          message: 'Project not found'
        });
      }

      // Get uploaded files
      const videoFile = req.files?.video?.[0];
      const audioFile = req.files?.audio?.[0];

      if (!videoFile) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: 'Video file is required'
        });
      }

      Logger.info(`[Video Controller] Processing video upload for project: ${projectId}, session: ${sessionId}`);

      // Create or update recording session
      let recordingSession;
      if (sessionId) {
        // Update existing session
        recordingSession = await ProjectService.updateRecordingSession(sessionId, {
          session_name: title,
          metadata: {
            title,
            description,
            template,
            uploadedAt: new Date().toISOString()
          }
        });
      } else {
        // Create new session
        recordingSession = await ProjectService.createRecordingSession({
          project_id: projectId,
          user_id: userId,
          session_name: title || 'Video Upload',
          metadata: {
            title,
            description,
            template,
            uploadedAt: new Date().toISOString()
          }
        });
      }

      const actualSessionId = recordingSession.id;

      // Start video processing in background
      VideoProcessingService.processVideoUpload(
        projectId,
        actualSessionId,
        videoFile.path,
        audioFile?.path,
        {
          title,
          description,
          template,
          projectId,
          sessionId: actualSessionId,
          originalFilename: videoFile.originalname,
          uploadedBy: userId
        },
        userId
      ).catch(error => {
        Logger.error(`[Video Controller] Background processing failed for session ${actualSessionId}:`, error);
      });

      res.status(StatusCodes.ACCEPTED).json({
        success: true,
        message: 'Video upload received and processing started',
        data: {
          sessionId: actualSessionId,
          projectId: projectId,
          status: 'processing',
          uploadedFiles: {
            video: videoFile.filename,
            audio: audioFile?.filename
          }
        }
      });

    } catch (error) {
      Logger.error('Video upload error:', error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message
      });
    }
  }

  async getProcessingStatus(req, res) {
    try {
      const { sessionId } = req.params;
      const status = VideoProcessingService.getProcessingStatus(sessionId);

      res.status(StatusCodes.OK).json({
        success: true,
        data: status
      });
    } catch (error) {
      Logger.error('Get processing status error:', error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message
      });
    }
  }

  async getProjectVideos(req, res) {
    try {
      const { projectId } = req.params;
      const userId = req.user.id;

      // Verify user has access to project
      const project = await ProjectService.getProject(projectId, userId);
      if (!project) {
        return res.status(StatusCodes.NOT_FOUND).json({
          success: false,
          message: 'Project not found'
        });
      }

      const recordings = await ProjectService.getProjectRecordings(projectId);

      // Filter for processed videos and add processing status
      const videos = recordings.map(recording => {
        const processingStatus = VideoProcessingService.getProcessingStatus(recording.id);
        
        return {
          ...recording,
          processingStatus: processingStatus.status || 'unknown',
          isProcessed: recording.metadata?.processed || false,
          template: recording.metadata?.template,
          thumbnails: recording.metadata?.thumbnails || [],
          chapters: recording.metadata?.chapters || []
        };
      });

      res.status(StatusCodes.OK).json({
        success: true,
        data: {
          project: project,
          videos: videos
        }
      });

    } catch (error) {
      Logger.error('Get project videos error:', error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message
      });
    }
  }

  async getVideoDetails(req, res) {
    try {
      const { projectId, sessionId } = req.params;
      const userId = req.user.id;

      // Verify user has access to project
      const project = await ProjectService.getProject(projectId, userId);
      if (!project) {
        return res.status(StatusCodes.NOT_FOUND).json({
          success: false,
          message: 'Project not found'
        });
      }

      // Get recording session details
      const recordings = await ProjectService.getProjectRecordings(projectId);
      const recording = recordings.find(r => r.id === sessionId);

      if (!recording) {
        return res.status(StatusCodes.NOT_FOUND).json({
          success: false,
          message: 'Video not found'
        });
      }

      // Get processing status
      const processingStatus = VideoProcessingService.getProcessingStatus(sessionId);

      res.status(StatusCodes.OK).json({
        success: true,
        data: {
          ...recording,
          processingStatus: processingStatus.status || 'unknown',
          processingDetails: processingStatus
        }
      });

    } catch (error) {
      Logger.error('Get video details error:', error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message
      });
    }
  }

  async reprocessVideo(req, res) {
    try {
      const { projectId, sessionId } = req.params;
      const { template } = req.body;
      const userId = req.user.id;

      // Verify user has access to project
      const project = await ProjectService.getProject(projectId, userId);
      if (!project) {
        return res.status(StatusCodes.NOT_FOUND).json({
          success: false,
          message: 'Project not found'
        });
      }

      // Get recording session
      const recordings = await ProjectService.getProjectRecordings(projectId);
      const recording = recordings.find(r => r.id === sessionId);

      if (!recording) {
        return res.status(StatusCodes.NOT_FOUND).json({
          success: false,
          message: 'Video not found'
        });
      }

      // Find original video file
      const videoFile = recording.files?.find(f => f.file_type?.startsWith('video/'));
      const audioFile = recording.files?.find(f => f.file_type?.startsWith('audio/'));

      if (!videoFile) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: 'Original video file not found'
        });
      }

      // Start reprocessing
      VideoProcessingService.processVideoUpload(
        projectId,
        sessionId,
        videoFile.file_path,
        audioFile?.file_path,
        {
          ...recording.metadata,
          template: template || recording.metadata?.template,
          reprocessedAt: new Date().toISOString()
        },
        userId
      ).catch(error => {
        Logger.error(`[Video Controller] Reprocessing failed for session ${sessionId}:`, error);
      });

      res.status(StatusCodes.ACCEPTED).json({
        success: true,
        message: 'Video reprocessing started',
        data: {
          sessionId: sessionId,
          template: template || recording.metadata?.template,
          status: 'processing'
        }
      });

    } catch (error) {
      Logger.error('Reprocess video error:', error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message
      });
    }
  }

  async deleteVideo(req, res) {
    try {
      const { projectId, sessionId } = req.params;
      const userId = req.user.id;

      // Verify user has access to project
      const project = await ProjectService.getProject(projectId, userId);
      if (!project) {
        return res.status(StatusCodes.NOT_FOUND).json({
          success: false,
          message: 'Project not found'
        });
      }

      // Delete recording session and associated files
      const { supabaseAdmin } = require('../config/supabase');
      
      // Delete files from storage
      const { data: files } = await supabaseAdmin
        .from('files')
        .select('file_path')
        .eq('recording_session_id', sessionId);

      if (files) {
        const fs = require('fs');
        files.forEach(file => {
          if (file.file_path && fs.existsSync(file.file_path)) {
            fs.unlinkSync(file.file_path);
          }
        });
      }

      // Delete database records
      await supabaseAdmin
        .from('recording_sessions')
        .delete()
        .eq('id', sessionId)
        .eq('user_id', userId);

      Logger.info(`[Video Controller] Deleted video session: ${sessionId}`);

      res.status(StatusCodes.OK).json({
        success: true,
        message: 'Video deleted successfully'
      });

    } catch (error) {
      Logger.error('Delete video error:', error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = {
  VideoController: new VideoController(),
  videoUpload
};