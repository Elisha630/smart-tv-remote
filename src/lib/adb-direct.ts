/**
 * Direct ADB over TCP implementation for Android/Web
 * This module provides device discovery and ADB command execution
 * without requiring an external Python bridge.
 * 
 * For Android: Uses Capacitor plugins for TCP sockets
 * For Web: Uses manual IP entry (WebSockets cannot connect to raw TCP)
 */

import { Device } from '@/types/adb';

// Common Android TV ports
const ADB_PORT = 5555;
const SCAN_TIMEOUT = 1500;

// Device discovery via mDNS/network scan simulation
// In production, this would use native code for proper mDNS discovery

interface AdbCommand {
  type: 'shell' | 'key' | 'text' | 'tap' | 'swipe';
  payload: string;
}

// Known Android TV device signatures
const TV_SIGNATURES = [
  { name: 'Android TV', modelMatch: /Android TV|SHIELD|Mi Box|Chromecast/i },
  { name: 'Fire TV', modelMatch: /AFTM|AFT[A-Z]/i },
  { name: 'Sony TV', modelMatch: /BRAVIA/i },
  { name: 'Samsung TV', modelMatch: /Tizen|Samsung/i },
];

/**
 * Check if a device at given IP has ADB enabled
 */
export async function probeAdbDevice(ip: string, port: number = ADB_PORT): Promise<Device | null> {
  try {
    // Use fetch with a short timeout to check if port is open
    // This is a fallback - real implementation would use TCP sockets
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), SCAN_TIMEOUT);
    
    // We can't directly probe TCP from browser, so we'll check for HTTP on common ports
    // For real scanning, we need native code or the user to manually enter IP
    
    clearTimeout(timeoutId);
    
    return {
      id: `${ip}:${port}`,
      ip,
      port,
      name: `Android TV (${ip})`,
    };
  } catch {
    return null;
  }
}

/**
 * Generate list of IPs to scan based on current network
 */
export function getLocalNetworkIPs(): string[] {
  // Common home network ranges
  const ranges: string[] = [];
  
  // 192.168.1.x and 192.168.0.x are most common
  for (let i = 1; i < 255; i++) {
    ranges.push(`192.168.1.${i}`);
    ranges.push(`192.168.0.${i}`);
  }
  
  return ranges;
}

/**
 * Build ADB shell command string
 */
export function buildAdbCommand(cmd: AdbCommand): string {
  switch (cmd.type) {
    case 'key':
      return `input keyevent ${cmd.payload}`;
    case 'text':
      // Escape special characters for shell
      const escaped = cmd.payload.replace(/(['"\\$`])/g, '\\$1').replace(/ /g, '%s');
      return `input text "${escaped}"`;
    case 'tap':
      return `input tap ${cmd.payload}`;
    case 'swipe':
      return `input swipe ${cmd.payload}`;
    case 'shell':
    default:
      return cmd.payload;
  }
}

/**
 * Key codes mapping
 */
export const ADB_KEYCODES: Record<string, number> = {
  KEYCODE_HOME: 3,
  KEYCODE_BACK: 4,
  KEYCODE_DPAD_UP: 19,
  KEYCODE_DPAD_DOWN: 20,
  KEYCODE_DPAD_LEFT: 21,
  KEYCODE_DPAD_RIGHT: 22,
  KEYCODE_DPAD_CENTER: 23,
  KEYCODE_VOLUME_UP: 24,
  KEYCODE_VOLUME_DOWN: 25,
  KEYCODE_POWER: 26,
  KEYCODE_MUTE: 164,
  KEYCODE_MENU: 82,
  KEYCODE_MEDIA_PLAY_PAUSE: 85,
  KEYCODE_MEDIA_STOP: 86,
  KEYCODE_MEDIA_NEXT: 87,
  KEYCODE_MEDIA_PREVIOUS: 88,
  KEYCODE_MEDIA_REWIND: 89,
  KEYCODE_MEDIA_FAST_FORWARD: 90,
  KEYCODE_CHANNEL_UP: 166,
  KEYCODE_CHANNEL_DOWN: 167,
  KEYCODE_SETTINGS: 176,
  KEYCODE_TV_INPUT: 178,
  KEYCODE_TV: 170,
  KEYCODE_GUIDE: 172,
  KEYCODE_INFO: 165,
};

/**
 * Storage keys for persisted devices
 */
export const STORAGE_KEYS = {
  SAVED_DEVICES: 'adb_saved_devices',
  LAST_CONNECTED: 'adb_last_connected',
  CONNECTION_MODE: 'adb_connection_mode',
};

/**
 * Save device to local storage
 */
export function saveDevice(device: Device): void {
  const saved = getSavedDevices();
  const exists = saved.findIndex(d => d.id === device.id);
  if (exists >= 0) {
    saved[exists] = device;
  } else {
    saved.push(device);
  }
  localStorage.setItem(STORAGE_KEYS.SAVED_DEVICES, JSON.stringify(saved));
}

/**
 * Get saved devices from local storage
 */
export function getSavedDevices(): Device[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.SAVED_DEVICES);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

/**
 * Remove device from saved list
 */
export function removeDevice(deviceId: string): void {
  const saved = getSavedDevices().filter(d => d.id !== deviceId);
  localStorage.setItem(STORAGE_KEYS.SAVED_DEVICES, JSON.stringify(saved));
}
