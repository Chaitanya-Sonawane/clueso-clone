'use client';

import { useState, useRef, useEffect } from 'react';
import { Instruction } from '@/hooks/useWebSocketConnection';

interface TimelineProps {
  currentTime: number;
  duration: number;
  events: Instruction[];
  onSeek: (time: number) => void;
  isPlaying: boolean;
}

export default function Timeline({ currentTime, duration, events, onSeek, isPlaying }: TimelineProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimeFromPosition = (clientX: number) => {
    if (!timelineRef.current) return 0;
    
    const rect = timelineRef.current.getBoundingClientRect();
    const position = (clientX - rect.left) / rect.width;
    return Math.max(0, Math.min(duration, position * duration));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    const time = getTimeFromPosition(e.clientX);
    onSeek(time);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const time = getTimeFromPosition(e.clientX);
    setHoverTime(time);
    
    if (isDragging) {
      onSeek(time);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setHoverTime(null);
    setIsDragging(false);
  };

  // Global mouse up handler for dragging
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mouseup', handleGlobalMouseUp);
      return () => document.removeEventListener('mouseup', handleGlobalMouseUp);
    }
  }, [isDragging]);

  // Group events by time ranges for better visualization
  const eventMarkers = events.map(event => ({
    time: event.timestamp,
    type: event.type,
    event
  })).sort((a, b) => a.time - b.time);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const hoverProgress = hoverTime !== null && duration > 0 ? (hoverTime / duration) * 100 : null;

  return (
    <div className="bg-[var(--color-bg-secondary)] border-t border-[var(--color-border-primary)] p-4">
      {/* Time Display */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <span className="text-[var(--color-text-primary)] font-mono text-sm">
            {formatTime(currentTime)}
          </span>
          <span className="text-[var(--color-text-tertiary)] text-sm">/</span>
          <span className="text-[var(--color-text-tertiary)] font-mono text-sm">
            {formatTime(duration)}
          </span>
        </div>
        
        {hoverTime !== null && (
          <div className="text-[var(--color-text-tertiary)] font-mono text-sm">
            Hover: {formatTime(hoverTime)}
          </div>
        )}
        
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`} />
          <span className="text-xs text-[var(--color-text-tertiary)]">
            {isPlaying ? 'Playing' : 'Paused'}
          </span>
        </div>
      </div>

      {/* Timeline Container */}
      <div className="relative">
        {/* Timeline Track */}
        <div
          ref={timelineRef}
          className="relative h-12 bg-[var(--color-bg-tertiary)] rounded-lg cursor-pointer overflow-hidden"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
        >
          {/* Progress Bar */}
          <div
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
          
          {/* Hover Indicator */}
          {hoverProgress !== null && (
            <div
              className="absolute top-0 h-full w-0.5 bg-white/50 pointer-events-none"
              style={{ left: `${hoverProgress}%` }}
            />
          )}

          {/* Event Markers */}
          {eventMarkers.map((marker, index) => {
            const position = duration > 0 ? (marker.time / duration) * 100 : 0;
            
            return (
              <div
                key={index}
                className="absolute top-0 h-full w-1 group cursor-pointer"
                style={{ left: `${position}%` }}
                onClick={(e) => {
                  e.stopPropagation();
                  onSeek(marker.time);
                }}
              >
                {/* Event Line */}
                <div className={`w-full h-full ${
                  marker.type === 'click' ? 'bg-blue-400' :
                  marker.type === 'scroll' ? 'bg-green-400' :
                  marker.type === 'type' ? 'bg-yellow-400' :
                  marker.type === 'navigation' ? 'bg-purple-400' :
                  'bg-gray-400'
                } opacity-70 hover:opacity-100 transition-opacity`} />
                
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                  <div className="font-medium capitalize">{marker.type}</div>
                  <div className="text-gray-300">{formatTime(marker.time)}</div>
                  {marker.event.target?.text && (
                    <div className="text-gray-400 max-w-32 truncate">
                      {marker.event.target.text}
                    </div>
                  )}
                  {/* Tooltip Arrow */}
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900" />
                </div>
              </div>
            );
          })}

          {/* Current Time Indicator */}
          <div
            className="absolute top-0 h-full w-0.5 bg-white shadow-lg pointer-events-none"
            style={{ left: `${progress}%` }}
          >
            {/* Playhead */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg" />
          </div>
        </div>

        {/* Time Markers */}
        <div className="flex justify-between mt-2 px-1">
          {Array.from({ length: 11 }, (_, i) => {
            const time = (duration / 10) * i;
            return (
              <button
                key={i}
                onClick={() => onSeek(time)}
                className="text-xs text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] font-mono transition-colors"
              >
                {formatTime(time)}
              </button>
            );
          })}
        </div>
      </div>

      {/* Event Legend */}
      {eventMarkers.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-400 rounded-sm" />
            <span className="text-[var(--color-text-tertiary)]">Clicks</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-400 rounded-sm" />
            <span className="text-[var(--color-text-tertiary)]">Scrolls</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-400 rounded-sm" />
            <span className="text-[var(--color-text-tertiary)]">Typing</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-purple-400 rounded-sm" />
            <span className="text-[var(--color-text-tertiary)]">Navigation</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[var(--color-text-tertiary)]">
              {eventMarkers.length} event{eventMarkers.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}