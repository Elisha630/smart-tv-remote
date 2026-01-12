/**
 * Native ADB implementation using Capacitor TCP Socket plugin.
 * This enables real ADB command execution on Android devices.
 * 
 * ADB uses a simple text-based protocol over TCP (default port 5555).
 * Commands are sent as shell commands via the ADB protocol.
 */

import { Capacitor } from '@capacitor/core';
import { Device, KeyCode } from '@/types/adb';

// Dynamic import for TcpSocket to handle web fallback
let TcpSocket: any = null;
let DataEncoding: any = null;

// ADB Protocol constants
const ADB_PORT = 5555;
const ADB_HEADER_SIZE = 24;
const ADB_VERSION = 0x01000000;
const ADB_MAX_PAYLOAD = 4096;

// ADB command constants
const A_CNXN = 0x4e584e43; // 'CNXN'
const A_OPEN = 0x4e45504f; // 'OPEN'
const A_OKAY = 0x59414b4f; // 'OKAY'
const A_CLSE = 0x45534c43; // 'CLSE'
const A_WRTE = 0x45545257; // 'WRTE'
const A_AUTH = 0x48545541; // 'AUTH'

// Check if we're running on a native platform
export const isNativePlatform = () => {
  return Capacitor.isNativePlatform();
};

// Initialize TCP socket plugin
export const initTcpSocket = async (): Promise<boolean> => {
  if (!isNativePlatform()) {
    console.log('[ADB] Not on native platform, TCP sockets unavailable');
    return false;
  }
  
  try {
    const module = await import('capacitor-tcp-socket');
    TcpSocket = module.TcpSocket;
    DataEncoding = module.DataEncoding;
    console.log('[ADB] TCP Socket plugin initialized');
    return true;
  } catch (e) {
    console.error('[ADB] Failed to load TCP socket plugin:', e);
    return false;
  }
};

/**
 * ADB Connection class for managing device connections
 */
export class AdbConnection {
  private clientId: number | null = null;
  private device: Device;
  private localId = 1;
  private isAuthenticated = false;
  
  constructor(device: Device) {
    this.device = device;
  }
  
  /**
   * Connect to the ADB device
   */
  async connect(): Promise<boolean> {
    if (!TcpSocket) {
      const initialized = await initTcpSocket();
      if (!initialized) {
        console.log('[ADB] Using simulated mode - no native TCP');
        return true; // Return true for simulated mode
      }
    }
    
    try {
      console.log(`[ADB] Connecting to ${this.device.ip}:${this.device.port}`);
      
      const result = await TcpSocket.connect({
        address: this.device.ip,
        port: this.device.port,
      });
      
      this.clientId = result.client;
      console.log(`[ADB] Connected with client ID: ${this.clientId}`);
      
      // Send CNXN (connection) message
      await this.sendConnect();
      
      return true;
    } catch (error) {
      console.error('[ADB] Connection failed:', error);
      return false;
    }
  }
  
  /**
   * Disconnect from the device
   */
  async disconnect(): Promise<void> {
    if (this.clientId !== null && TcpSocket) {
      try {
        await TcpSocket.disconnect({ client: this.clientId });
        console.log('[ADB] Disconnected');
      } catch (e) {
        console.error('[ADB] Disconnect error:', e);
      }
      this.clientId = null;
    }
  }
  
  /**
   * Send ADB CNXN message
   */
  private async sendConnect(): Promise<void> {
    const systemIdentity = 'host::features=shell_v2,cmd,stat_v2';
    const identityBytes = new TextEncoder().encode(systemIdentity + '\0');
    
    const message = this.createMessage(A_CNXN, ADB_VERSION, ADB_MAX_PAYLOAD, identityBytes);
    await this.sendRaw(message);
    
    // Read response
    const response = await this.readResponse();
    if (response) {
      console.log('[ADB] Connection acknowledged');
      this.isAuthenticated = true;
    }
  }
  
  /**
   * Execute a shell command
   */
  async shell(command: string): Promise<string | null> {
    if (this.clientId === null) {
      // Simulated mode - just log the command
      console.log(`[ADB Simulated] shell: ${command}`);
      return null;
    }
    
    try {
      // Open shell stream
      const streamCmd = `shell:${command}`;
      const cmdBytes = new TextEncoder().encode(streamCmd + '\0');
      
      const openMsg = this.createMessage(A_OPEN, this.localId++, 0, cmdBytes);
      await this.sendRaw(openMsg);
      
      // Read response
      const response = await this.readResponse();
      return response;
    } catch (error) {
      console.error('[ADB] Shell command failed:', error);
      return null;
    }
  }
  
  /**
   * Send key event
   */
  async sendKey(keyCode: KeyCode | number): Promise<boolean> {
    const code = typeof keyCode === 'number' ? keyCode : getKeyCodeNumber(keyCode);
    const command = `input keyevent ${code}`;
    console.log(`[ADB] Sending key: ${keyCode} (${code})`);
    await this.shell(command);
    return true;
  }
  
  /**
   * Send text input
   */
  async sendText(text: string): Promise<boolean> {
    // Escape special characters for ADB shell
    const escaped = text
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/\$/g, '\\$')
      .replace(/`/g, '\\`')
      .replace(/ /g, '%s');
    
    const command = `input text "${escaped}"`;
    console.log(`[ADB] Sending text: ${text}`);
    await this.shell(command);
    return true;
  }
  
  /**
   * Tap at coordinates
   */
  async tap(x: number, y: number): Promise<boolean> {
    const command = `input tap ${x} ${y}`;
    console.log(`[ADB] Tap at: ${x}, ${y}`);
    await this.shell(command);
    return true;
  }
  
  /**
   * Swipe gesture
   */
  async swipe(x1: number, y1: number, x2: number, y2: number, duration = 300): Promise<boolean> {
    const command = `input swipe ${x1} ${y1} ${x2} ${y2} ${duration}`;
    console.log(`[ADB] Swipe: ${x1},${y1} -> ${x2},${y2}`);
    await this.shell(command);
    return true;
  }
  
  /**
   * Launch an app by package name
   */
  async launchApp(packageName: string): Promise<boolean> {
    const command = `monkey -p ${packageName} -c android.intent.category.LAUNCHER 1`;
    console.log(`[ADB] Launching app: ${packageName}`);
    await this.shell(command);
    return true;
  }
  
  /**
   * Get list of installed packages
   */
  async getPackages(): Promise<string[]> {
    const result = await this.shell('pm list packages -3');
    if (!result) return [];
    
    return result
      .split('\n')
      .filter(line => line.startsWith('package:'))
      .map(line => line.replace('package:', '').trim());
  }
  
  /**
   * Create ADB protocol message
   */
  private createMessage(command: number, arg0: number, arg1: number, data?: Uint8Array): Uint8Array {
    const dataLen = data?.length || 0;
    const message = new Uint8Array(ADB_HEADER_SIZE + dataLen);
    const view = new DataView(message.buffer);
    
    // Write header (little-endian)
    view.setUint32(0, command, true);
    view.setUint32(4, arg0, true);
    view.setUint32(8, arg1, true);
    view.setUint32(12, dataLen, true);
    
    // Calculate data checksum
    let checksum = 0;
    if (data) {
      for (let i = 0; i < data.length; i++) {
        checksum += data[i];
      }
    }
    view.setUint32(16, checksum, true);
    
    // Magic (command XOR 0xFFFFFFFF)
    view.setUint32(20, command ^ 0xFFFFFFFF, true);
    
    // Append data
    if (data) {
      message.set(data, ADB_HEADER_SIZE);
    }
    
    return message;
  }
  
  /**
   * Send raw bytes to socket
   */
  private async sendRaw(data: Uint8Array): Promise<void> {
    if (this.clientId === null || !TcpSocket) return;
    
    // Convert to base64 for transmission
    const base64 = btoa(String.fromCharCode.apply(null, Array.from(data)));
    
    await TcpSocket.send({
      client: this.clientId,
      data: base64,
      encoding: DataEncoding?.BASE64 || 'base64',
    });
  }
  
  /**
   * Read response from socket
   */
  private async readResponse(): Promise<string | null> {
    if (this.clientId === null || !TcpSocket) return null;
    
    try {
      const result = await TcpSocket.read({
        client: this.clientId,
        expectLen: 4096,
        timeout: 5,
      });
      
      return result.result;
    } catch (e) {
      console.error('[ADB] Read error:', e);
      return null;
    }
  }
}

/**
 * Key code name to number mapping
 */
const KEY_CODE_MAP: Record<string, number> = {
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
  KEYCODE_VOLUME_MUTE: 164,
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
  KEYCODE_APP_SWITCH: 187,
};

function getKeyCodeNumber(keyCode: KeyCode): number {
  return KEY_CODE_MAP[keyCode] || 0;
}

/**
 * Connection manager for handling multiple device connections
 */
export class AdbConnectionManager {
  private connections = new Map<string, AdbConnection>();
  
  async connect(device: Device): Promise<AdbConnection> {
    const existing = this.connections.get(device.id);
    if (existing) {
      return existing;
    }
    
    const connection = new AdbConnection(device);
    await connection.connect();
    this.connections.set(device.id, connection);
    
    return connection;
  }
  
  async disconnect(deviceId: string): Promise<void> {
    const connection = this.connections.get(deviceId);
    if (connection) {
      await connection.disconnect();
      this.connections.delete(deviceId);
    }
  }
  
  async disconnectAll(): Promise<void> {
    for (const connection of this.connections.values()) {
      await connection.disconnect();
    }
    this.connections.clear();
  }
  
  get(deviceId: string): AdbConnection | undefined {
    return this.connections.get(deviceId);
  }
  
  getAll(): AdbConnection[] {
    return Array.from(this.connections.values());
  }
}

// Global connection manager instance
export const adbManager = new AdbConnectionManager();
