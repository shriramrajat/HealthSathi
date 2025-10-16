/**
 * Jitsi Meet Integration Service
 * Uses Jitsi Meet External API for video conferencing
 */

// Jitsi Meet External API types
declare global {
  interface Window {
    JitsiMeetExternalAPI: any;
  }
}

export interface JitsiConfig {
  roomName: string;
  width?: string | number;
  height?: string | number;
  parentNode?: HTMLElement;
  configOverwrite?: {
    startWithAudioMuted?: boolean;
    startWithVideoMuted?: boolean;
    enableWelcomePage?: boolean;
    prejoinPageEnabled?: boolean;
    disableModeratorIndicator?: boolean;
    startScreenSharing?: boolean;
    enableEmailInStats?: boolean;
  };
  interfaceConfigOverwrite?: {
    TOOLBAR_BUTTONS?: string[];
    SETTINGS_SECTIONS?: string[];
    SHOW_JITSI_WATERMARK?: boolean;
    SHOW_WATERMARK_FOR_GUESTS?: boolean;
    SHOW_BRAND_WATERMARK?: boolean;
    BRAND_WATERMARK_LINK?: string;
    SHOW_POWERED_BY?: boolean;
    DISPLAY_WELCOME_PAGE_CONTENT?: boolean;
    DISPLAY_WELCOME_PAGE_TOOLBAR_ADDITIONAL_CONTENT?: boolean;
    APP_NAME?: string;
    NATIVE_APP_NAME?: string;
    PROVIDER_NAME?: string;
    LANG_DETECTION?: boolean;
    CONNECTION_INDICATOR_DISABLED?: boolean;
    VIDEO_QUALITY_LABEL_DISABLED?: boolean;
    RECENT_LIST_ENABLED?: boolean;
    OPTIMAL_BROWSERS?: string[];
    UNSUPPORTED_BROWSERS?: string[];
    MOBILE_APP_PROMO?: boolean;
  };
  userInfo?: {
    displayName?: string;
    email?: string;
  };
}

export interface JitsiEventHandlers {
  onVideoConferenceJoined?: (event: any) => void;
  onVideoConferenceLeft?: (event: any) => void;
  onParticipantJoined?: (event: any) => void;
  onParticipantLeft?: (event: any) => void;
  onDisplayNameChanged?: (event: any) => void;
  onDeviceListChanged?: (event: any) => void;
  onEmailChanged?: (event: any) => void;
  onFeedbackSubmitted?: (event: any) => void;
  onFilmstripDisplayChanged?: (event: any) => void;
  onMicMutedChanged?: (event: any) => void;
  onCameraMutedChanged?: (event: any) => void;
  onScreenSharingStatusChanged?: (event: any) => void;
  onDominantSpeakerChanged?: (event: any) => void;
  onTileViewChanged?: (event: any) => void;
  onIncomingMessage?: (event: any) => void;
  onOutgoingMessage?: (event: any) => void;
  onMouseEnter?: (event: any) => void;
  onMouseLeave?: (event: any) => void;
  onMouseMove?: (event: any) => void;
  onRecordingStatusChanged?: (event: any) => void;
  onConnectionStatusChanged?: (event: any) => void;
  onError?: (event: any) => void;
}

export class JitsiService {
  private api: any = null;
  private isScriptLoaded = false;
  private scriptLoadPromise: Promise<void> | null = null;

  /**
   * Load Jitsi Meet External API script
   */
  private async loadJitsiScript(): Promise<void> {
    if (this.isScriptLoaded) return;
    
    if (this.scriptLoadPromise) {
      return this.scriptLoadPromise;
    }

    this.scriptLoadPromise = new Promise((resolve, reject) => {
      // Check if script is already loaded
      if (window.JitsiMeetExternalAPI) {
        this.isScriptLoaded = true;
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://meet.jit.si/external_api.js';
      script.async = true;
      
      script.onload = () => {
        this.isScriptLoaded = true;
        resolve();
      };
      
      script.onerror = () => {
        reject(new Error('Failed to load Jitsi Meet External API'));
      };

      document.head.appendChild(script);
    });

    return this.scriptLoadPromise;
  }

  /**
   * Initialize Jitsi Meet conference
   */
  async initializeConference(
    config: JitsiConfig,
    eventHandlers: JitsiEventHandlers = {}
  ): Promise<any> {
    try {
      await this.loadJitsiScript();

      if (!window.JitsiMeetExternalAPI) {
        throw new Error('Jitsi Meet External API not available');
      }

      // Default configuration
      const defaultConfig: JitsiConfig = {
        roomName: config.roomName,
        width: config.width || '100%',
        height: config.height || '100%',
        parentNode: config.parentNode || document.body,
        configOverwrite: {
          startWithAudioMuted: false,
          startWithVideoMuted: false,
          enableWelcomePage: false,
          prejoinPageEnabled: false,
          disableModeratorIndicator: true,
          startScreenSharing: false,
          enableEmailInStats: false,
          ...config.configOverwrite,
        },
        interfaceConfigOverwrite: {
          TOOLBAR_BUTTONS: [
            'microphone', 'camera', 'closedcaptions', 'desktop', 'embedmeeting',
            'fullscreen', 'fodeviceselection', 'hangup', 'profile', 'chat', 'recording',
            'livestreaming', 'etherpad', 'sharedvideo', 'settings', 'raisehand',
            'videoquality', 'filmstrip', 'invite', 'feedback', 'stats', 'shortcuts',
            'tileview', 'videobackgroundblur', 'download', 'help', 'mute-everyone',
            'security'
          ],
          SETTINGS_SECTIONS: ['devices', 'language', 'moderator', 'profile', 'calendar'],
          SHOW_JITSI_WATERMARK: false,
          SHOW_WATERMARK_FOR_GUESTS: false,
          SHOW_BRAND_WATERMARK: false,
          SHOW_POWERED_BY: false,
          DISPLAY_WELCOME_PAGE_CONTENT: false,
          DISPLAY_WELCOME_PAGE_TOOLBAR_ADDITIONAL_CONTENT: false,
          APP_NAME: 'NeuraNovaHealth',
          NATIVE_APP_NAME: 'NeuraNovaHealth',
          PROVIDER_NAME: 'NeuraNovaHealth',
          LANG_DETECTION: true,
          CONNECTION_INDICATOR_DISABLED: false,
          VIDEO_QUALITY_LABEL_DISABLED: false,
          RECENT_LIST_ENABLED: false,
          MOBILE_APP_PROMO: false,
          ...config.interfaceConfigOverwrite,
        },
        userInfo: config.userInfo,
      };

      // Create Jitsi Meet API instance
      this.api = new window.JitsiMeetExternalAPI('meet.jit.si', defaultConfig);

      // Register event handlers
      Object.entries(eventHandlers).forEach(([eventName, handler]) => {
        if (handler && typeof handler === 'function') {
          const jitsiEventName = eventName.replace(/^on/, '').toLowerCase();
          this.api.addEventListener(jitsiEventName, handler);
        }
      });

      return this.api;
    } catch (error) {
      console.error('Error initializing Jitsi conference:', error);
      throw error;
    }
  }

  /**
   * Get current API instance
   */
  getApi(): any {
    return this.api;
  }

  /**
   * Check if conference is active
   */
  isConferenceActive(): boolean {
    return this.api !== null;
  }

  /**
   * Mute/unmute microphone
   */
  toggleAudio(): void {
    if (this.api) {
      this.api.executeCommand('toggleAudio');
    }
  }

  /**
   * Mute/unmute camera
   */
  toggleVideo(): void {
    if (this.api) {
      this.api.executeCommand('toggleVideo');
    }
  }

  /**
   * Start/stop screen sharing
   */
  toggleScreenShare(): void {
    if (this.api) {
      this.api.executeCommand('toggleShareScreen');
    }
  }

  /**
   * Start/stop recording
   */
  toggleRecording(): void {
    if (this.api) {
      this.api.executeCommand('toggleRecording');
    }
  }

  /**
   * Send chat message
   */
  sendChatMessage(message: string): void {
    if (this.api) {
      this.api.executeCommand('sendChatMessage', message);
    }
  }

  /**
   * Set display name
   */
  setDisplayName(name: string): void {
    if (this.api) {
      this.api.executeCommand('displayName', name);
    }
  }

  /**
   * Get participant count
   */
  getParticipantCount(): number {
    if (this.api) {
      return this.api.getNumberOfParticipants();
    }
    return 0;
  }

  /**
   * Check if audio is muted
   */
  isAudioMuted(): boolean {
    if (this.api) {
      return this.api.isAudioMuted();
    }
    return false;
  }

  /**
   * Check if video is muted
   */
  isVideoMuted(): boolean {
    if (this.api) {
      return this.api.isVideoMuted();
    }
    return false;
  }

  /**
   * Get available devices
   */
  async getAvailableDevices(): Promise<any> {
    if (this.api) {
      return this.api.getAvailableDevices();
    }
    return { audioInput: [], audioOutput: [], videoInput: [] };
  }

  /**
   * Set audio input device
   */
  setAudioInputDevice(deviceId: string): void {
    if (this.api) {
      this.api.setAudioInputDevice(deviceId);
    }
  }

  /**
   * Set audio output device
   */
  setAudioOutputDevice(deviceId: string): void {
    if (this.api) {
      this.api.setAudioOutputDevice(deviceId);
    }
  }

  /**
   * Set video input device
   */
  setVideoInputDevice(deviceId: string): void {
    if (this.api) {
      this.api.setVideoInputDevice(deviceId);
    }
  }

  /**
   * Hang up and leave conference
   */
  hangUp(): void {
    if (this.api) {
      this.api.executeCommand('hangup');
    }
  }

  /**
   * Dispose of the API instance
   */
  dispose(): void {
    if (this.api) {
      this.api.dispose();
      this.api = null;
    }
  }

  /**
   * Generate room name from appointment ID
   */
  static generateRoomName(appointmentId: string, patientId?: string): string {
    // Create a unique but predictable room name
    const baseRoom = `neuranova-${appointmentId}`;
    if (patientId) {
      return `${baseRoom}-${patientId.substring(0, 8)}`;
    }
    return baseRoom;
  }

  /**
   * Validate room name format
   */
  static isValidRoomName(roomName: string): boolean {
    // Jitsi room names should be alphanumeric with hyphens
    return /^[a-zA-Z0-9-_]+$/.test(roomName) && roomName.length > 0;
  }
}

// Export singleton instance
export const jitsiService = new JitsiService();