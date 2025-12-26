const { spawn } = require('child_process');
const { Logger } = require('../config');

class VideoMetadataService {
    /**
     * Extract comprehensive video metadata including original duration and audio info
     * @param {string} videoPath - Path to video file
     * @returns {Promise<object>} Video metadata with duration, audio info, etc.
     */
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
            let error = '';

            ffprobe.stdout.on('data', (data) => {
                output += data.toString();
            });

            ffprobe.stderr.on('data', (data) => {
                error += data.toString();
            });

            ffprobe.on('close', (code) => {
                if (code !== 0) {
                    Logger.error(`[Video Metadata] FFprobe failed: ${error}`);
                    return reject(new Error(`FFprobe failed with code ${code}: ${error}`));
                }

                try {
                    const metadata = JSON.parse(output);
                    const processedMetadata = this.processMetadata(metadata);
                    Logger.info(`[Video Metadata] Extracted metadata for ${videoPath}:`, processedMetadata);
                    resolve(processedMetadata);
                } catch (parseError) {
                    Logger.error(`[Video Metadata] Failed to parse FFprobe output:`, parseError);
                    reject(parseError);
                }
            });
        });
    }

    /**
     * Process raw FFprobe metadata into structured format
     * @param {object} rawMetadata - Raw FFprobe output
     * @returns {object} Processed metadata
     */
    processMetadata(rawMetadata) {
        const { format, streams } = rawMetadata;
        
        // Find video and audio streams
        const videoStream = streams.find(s => s.codec_type === 'video');
        const audioStream = streams.find(s => s.codec_type === 'audio');

        // Extract original duration (always from format, not streams)
        const originalDuration = parseFloat(format.duration) || 0;
        
        // Video stream info
        const videoInfo = videoStream ? {
            width: parseInt(videoStream.width) || 0,
            height: parseInt(videoStream.height) || 0,
            fps: this.calculateFPS(videoStream.r_frame_rate),
            codec: videoStream.codec_name,
            bitrate: parseInt(videoStream.bit_rate) || 0,
            pixelFormat: videoStream.pix_fmt
        } : null;

        // Audio stream info
        const audioInfo = audioStream ? {
            codec: audioStream.codec_name,
            sampleRate: parseInt(audioStream.sample_rate) || 0,
            channels: parseInt(audioStream.channels) || 0,
            bitrate: parseInt(audioStream.bit_rate) || 0,
            duration: parseFloat(audioStream.duration) || originalDuration
        } : null;

        return {
            // Core timing info (CRITICAL for timeline sync)
            originalDuration,
            currentTime: 0, // Will be updated by playback state
            
            // Audio sync info
            hasAudio: !!audioStream,
            audioTrackDuration: audioInfo ? audioInfo.duration : 0,
            
            // File info
            fileSize: parseInt(format.size) || 0,
            bitrate: parseInt(format.bit_rate) || 0,
            
            // Stream details
            video: videoInfo,
            audio: audioInfo,
            
            // Technical details
            formatName: format.format_name,
            formatLongName: format.format_long_name,
            streamCount: streams.length,
            
            // Timestamps
            extractedAt: new Date().toISOString(),
            
            // Raw metadata for debugging
            _raw: {
                format: format,
                streams: streams.map(s => ({
                    index: s.index,
                    codec_type: s.codec_type,
                    codec_name: s.codec_name,
                    duration: s.duration
                }))
            }
        };
    }

    /**
     * Calculate FPS from FFprobe frame rate string
     * @param {string} frameRate - Frame rate string like "30/1" or "29.97"
     * @returns {number} FPS as decimal
     */
    calculateFPS(frameRate) {
        if (!frameRate) return 0;
        
        if (frameRate.includes('/')) {
            const [num, den] = frameRate.split('/').map(parseFloat);
            return den > 0 ? num / den : 0;
        }
        
        return parseFloat(frameRate) || 0;
    }

    /**
     * Validate video file and extract basic info quickly
     * @param {string} videoPath - Path to video file
     * @returns {Promise<object>} Basic validation info
     */
    async validateVideoFile(videoPath) {
        try {
            const metadata = await this.extractVideoMetadata(videoPath);
            
            return {
                isValid: metadata.originalDuration > 0,
                duration: metadata.originalDuration,
                hasAudio: metadata.hasAudio,
                hasVideo: !!metadata.video,
                error: null
            };
        } catch (error) {
            Logger.error(`[Video Metadata] Validation failed for ${videoPath}:`, error);
            return {
                isValid: false,
                duration: 0,
                hasAudio: false,
                hasVideo: false,
                error: error.message
            };
        }
    }
}

module.exports = new VideoMetadataService();