export interface Device {
  id: string;
  name: string;
  ip: string;
  port: number;
  model?: string;
  manufacturer?: string;
  androidVersion?: string;
}

export interface AppInfo {
  packageName: string;
  label: string;
  icon?: string;
  isSystem: boolean;
}

export interface ConnectionState {
  isConnected: boolean;
  device: Device | null;
  isConnecting: boolean;
  error: string | null;
}

export interface TrackpadPosition {
  x: number;
  y: number;
}

export interface RemoteShortcut {
  id: string;
  name: string;
  key: string;
  command: string;
  icon?: string;
}

export type KeyCode =
  | 'KEYCODE_DPAD_UP'
  | 'KEYCODE_DPAD_DOWN'
  | 'KEYCODE_DPAD_LEFT'
  | 'KEYCODE_DPAD_RIGHT'
  | 'KEYCODE_DPAD_CENTER'
  | 'KEYCODE_BACK'
  | 'KEYCODE_HOME'
  | 'KEYCODE_MENU'
  | 'KEYCODE_VOLUME_UP'
  | 'KEYCODE_VOLUME_DOWN'
  | 'KEYCODE_VOLUME_MUTE'
  | 'KEYCODE_POWER'
  | 'KEYCODE_MEDIA_PLAY_PAUSE'
  | 'KEYCODE_MEDIA_STOP'
  | 'KEYCODE_MEDIA_NEXT'
  | 'KEYCODE_MEDIA_PREVIOUS'
  | 'KEYCODE_MEDIA_REWIND'
  | 'KEYCODE_MEDIA_FAST_FORWARD'
  | 'KEYCODE_CHANNEL_UP'
  | 'KEYCODE_CHANNEL_DOWN'
  | 'KEYCODE_TV_INPUT'
  | 'KEYCODE_SETTINGS'
  | 'KEYCODE_APP_SWITCH';
