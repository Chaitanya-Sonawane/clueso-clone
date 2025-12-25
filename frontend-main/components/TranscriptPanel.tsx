'use client';

import { useState, useEffect, useRef } from 'react';
import { AudioData, SessionStatus } from '@/hooks/useWebSocketConnection';

interface TranscriptPanelProps {
  audioData: AudioData | null;
  currentTime: number;
  onSeek: (time: number) => void;
  transcriptionLoading: boolean;
  sessionStatus: SessionStatus;
  retryTranscription?: () => void;
}

interface TranscriptSegment {
  text: string;
  start: number;
  end: number;
  confidence?: number;
  speaker?: number;
  type?: 'speech' | 'silence';
  words?: Array<{
    word: string;
    start: number;
    end: number;
    confidence: number;
  }>;
}

interface EnhancedTranscriptData {
  text: string;
  timeline: TranscriptSegment[];
  paragraphs?: Array<{
    start: number;
    end: number;
    text: string;
    sentences?: any[];
  }>;
  speakers?: number[];
  keyPhrases?: string[];
  summary?: string;
  metadata?: {
    duration: number;
    language: string;
    confidence: number;
  };
}

export default function TranscriptPanel({ 
  audioData, 
  currentTime, 
  onSeek, 
  transcriptionLoading, 
  sessionStatus,
  retryTranscription
}: TranscriptPanelProps) {
  const [segments, setSegments] = useState<TranscriptSegment[]>([]);
  const [enhancedData, setEnhancedData] = useState<EnhancedTranscriptData | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [showSpeakers, setShowSpeakers] = useState(true);
  const [showConfidence, setShowConfidence] = useState(false);
  const [selectedSpeaker, setSelectedSpeaker] = useState<number | null>(null);
  const activeSegmentRef = useRef<HTMLDivElement>(null);

  // Parse transcript text into segments (enhanced format support)
  useEffect(() => {
    if (!audioData?.text) {
      setSegments([]);
      setEnhancedData(null);
      return;
    }

    try {
      // Try to parse as enhanced JSON format from Deepgram service
      const parsed = JSON.parse(audioData.text);
      
      if (parsed.timeline && Array.isArray(parsed.timeline)) {
        // Enhanced format with timeline, speakers, etc.
        setEnhancedData(parsed);
        setSegments(parsed.timeline);
        return;
      } else if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].start !== undefined) {
        // Simple timeline format
        setSegments(parsed);
        return;
      }
    } catch {
      // Not JSON, treat as plain text
    }

    // If it's plain text, create segments by splitting into sentences
    const sentences = audioData.text
      .split(/[.!?]+/)
      .filter(sentence => sentence.trim().length > 0)
      .map(sentence => sentence.trim());

    if (sentences.length === 0) {
      setSegments([]);
      return;
    }

    // Estimate timing for each sentence (assuming even distribution)
    const estimatedDuration = 60; // Default 60 seconds if no timing info
    const segmentDuration = estimatedDuration / sentences.length;

    const estimatedSegments: TranscriptSegment[] = sentences.map((sentence, index) => ({
      text: sentence,
      start: index * segmentDuration,
      end: (index + 1) * segmentDuration,
      confidence: 0.8, // Estimated confidence
      type: 'speech' as const
    }));

    setSegments(estimatedSegments);
  }, [audioData]);

  // Auto-scroll to active segment
  useEffect(() => {
    if (activeSegmentRef.current) {
      activeSegmentRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }, [currentTime]);

  // Find the currently active segment
  const activeSegmentIndex = segments.findIndex(
    segment => currentTime >= segment.start && currentTime <= segment.end
  );

  // Filter segments based on search query and speaker selection
  const filteredSegments = segments.filter(segment => {
    const matchesSearch = segment.text.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSpeaker = selectedSpeaker === null || segment.speaker === selectedSpeaker;
    return matchesSearch && matchesSpeaker;
  });

  const getSpeakerColor = (speaker: number) => {
    const colors = [
      'text-blue-400 bg-blue-500/20',
      'text-green-400 bg-green-500/20', 
      'text-yellow-400 bg-yellow-500/20',
      'text-purple-400 bg-purple-500/20',
      'text-pink-400 bg-pink-500/20',
      'text-indigo-400 bg-indigo-500/20'
    ];
    return colors[speaker % colors.length] || 'text-gray-400 bg-gray-500/20';
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setIsSearching(query.length > 0);
  };

  const handleSegmentClick = (segment: TranscriptSegment) => {
    onSeek(segment.start);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const highlightText = (text: string, query: string) => {
    if (!query) return text;
    
    const regex = new RegExp(`(${query})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-300 text-gray-900 px-1 rounded">
          {part}
        </mark>
      ) : part
    );
  };

  return (
    <div className="h-full bg-[var(--color-bg-secondary)] border-l border-[var(--color-border-primary)] flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-[var(--color-border-primary)]">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Transcript</h2>
          <div className="flex items-center gap-4">
            {enhancedData?.speakers && enhancedData.speakers.length > 1 && (
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span className="text-xs text-[var(--color-text-tertiary)]">
                  {enhancedData.speakers.length} speakers
                </span>
              </div>
            )}
            {audioData && (
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-xs text-[var(--color-text-tertiary)]">
                  {segments.length} segments
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Enhanced Summary */}
        {enhancedData?.summary && (
          <div className="mb-4 p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="text-sm font-medium text-purple-400">AI Summary</span>
            </div>
            <p className="text-sm text-[var(--color-text-secondary)]">{enhancedData.summary}</p>
          </div>
        )}

        {/* Key Phrases */}
        {enhancedData?.keyPhrases && enhancedData.keyPhrases.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              <span className="text-sm font-medium text-[var(--color-text-primary)]">Key Phrases</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {enhancedData.keyPhrases.slice(0, 6).map((phrase, index) => (
                <button
                  key={index}
                  onClick={() => handleSearch(phrase)}
                  className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded-full hover:bg-yellow-500/30 transition-colors"
                >
                  {phrase}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center gap-4 mb-4">
          {enhancedData?.speakers && enhancedData.speakers.length > 1 && (
            <button
              onClick={() => setShowSpeakers(!showSpeakers)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-colors ${
                showSpeakers 
                  ? 'bg-blue-500/20 text-blue-400' 
                  : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Speakers
            </button>
          )}
          <button
            onClick={() => setShowConfidence(!showConfidence)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-colors ${
              showConfidence 
                ? 'bg-green-500/20 text-green-400' 
                : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Confidence
          </button>
        </div>

        {/* Speaker Filter */}
        {enhancedData?.speakers && enhancedData.speakers.length > 1 && (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm text-[var(--color-text-primary)]">Filter by speaker:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedSpeaker(null)}
                className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${
                  selectedSpeaker === null
                    ? 'bg-purple-500/20 text-purple-400'
                    : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]'
                }`}
              >
                All Speakers
              </button>
              {enhancedData.speakers.map(speaker => (
                <button
                  key={speaker}
                  onClick={() => setSelectedSpeaker(speaker)}
                  className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${
                    selectedSpeaker === speaker
                      ? getSpeakerColor(speaker)
                      : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]'
                  }`}
                >
                  Speaker {speaker + 1}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Search */}
        <div className="relative">
          <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[var(--color-text-tertiary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search transcript..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)] rounded-lg text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          {searchQuery && (
            <button
              onClick={() => handleSearch('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {isSearching && (
          <p className="text-xs text-[var(--color-text-tertiary)] mt-2">
            {filteredSegments.length} result{filteredSegments.length !== 1 ? 's' : ''} found
          </p>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {transcriptionLoading ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <div className="w-16 h-16 mb-4 rounded-full bg-purple-500/20 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <h3 className="text-lg font-medium text-[var(--color-text-primary)] mb-2">
              Transcribing audio...
            </h3>
            <p className="text-[var(--color-text-tertiary)] text-sm">
              This may take a few moments
            </p>
          </div>
        ) : !audioData ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <svg className="w-16 h-16 text-[var(--color-text-tertiary)] mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
            <h3 className="text-lg font-medium text-[var(--color-text-secondary)] mb-2">
              No Audio Available
            </h3>
            <p className="text-[var(--color-text-tertiary)] text-sm">
              Waiting for audio transcription...
            </p>
          </div>
        ) : segments.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <svg className="w-16 h-16 text-[var(--color-text-tertiary)] mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-lg font-medium text-[var(--color-text-secondary)] mb-2">
              Processing Transcript
            </h3>
            <p className="text-[var(--color-text-tertiary)] text-sm mb-4">
              Audio transcription is being processed...
            </p>
            {sessionStatus === 'ERROR' && retryTranscription && (
              <button
                onClick={retryTranscription}
                className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors"
              >
                Retry Transcription
              </button>
            )}
          </div>
        ) : filteredSegments.length === 0 && isSearching ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <svg className="w-16 h-16 text-[var(--color-text-tertiary)] mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <h3 className="text-lg font-medium text-[var(--color-text-secondary)] mb-2">
              No Results Found
            </h3>
            <p className="text-[var(--color-text-tertiary)] text-sm">
              Try a different search term
            </p>
          </div>
        ) : (
          <div className="p-4 space-y-3">
            {(isSearching || selectedSpeaker !== null ? filteredSegments : segments).map((segment, index) => {
              const isActive = !isSearching && selectedSpeaker === null && index === activeSegmentIndex;
              const globalIndex = isSearching || selectedSpeaker !== null ? segments.indexOf(segment) : index;
              
              return (
                <div
                  key={globalIndex}
                  ref={isActive ? activeSegmentRef : null}
                  onClick={() => handleSegmentClick(segment)}
                  className={`p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                    isActive
                      ? 'bg-purple-500/20 border-purple-500/50 border-2'
                      : 'bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)] hover:bg-[var(--color-bg-primary)]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSegmentClick(segment);
                        }}
                        className={`text-xs font-mono px-2 py-1 rounded transition-colors ${
                          isActive
                            ? 'bg-purple-500 text-white'
                            : 'bg-[var(--color-bg-primary)] text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]'
                        }`}
                      >
                        {formatTime(segment.start)}
                      </button>
                      
                      {/* Speaker Badge */}
                      {showSpeakers && segment.speaker !== undefined && (
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${getSpeakerColor(segment.speaker)}`}>
                          Speaker {segment.speaker + 1}
                        </span>
                      )}
                      
                      {/* Segment Type */}
                      {segment.type === 'silence' && (
                        <span className="text-xs px-2 py-1 rounded-full bg-gray-500/20 text-gray-400">
                          Silence
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {/* Confidence Score */}
                      {showConfidence && segment.confidence && (
                        <span className={`text-xs px-2 py-1 rounded ${
                          segment.confidence > 0.8
                            ? 'bg-green-500/20 text-green-400'
                            : segment.confidence > 0.6
                            ? 'bg-yellow-500/20 text-yellow-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}>
                          {Math.round(segment.confidence * 100)}%
                        </span>
                      )}
                      
                      {/* Duration */}
                      <span className="text-xs text-[var(--color-text-tertiary)]">
                        {Math.round(segment.end - segment.start)}s
                      </span>
                    </div>
                  </div>
                  
                  <p className={`text-sm leading-relaxed ${
                    isActive
                      ? 'text-[var(--color-text-primary)] font-medium'
                      : 'text-[var(--color-text-secondary)]'
                  } ${segment.type === 'silence' ? 'italic text-[var(--color-text-tertiary)]' : ''}`}>
                    {segment.type === 'silence' ? (
                      '— Silence —'
                    ) : isSearching ? (
                      highlightText(segment.text, searchQuery)
                    ) : (
                      segment.text
                    )}
                  </p>
                  
                  {/* Word-level confidence (if available) */}
                  {segment.words && segment.words.length > 0 && showConfidence && (
                    <div className="mt-2 pt-2 border-t border-[var(--color-border-primary)]">
                      <div className="flex flex-wrap gap-1">
                        {segment.words.slice(0, 10).map((word, wordIndex) => (
                          <span
                            key={wordIndex}
                            className={`text-xs px-1 py-0.5 rounded ${
                              word.confidence > 0.8
                                ? 'bg-green-500/10 text-green-400'
                                : word.confidence > 0.6
                                ? 'bg-yellow-500/10 text-yellow-400'
                                : 'bg-red-500/10 text-red-400'
                            }`}
                            title={`${word.word}: ${Math.round(word.confidence * 100)}%`}
                          >
                            {word.word}
                          </span>
                        ))}
                        {segment.words.length > 10 && (
                          <span className="text-xs text-[var(--color-text-tertiary)]">
                            +{segment.words.length - 10} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      {audioData && (
        <div className="p-4 border-t border-[var(--color-border-primary)] bg-[var(--color-bg-tertiary)]">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-[var(--color-text-tertiary)]">
              <span>Audio: {audioData.filename}</span>
              <span>
                {audioData.text.length > 0 ? `${audioData.text.length} chars` : 'No text'}
              </span>
            </div>
            {enhancedData?.metadata && (
              <div className="flex items-center justify-between text-xs text-[var(--color-text-tertiary)]">
                <span>
                  Language: {enhancedData.metadata.language?.toUpperCase() || 'Unknown'}
                </span>
                <span>
                  Duration: {formatTime(enhancedData.metadata.duration || 0)}
                </span>
                <span>
                  Avg Confidence: {Math.round((enhancedData.metadata.confidence || 0) * 100)}%
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}