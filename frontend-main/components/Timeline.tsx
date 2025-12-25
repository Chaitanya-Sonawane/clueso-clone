'use client';

import { useState, useRef, useEffect } from 'react';
import { Instruction, AudioData } from '@/hooks/useWebSocketConnection';

interface TimelineProps {
  currentTime: number;
  duration: number;
  events: Instruction[];
  onSeek: (time: number) => void;
  isPlaying: boolean;
  audioData?: AudioData | null;
  videoElement?: HTMLVideoElement | null;
}

interface WaveformData {
  peaks: number[];
  duration: number;
}

export default function Timeline({ 
  currentTime, 
  duration, 
  events, 
  onSeek, 
  isPlaying, 
  audioData,
  videoElement 
}: TimelineProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [waveformData, setWaveformData] = useState<WaveformData | null>(null);
  const [showMusicPanel, setShowMusicPanel] = useState(false);
  const [backgroundMusic, setBackgroundMusic] = useState<string | null>(null);
  const [musicVolume, setMusicVolume] = useState(0.3);
  const timelineRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const musicAudioRef = useRef<HTMLAudioElement>(null);

  // Generate waveform from audio data
  useEffect(() => {
    if (audioData && audioData.url) {
      generateWaveform(audioData.url);
    }
  }, [audioData]);

  // Sync background music with video
  useEffect(() => {
    if (musicAudioRef.current && videoElement) {
      const musicAudio = musicAudioRef.current;
      
      if (isPlaying) {
        musicAudio.currentTime = currentTime;
        musicAudio.play().catch(() => {});
      } else {
        musicAudio.pause();
      }
    }
  }, [isPlaying, currentTime, videoElement]);

  // Generate waveform visualization
  const generateWaveform = async (audioUrl: string) => {
    try {
      const response = await fetch(audioUrl);
      const arrayBuffer = await response.arrayBuffer();
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      const channelData = audioBuffer.getChannelData(0);
      const samples = 200; // Number of waveform bars
      const blockSize = Math.floor(channelData.length / samples);
      const peaks = [];
      
      for (let i = 0; i < samples; i++) {
        let sum = 0;
        for (let j = 0; j < blockSize; j++) {
          sum += Math.abs(channelData[i * blockSize + j]);
        }
        peaks.push(sum / blockSize);
      }
      
      setWaveformData({
        peaks: peaks.map(peak => Math.min(peak * 10, 1)), // Normalize
        duration: audioBuffer.duration
      });
    } catch (error) {
      console.error('Error generating waveform:', error);
    }
  };

  // Draw waveform on canvas
  useEffect(() => {
    if (waveformData && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);

      const barWidth = width / waveformData.peaks.length;
      const progress = duration > 0 ? currentTime / duration : 0;

      waveformData.peaks.forEach((peak, i) => {
        const barHeight = peak * height * 0.8;
        const x = i * barWidth;
        const y = (height - barHeight) / 2;
        
        // Color based on playback progress
        const isPlayed = i / waveformData.peaks.length < progress;
        ctx.fillStyle = isPlayed 
          ? 'rgba(168, 85, 247, 0.8)' // Purple for played
          : 'rgba(75, 85, 99, 0.4)';   // Gray for unplayed
        
        ctx.fillRect(x, y, Math.max(barWidth - 1, 1), barHeight);
      });
    }
  }, [waveformData, currentTime, duration]);

  // Music selection options
  const musicOptions = [
    { id: 'upbeat', name: 'Upbeat Corporate', url: '/music/upbeat-corporate.mp3' },
    { id: 'ambient', name: 'Ambient Focus', url: '/music/ambient-focus.mp3' },
    { id: 'tech', name: 'Tech Innovation', url: '/music/tech-innovation.mp3' },
    { id: 'minimal', name: 'Minimal Clean', url: '/music/minimal-clean.mp3' }
  ];

  const handleMusicSelect = (musicUrl: string) => {
    setBackgroundMusic(musicUrl);
    if (musicAudioRef.current) {
      musicAudioRef.current.src = musicUrl;
      musicAudioRef.current.volume = musicVolume;
      musicAudioRef.current.loop = true;
    }
  };

  const handleMusicVolumeChange = (volume: number) => {
    setMusicVolume(volume);
    if (musicAudioRef.current) {
      musicAudioRef.current.volume = volume;
    }
  };

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
        {/* Waveform Visualization */}
        {waveformData && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-[var(--color-text-primary)]">Audio Waveform</h3>
              <button
                onClick={() => setShowMusicPanel(!showMusicPanel)}
                className="flex items-center gap-2 px-3 py-1.5 bg-[var(--color-bg-tertiary)] hover:bg-purple-500/20 rounded-lg text-sm text-[var(--color-text-secondary)] hover:text-purple-400 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
                Add Music
              </button>
            </div>
            <canvas
              ref={canvasRef}
              width={800}
              height={80}
              className="w-full h-20 bg-[var(--color-bg-tertiary)] rounded-lg cursor-pointer"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const position = (e.clientX - rect.left) / rect.width;
                const time = position * duration;
                onSeek(time);
              }}
            />
          </div>
        )}

        {/* Music Integration Panel */}
        {showMusicPanel && (
          <div className="mb-4 p-4 bg-[var(--color-bg-tertiary)] rounded-lg border border-[var(--color-border-primary)]">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-[var(--color-text-primary)]">Background Music</h3>
              <button
                onClick={() => setShowMusicPanel(false)}
                className="text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Music Selection */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              {musicOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => handleMusicSelect(option.url)}
                  className={`p-2 text-xs rounded-lg border transition-colors ${
                    backgroundMusic === option.url
                      ? 'bg-purple-500/20 border-purple-500/50 text-purple-400'
                      : 'bg-[var(--color-bg-secondary)] border-[var(--color-border-primary)] text-[var(--color-text-secondary)] hover:border-purple-500/30'
                  }`}
                >
                  {option.name}
                </button>
              ))}
            </div>

            {/* Volume Control */}
            {backgroundMusic && (
              <div className="flex items-center gap-3">
                <svg className="w-4 h-4 text-[var(--color-text-tertiary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 14.142M6.343 6.343L4.93 4.93A1 1 0 003.515 6.343L6.343 9.17 4.93 10.586a1 1 0 001.414 1.414L7.757 10.586 9.17 12a1 1 0 001.414-1.414L9.17 9.17l1.414-1.414A1 1 0 009.17 6.343L7.757 7.757 6.343 6.343z" />
                </svg>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={musicVolume}
                  onChange={(e) => handleMusicVolumeChange(parseFloat(e.target.value))}
                  className="flex-1 h-2 bg-[var(--color-bg-secondary)] rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
                <span className="text-xs text-[var(--color-text-tertiary)] w-8">
                  {Math.round(musicVolume * 100)}%
                </span>
              </div>
            )}
          </div>
        )}

        {/* Hidden Audio Element for Background Music */}
        <audio ref={musicAudioRef} />

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