'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

interface ScreenRecorderInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSkip: () => void;
}

export default function ScreenRecorderInstallModal({ 
  isOpen, 
  onClose, 
  onSkip 
}: ScreenRecorderInstallModalProps) {
  const [isExtensionDetected, setIsExtensionDetected] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [showFeatures, setShowFeatures] = useState(false);

  // Extension detection timeout (3 seconds)
  const DETECTION_TIMEOUT = 3000;
  
  // Placeholder Chrome Web Store URL - replace with actual extension ID
  const EXTENSION_STORE_URL = "https://chromewebstore.google.com/detail/EXTENSION_ID";

  useEffect(() => {
    if (!isOpen) return;

    let timeoutId: NodeJS.Timeout;
    let isDetectionComplete = false;

    // Listen for extension response
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "EXTENSION_INSTALLED" && !isDetectionComplete) {
        isDetectionComplete = true;
        setIsExtensionDetected(true);
        setIsChecking(false);
        clearTimeout(timeoutId);
        
        toast.success('Screen recorder extension detected!');
        
        // Auto-close modal if extension is detected
        setTimeout(() => {
          onClose();
        }, 1000);
      }
    };

    // Start detection
    window.addEventListener("message", handleMessage);
    
    // Send detection message
    window.postMessage({ type: "CHECK_EXTENSION" }, "*");
    
    // Set timeout for detection
    timeoutId = setTimeout(() => {
      if (!isDetectionComplete) {
        setIsExtensionDetected(false);
        setIsChecking(false);
        setShowFeatures(true);
      }
    }, DETECTION_TIMEOUT);

    return () => {
      window.removeEventListener("message", handleMessage);
      clearTimeout(timeoutId);
    };
  }, [isOpen, onClose]);

  const handleInstallClick = () => {
    try {
      // Open Chrome Web Store in new tab
      window.open(EXTENSION_STORE_URL, "_blank");
      toast.success('Redirected to Chrome Web Store');
    } catch (error) {
      console.error('Failed to open Chrome Web Store:', error);
      toast.error('Failed to open Chrome Web Store');
    }
  };

  const handleSkipClick = () => {
    toast('Recording without extension - limited functionality', {
      icon: '⚠️',
      duration: 3000,
    });
    onSkip();
  };

  const handleSkipClick = () => {
    onSkip();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-gray-200">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="text-5xl mb-3">🎬</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Install Screen Recorder
          </h2>
          <p className="text-gray-600">
            Get the best recording experience with our Chrome extension
          </p>
        </div>

        {/* Detection Status */}
        {isChecking && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="animate-spin w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full"></div>
              <span className="text-blue-700 font-medium">
                Checking for extension...
              </span>
            </div>
          </div>
        )}

        {!isChecking && isExtensionDetected && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 bg-green-600 rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-green-700 font-medium">
                Extension detected! You're all set.
              </span>
            </div>
          </div>
        )}

        {!isChecking && !isExtensionDetected && (
          <>
            {/* Features List */}
            <div className="mb-6">
              <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <span>✨</span> Extension Features
              </h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>High-quality screen & audio recording</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>Automatic sync with Clueso dashboard</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>One-click recording start/stop</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>Secure browser-based capture</span>
                </li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={handleInstallClick}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-blue-700 hover:to-purple-700 transform hover:scale-[1.02] transition-all shadow-lg hover:shadow-xl"
              >
                Proceed 