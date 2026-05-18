// ========================================
// LAURA - JavaScript PWA Utilities & Managers
// ========================================

// ========================================
// 1. DATA PERSISTENCE
// ========================================
export class LocalDataManager {
  static setItem(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      if (error.name === 'QuotaExceededError') {
        console.error('LocalStorage quota exceeded');
      }
    }
  }
  
  static getItem(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error('LocalStorage read error:', error);
      return defaultValue;
    }
  }
  
  static removeItem(key) {
    localStorage.removeItem(key);
  }
  
  static clear() {
    localStorage.clear();
  }
  
  // Prefixed storage for app data
  static saveUserData(key, data) {
    this.setItem(`laura_${key}`, data);
  }
  
  static getUserData(key, defaultValue = null) {
    return this.getItem(`laura_${key}`, defaultValue);
  }
}

// ========================================
// 2. API CLIENT (JWT Authorized)
// ========================================
export class APIClient {
  constructor(baseURL = '/api') {
    this.baseURL = baseURL;
  }
  
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const token = LocalDataManager.getUserData('token');
    
    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      }
    };
    
    const response = await fetch(url, { ...defaultOptions, ...options });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    return response.json();
  }
  
  get(endpoint) {
    return this.request(endpoint);
  }
  
  post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }
  
  put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }
  
  delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }
}

export const api = new APIClient('/api');

// ========================================
// 3. NOTIFICATIONS (UI Toast overlays)
// ========================================
export const showNotification = (message, type = 'info') => {
  const existing = document.querySelectorAll('.notification-toast');
  existing.forEach(el => el.remove());

  const notification = document.createElement('div');
  notification.className = `notification-toast notification-${type}`;
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    padding: 12px 16px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 500;
    z-index: 9999;
    animation: slideIn 0.3s ease-out;
  `;
  
  // Style based on type
  const styles = {
    success: { background: '#1f9e6e', color: 'white' },
    error: { background: '#d33b27', color: 'white' },
    info: { background: '#1f73e8', color: 'white' },
    warning: { background: '#f57c00', color: 'white' }
  };
  
  Object.assign(notification.style, styles[type] || styles.info);
  
  document.body.appendChild(notification);
  
  // Add CSS animation keyframes inline if not present
  if (!document.getElementById('notification-animations')) {
    const style = document.createElement('style');
    style.id = 'notification-animations';
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(400px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(400px); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  }
  
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease-out';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
};

// ========================================
// 4. LOADERS
// ========================================
export const showLoader = () => {
  if (document.getElementById('app-loader')) return;

  const loader = document.createElement('div');
  loader.id = 'app-loader';
  loader.style.cssText = `
    position: fixed;
    inset: 0;
    background: rgba(255,255,255,0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9998;
  `;
  loader.innerHTML = `
    <div style="text-align: center;">
      <div style="
        width: 40px;
        height: 40px;
        border: 3px solid #1f73e8;
        border-top-color: transparent;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
        margin: 0 auto 16px;
      "></div>
      <p style="color: #5f6368; font-size: 12px;">Chargement...</p>
    </div>
  `;
  document.body.appendChild(loader);
};

export const hideLoader = () => {
  document.getElementById('app-loader')?.remove();
};

// ========================================
// 5. PWA OS SERVICES
// ========================================
export class PWAManager {
  static async initInstall(onPromptAvailable) {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      onPromptAvailable?.(e);
    });
  }
  
  static initOfflineDetection() {
    window.addEventListener('online', () => {
      showNotification('Connexion réseau rétablie !', 'success');
    });
    
    window.addEventListener('offline', () => {
      showNotification('Vous êtes actuellement hors-ligne.', 'warning');
    });
  }
  
  static async registerBackgroundSync(tag = 'sync-progress') {
    if (!('serviceWorker' in navigator) || !('SyncManager' in window)) {
      console.warn('Background Sync not supported');
      return;
    }
    
    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.sync.register(tag);
      console.log(`[Sync] Registered background sync tag: ${tag}`);
    } catch (error) {
      console.error('[Sync] Sync registration failed:', error);
    }
  }
  
  static async subscribeToPush(publicVapidKey) {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      console.warn('Push notifications not supported');
      return null;
    }
    
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return null;
    
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(publicVapidKey)
      });
      
      console.log('[PWA] Push subscription successful');
      return subscription;
    } catch (error) {
      console.error('[PWA] Push subscription failed:', error);
      return null;
    }
  }
  
  static urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    
    return outputArray;
  }
  
  static async clearCache(cacheName = null) {
    try {
      if (cacheName) {
        await caches.delete(cacheName);
        console.log(`[Cache] Cache cleared: ${cacheName}`);
      } else {
        const names = await caches.keys();
        await Promise.all(names.map(name => caches.delete(name)));
        console.log('[Cache] All caches cleared');
      }
    } catch (error) {
      console.error('[Cache] Cache clear failed:', error);
    }
  }
  
  static async getCacheSize() {
    if (!navigator.storage?.estimate) return null;
    
    try {
      const { usage, quota } = await navigator.storage.estimate();
      return {
        usage: (usage / 1024 / 1024).toFixed(2),
        quota: (quota / 1024 / 1024).toFixed(2),
        percentage: ((usage / quota) * 100).toFixed(1)
      };
    } catch (error) {
      console.error('[Cache] Cache size estimation failed:', error);
      return null;
    }
  }
}
