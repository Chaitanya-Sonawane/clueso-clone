const http = require('http');
const https = require('https');
const path = require('path');
const { Logger } = require('../config');

class PythonService {
  constructor() {
    this.pythonBaseUrl = process.env.PYTHON_LAYER_URL || 'http://localhost:8000';
    this.timeout = parseInt(process.env.PYTHON_SERVICE_TIMEOUT || '3000', 10);
  }

  // Helper method to make HTTP requests without node-fetch
  async makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);
      const isHttps = urlObj.protocol === 'https:';
      const httpModule = isHttps ? https : http;
      
      const requestOptions = {
        hostname: urlObj.hostname,
        port: urlObj.port || (isHttps ? 443 : 80),
        path: urlObj.pathname + urlObj.search,
        method: options.method || 'GET',
        headers: options.headers || {},
        timeout: this.timeout
      };

      const req = httpModule.request(requestOptions, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          try {
            const result = {
              ok: res.statusCode >= 200 && res.statusCode < 300,
              status: res.statusCode,
              statusText: res.statusMessage,
              json: () => Promise.resolve(JSON.parse(data)),
              text: () => Promise.resolve(data)
            };
            resolve(result);
          } catch (error) {
            reject(error);
          }
        });
      });

      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      if (options.body) {
        req.write(options.body);
      }
      
      req.end();
    });
  }

  /**
   * Send text with DOM events to Python layer at /audio-full-process endpoint
   * @param {string} text - Transcribed text from Deepgram
   * @param {Array} domEvents - Array of DOM events with timestamps
   * @param {object} metadata - Additional metadata (sessionId, url, viewport, etc.)
   * @param {object} deepgramResponse - Full Deepgram JSON response (text, timeline, metadata, raw)
   * @returns {Promise<object>} - Response from Python layer
   */
  async sendTextWithDomEvents(text, domEvents = [], metadata = {}, deepgramResponse = null) {
    try {
      const payload = {
        text: text,
        domEvents: domEvents,
        recordingsPath: path.resolve(__dirname, '../../recordings'), // Add recordings path
        deepgramResponse: deepgramResponse, // Include full Deepgram JSON response
        metadata: {
          sessionId: metadata.sessionId,
          url: metadata.url,
          viewport: metadata.viewport,
          startTime: metadata.startTime,
          endTime: metadata.endTime,
          timestamp: new Date().toISOString(),
          ...metadata
        }
      };

      Logger.info(`[Python Service] Sending text with ${domEvents.length} DOM events to Python layer`);
      Logger.debug(`[Python Service] Payload:`, {
        textLength: text.length,
        eventsCount: domEvents.length,
        sessionId: metadata.sessionId,
        hasDeepgramResponse: !!deepgramResponse,
        deepgramTimelineSegments: deepgramResponse?.timeline?.length || 0
      });

      const response = await this.makeRequest(`${this.pythonBaseUrl}/audio-full-process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        Logger.error(`[Python Service] Error response from Python layer: ${response.status} - ${errorText}`);
        throw new Error(`Python layer returned error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      Logger.info('[Python Service] Successfully received response from Python layer');

      return result;
    } catch (error) {
      Logger.error('[Python Service] Error sending data to Python layer:', error);

      // Handle timeout errors
      if (error.message.includes('timeout')) {
        throw new Error(`Request to Python layer timed out after ${this.timeout}ms`);
      }

      // Handle network errors
      if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
        throw new Error(`Cannot connect to Python layer at ${this.pythonBaseUrl}. Is the Python server running?`);
      }

      throw error;
    }
  }

  /**
   * Send raw text with DOM events (alternative endpoint)
   * @param {object} data - Complete data object with text and events
   * @returns {Promise<object>} - Response from Python layer
   */
  async sendRawTextWithDomEvents(data) {
    try {
      Logger.info(`[Python Service] Sending raw text with DOM events to Python layer`);

      const response = await this.makeRequest(`${this.pythonBaseUrl}/api/process-raw`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const errorText = await response.text();
        Logger.error(`[Python Service] Error response from Python layer: ${response.status} - ${errorText}`);
        throw new Error(`Python layer returned error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      Logger.info('[Python Service] Successfully received response from Python layer');

      return result;
    } catch (error) {
      Logger.error('[Python Service] Error sending raw data to Python layer:', error);

      if (error.message.includes('timeout')) {
        throw new Error(`Request to Python layer timed out after ${this.timeout}ms`);
      }

      if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
        throw new Error(`Cannot connect to Python layer at ${this.pythonBaseUrl}. Is the Python server running?`);
      }

      throw error;
    }
  }

  /**
   * Health check for Python layer
   * @returns {Promise<boolean>} - True if Python layer is reachable
   */
  async healthCheck() {
    try {
      const response = await this.makeRequest(`${this.pythonBaseUrl}/health`, {
        method: 'GET'
      });
      return response.ok;
    } catch (error) {
      Logger.warn('[Python Service] Health check failed:', error.message);
      return false;
    }
  }
}

// Export singleton instance
module.exports = new PythonService();

