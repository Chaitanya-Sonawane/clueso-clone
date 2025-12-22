'use client';

import { useState, useEffect, useRef } from 'react';
import { AudioData } from '@/hooks/useWebSocketConnection';

interface TranscriptPanelProps {
  audioData: AudioData | null;
  currentTime: number;
  onSeek: (time: number) => void;
}

interface TranscriptSegment {
  text: string;
  start: number;
  end: number;
  confidence?: number;
}

export default function TranscriptPanel({ audioData, currentTime, onSeek }: TranscriptPanelProps) {
  const [segments, setSegments] = useState<TranscriptSegment[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const activeSegmentRef = useRef<HTMLDivElement>(null);

  // Parse transcript text into segments (if it contains timing information)
  useEffect(() => {
    if (!audioData?.text) {
      setSegments([]);
      return;
    }

    try {
      // Try to parse as JSON with timing information
      const parsed = JSON.parse(audioData.text);
      if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].start !== undefined) {
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
      confidence: 0.8 // Estimated confidence
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

  // Filter segments based on search query
  const filteredSegments = segments.filter(segment =>
    segment.text.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
        {!audioData ? (
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
            <p className="text-[var(--color-text-tertiary)] text-sm">
              Audio transcription is being processed...
            </p>
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
            {(isSearching ? filteredSegments : segments).map((segment, index) => {
              const isActive = !isSearching && index === activeSegmentIndex;
              const globalIndex = isSearching ? segments.indexOf(segment) : index;
              
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
                    {segment.confidence && (
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
                  </div>
                  <p className={`text-sm leading-relaxed ${
                    isActive
                      ? 'text-[var(--color-text-primary)] font-medium'
                      : 'text-[var(--color-text-secondary)]'
                  }`}>
                    {isSearching 
                      ? highlightText(segment.text, searchQuery)
                      : segment.text
                    }
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      {audioData && (
        <div className="p-4 border-t border-[var(--color-border-primary)] bg-[var(--color-bg-tertiary)]">
          <div className="flex items-center justify-between text-xs text-[var(--color-text-tertiary)]">
            <span>Audio: {audioData.filename}</span>
            <span>
              {audioData.text.length > 0 ? `${audioData.text.length} chars` : 'No text'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}