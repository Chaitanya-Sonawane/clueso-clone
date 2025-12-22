'use client';

import { useState, useEffect } from 'react';
import { Instruction } from '@/hooks/useWebSocketConnection';

interface EventOverlayProps {
  currentTime: number;
  events: Instruction[];
  videoWidth: number;
  videoHeight: number;
  originalViewport: { width: number; height: number };
  effectDuration?: number;
}

interface ActiveEvent {
  event: Instruction;
  startTime: number;
  opacity: number;
}

export default function EventOverlay({
  currentTime,
  events,
  videoWidth,
  videoHeight,
  originalViewport,
  effectDuration = 0.8
}: EventOverlayProps) {
  const [activeEvents, setActiveEvents] = useState<ActiveEvent[]>([]);

  // Update active events based on current time
  useEffect(() => {
    const newActiveEvents: ActiveEvent[] = [];
    
    events.forEach(event => {
      const timeDiff = currentTime - event.timestamp;
      
      // Show event if it's within the effect duration
      if (timeDiff >= 0 && timeDiff <= effectDuration) {
        const progress = timeDiff / effectDuration;
        const opacity = Math.max(0, 1 - progress); // Fade out over time
        
        newActiveEvents.push({
          event,
          startTime: event.timestamp,
          opacity
        });
      }
    });
    
    setActiveEvents(newActiveEvents);
  }, [currentTime, events, effectDuration]);

  // Calculate scale factors for positioning
  const scaleX = videoWidth / originalViewport.width;
  const scaleY = videoHeight / originalViewport.height;

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'click':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.121 2.122" />
          </svg>
        );
      case 'scroll':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7l4-4m0 0l4 4m-4-4v18" />
          </svg>
        );
      case 'type':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        );
      case 'navigation':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 9l3 3m0 0l-3 3m3-3H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'click':
        return 'text-blue-400 bg-blue-500/20 border-blue-500/50';
      case 'scroll':
        return 'text-green-400 bg-green-500/20 border-green-500/50';
      case 'type':
        return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/50';
      case 'navigation':
        return 'text-purple-400 bg-purple-500/20 border-purple-500/50';
      default:
        return 'text-gray-400 bg-gray-500/20 border-gray-500/50';
    }
  };

  if (activeEvents.length === 0 || videoWidth === 0 || videoHeight === 0) {
    return null;
  }

  return (
    <div className="absolute inset-0 pointer-events-none">
      {activeEvents.map((activeEvent, index) => {
        const { event, opacity } = activeEvent;
        const { target } = event;
        
        if (!target?.bbox) return null;

        // Calculate position on the scaled video
        const x = target.bbox.x * scaleX;
        const y = target.bbox.y * scaleY;
        const width = target.bbox.width * scaleX;
        const height = target.bbox.height * scaleY;

        // Ensure the event is within video bounds
        if (x < 0 || y < 0 || x > videoWidth || y > videoHeight) {
          return null;
        }

        const colorClasses = getEventColor(event.type);
        
        return (
          <div key={`${event.timestamp}-${index}`}>
            {/* Target Element Highlight */}
            <div
              className={`absolute border-2 ${colorClasses} rounded transition-all duration-200`}
              style={{
                left: `${x}px`,
                top: `${y}px`,
                width: `${width}px`,
                height: `${height}px`,
                opacity: opacity * 0.6,
                transform: `scale(${1 + (1 - opacity) * 0.1})`, // Slight scale effect
              }}
            />
            
            {/* Event Icon */}
            <div
              className={`absolute flex items-center justify-center w-12 h-12 rounded-full border-2 ${colorClasses} backdrop-blur-sm transition-all duration-200`}
              style={{
                left: `${x + width / 2 - 24}px`,
                top: `${y + height / 2 - 24}px`,
                opacity: opacity,
                transform: `scale(${0.8 + opacity * 0.2})`, // Scale with opacity
              }}
            >
              {getEventIcon(event.type)}
            </div>
            
            {/* Ripple Effect for Clicks */}
            {event.type === 'click' && (
              <div
                className="absolute rounded-full border-2 border-blue-400 animate-ping"
                style={{
                  left: `${x + width / 2 - 20}px`,
                  top: `${y + height / 2 - 20}px`,
                  width: '40px',
                  height: '40px',
                  opacity: opacity * 0.5,
                }}
              />
            )}
            
            {/* Event Label */}
            {target.text && (
              <div
                className={`absolute px-3 py-1 rounded-lg text-sm font-medium ${colorClasses} backdrop-blur-sm max-w-xs truncate`}
                style={{
                  left: `${Math.min(x, videoWidth - 200)}px`,
                  top: `${Math.max(y - 40, 10)}px`,
                  opacity: opacity * 0.9,
                }}
              >
                {target.text}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}