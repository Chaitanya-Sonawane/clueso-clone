'use client';

import { useState } from 'react';
import { AudioData, VideoData } from '@/hooks/useWebSocketConnection';
import toast from 'react-hot-toast';

interface ExportButtonProps {
  audioData: AudioData | null;
  videoData: VideoData | null;
  sessionId: string;
}

export default function ExportButton({ audioData, videoData, sessionId }: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const handleExportVideo = async () => {
    if (!videoData) {
      toast.error('No video available to export');
      return;
    }

    setIsExporting(true);
    try {
      // Download the video file
      const response = await fetch(videoData.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${sessionId}_video.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast.success('Video exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export video');
    } finally {
      setIsExporting(false);
      setShowMenu(false);
    }
  };

  const handleExportAudio = async () => {
    if (!audioData) {
      toast.error('No audio available to export');
      return;
    }

    setIsExporting(true);
    try {
      // Download the audio file
      const response = await fetch(audioData.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${sessionId}_audio.wav`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast.success('Audio exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export audio');
    } finally {
      setIsExporting(false);
      setShowMenu(false);
    }
  };

  const handleExportTranscript = () => {
    if (!audioData?.text) {
      toast.error('No transcript available to export');
      return;
    }

    try {
      const blob = new Blob([audioData.text], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${sessionId}_transcript.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast.success('Transcript exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export transcript');
    } finally {
      setShowMenu(false);
    }
  };

  const handleExportAll = async () => {
    setIsExporting(true);
    try {
      if (videoData) await handleExportVideo();
      if (audioData) await handleExportAudio();
      if (audioData?.text) handleExportTranscript();
      
      toast.success('All files exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export all files');
    } finally {
      setIsExporting(false);
      setShowMenu(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        disabled={isExporting || (!videoData && !audioData)}
        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-medium hover:from-green-700 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isExporting ? (
          <>
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            Exporting...
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export
          </>
        )}
      </button>

      {/* Export Menu */}
      {showMenu && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowMenu(false)}
          />
          
          {/* Menu */}
          <div className="absolute right-0 top-full mt-2 w-56 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 overflow-hidden">
            <div className="p-2 space-y-1">
              {videoData && (
                <button
                  onClick={handleExportVideo}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Export Video
                </button>
              )}
              
              {audioData && (
                <button
                  onClick={handleExportAudio}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                  Export Audio
                </button>
              )}
              
              {audioData?.text && (
                <button
                  onClick={handleExportTranscript}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Export Transcript
                </button>
              )}
              
              {(videoData || audioData) && (
                <>
                  <div className="border-t border-gray-700 my-1" />
                  <button
                    onClick={handleExportAll}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-green-400 hover:bg-gray-700 hover:text-green-300 rounded-lg transition-colors font-medium"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    Export All
                  </button>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}