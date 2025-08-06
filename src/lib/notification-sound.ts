// src/lib/notification-sound.ts - SSR Safe Version
class NotificationSoundManager {
  private audio: HTMLAudioElement | null = null;
  private soundUrl: string = '/admin/notification-sounds/custom.mp3';
  private volume: number = 0.8;
  private enabled: boolean = true;
  private isInitialized: boolean = false;

  constructor() {
    // Don't initialize during SSR - wait for browser
    if (typeof window !== 'undefined') {
      this.initializeSound();
    }
  }

  private initializeSound() {
    // Prevent multiple initializations
    if (this.isInitialized) return;
    
    try {
      // Only initialize in browser environment
      if (typeof window === 'undefined' || typeof Audio === 'undefined') {
        console.warn('🔇 Audio not available in this environment');
        return;
      }

      this.audio = new Audio();
      this.audio.volume = this.volume;
      this.audio.preload = 'auto';
      this.isInitialized = true;
      
      // Load the custom sound file
      this.loadCustomSound();
      console.log('✅ Notification sound manager initialized');
    } catch (error: any) {
      console.error('Failed to initialize notification sound:', error);
    }
  }

  private async loadCustomSound() {
    // Ensure we're in browser environment
    if (typeof window === 'undefined') return;
    
    try {
      // Check if custom sound exists
      const response = await fetch(this.soundUrl, { method: 'HEAD' });
      if (response.ok) {
        if (this.audio) {
          this.audio.src = this.soundUrl;
        }
        console.log('✅ Custom notification sound loaded');
      } else {
        // Fallback to default browser notification sound
        this.useDefaultSound();
      }
    } catch (error: any) {
      console.error('Failed to load custom sound, using default:', error);
      this.useDefaultSound();
    }
  }

  private useDefaultSound() {
    // Create a simple beep sound as fallback
    this.createBeepSound();
  }

  private createBeepSound() {
    // Only create beep in browser environment
    if (typeof window === 'undefined') return;
    
    try {
      // Create a short beep using Web Audio API
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) {
        console.warn('🔇 Web Audio API not supported');
        this.playBeep = () => {};
        return;
      }

      const audioContext = new AudioContextClass();
      
      this.playBeep = () => {
        if (!this.enabled || typeof window === 'undefined') return;
        
        try {
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();
          
          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);
          
          oscillator.frequency.value = 800; // 800Hz tone
          gainNode.gain.setValueAtTime(this.volume, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
          
          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + 0.3);
        } catch (error: any) {
          console.error('Failed to play beep:', error);
        }
      };
    } catch (error: any) {
      console.error('Failed to create beep sound:', error);
      this.playBeep = () => {}; // No-op fallback
    }
  }

  private playBeep: () => void = () => {};

  // Main method to play notification sound
  public async playNotificationSound(): Promise<void> {
    // Ensure initialization in browser
    if (typeof window !== 'undefined' && !this.isInitialized) {
      this.initializeSound();
    }

    if (!this.enabled) {
      console.log('🔇 Notification sound disabled');
      return;
    }

    // Guard against SSR
    if (typeof window === 'undefined') {
      console.warn('🔇 Notification sound not available during SSR');
      return;
    }

    try {
      if (this.audio && this.audio.src) {
        // Play custom sound
        await this.playCustomSound();
      } else {
        // Play fallback beep
        this.playBeep();
      }
      console.log('🔊 Notification sound played');
    } catch (error: any) {
      console.error('Failed to play notification sound:', error);
      // Try fallback beep
      this.playBeep();
    }
  }

  private async playCustomSound(): Promise<void> {
    if (!this.audio || typeof window === 'undefined') return;

    try {
      // Reset audio to beginning
      this.audio.currentTime = 0;
      
      // Play the sound
      const playPromise = this.audio.play();
      
      if (playPromise !== undefined) {
        await playPromise;
      }
    } catch (error: any) {
      // Handle autoplay restrictions
      if (error.name === 'NotAllowedError') {
        console.warn('🔇 Audio autoplay blocked by browser. User interaction required.');
        // Store that we need user permission
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('needAudioPermission', 'true');
        }
      } else {
        throw error;
      }
    }
  }

  // Request audio permission (call after user interaction)
  public async requestAudioPermission(): Promise<boolean> {
    // Guard against SSR
    if (typeof window === 'undefined') return false;
    
    // Ensure initialization
    if (!this.isInitialized) {
      this.initializeSound();
    }

    try {
      if (this.audio && this.audio.src) {
        await this.audio.play();
        this.audio.pause();
        this.audio.currentTime = 0;
        if (typeof localStorage !== 'undefined') {
          localStorage.removeItem('needAudioPermission');
        }
        console.log('✅ Audio permission granted');
        return true;
      }
      return false;
    } catch (error: any) {
      console.error('Audio permission denied:', error);
      return false;
    }
  }

  // Check if audio permission is needed
  public needsPermission(): boolean {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') return false;
    return localStorage.getItem('needAudioPermission') === 'true';
  }

  // Enable/disable notifications
  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('notificationSoundEnabled', enabled.toString());
    }
    console.log(`🔊 Notification sound ${enabled ? 'enabled' : 'disabled'}`);
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  // Set volume (0.0 to 1.0)
  public setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
    if (this.audio) {
      this.audio.volume = this.volume;
    }
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('notificationVolume', this.volume.toString());
    }
    console.log(`🔊 Notification volume set to ${Math.round(this.volume * 100)}%`);
  }

  public getVolume(): number {
    return this.volume;
  }

  // Test sound
  public async testSound(): Promise<void> {
    console.log('🧪 Testing notification sound...');
    await this.playNotificationSound();
  }

  // Load settings from localStorage
  public loadSettings(): void {
    // Guard against SSR
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
    
    try {
      const savedEnabled = localStorage.getItem('notificationSoundEnabled');
      if (savedEnabled !== null) {
        this.enabled = savedEnabled === 'true';
      }

      const savedVolume = localStorage.getItem('notificationVolume');
      if (savedVolume !== null) {
        this.setVolume(parseFloat(savedVolume));
      }

      console.log(`🔊 Sound settings loaded: enabled=${this.enabled}, volume=${Math.round(this.volume * 100)}%`);
    } catch (error: any) {
      console.error('Failed to load sound settings:', error);
    }
  }

  // Update custom sound file
  public async updateCustomSound(file: File): Promise<boolean> {
    // Guard against SSR
    if (typeof window === 'undefined') {
      console.error('File upload not available during SSR');
      return false;
    }

    try {
      // Validate file
      if (!file.type.startsWith('audio/')) {
        throw new Error('File must be an audio file');
      }

      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        throw new Error('File must be smaller than 5MB');
      }

      // Upload file to server
      const formData = new FormData();
      formData.append('soundFile', file);

      const response = await fetch('/api/admin/notification-sound', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload sound file');
      }

      const result = await response.json();
      
      // Update audio source
      if (this.audio) {
        this.audio.src = result.soundUrl + '?t=' + Date.now(); // Cache bust
        await this.audio.load();
      }

      console.log('✅ Custom notification sound updated');
      return true;
    } catch (error: any) {
      console.error('Failed to update custom sound:', error);
      return false;
    }
  }
}

// Create singleton instance with SSR safety
let notificationSoundManager: NotificationSoundManager;

// Only create instance in browser
if (typeof window !== 'undefined') {
  notificationSoundManager = new NotificationSoundManager();
  // Load settings on initialization
  notificationSoundManager.loadSettings();
} else {
  // Create a safe mock for SSR
  notificationSoundManager = {
    playNotificationSound: async () => {},
    requestAudioPermission: async () => false,
    needsPermission: () => false,
    setEnabled: () => {},
    isEnabled: () => false,
    setVolume: () => {},
    getVolume: () => 0.8,
    testSound: async () => {},
    loadSettings: () => {},
    updateCustomSound: async () => false,
  } as any;
}

export default notificationSoundManager;