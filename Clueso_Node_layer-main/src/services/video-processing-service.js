const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { Logger } = require('../config');
const ProjectService = require('./project-service');

class VideoProcessingService {
  constructor() {
    this.processingQueue = new Map(); // sessionId -> processing status
    this.templates = {
      tutorial: {
        name: 'Tutorial Template',
        intro: { duration: 3, text: 'Tutorial: {{title}}' },
        outro: { duration: 2, text: 'Thank you for watching!' },
        watermark: { position: 'bottom-right', opacity: 0.7 }
      },
      demo: {
        name: 'Demo Template',
        intro: { duration: 2, text: 'Demo: {{title}}' },
        highlights: true,
        callouts: true,
        outro: { duration: 3, text: 'Learn more at {{website}}' }
      },
      presentation: {
        name: 'Presentation Template',
        intro: { duration: 4, text: '{{company}} Presents: {{title}}' },
        chapters: true,
        transitions: 'fade',
        outro: { duration: 3, text: 'Questions?' }
      },
      bug_report: {
        name: 'Bug Report Template',
        intro: { duration: 2, text: 'Bug Report: {{issue_id}}' },
        annotations: true,
        steps: true,
        outro: { duration: 2, text: 'Issue documented' }
      }
    };
  }

  async processVideoUpload(projectId, sessionId, videoPath, audioPath, metadata, userId) {
    try {
      Logger.info(`[Video Processing] Starting processing for session: ${sessionId}`);
      
      // Update processing status
      this.processingQueue.set(sessionId, {
        status: 'processing',
        progress: 0,
        startTime: new Date(),
        projectId,
        userId
      });

      // 1. Validate and prepare files
      const processedFiles = await this.prepareFiles(videoPath, audioPath, sessionId);
      
      // 2. Extract video metadata
      const videoMetadata = await this.extractVideoMetadata(processedFiles.videoPath);
      
      // 3. Generate transcription if audio exists
      let transcription = null;
      if (processedFiles.audioPath) {
        transcription = await this.generateTranscription(processedFiles.audioPath, sessionId);
      }

      // 4. Detect template based on content and metadata
      const detectedTemplate = await this.detectTemplate(metadata, transcription);
      
      // 5. Process video with template
      const processedVideo = await this.applyTemplate(
        processedFiles.videoPath,
        processedFiles.audioPath,
        detectedTemplate,
        metadata,
        transcription
      );

      // 6. Generate thumbnails and previews
      const thumbnails = await this.generateThumbnails(processedVideo.path, sessionId);
      
      // 7. Create video chapters/segments
      const chapters = await this.createChapters(transcription, videoMetadata);

      // 8. Save processed video and metadata to project
      const savedFiles = await this.saveProcessedVideo(
        projectId,
        sessionId,
        processedVideo,
        thumbnails,
        {
          ...metadata,
          template: detectedTemplate,
          transcription,
          chapters,
          videoMetadata,
          processingTime: Date.now() - this.processingQueue.get(sessionId).startTime
        },
        userId
      );

      // 9. Update processing status
      this.processingQueue.set(sessionId, {
        status: 'completed',
        progress: 100,
        result: savedFiles,
        completedAt: new Date()
      });

      Logger.info(`[Video Processing] Completed processing for session: ${sessionId}`);
      
      // 10. Notify frontend
      await this.notifyProcessingComplete(sessionId, savedFiles);

      return savedFiles;

    } catch (error) {
      Logger.error(`[Video Processing] Error processing video for session ${sessionId}:`, error);
      
      this.processingQueue.set(sessionId, {
        status: 'failed',
        error: error.message,
        failedAt: new Date()
      });

      throw error;
    }
  }

  async prepareFiles(videoPath, audioPath, sessionId) {
    const processedDir = path.join(__dirname, '../../processed');
    if (!fs.existsSync(processedDir)) {
      fs.mkdirSync(processedDir, { recursive: true });
    }

    const preparedFiles = {
      videoPath: null,
      audioPath: null
    };

    // Copy and validate video file
    if (videoPath && fs.existsSync(videoPath)) {
      const videoFileName = `${sessionId}_video.webm`;
      preparedFiles.videoPath = path.join(processedDir, videoFileName);
      fs.copyFileSync(videoPath, preparedFiles.videoPath);
      Logger.info(`[Video Processing] Video file prepared: ${preparedFiles.videoPath}`);
    }

    // Copy and validate audio file
    if (audioPath && fs.existsSync(audioPath)) {
      const audioFileName = `${sessionId}_audio.webm`;
      preparedFiles.audioPath = path.join(processedDir, audioFileName);
      fs.copyFileSync(audioPath, preparedFiles.audioPath);
      Logger.info(`[Video Processing] Audio file prepared: ${preparedFiles.audioPath}`);
    }

    return preparedFiles;
  }

  async extractVideoMetadata(videoPath) {
    return new Promise((resolve, reject) => {
      const ffprobe = spawn('ffprobe', [
        '-v', 'quiet',
        '-print_format', 'json',
        '-show_format',
        '-show_streams',
        videoPath
      ]);

      let output = '';
      ffprobe.stdout.on('data', (data) => {
        output += data.toString();
      });

      ffprobe.on('close', (code) => {
        if (code === 0) {
          try {
            const metadata = JSON.parse(output);
            const videoStream = metadata.streams.find(s => s.codec_type === 'video');
            
            resolve({
              duration: parseFloat(metadata.format.duration),
              width: videoStream?.width || 0,
              height: videoStream?.height || 0,
              fps: eval(videoStream?.r_frame_rate) || 30,
              bitrate: parseInt(metadata.format.bit_rate) || 0,
              size: parseInt(metadata.format.size) || 0
            });
          } catch (error) {
            reject(new Error(`Failed to parse video metadata: ${error.message}`));
          }
        } else {
          reject(new Error(`FFprobe failed with code ${code}`));
        }
      });

      ffprobe.on('error', reject);
    });
  }

  async generateTranscription(audioPath, sessionId) {
    try {
      const DeepgramService = require('./deepgram-service');
      const transcription = await DeepgramService.transcribeFile(audioPath);
      
      Logger.info(`[Video Processing] Generated transcription for session: ${sessionId}`);
      return transcription;
    } catch (error) {
      Logger.error(`[Video Processing] Transcription failed for session ${sessionId}:`, error);
      return null;
    }
  }

  async detectTemplate(metadata, transcription) {
    // AI-powered template detection based on content
    const content = transcription?.text?.toLowerCase() || '';
    const url = metadata.url?.toLowerCase() || '';
    
    // Simple rule-based detection (can be enhanced with AI)
    if (content.includes('tutorial') || content.includes('how to') || content.includes('step by step')) {
      return 'tutorial';
    } else if (content.includes('demo') || content.includes('demonstration') || content.includes('showing')) {
      return 'demo';
    } else if (content.includes('presentation') || content.includes('slides') || url.includes('slides')) {
      return 'presentation';
    } else if (content.includes('bug') || content.includes('error') || content.includes('issue')) {
      return 'bug_report';
    }
    
    // Default template
    return 'demo';
  }

  async applyTemplate(videoPath, audioPath, templateName, metadata, transcription) {
    const template = this.templates[templateName];
    const outputDir = path.join(__dirname, '../../processed/templated');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const outputPath = path.join(outputDir, `templated_${path.basename(videoPath)}`);
    
    return new Promise((resolve, reject) => {
      const ffmpegArgs = [
        '-i', videoPath
      ];

      // Add audio if available
      if (audioPath) {
        ffmpegArgs.push('-i', audioPath);
      }

      // Apply template-specific processing
      switch (templateName) {
        case 'tutorial':
          ffmpegArgs.push(
            '-vf', 'drawtext=text=\'Tutorial\\: ' + (metadata.title || 'Recording') + '\':fontcolor=white:fontsize=24:x=(w-text_w)/2:y=50:enable=\'between(t,0,3)\'',
            '-c:v', 'libx264',
            '-preset', 'medium',
            '-crf', '23'
          );
          break;
          
        case 'demo':
          ffmpegArgs.push(
            '-vf', 'drawtext=text=\'Demo\\: ' + (metadata.title || 'Recording') + '\':fontcolor=yellow:fontsize=20:x=(w-text_w)/2:y=30:enable=\'between(t,0,2)\'',
            '-c:v', 'libx264',
            '-preset', 'medium',
            '-crf', '23'
          );
          break;
          
        case 'presentation':
          ffmpegArgs.push(
            '-vf', 'drawtext=text=\'' + (metadata.company || 'Company') + ' Presents\\: ' + (metadata.title || 'Recording') + '\':fontcolor=blue:fontsize=28:x=(w-text_w)/2:y=60:enable=\'between(t,0,4)\'',
            '-c:v', 'libx264',
            '-preset', 'medium',
            '-crf', '20'
          );
          break;
          
        case 'bug_report':
          ffmpegArgs.push(
            '-vf', 'drawtext=text=\'Bug Report\\: ' + (metadata.issue_id || 'Issue') + '\':fontcolor=red:fontsize=22:x=(w-text_w)/2:y=40:enable=\'between(t,0,2)\'',
            '-c:v', 'libx264',
            '-preset', 'medium',
            '-crf', '23'
          );
          break;
          
        default:
          ffmpegArgs.push('-c:v', 'libx264', '-preset', 'medium', '-crf', '23');
      }

      // Add audio codec if audio exists
      if (audioPath) {
        ffmpegArgs.push('-c:a', 'aac', '-b:a', '128k');
      }

      ffmpegArgs.push('-y', outputPath);

      Logger.info(`[Video Processing] Applying template ${templateName} with FFmpeg:`, ffmpegArgs.join(' '));

      const ffmpeg = spawn('ffmpeg', ffmpegArgs);

      ffmpeg.stderr.on('data', (data) => {
        // Log FFmpeg progress (optional)
        const progress = data.toString();
        if (progress.includes('time=')) {
          Logger.debug(`[Video Processing] FFmpeg progress: ${progress.trim()}`);
        }
      });

      ffmpeg.on('close', (code) => {
        if (code === 0) {
          resolve({
            path: outputPath,
            template: templateName,
            size: fs.statSync(outputPath).size
          });
        } else {
          reject(new Error(`FFmpeg failed with code ${code}`));
        }
      });

      ffmpeg.on('error', reject);
    });
  }

  async generateThumbnails(videoPath, sessionId) {
    const thumbnailDir = path.join(__dirname, '../../processed/thumbnails');
    if (!fs.existsSync(thumbnailDir)) {
      fs.mkdirSync(thumbnailDir, { recursive: true });
    }

    const thumbnails = [];
    const timestamps = ['00:00:01', '25%', '50%', '75%'];

    for (let i = 0; i < timestamps.length; i++) {
      const thumbnailPath = path.join(thumbnailDir, `${sessionId}_thumb_${i}.jpg`);
      
      await new Promise((resolve, reject) => {
        const ffmpeg = spawn('ffmpeg', [
          '-i', videoPath,
          '-ss', timestamps[i],
          '-vframes', '1',
          '-q:v', '2',
          '-y', thumbnailPath
        ]);

        ffmpeg.on('close', (code) => {
          if (code === 0) {
            thumbnails.push({
              path: thumbnailPath,
              timestamp: timestamps[i],
              url: `/processed/thumbnails/${path.basename(thumbnailPath)}`
            });
            resolve();
          } else {
            reject(new Error(`Thumbnail generation failed with code ${code}`));
          }
        });

        ffmpeg.on('error', reject);
      });
    }

    Logger.info(`[Video Processing] Generated ${thumbnails.length} thumbnails for session: ${sessionId}`);
    return thumbnails;
  }

  async createChapters(transcription, videoMetadata) {
    if (!transcription || !transcription.timeline) {
      return [];
    }

    const chapters = [];
    const segments = transcription.timeline;
    const duration = videoMetadata.duration;

    // Group segments into chapters (every 30 seconds or topic change)
    let currentChapter = null;
    let chapterIndex = 0;

    for (const segment of segments) {
      const startTime = segment.start;
      
      if (!currentChapter || startTime - currentChapter.start > 30) {
        if (currentChapter) {
          currentChapter.end = startTime;
          chapters.push(currentChapter);
        }
        
        currentChapter = {
          index: chapterIndex++,
          title: this.generateChapterTitle(segment.text),
          start: startTime,
          end: duration
        };
      }
    }

    if (currentChapter) {
      chapters.push(currentChapter);
    }

    Logger.info(`[Video Processing] Created ${chapters.length} chapters`);
    return chapters;
  }

  generateChapterTitle(text) {
    // Simple chapter title generation (can be enhanced with AI)
    const words = text.split(' ').slice(0, 5);
    return words.join(' ') + (words.length === 5 ? '...' : '');
  }

  async saveProcessedVideo(projectId, sessionId, processedVideo, thumbnails, metadata, userId) {
    try {
      // Save files to project using ProjectService
      const files = await ProjectService.saveRecordingFiles(
        sessionId,
        processedVideo.path,
        null // Audio is embedded in processed video
      );

      // Save thumbnail files
      const thumbnailFiles = [];
      for (const thumbnail of thumbnails) {
        const thumbnailFile = await ProjectService.saveRecordingFiles(
          sessionId,
          thumbnail.path,
          null
        );
        thumbnailFiles.push(...thumbnailFile);
      }

      // Update recording session with processed video info
      await ProjectService.updateRecordingSession(sessionId, {
        file_path: processedVideo.path,
        metadata: {
          ...metadata,
          processed: true,
          template: processedVideo.template,
          thumbnails: thumbnails.map(t => t.url),
          fileSize: processedVideo.size
        }
      });

      // Save AI analysis for template detection and processing
      const { supabaseAdmin } = require('../config/supabase');
      await supabaseAdmin
        .from('ai_analysis')
        .insert([{
          recording_session_id: sessionId,
          analysis_type: 'video_processing',
          result: {
            template: processedVideo.template,
            chapters: metadata.chapters,
            thumbnails: thumbnails.length,
            processingTime: metadata.processingTime
          },
          confidence_score: null
        }]);

      Logger.info(`[Video Processing] Saved processed video for session: ${sessionId}`);

      return {
        processedVideo: processedVideo.path,
        thumbnails: thumbnails,
        files: [...files, ...thumbnailFiles],
        template: processedVideo.template,
        chapters: metadata.chapters
      };

    } catch (error) {
      Logger.error(`[Video Processing] Error saving processed video:`, error);
      throw error;
    }
  }

  async notifyProcessingComplete(sessionId, result) {
    try {
      const FrontendService = require('./frontend-service');
      FrontendService.sendVideoProcessingComplete(sessionId, {
        status: 'completed',
        processedVideo: `/processed/templated/${path.basename(result.processedVideo)}`,
        thumbnails: result.thumbnails,
        template: result.template,
        chapters: result.chapters,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      Logger.error(`[Video Processing] Error notifying frontend:`, error);
    }
  }

  getProcessingStatus(sessionId) {
    return this.processingQueue.get(sessionId) || { status: 'not_found' };
  }

  getAllProcessingStatuses() {
    return Array.from(this.processingQueue.entries()).map(([sessionId, status]) => ({
      sessionId,
      ...status
    }));
  }
}

module.exports = new VideoProcessingService();