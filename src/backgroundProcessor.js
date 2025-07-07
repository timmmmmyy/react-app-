// Background processor for face touch detection
// This bypasses MediaPipe's Camera class which gets throttled

class BackgroundProcessor {
  constructor() {
    this.isActive = false;
    this.isTabVisible = true;
    this.processingInterval = null;
    this.serviceWorker = null;
    this.lastProcessTime = 0;
    this.frameSkipCounter = 0;
    
    // Initialize service worker
    this.initServiceWorker();
  }

  async initServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/background-worker.js');
        console.log('Service Worker registered:', registration);
        
        // Get active service worker
        this.serviceWorker = registration.active || registration.installing || registration.waiting;
        
        // Listen for service worker messages
        navigator.serviceWorker.addEventListener('message', (event) => {
          console.log('Received from Service Worker:', event.data);
        });
        
        // Keep connection alive
        setInterval(() => {
          if (this.serviceWorker) {
            this.serviceWorker.postMessage({ type: 'PING' });
          }
        }, 5000);
        
      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    }
  }

  start(videoElement, faceMeshModel, handsModel, callbacks) {
    if (this.isActive) return;
    
    this.isActive = true;
    this.videoElement = videoElement;
    this.faceMeshModel = faceMeshModel;
    this.handsModel = handsModel;
    this.callbacks = callbacks;
    
    console.log('BackgroundProcessor: Starting direct video processing');
    
    // Notify service worker
    if (this.serviceWorker) {
      this.serviceWorker.postMessage({ type: 'START_DETECTION' });
    }
    
    // Start processing loop with setInterval instead of MediaPipe Camera
    this.startProcessingLoop();
  }

  stop() {
    this.isActive = false;
    
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
    
    // Notify service worker
    if (this.serviceWorker) {
      this.serviceWorker.postMessage({ type: 'STOP_DETECTION' });
    }
    
    console.log('BackgroundProcessor: Stopped');
  }

  setTabVisibility(isVisible) {
    this.isTabVisible = isVisible;
    console.log('BackgroundProcessor: Tab visibility changed to', isVisible);
  }

  startProcessingLoop() {
    // Use setInterval for consistent timing regardless of tab visibility
    const targetFPS = this.isTabVisible ? 3 : 1; // Lower FPS in background
    const interval = 1000 / targetFPS;
    
    this.processingInterval = setInterval(async () => {
      if (!this.isActive || !this.videoElement) return;
      
      try {
        const now = performance.now();
        
        // Frame skipping logic
        const maxSkipFrames = this.isTabVisible ? 10 : 20;
        this.frameSkipCounter++;
        
        if (this.frameSkipCounter < maxSkipFrames) {
          return;
        }
        this.frameSkipCounter = 0;
        
        // Rate limiting
        if (now - this.lastProcessTime < interval) {
          return;
        }
        this.lastProcessTime = now;
        
        // Process video frame directly
        await this.processFrame();
        
        // Log heartbeat to prove background processing
        if (!this.isTabVisible) {
          console.log('Background processing heartbeat:', new Date().toLocaleTimeString());
        }
        
      } catch (error) {
        console.error('Background processing error:', error);
      }
    }, interval);
  }

  async processFrame() {
    if (!this.videoElement || !this.faceMeshModel || !this.handsModel) return;
    
    try {
      // Check if video is ready
      if (this.videoElement.readyState !== 4) return;
      
      // Alternate between models to reduce CPU load
      const useHands = Math.random() > 0.5;
      
      if (useHands && this.handsModel) {
        // Process hands
        await this.handsModel.send({ image: this.videoElement });
      } else if (this.faceMeshModel) {
        // Process face
        await this.faceMeshModel.send({ image: this.videoElement });
      }
      
    } catch (error) {
      console.warn('Frame processing error:', error);
    }
  }

  // Handle face touch detection
  handleFaceTouch(isTouching) {
    if (isTouching && this.serviceWorker) {
      // Delegate alert to service worker for background compatibility
      this.serviceWorker.postMessage({ 
        type: 'FACE_TOUCH_DETECTED',
        timestamp: Date.now()
      });
    }
    
    // Also call original callback
    if (this.callbacks && this.callbacks.onFaceTouch) {
      this.callbacks.onFaceTouch(isTouching);
    }
  }

  // Force keep-alive operations
  keepAlive() {
    if (!this.isTabVisible && this.isActive) {
      // Micro-operations to prevent throttling
      const dummy = Math.random() * 1000;
      
      // Force a small computation
      for (let i = 0; i < 10; i++) {
        Math.sin(dummy + i);
      }
      
      // Update a timestamp to keep memory active
      this.lastKeepAlive = Date.now();
    }
  }
}

export default BackgroundProcessor; 