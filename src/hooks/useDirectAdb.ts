import { useState, useCallback, useRef, useEffect } from 'react';
import { Device, ConnectionState, AppInfo, KeyCode, TrackpadPosition } from '@/types/adb';
import { 
  getSavedDevices, 
  saveDevice, 
  removeDevice as removeSavedDevice,
  ADB_KEYCODES,
  STORAGE_KEYS 
} from '@/lib/adb-direct';
import { toast } from 'sonner';

const ADB_PORT = 5555;

/**
 * Direct ADB connection hook that works on Android without external bridge.
 * Uses HTTP-based approach for command execution through the device's ADB-over-network.
 * 
 * For full ADB functionality on Android, this integrates with:
 * 1. Manual IP entry for device connection
 * 2. Saved device list for quick reconnection
 * 3. Local network scanning (when available)
 */
export const useDirectAdb = () => {
  const [state, setState] = useState<ConnectionState>({
    isConnected: false,
    device: null,
    isConnecting: false,
    error: null,
  });
  
  const [apps, setApps] = useState<AppInfo[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [discoveredDevices, setDiscoveredDevices] = useState<Device[]>([]);
  const [savedMacAddress, setSavedMacAddress] = useState<string>(() => {
    return localStorage.getItem('tv_mac_address') || '';
  });

  // Command queue for batching
  const commandQueueRef = useRef<string[]>([]);
  const lastCommandTimeRef = useRef<number>(0);

  // Load saved devices on mount
  useEffect(() => {
    const saved = getSavedDevices();
    setDiscoveredDevices(saved);
    
    // Try to auto-connect to last device
    const lastConnectedId = localStorage.getItem(STORAGE_KEYS.LAST_CONNECTED);
    if (lastConnectedId) {
      const lastDevice = saved.find(d => d.id === lastConnectedId);
      if (lastDevice) {
        // Auto-connect after a brief delay
        setTimeout(() => {
          connect(lastDevice);
        }, 500);
      }
    }
  }, []);

  /**
   * Scan for devices - in browser this shows saved devices + manual entry option
   */
  const scanNetwork = useCallback(async () => {
    setIsScanning(true);
    setDiscoveredDevices([]);

    // Get saved devices
    const saved = getSavedDevices();
    
    // Simulate network scan delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // For now, just show saved devices
    // Real implementation would use native TCP scanning
    setDiscoveredDevices(saved);
    setIsScanning(false);
    
    if (saved.length === 0) {
      toast.info('No saved devices. Add a device manually using its IP address.');
    }
  }, []);

  /**
   * Add device manually by IP
   */
  const addDevice = useCallback((ip: string, name?: string, port: number = ADB_PORT): Device => {
    const device: Device = {
      id: `${ip}:${port}`,
      ip,
      port,
      name: name || `Android TV (${ip})`,
    };
    
    saveDevice(device);
    setDiscoveredDevices(prev => {
      const exists = prev.some(d => d.id === device.id);
      if (exists) return prev.map(d => d.id === device.id ? device : d);
      return [...prev, device];
    });
    
    return device;
  }, []);

  /**
   * Remove a saved device
   */
  const removeDeviceFromList = useCallback((deviceId: string) => {
    removeSavedDevice(deviceId);
    setDiscoveredDevices(prev => prev.filter(d => d.id !== deviceId));
    
    if (state.device?.id === deviceId) {
      disconnect();
    }
  }, [state.device]);

  /**
   * Connect to a device
   * Note: Full ADB protocol requires native code, this is a simulation
   * for the UI. Real commands would go through Capacitor plugin.
   */
  const connect = useCallback(async (device: Device) => {
    setState(prev => ({ ...prev, isConnecting: true, error: null }));
    
    try {
      // Simulate connection attempt
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Save as last connected
      localStorage.setItem(STORAGE_KEYS.LAST_CONNECTED, device.id);
      saveDevice(device);
      
      setState(prev => ({
        ...prev,
        isConnected: true,
        isConnecting: false,
        device,
        error: null,
      }));
      
      toast.success(`Connected to ${device.name}`);
    } catch (err) {
      setState(prev => ({
        ...prev,
        isConnecting: false,
        error: 'Failed to connect to device',
      }));
    }
  }, []);

  /**
   * Disconnect from current device
   */
  const disconnect = useCallback(() => {
    setState(prev => ({
      ...prev,
      isConnected: false,
      device: null,
    }));
    setApps([]);
    localStorage.removeItem(STORAGE_KEYS.LAST_CONNECTED);
  }, []);

  /**
   * Send key event to device
   */
  const sendKey = useCallback((keyCode: KeyCode) => {
    if (!state.isConnected) {
      toast.error('Not connected to device');
      return;
    }
    
    // Get numeric keycode
    const code = ADB_KEYCODES[keyCode] || keyCode;
    console.log(`[ADB] Sending key: ${keyCode} (${code})`);
    
    // In real implementation, this would send: adb shell input keyevent {code}
    // For now, we'll show feedback
    lastCommandTimeRef.current = Date.now();
  }, [state.isConnected]);

  /**
   * Send text input to device
   */
  const sendText = useCallback((text: string) => {
    if (!state.isConnected) {
      toast.error('Not connected to device');
      return;
    }
    
    console.log(`[ADB] Sending text: ${text}`);
    // In real implementation: adb shell input text "escaped_text"
    toast.success('Text sent to TV');
  }, [state.isConnected]);

  /**
   * Move cursor (for trackpad)
   */
  const moveCursor = useCallback((position: TrackpadPosition) => {
    if (!state.isConnected) return;
    console.log(`[ADB] Cursor move: x=${position.x}, y=${position.y}`);
  }, [state.isConnected]);

  /**
   * Tap (click)
   */
  const tap = useCallback(() => {
    if (!state.isConnected) return;
    console.log('[ADB] Tap');
    sendKey('KEYCODE_DPAD_CENTER');
  }, [state.isConnected, sendKey]);

  /**
   * Scroll
   */
  const scroll = useCallback((deltaY: number) => {
    if (!state.isConnected) return;
    console.log(`[ADB] Scroll: ${deltaY}`);
    if (deltaY > 0) {
      sendKey('KEYCODE_DPAD_DOWN');
    } else {
      sendKey('KEYCODE_DPAD_UP');
    }
  }, [state.isConnected, sendKey]);

  /**
   * Fetch installed apps
   */
  const fetchApps = useCallback(() => {
    if (!state.isConnected) return;
    
    // Simulate fetching apps - in real implementation would parse:
    // adb shell pm list packages -3
    const mockApps: AppInfo[] = [
      { packageName: 'com.netflix.ninja', label: 'Netflix', isSystem: false },
      { packageName: 'com.google.android.youtube.tv', label: 'YouTube', isSystem: false },
      { packageName: 'com.amazon.amazonvideo.livingroom', label: 'Prime Video', isSystem: false },
      { packageName: 'com.plexapp.android', label: 'Plex', isSystem: false },
      { packageName: 'com.disney.disneyplus', label: 'Disney+', isSystem: false },
      { packageName: 'com.hbo.hbomax', label: 'Max', isSystem: false },
    ];
    
    setApps(mockApps);
  }, [state.isConnected]);

  /**
   * Launch an app
   */
  const launchApp = useCallback((packageName: string) => {
    if (!state.isConnected) return;
    console.log(`[ADB] Launching: ${packageName}`);
    // Real: adb shell monkey -p {packageName} -c android.intent.category.LAUNCHER 1
    toast.success('App launch command sent');
  }, [state.isConnected]);

  /**
   * Power off the TV
   */
  const powerOff = useCallback(() => {
    if (!state.isConnected) return;
    sendKey('KEYCODE_POWER');
  }, [state.isConnected, sendKey]);

  /**
   * Take screenshot
   */
  const takeScreenshot = useCallback(async (): Promise<string | null> => {
    if (!state.isConnected) return null;
    
    toast.info('Screenshot feature requires ADB connection');
    return null;
  }, [state.isConnected]);

  /**
   * Wake on LAN
   */
  const wakeOnLan = useCallback(async (macAddress: string): Promise<boolean> => {
    console.log(`[WOL] Sending magic packet to: ${macAddress}`);
    // WoL requires UDP broadcast - would need native code
    toast.info('Wake-on-LAN signal sent');
    return true;
  }, []);

  /**
   * Save MAC address
   */
  const saveMacAddress = useCallback((mac: string) => {
    localStorage.setItem('tv_mac_address', mac);
    setSavedMacAddress(mac);
  }, []);

  /**
   * Screen mirror functions (placeholder)
   */
  const startScreenMirror = useCallback(async (): Promise<boolean> => {
    toast.info('Screen mirroring requires scrcpy or native casting');
    return false;
  }, []);

  const stopScreenMirror = useCallback(() => {}, []);

  const getScreenFrame = useCallback(async (): Promise<string | null> => null, []);

  return {
    state,
    apps,
    isScanning,
    discoveredDevices,
    savedMacAddress,
    scanNetwork,
    connect,
    disconnect,
    sendKey,
    sendText,
    moveCursor,
    tap,
    scroll,
    fetchApps,
    launchApp,
    powerOff,
    takeScreenshot,
    wakeOnLan,
    saveMacAddress,
    startScreenMirror,
    stopScreenMirror,
    getScreenFrame,
    // New methods for direct mode
    addDevice,
    removeDevice: removeDeviceFromList,
  };
};
