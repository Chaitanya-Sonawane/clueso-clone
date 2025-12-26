# 🔌 Clueso Browser Extension

> **Chrome/Firefox extension for seamless screen recording with AI-powered event capture**

## 📋 Overview

The Clueso Browser Extension is a powerful screen recording tool that captures not just video and audio, but also intelligently tracks user interactions, DOM events, and contextual information. It seamlessly integrates with the Clueso platform to provide comprehensive recording capabilities.

## ✨ Key Features

- **🎥 Screen Recording**: High-quality screen, tab, and window capture
- **🎤 Audio Capture**: System audio and microphone recording
- **🖱️ Event Tracking**: Intelligent capture of clicks, scrolls, form interactions
- **🧠 DOM Analysis**: Contextual element information and page structure
- **🔄 Real-time Sync**: Live data streaming to Clueso backend
- **🎯 Smart Targeting**: Automatic detection of important UI elements
- **📊 Performance Monitoring**: Recording quality and performance metrics
- **🔐 Secure Communication**: Encrypted data transmission to backend

## 🛠 Tech Stack

```
React 19.2.0         - UI framework for extension popup/options
Vite 7.2.4           - Build tool and development server
TypeScript           - Type-safe development
Chrome Extensions API - Browser integration and permissions
WebRTC               - Screen and audio capture
Manifest V3          - Latest extension architecture
```

## 🏗 Architecture

### **Extension Structure**
```
src/
├── 📁 background/           # Service worker (Manifest V3)
│   ├── service-worker.js    # Main background script
│   └── recording-manager.js # Recording session management
│
├── 📁 content/              # Content scripts (injected into pages)
│   ├── content-script.js    # Main content script
│   ├── event-tracker.js     # DOM event capture
│   ├── dom-analyzer.js      # Page structure analysis
│   └── ui-overlay.js        # Recording UI overlay
│
├── 📁 popup/                # Extension popup interface
│   ├── Popup.tsx            # Main popup component
│   ├── RecordingControls.tsx # Recording start/stop controls
│   └── SettingsPanel.tsx    # Extension settings
│
├── 📁 options/              # Extension options page
│   ├── Options.tsx          # Settings and configuration
│   └── ApiKeySetup.tsx      # Backend connection setup
│
└── 📁 utils/                # Shared utilities
    ├── api-client.js        # Backend API communication
    ├── storage-manager.js   # Chrome storage management
    └── event-serializer.js  # Event data serialization

public/
├── manifest.json            # Extension manifest (V3)
├── icons/                   # Extension icons (16, 48, 128px)
└── permissions.json         # Required permissions
```

### **Data Flow**
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Web Page      │───▶│  Content Script │───▶│ Service Worker  │
│   (DOM Events)  │    │  (Event Capture)│    │ (Coordination)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │                       │
                                ▼                       ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │   Popup UI      │    │ Clueso Backend  │
                       │ (User Controls) │    │ (Data Storage)  │
                       └─────────────────┘    └─────────────────┘
```

## 🚀 Quick Start

### **Prerequisites**
- Chrome/Firefox browser
- Node.js 18+ and npm
- Running Clueso Backend API

### **Development Setup**
```bash
# Navigate to extension directory
cd clueso-extension

# Install dependencies
npm install

# Start development server
npm run dev
# Extension builds to dist/ folder
```

### **Load Extension in Browser**

#### **Chrome:**
1. Open `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `dist/` folder

#### **Firefox:**
1. Open `about:debugging`
2. Click "This Firefox"
3. Click "Load Temporary Add-on"
4. Select `dist/manifest.json`

### **Available Scripts**
```bash
npm run dev          # Development build with watch
npm run build        # Production build
npm run preview      # Preview built extension
npm run lint         # ESLint checking
```

## 🔧 Configuration

### **Manifest Configuration**
```json
{
  "manifest_version": 3,
  "name": "Clueso Screen Recorder",
  "version": "1.0.0",
  "description": "AI-powered screen recording with intelligent event capture",
  
  "permissions": [
    "activeTab",
    "desktopCapture",
    "storage",
    "tabs",
    "scripting"
  ],
  
  "host_permissions": [
    "http://localhost:3000/*",
    "https://your-backend-domain.com/*"
  ],
  
  "background": {
    "service_worker": "background/service-worker.js"
  },
  
  "content_scripts": [{
    "matches": ["<all_urls>"],
    "js": ["content/content-script.js"],
    "run_at": "document_start"
  }],
  
  "action": {
    "default_popup": "popup/index.html",
    "default_title": "Clueso Recorder"
  }
}
```

### **Backend Connection**
```javascript
// Configure backend API endpoint
const API_CONFIG = {
  baseURL: 'http://localhost:3000', // Development
  // baseURL: 'https://api.clueso.com', // Production
  timeout: 30000,
  retryAttempts: 3
};
```

## 🎥 Recording Features

### **Screen Capture**
```javascript
// Screen recording initialization
const startScreenRecording = async () => {
  try {
    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: {
        mediaSource: 'screen',
        width: { ideal: 1920 },
        height: { ideal: 1080 },
        frameRate: { ideal: 30 }
      },
      audio: {
        echoCancellation: true,
        noiseSuppression: true
      }
    });

    const recorder = new MediaRecorder(stream, {
      mimeType: 'video/webm;codecs=vp9,opus'
    });

    recorder.ondataavailable = handleRecordingData;
    recorder.start(1000); // 1-second chunks

  } catch (error) {
    console.error('Screen recording failed:', error);
  }
};
```

### **Event Tracking**
```javascript
// Intelligent event capture
const trackUserEvents = () => {
  // Click tracking with element context
  document.addEventListener('click', (event) => {
    const elementInfo = {
      tagName: event.target.tagName,
      id: event.target.id,
      className: event.target.className,
      textContent: event.target.textContent?.substring(0, 100),
      xpath: getElementXPath(event.target),
      timestamp: Date.now(),
      coordinates: { x: event.clientX, y: event.clientY }
    };

    sendEventToBackground('user_click', elementInfo);
  });

  // Form interaction tracking
  document.addEventListener('input', (event) => {
    if (event.target.type !== 'password') { // Security: no password capture
      const inputInfo = {
        type: 'form_input',
        fieldName: event.target.name || event.target.id,
        fieldType: event.target.type,
        value: event.target.value.substring(0, 50), // Limit data
        timestamp: Date.now()
      };

      sendEventToBackground('form_interaction', inputInfo);
    }
  });

  // Scroll tracking
  let scrollTimeout;
  document.addEventListener('scroll', () => {
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      const scrollInfo = {
        type: 'scroll',
        scrollY: window.scrollY,
        scrollX: window.scrollX,
        timestamp: Date.now()
      };

      sendEventToBackground('scroll_event', scrollInfo);
    }, 100);
  });
};
```

### **DOM Analysis**
```javascript
// Page structure analysis
const analyzePage = () => {
  const pageInfo = {
    url: window.location.href,
    title: document.title,
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight
    },
    elements: {
      buttons: document.querySelectorAll('button').length,
      inputs: document.querySelectorAll('input').length,
      links: document.querySelectorAll('a').length,
      images: document.querySelectorAll('img').length
    },
    technologies: detectTechnologies(), // Framework detection
    timestamp: Date.now()
  };

  return pageInfo;
};
```

## 🔄 Communication Flow

### **Content Script ↔ Background**
```javascript
// Content script sends events to background
const sendEventToBackground = (type, data) => {
  chrome.runtime.sendMessage({
    action: type,
    data: data,
    timestamp: Date.now(),
    tabId: chrome.tabs.getCurrent()?.id
  });
};

// Background script handles events
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.action) {
    case 'user_click':
      handleUserClick(message.data, sender.tab);
      break;
    case 'form_interaction':
      handleFormInteraction(message.data, sender.tab);
      break;
    case 'start_recording':
      startRecordingSession(sender.tab);
      break;
  }
});
```

### **Extension ↔ Backend**
```javascript
// Send recording data to backend
const uploadRecordingChunk = async (chunk, sessionId) => {
  const formData = new FormData();
  formData.append('video', chunk);
  formData.append('sessionId', sessionId);
  formData.append('timestamp', Date.now());

  try {
    const response = await fetch(`${API_CONFIG.baseURL}/api/recording/upload`, {
      method: 'POST',
      body: formData,
      headers: {
        'Authorization': `Bearer ${await getAuthToken()}`
      }
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Upload error:', error);
    // Implement retry logic
  }
};
```

## 🎨 User Interface

### **Popup Component**
```typescript
// Main extension popup
const Popup: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);

  const handleStartRecording = async () => {
    try {
      await chrome.runtime.sendMessage({ action: 'start_recording' });
      setIsRecording(true);
    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  };

  const handleStopRecording = async () => {
    try {
      await chrome.runtime.sendMessage({ action: 'stop_recording' });
      setIsRecording(false);
      setRecordingTime(0);
    } catch (error) {
      console.error('Failed to stop recording:', error);
    }
  };

  return (
    <div className="popup-container">
      <div className="header">
        <h1>Clueso Recorder</h1>
        <div className="status">
          {isRecording ? (
            <span className="recording">● Recording {formatTime(recordingTime)}</span>
          ) : (
            <span className="ready">Ready to record</span>
          )}
        </div>
      </div>

      <div className="controls">
        {!isRecording ? (
          <button onClick={handleStartRecording} className="start-btn">
            🎥 Start Recording
          </button>
        ) : (
          <button onClick={handleStopRecording} className="stop-btn">
            ⏹️ Stop Recording
          </button>
        )}
      </div>

      <div className="settings">
        <RecordingSettings />
      </div>
    </div>
  );
};
```

### **Recording Settings**
```typescript
// Recording configuration component
const RecordingSettings: React.FC = () => {
  const [settings, setSettings] = useState({
    quality: 'high',
    includeAudio: true,
    trackEvents: true,
    autoUpload: true
  });

  const updateSetting = (key: string, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    
    // Save to Chrome storage
    chrome.storage.sync.set({ recordingSettings: newSettings });
  };

  return (
    <div className="settings-panel">
      <h3>Recording Settings</h3>
      
      <div className="setting-item">
        <label>Video Quality:</label>
        <select 
          value={settings.quality}
          onChange={(e) => updateSetting('quality', e.target.value)}
        >
          <option value="high">High (1080p)</option>
          <option value="medium">Medium (720p)</option>
          <option value="low">Low (480p)</option>
        </select>
      </div>

      <div className="setting-item">
        <label>
          <input
            type="checkbox"
            checked={settings.includeAudio}
            onChange={(e) => updateSetting('includeAudio', e.target.checked)}
          />
          Include Audio
        </label>
      </div>

      <div className="setting-item">
        <label>
          <input
            type="checkbox"
            checked={settings.trackEvents}
            onChange={(e) => updateSetting('trackEvents', e.target.checked)}
          />
          Track User Events
        </label>
      </div>
    </div>
  );
};
```

## 🔒 Security & Privacy

### **Data Protection**
- **No Password Capture**: Automatically excludes password fields
- **Data Minimization**: Limits captured text content length
- **Secure Transmission**: HTTPS-only communication with backend
- **Local Storage**: Temporary storage with automatic cleanup
- **Permission Management**: Minimal required permissions

### **Privacy Features**
```javascript
// Privacy-aware event filtering
const isPrivateField = (element) => {
  const sensitiveTypes = ['password', 'ssn', 'credit-card'];
  const sensitiveNames = ['password', 'ssn', 'creditcard', 'cvv'];
  
  return (
    sensitiveTypes.includes(element.type) ||
    sensitiveNames.some(name => 
      element.name?.toLowerCase().includes(name) ||
      element.id?.toLowerCase().includes(name)
    )
  );
};

// Filter out sensitive data
const sanitizeEventData = (eventData) => {
  if (isPrivateField(eventData.target)) {
    return null; // Don't capture sensitive fields
  }
  
  // Limit text content length
  if (eventData.textContent) {
    eventData.textContent = eventData.textContent.substring(0, 100);
  }
  
  return eventData;
};
```

## 🧪 Testing & Debugging

### **Development Tools**
```bash
# Build for testing
npm run build

# Load extension in browser
# Check browser console for errors
# Use Chrome DevTools for debugging
```

### **Debug Mode**
```javascript
// Enable debug logging
const DEBUG_MODE = process.env.NODE_ENV === 'development';

const debugLog = (message, data) => {
  if (DEBUG_MODE) {
    console.log(`[Clueso Extension] ${message}`, data);
  }
};
```

### **Error Handling**
```javascript
// Global error handling
window.addEventListener('error', (event) => {
  console.error('Extension error:', event.error);
  
  // Send error to backend for monitoring
  chrome.runtime.sendMessage({
    action: 'log_error',
    error: {
      message: event.error.message,
      stack: event.error.stack,
      timestamp: Date.now()
    }
  });
});
```

## 📦 Distribution

### **Chrome Web Store**
1. Create production build: `npm run build`
2. Zip the `dist/` folder
3. Upload to Chrome Web Store Developer Dashboard
4. Fill out store listing details
5. Submit for review

### **Firefox Add-ons**
1. Create production build: `npm run build`
2. Zip the `dist/` folder
3. Upload to Firefox Add-on Developer Hub
4. Complete listing information
5. Submit for review

### **Enterprise Distribution**
```bash
# Create enterprise package
npm run build
zip -r clueso-extension-enterprise.zip dist/

# Include installation instructions
# Provide group policy templates for IT deployment
```

## 🔧 Development

### **Adding New Features**
1. Update manifest.json permissions if needed
2. Add new content scripts or background scripts
3. Update popup UI components
4. Test across different websites
5. Update documentation

### **Performance Optimization**
- Minimize content script size
- Use efficient event listeners
- Implement proper cleanup
- Optimize recording quality vs. file size
- Use background script efficiently

## 🤝 Contributing

1. Follow Chrome Extension best practices
2. Test on multiple websites and browsers
3. Ensure privacy compliance
4. Add proper error handling
5. Update documentation

## 📞 Support

- **Chrome Extension Issues**: Check browser console
- **Recording Problems**: Verify permissions and API connectivity
- **Performance**: Monitor memory usage and optimize accordingly

---

**Built for seamless integration with the Clueso platform**