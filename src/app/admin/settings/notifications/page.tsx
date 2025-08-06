// src/app/admin/settings/notifications/page.tsx
'use client';

import React, { useState, useRef } from 'react';
import { 
  Volume2, 
  VolumeX, 
  Upload, 
  Play, 
  Trash2, 
  Check, 
  AlertCircle,
  Bell,
  BellOff
} from 'lucide-react';
import { useAdminNotifications } from '@/hooks/useAdminNotifications';

export default function NotificationSettingsPage() {
  const {
    connected,
    connectionError,
    testNotification,
    soundManager,
    reconnect
  } = useAdminNotifications();

  const [soundEnabled, setSoundEnabled] = useState(soundManager.isEnabled());
  const [volume, setVolume] = useState(Math.round(soundManager.getVolume() * 100));
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [currentSound, setCurrentSound] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load current sound info on mount
  React.useEffect(() => {
    const loadSoundInfo = async () => {
      try {
        const response = await fetch('/api/admin/notification-sound');
        const data = await response.json();
        if (data.success && data.soundExists) {
          setCurrentSound(data.soundUrl);
        }
      } catch (error) {
        console.error('Failed to load sound info:', error);
      }
    };
    loadSoundInfo();
  }, []);

  const handleSoundToggle = (enabled: boolean) => {
    setSoundEnabled(enabled);
    soundManager.setEnabled(enabled);
  };

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    soundManager.setVolume(newVolume / 100);
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith('audio/')) {
      alert('Please select an audio file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('File must be smaller than 5MB');
      return;
    }

    setUploading(true);
    setUploadStatus('idle');

    try {
      const formData = new FormData();
      formData.append('soundFile', file);

      const response = await fetch('/api/admin/notification-sound', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        setCurrentSound(result.soundUrl);
        setUploadStatus('success');
        // Update sound manager
        await soundManager.updateCustomSound(file);
        console.log('✅ Sound uploaded successfully');
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (error) {
      console.error('❌ Sound upload failed:', error);
      setUploadStatus('error');
      alert('Failed to upload sound file');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteSound = async () => {
    if (!confirm('Are you sure you want to remove the custom sound?')) return;

    try {
      const response = await fetch('/api/admin/notification-sound', {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        setCurrentSound(null);
        setUploadStatus('success');
        console.log('✅ Custom sound deleted');
      } else {
        throw new Error(result.error || 'Delete failed');
      }
    } catch (error) {
      console.error('❌ Sound delete failed:', error);
      alert('Failed to delete sound file');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Bell className="w-6 h-6 text-green-600" />
              Notification Settings
            </h1>
            <p className="text-gray-600 mt-1">
              Configure your admin notification preferences and custom sounds
            </p>
          </div>

          <div className="p-6 space-y-8">
            {/* Connection Status */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                <Bell className="w-4 h-4" />
                Connection Status
              </h3>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span className={`text-sm ${connected ? 'text-green-700' : 'text-red-700'}`}>
                    {connected ? 'Connected to notification stream' : 'Disconnected'}
                  </span>
                </div>
                {!connected && (
                  <button
                    onClick={reconnect}
                    className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
                  >
                    Reconnect
                  </button>
                )}
              </div>
              {connectionError && (
                <p className="text-sm text-red-600 mt-1">{connectionError}</p>
              )}
            </div>

            {/* Sound Settings */}
            <div>
              <h3 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                <Volume2 className="w-4 h-4" />
                Sound Settings
              </h3>

              <div className="space-y-4">
                {/* Enable/Disable Sound */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">Notification Sounds</h4>
                    <p className="text-sm text-gray-600">Play sound when new cars are listed</p>
                  </div>
                  <button
                    onClick={() => handleSoundToggle(!soundEnabled)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      soundEnabled ? 'bg-green-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        soundEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Volume Control */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-4">
                    <VolumeX className="w-4 h-4 text-gray-400" />
                    <div className="flex-1">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={volume}
                        onChange={(e) => handleVolumeChange(parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                        disabled={!soundEnabled}
                      />
                    </div>
                    <Volume2 className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600 w-12">{volume}%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Custom Sound Upload */}
            <div>
              <h3 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Custom Sound
              </h3>

              <div className="space-y-4">
                {/* Current Sound */}
                {currentSound && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-600" />
                        <span className="text-sm text-green-800">Custom sound uploaded</span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => soundManager.testSound()}
                          className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors flex items-center gap-1"
                        >
                          <Play className="w-3 h-3" />
                          Test
                        </button>
                        <button
                          onClick={handleDeleteSound}
                          className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition-colors flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" />
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Upload Area */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="audio/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  
                  {uploading ? (
                    <div className="flex flex-col items-center gap-2">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      <p className="text-sm text-gray-600">Uploading sound...</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <Upload className="w-8 h-8 text-gray-400" />
                      <p className="text-sm text-gray-600">
                        {currentSound ? 'Upload new custom sound' : 'Upload your 6-second notification sound'}
                      </p>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                      >
                        Choose File
                      </button>
                      <p className="text-xs text-gray-500">
                        MP3, WAV, or other audio formats • Max 5MB • Recommended: 6 seconds
                      </p>
                    </div>
                  )}
                </div>

                {/* Upload Status */}
                {uploadStatus === 'success' && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-green-800">Sound updated successfully!</span>
                  </div>
                )}

                {uploadStatus === 'error' && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                    <span className="text-sm text-red-800">Failed to upload sound. Please try again.</span>
                  </div>
                )}
              </div>
            </div>

            {/* Test Notification */}
            <div>
              <h3 className="font-medium text-gray-900 mb-4">Test Notifications</h3>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-3">
                  Test your notification settings to ensure everything is working correctly.
                </p>
                <button
                  onClick={testNotification}
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors flex items-center gap-2"
                  disabled={!connected}
                >
                  <Bell className="w-4 h-4" />
                  Send Test Notification
                </button>
                {!connected && (
                  <p className="text-xs text-red-600 mt-2">
                    Connect to notification stream to test notifications
                  </p>
                )}
              </div>
            </div>

            {/* Browser Notifications */}
            <div>
              <h3 className="font-medium text-gray-900 mb-4">Browser Notifications</h3>
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">Desktop Notifications</h4>
                    <p className="text-sm text-gray-600">Show notifications even when browser is in background</p>
                  </div>
                  <div className="text-sm">
                    {Notification.permission === 'granted' && (
                      <span className="text-green-600 flex items-center gap-1">
                        <Check className="w-4 h-4" />
                        Enabled
                      </span>
                    )}
                    {Notification.permission === 'denied' && (
                      <span className="text-red-600 flex items-center gap-1">
                        <BellOff className="w-4 h-4" />
                        Blocked
                      </span>
                    )}
                    {Notification.permission === 'default' && (
                      <button
                        onClick={() => Notification.requestPermission()}
                        className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-colors"
                      >
                        Enable
                      </button>
                    )}
                  </div>
                </div>
                {Notification.permission === 'denied' && (
                  <p className="text-xs text-red-600 mt-2">
                    Browser notifications are blocked. Please enable them in your browser settings.
                  </p>
                )}
              </div>
            </div>

            {/* Notification Types */}
            <div>
              <h3 className="font-medium text-gray-900 mb-4">Notification Types</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <h4 className="font-medium text-gray-900">New Car Listings</h4>
                  </div>
                  <p className="text-sm text-gray-600">
                    Get notified immediately when someone places a new car ad with your custom sound.
                  </p>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <h4 className="font-medium text-gray-900">New Dealer Registrations</h4>
                  </div>
                  <p className="text-sm text-gray-600">
                    Be alerted when new dealers sign up and need verification.
                  </p>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <h4 className="font-medium text-gray-900">Urgent Reports</h4>
                  </div>
                  <p className="text-sm text-gray-600">
                    Critical security issues and scam reports that need immediate attention.
                  </p>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                    <h4 className="font-medium text-gray-900">System Alerts</h4>
                  </div>
                  <p className="text-sm text-gray-600">
                    Platform maintenance, security updates, and system notifications.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #059669;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }

        .slider::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #059669;
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }

        .slider:disabled::-webkit-slider-thumb {
          background: #9ca3af;
          cursor: not-allowed;
        }

        .slider:disabled::-moz-range-thumb {
          background: #9ca3af;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}