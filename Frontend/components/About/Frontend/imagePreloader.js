// Image preloading utility for team member images
export class ImagePreloader {
  constructor() {
    this.cache = new Map();
    this.preloadQueue = [];
    this.isPreloading = false;
  }

  // Preload a single image
  async preloadImage(url) {
    if (this.cache.has(url)) {
      return this.cache.get(url);
    }

    return new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        this.cache.set(url, {
          url,
          loaded: true,
          element: img,
          timestamp: Date.now()
        });
        resolve(img);
      };
      
      img.onerror = () => {
        this.cache.set(url, {
          url,
          loaded: false,
          error: true,
          timestamp: Date.now()
        });
        reject(new Error(`Failed to load image: ${url}`));
      };
      
      img.src = url;
    });
  }

  // Preload multiple images with batching
  async preloadImages(urls, batchSize = 3) {
    this.isPreloading = true;
    const batches = [];
    
    // Split URLs into batches
    for (let i = 0; i < urls.length; i += batchSize) {
      batches.push(urls.slice(i, i + batchSize));
    }

    try {
      // Process batches sequentially to avoid overwhelming the server
      for (const batch of batches) {
        await Promise.allSettled(
          batch.map(url => this.preloadImage(url))
        );
        
        // Small delay between batches
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } finally {
      this.isPreloading = false;
    }
  }

  // Check if image is cached
  isImageCached(url) {
    const cached = this.cache.get(url);
    return cached && cached.loaded;
  }

  // Clear old cache entries (older than 1 hour)
  clearOldCache() {
    const now = Date.now();
    const maxAge = 60 * 60 * 1000; // 1 hour

    for (const [url, data] of this.cache.entries()) {
      if (now - data.timestamp > maxAge) {
        this.cache.delete(url);
      }
    }
  }

  // Get cache stats
  getCacheStats() {
    return {
      size: this.cache.size,
      isPreloading: this.isPreloading,
      entries: Array.from(this.cache.keys())
    };
  }
}

// Create a global instance
export const imagePreloader = new ImagePreloader();

// Auto-cleanup every 30 minutes
setInterval(() => {
  imagePreloader.clearOldCache();
}, 30 * 60 * 1000); 