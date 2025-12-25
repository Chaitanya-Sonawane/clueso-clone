const { createClient } = require('@deepgram/sdk');
const fs = require('fs');
const { Logger } = require('../config');

class DeepgramService {
  constructor() {
    const apiKey = process.env.DEEPGRAM_API_KEY;

    if (!apiKey) {
      Logger.warn('[Deepgram] API key missing');
      this.client = null;
      return;
    }

    Logger.info('[Deepgram] Client initialized');
    this.client = createClient(apiKey);
  }

  /**
   * Transcribe from file path
   */
  async transcribeFile(audioPath, userOptions = {}) {
    try {
      if (!this.client) throw new Error('Deepgram not configured');

      if (!fs.existsSync(audioPath)) {
        Logger.error(`[Deepgram] File missing: ${audioPath}`);
        throw new Error(`File not found: ${audioPath}`);
      }

      Logger.info(`[Deepgram] Transcribing file: ${audioPath}`);

      const audioStream = fs.createReadStream(audioPath);
      const options = this._buildOptions(audioPath, userOptions);

      const { result, error } = await this.client.listen.prerecorded.transcribeFile(audioStream, options);

      if (error) throw error;

      Logger.info('[Deepgram] File transcription complete');

      return this._formatResult(result);
    } catch (err) {
      Logger.error('[Deepgram] File transcription failed:', err);
      throw err;
    }
  }

  /**
   * Transcribe from Buffer
   */
  async transcribeBuffer(audioBuffer, userOptions = {}) {
    try {
      if (!this.client) throw new Error('Deepgram not configured');

      if (!Buffer.isBuffer(audioBuffer)) {
        Logger.error('[Deepgram] Passed buffer is not a Buffer');
        throw new Error('audioBuffer must be a Buffer');
      }

      Logger.info(`[Deepgram] Transcribing buffer (${audioBuffer.length} bytes)`);

      const options = this._buildOptions(null, userOptions);

      const { result, error } = await this.client.listen.prerecorded.transcribeFile(audioBuffer, options);

      if (error) throw error;

      Logger.info('[Deepgram] Buffer transcription complete');

      return this._formatResult(result);
    } catch (err) {
      Logger.error('[Deepgram] Buffer transcription failed:', err);
      throw err;
    }
  }

  /**
   * Deepgram request options with enhanced features
   */
  _buildOptions(audioPath, userOptions) {
    Logger.info('[Deepgram] Building enhanced transcription options');

    return {
      model: 'nova-2',
      language: 'en-US',
      punctuate: true,
      diarize: true, // Enable speaker detection
      utterances: true,
      utterance_silence: 100,
      filler_words: true,
      paragraphs: true, // Enable paragraph detection
      summarize: true, // Enable AI summarization
      detect_language: true, // Auto-detect language
      smart_format: true, // Smart formatting
      profanity_filter: false,
      redact: false,
      search: [], // Can add search terms
      keywords: [], // Can add keywords for boosting
      mimetype: audioPath ? this._detectMimeType(audioPath) : 'audio/webm',
      
      ...userOptions,
    };
  }

  /**
   * Build enhanced result object with detailed analysis
   */
  _formatResult(result) {
    Logger.info('[Deepgram] Formatting enhanced result');

    const utterances = result?.results?.utterances || [];
    const channels = result?.results?.channels || [];
    const paragraphs = result?.results?.paragraphs?.paragraphs || [];
    const summary = result?.results?.summary;

    // Build timeline with enhanced information
    const timeline = utterances.map(u => ({
      start: u.start,
      end: u.end,
      text: u.transcript.trim() || '—',
      type: u.transcript.trim() ? 'speech' : 'silence',
      confidence: u.confidence || 0,
      speaker: u.speaker || 0,
      words: u.words || []
    }));

    // Extract speakers information
    const speakers = [...new Set(utterances.map(u => u.speaker).filter(s => s !== undefined))];
    
    // Build paragraphs for better readability
    const formattedParagraphs = paragraphs.map(p => ({
      start: p.start,
      end: p.end,
      text: p.transcript,
      sentences: p.sentences || []
    }));

    // Extract key phrases and topics
    const words = channels[0]?.alternatives?.[0]?.words || [];
    const keyPhrases = this._extractKeyPhrases(words);
    
    const text = timeline.map(t => t.text).join(' ');

    Logger.info('[Deepgram] Enhanced timeline built with', timeline.length, 'segments');
    Logger.info('[Deepgram] Found', speakers.length, 'speakers');
    Logger.info('[Deepgram] Extracted', keyPhrases.length, 'key phrases');

    return {
      text,                    // main readable transcript
      timeline,               // enhanced timeline with speakers and confidence
      paragraphs: formattedParagraphs, // paragraph-based structure
      speakers,               // list of detected speakers
      keyPhrases,            // important phrases and topics
      summary: summary?.short || '', // AI-generated summary
      metadata: {
        ...result.metadata,
        duration: result.metadata?.duration || 0,
        language: result.metadata?.detected_language || 'en',
        confidence: this._calculateOverallConfidence(timeline)
      },
      raw: result
    };
  }

  /**
   * Extract key phrases from words
   */
  _extractKeyPhrases(words) {
    if (!words || words.length === 0) return [];
    
    // Simple key phrase extraction based on confidence and length
    const phrases = [];
    let currentPhrase = [];
    
    words.forEach(word => {
      if (word.confidence > 0.8 && word.word.length > 3) {
        currentPhrase.push(word.word);
      } else if (currentPhrase.length > 0) {
        if (currentPhrase.length >= 2) {
          phrases.push(currentPhrase.join(' '));
        }
        currentPhrase = [];
      }
    });
    
    // Add final phrase if exists
    if (currentPhrase.length >= 2) {
      phrases.push(currentPhrase.join(' '));
    }
    
    return phrases.slice(0, 10); // Return top 10 key phrases
  }

  /**
   * Calculate overall confidence score
   */
  _calculateOverallConfidence(timeline) {
    if (!timeline || timeline.length === 0) return 0;
    
    const confidenceScores = timeline
      .filter(t => t.confidence > 0)
      .map(t => t.confidence);
    
    if (confidenceScores.length === 0) return 0;
    
    return confidenceScores.reduce((sum, conf) => sum + conf, 0) / confidenceScores.length;
  }

  /**
   * Infer mimetype
   */
  _detectMimeType(filePath) {
    // 🛡️ Safe string operations with validation
    if (!filePath || typeof filePath !== 'string') {
      return 'audio/webm';
    }
    
    const parts = filePath.toLowerCase().split('.');
    const ext = parts.length > 1 ? parts.pop() : '';
    
    const map = {
      webm: 'audio/webm',
      wav: 'audio/wav',
      mp3: 'audio/mpeg',
      m4a: 'audio/m4a',
      ogg: 'audio/ogg',
      flac: 'audio/flac',
      mp4: 'audio/mp4',
    };
    return map[ext] || 'audio/webm';
  }
}

module.exports = new DeepgramService();
