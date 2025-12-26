const { createClient } = require('@deepgram/sdk');
const fs = require('fs');
const { Logger } = require('../config');

class DeepgramService {
  constructor() {
    const apiKey = process.env.DEEPGRAM_API_KEY;

    if (!apiKey) {
      Logger.warn('[Deepgram] API key missing - transcription will use fallback mode');
      this.client = null;
      this.fallbackMode = true;
      return;
    }

    try {
      Logger.info('[Deepgram] Client initialized');
      this.client = createClient(apiKey);
      this.fallbackMode = false;
      
      // Test connection on startup
      this._testConnection();
    } catch (error) {
      Logger.error('[Deepgram] Failed to initialize client:', error);
      this.client = null;
      this.fallbackMode = true;
    }
  }

  /**
   * Test Deepgram connection
   */
  async _testConnection() {
    try {
      // Simple test to validate API key and connection
      const testBuffer = Buffer.from('test');
      await this.client.listen.prerecorded.transcribeFile(testBuffer, {
        model: 'nova-2',
        language: 'en-US'
      });
      Logger.info('[Deepgram] Connection test successful');
    } catch (error) {
      Logger.warn('[Deepgram] Connection test failed, will use fallback mode:', error.message);
      this.fallbackMode = true;
    }
  }

  /**
   * Enhanced transcribe from file path with retry mechanism
   */
  async transcribeFile(audioPath, userOptions = {}) {
    const maxRetries = 3;
    let lastError = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        if (this.fallbackMode || !this.client) {
          return this._generateFallbackTranscription(audioPath);
        }

        if (!fs.existsSync(audioPath)) {
          Logger.error(`[Deepgram] File missing: ${audioPath}`);
          throw new Error(`File not found: ${audioPath}`);
        }

        Logger.info(`[Deepgram] Transcribing file: ${audioPath} (attempt ${attempt}/${maxRetries})`);

        const audioStream = fs.createReadStream(audioPath);
        const options = this._buildOptions(audioPath, userOptions);

        const { result, error } = await this.client.listen.prerecorded.transcribeFile(audioStream, options);

        if (error) {
          throw new Error(`Deepgram API error: ${error.message || error}`);
        }

        if (!result || !result.results) {
          throw new Error('Invalid response from Deepgram API');
        }

        Logger.info('[Deepgram] File transcription complete');
        return this._formatResult(result);

      } catch (err) {
        lastError = err;
        Logger.error(`[Deepgram] File transcription attempt ${attempt} failed:`, err);
        
        if (attempt === maxRetries) {
          Logger.error('[Deepgram] All transcription attempts failed, using fallback');
          return this._generateFallbackTranscription(audioPath, err.message);
        }
        
        // Wait before retry (exponential backoff)
        await this._sleep(1000 * Math.pow(2, attempt - 1));
      }
    }

    return this._generateFallbackTranscription(audioPath, lastError?.message);
  }

  /**
   * Enhanced transcribe from Buffer with retry mechanism
   */
  async transcribeBuffer(audioBuffer, userOptions = {}) {
    const maxRetries = 3;
    let lastError = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        if (this.fallbackMode || !this.client) {
          return this._generateFallbackTranscription(null, 'Deepgram service unavailable');
        }

        if (!Buffer.isBuffer(audioBuffer)) {
          Logger.error('[Deepgram] Passed buffer is not a Buffer');
          throw new Error('audioBuffer must be a Buffer');
        }

        if (audioBuffer.length === 0) {
          throw new Error('Audio buffer is empty');
        }

        Logger.info(`[Deepgram] Transcribing buffer (${audioBuffer.length} bytes) (attempt ${attempt}/${maxRetries})`);

        const options = this._buildOptions(null, userOptions);

        const { result, error } = await this.client.listen.prerecorded.transcribeFile(audioBuffer, options);

        if (error) {
          throw new Error(`Deepgram API error: ${error.message || error}`);
        }

        if (!result || !result.results) {
          throw new Error('Invalid response from Deepgram API');
        }

        Logger.info('[Deepgram] Buffer transcription complete');
        return this._formatResult(result);

      } catch (err) {
        lastError = err;
        Logger.error(`[Deepgram] Buffer transcription attempt ${attempt} failed:`, err);
        
        if (attempt === maxRetries) {
          Logger.error('[Deepgram] All transcription attempts failed, using fallback');
          return this._generateFallbackTranscription(null, err.message);
        }
        
        // Wait before retry (exponential backoff)
        await this._sleep(1000 * Math.pow(2, attempt - 1));
      }
    }

    return this._generateFallbackTranscription(null, lastError?.message);
  }

  /**
   * Generate fallback transcription when Deepgram fails
   */
  _generateFallbackTranscription(audioPath, errorMessage = 'Transcription service unavailable') {
    Logger.warn(`[Deepgram] Generating fallback transcription: ${errorMessage}`);
    
    const fallbackText = 'Audio transcription is currently unavailable. Please try again later or check your audio file format.';
    
    return {
      text: fallbackText,
      timeline: [{
        start: 0,
        end: 30,
        text: fallbackText,
        type: 'fallback',
        confidence: 0,
        speaker: 0,
        words: []
      }],
      paragraphs: [{
        start: 0,
        end: 30,
        text: fallbackText,
        sentences: [fallbackText]
      }],
      speakers: [0],
      keyPhrases: [],
      summary: 'Transcription service temporarily unavailable',
      metadata: {
        duration: 30,
        language: 'en',
        confidence: 0,
        fallback: true,
        error: errorMessage
      },
      raw: null,
      fallback: true,
      error: errorMessage
    };
  }

  /**
   * Sleep utility for retry delays
   */
  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Deepgram request options with enhanced features and language support
   */
  _buildOptions(audioPath, userOptions) {
    Logger.info('[Deepgram] Building enhanced transcription options');

    const baseOptions = {
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
      
      // Enhanced options for better accuracy
      multichannel: false,
      alternatives: 1,
      numerals: true,
      replace: [],
      callback: null,
      callback_method: 'POST'
    };

    // Merge with user options
    return { ...baseOptions, ...userOptions };
  }

  /**
   * Build enhanced result object with detailed analysis and multi-language support
   */
  _formatResult(result) {
    Logger.info('[Deepgram] Formatting enhanced result');

    try {
      const utterances = result?.results?.utterances || [];
      const channels = result?.results?.channels || [];
      const paragraphs = result?.results?.paragraphs?.paragraphs || [];
      const summary = result?.results?.summary;

      // Build timeline with enhanced information
      const timeline = utterances.map(u => ({
        start: u.start || 0,
        end: u.end || 0,
        text: (u.transcript || '').trim() || '—',
        type: (u.transcript || '').trim() ? 'speech' : 'silence',
        confidence: u.confidence || 0,
        speaker: u.speaker !== undefined ? u.speaker : 0,
        words: u.words || []
      }));

      // Extract speakers information
      const speakers = [...new Set(utterances.map(u => u.speaker).filter(s => s !== undefined))];
      
      // Build paragraphs for better readability
      const formattedParagraphs = paragraphs.map(p => ({
        start: p.start || 0,
        end: p.end || 0,
        text: p.transcript || '',
        sentences: p.sentences || []
      }));

      // Extract key phrases and topics
      const words = channels[0]?.alternatives?.[0]?.words || [];
      const keyPhrases = this._extractKeyPhrases(words);
      
      const text = timeline.map(t => t.text).filter(t => t !== '—').join(' ');

      // Detect language from metadata
      const detectedLanguage = result.metadata?.detected_language || 'en';
      const confidence = this._calculateOverallConfidence(timeline);

      Logger.info('[Deepgram] Enhanced timeline built with', timeline.length, 'segments');
      Logger.info('[Deepgram] Found', speakers.length, 'speakers');
      Logger.info('[Deepgram] Extracted', keyPhrases.length, 'key phrases');
      Logger.info('[Deepgram] Detected language:', detectedLanguage);
      Logger.info('[Deepgram] Overall confidence:', confidence);

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
          language: detectedLanguage,
          confidence,
          fallback: false
        },
        raw: result,
        fallback: false
      };
    } catch (error) {
      Logger.error('[Deepgram] Error formatting result:', error);
      return this._generateFallbackTranscription(null, 'Error processing transcription result');
    }
  }

  /**
   * Extract key phrases from words with improved algorithm
   */
  _extractKeyPhrases(words) {
    if (!words || words.length === 0) return [];
    
    try {
      // Enhanced key phrase extraction based on confidence, length, and context
      const phrases = [];
      let currentPhrase = [];
      
      words.forEach((word, index) => {
        const wordText = word.word || '';
        const confidence = word.confidence || 0;
        
        // Skip common stop words
        const stopWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'a', 'an'];
        
        if (confidence > 0.7 && wordText.length > 2 && !stopWords.includes(wordText.toLowerCase())) {
          currentPhrase.push(wordText);
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
      
      // Remove duplicates and return top phrases
      const uniquePhrases = [...new Set(phrases)];
      return uniquePhrases.slice(0, 10);
    } catch (error) {
      Logger.error('[Deepgram] Error extracting key phrases:', error);
      return [];
    }
  }

  /**
   * Calculate overall confidence score with improved algorithm
   */
  _calculateOverallConfidence(timeline) {
    if (!timeline || timeline.length === 0) return 0;
    
    try {
      const speechSegments = timeline.filter(t => t.type === 'speech' && t.confidence > 0);
      
      if (speechSegments.length === 0) return 0;
      
      // Weight confidence by segment duration
      let totalWeightedConfidence = 0;
      let totalDuration = 0;
      
      speechSegments.forEach(segment => {
        const duration = (segment.end || 0) - (segment.start || 0);
        totalWeightedConfidence += (segment.confidence || 0) * duration;
        totalDuration += duration;
      });
      
      return totalDuration > 0 ? totalWeightedConfidence / totalDuration : 0;
    } catch (error) {
      Logger.error('[Deepgram] Error calculating confidence:', error);
      return 0;
    }
  }

  /**
   * Infer mimetype with enhanced detection
   */
  _detectMimeType(filePath) {
    // 🛡️ Safe string operations with validation
    if (!filePath || typeof filePath !== 'string') {
      return 'audio/webm';
    }
    
    try {
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
        aac: 'audio/aac',
        opus: 'audio/opus'
      };
      
      return map[ext] || 'audio/webm';
    } catch (error) {
      Logger.error('[Deepgram] Error detecting mime type:', error);
      return 'audio/webm';
    }
  }

  /**
   * Get service health status
   */
  getHealthStatus() {
    return {
      available: !this.fallbackMode && !!this.client,
      fallbackMode: this.fallbackMode,
      apiKeyConfigured: !!process.env.DEEPGRAM_API_KEY,
      lastError: this.lastError || null
    };
  }

  /**
   * Retry failed transcription
   */
  async retryTranscription(audioPath, options = {}) {
    Logger.info(`[Deepgram] Retrying transcription for: ${audioPath}`);
    
    // Reset fallback mode and try again
    if (this.fallbackMode && process.env.DEEPGRAM_API_KEY) {
      try {
        this.client = createClient(process.env.DEEPGRAM_API_KEY);
        this.fallbackMode = false;
        Logger.info('[Deepgram] Reconnected to service for retry');
      } catch (error) {
        Logger.error('[Deepgram] Failed to reconnect for retry:', error);
      }
    }
    
    return this.transcribeFile(audioPath, options);
  }
}

module.exports = new DeepgramService();
