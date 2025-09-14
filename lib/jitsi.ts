// Jitsi Meet integration utilities
export interface JitsiConfig {
  roomName: string
  width: string | number
  height: string | number
  parentNode: HTMLElement
  configOverwrite?: {
    startWithAudioMuted?: boolean
    startWithVideoMuted?: boolean
    enableWelcomePage?: boolean
    prejoinPageEnabled?: boolean
    disableModeratorIndicator?: boolean
  }
  interfaceConfigOverwrite?: {
    TOOLBAR_BUTTONS?: string[]
    SETTINGS_SECTIONS?: string[]
    SHOW_JITSI_WATERMARK?: boolean
    SHOW_WATERMARK_FOR_GUESTS?: boolean
  }
  userInfo?: {
    displayName?: string
    email?: string
  }
}

export class JitsiMeetService {
  private api: any = null

  async initializeJitsi(config: JitsiConfig): Promise<void> {
    // In a real implementation, you would load the Jitsi Meet API
    // For now, we'll simulate the initialization
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log("Jitsi Meet initialized with config:", config)
        resolve()
      }, 1000)
    })
  }

  async joinRoom(roomName: string, displayName: string): Promise<void> {
    // Simulate joining a room
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log(`Joined room: ${roomName} as ${displayName}`)
        resolve()
      }, 2000)
    })
  }

  async leaveRoom(): Promise<void> {
    // Simulate leaving a room
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log("Left the room")
        resolve()
      }, 500)
    })
  }

  toggleAudio(): void {
    console.log("Audio toggled")
  }

  toggleVideo(): void {
    console.log("Video toggled")
  }

  dispose(): void {
    if (this.api) {
      this.api.dispose()
      this.api = null
    }
  }
}

// Utility function to generate room IDs
export function generateRoomId(): string {
  return "room-" + Math.random().toString(36).substr(2, 9)
}

// Utility function to validate room ID format
export function isValidRoomId(roomId: string): boolean {
  return /^room-[a-z0-9]{9}$/.test(roomId)
}
