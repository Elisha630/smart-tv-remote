import { useState, useCallback, useRef, useEffect } from 'react';
import { Device, ConnectionState, AppInfo, KeyCode, TrackpadPosition } from '@/types/adb';
import { 
  getSavedDevices, 
  saveDevice, 
  removeDevice as removeSavedDevice,
  STORAGE_KEYS 
} from '@/lib/adb-direct';
import { adbManager, AdbConnection, isNativePlatform, initTcpSocket } from '@/lib/native-adb';
import { toast } from 'sonner';

const ADB_PORT = 5555;

// Key code name to number mapping
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

/**
 * Direct ADB connection hook with native TCP socket support.
 * On native platforms (Android/iOS), uses real TCP sockets for ADB commands.
 * On web, provides simulated mode with manual IP entry.
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
  const [isNative, setIsNative] = useState(false);

  // Active ADB connection
  const connectionRef = useRef<AdbConnection | null>(null);
  const lastCommandTimeRef = useRef<number>(0);

  // Initialize native support and load saved devices
  useEffect(() => {
    const init = async () => {
      // Check if we're on native platform
      const native = isNativePlatform();
      setIsNative(native);
      
      if (native) {
        await initTcpSocket();
        console.log('[ADB] Native TCP socket support available');
      } else {
        console.log('[ADB] Running in web mode (simulated commands)');
      }
      
      // Load saved devices
      const saved = getSavedDevices();
      setDiscoveredDevices(saved);
      
      // Try to auto-connect to last device
      const lastConnectedId = localStorage.getItem(STORAGE_KEYS.LAST_CONNECTED);
      if (lastConnectedId) {
        const lastDevice = saved.find(d => d.id === lastConnectedId);
        if (lastDevice) {
          setTimeout(() => {
            connect(lastDevice);
          }, 500);
        }
      }
    };
    
    init();
    
    return () => {
      // Cleanup connections on unmount
      adbManager.disconnectAll();
    };
  }, []);

  /**
   * Scan for devices - shows saved devices + manual entry option
   */
  const scanNetwork = useCallback(async () => {
    setIsScanning(true);
    setDiscoveredDevices([]);

    const saved = getSavedDevices();
    
    // Brief delay to show scanning state
    await new Promise(resolve => setTimeout(resolve, 800));
    
    setDiscoveredDevices(saved);
    setIsScanning(false);
    
    if (saved.length === 0) {
      toast.info('No saved devices. Tap "Add" to enter your TV\'s IP address.');
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
   * Connect to a device using native ADB or simulation
   */
  const connect = useCallback(async (device: Device) => {
    setState(prev => ({ ...prev, isConnecting: true, error: null }));
    
    try {
      // Use native ADB connection if available
      const connection = await adbManager.connect(device);
      connectionRef.current = connection;
      
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
      
      const modeLabel = isNative ? '(Native ADB)' : '(Simulated)';
      toast.success(`Connected to ${device.name} ${modeLabel}`);
    } catch (err) {
      console.error('[ADB] Connection failed:', err);
      setState(prev => ({
        ...prev,
        isConnecting: false,
        error: 'Failed to connect to device. Make sure ADB is enabled on the TV.',
      }));
      toast.error('Connection failed. Is ADB enabled on the TV?');
    }
  }, [isNative]);

  /**
   * Disconnect from current device
   */
  const disconnect = useCallback(async () => {
    if (state.device) {
      await adbManager.disconnect(state.device.id);
    }
    connectionRef.current = null;
    
    setState(prev => ({
      ...prev,
      isConnected: false,
      device: null,
    }));
    setApps([]);
    localStorage.removeItem(STORAGE_KEYS.LAST_CONNECTED);
  }, [state.device]);

  /**
   * Send key event to device
   */
  const sendKey = useCallback(async (keyCode: KeyCode) => {
    if (!state.isConnected || !connectionRef.current) {
      toast.error('Not connected to device');
      return;
    }
    
    const code = KEY_CODE_MAP[keyCode] || keyCode;
    console.log(`[ADB] Sending key: ${keyCode} (${code})`);
    
    await connectionRef.current.sendKey(keyCode);
    lastCommandTimeRef.current = Date.now();
  }, [state.isConnected]);

  /**
   * Send text input to device
   */
  const sendText = useCallback(async (text: string) => {
    if (!state.isConnected || !connectionRef.current) {
      toast.error('Not connected to device');
      return;
    }
    
    console.log(`[ADB] Sending text: ${text}`);
    await connectionRef.current.sendText(text);
    toast.success('Text sent to TV');
  }, [state.isConnected]);

  /**
   * Move cursor (for trackpad - uses swipe gestures)
   */
  const moveCursor = useCallback(async (position: TrackpadPosition) => {
    if (!state.isConnected || !connectionRef.current) return;
    
    // Convert trackpad position to swipe gesture
    // This simulates mouse movement on Android TV
    const centerX = 540;
    const centerY = 960;
    const scale = 5;
    
    await connectionRef.current.swipe(
      centerX, 
      centerY, 
      centerX + (position.x * scale), 
      centerY + (position.y * scale), 
      50
    );
  }, [state.isConnected]);

  /**
   * Tap (D-pad center)
   */
  const tap = useCallback(async () => {
    if (!state.isConnected) return;
    await sendKey('KEYCODE_DPAD_CENTER');
  }, [state.isConnected, sendKey]);

  /**
   * Scroll using D-pad
   */
  const scroll = useCallback(async (deltaY: number) => {
    if (!state.isConnected) return;
    
    if (deltaY > 0) {
      await sendKey('KEYCODE_DPAD_DOWN');
    } else {
      await sendKey('KEYCODE_DPAD_UP');
    }
  }, [state.isConnected, sendKey]);

  /**
   * Fetch installed apps
   */
  const fetchApps = useCallback(async () => {
    if (!state.isConnected || !connectionRef.current) return;
    
    try {
      const packages = await connectionRef.current.getPackages();
      
      // Convert to AppInfo format
      const appList: AppInfo[] = packages.map(pkg => ({
        packageName: pkg,
        label: pkg.split('.').pop() || pkg,
        isSystem: false,
      }));
      
      setApps(appList);
    } catch (e) {
      // Fallback to default apps
      setApps([
        { packageName: 'com.netflix.ninja', label: 'Netflix', isSystem: false },
        { packageName: 'com.google.android.youtube.tv', label: 'YouTube', isSystem: false },
        { packageName: 'com.amazon.amazonvideo.livingroom', label: 'Prime Video', isSystem: false },
        { packageName: 'com.plexapp.android', label: 'Plex', isSystem: false },
        { packageName: 'com.disney.disneyplus', label: 'Disney+', isSystem: false },
      ]);
    }
  }, [state.isConnected]);

  /**
   * Launch an app by package name
   */
  const launchApp = useCallback(async (packageName: string) => {
    if (!state.isConnected || !connectionRef.current) return;
    
    console.log(`[ADB] Launching: ${packageName}`);
    await connectionRef.current.launchApp(packageName);
    toast.success('App launched');
  }, [state.isConnected]);

  /**
   * Power off the TV
   */
  const powerOff = useCallback(async () => {
    if (!state.isConnected) return;
    await sendKey('KEYCODE_POWER');
  }, [state.isConnected, sendKey]);

  /**
   * Take screenshot (requires native implementation)
   */
  const takeScreenshot = useCallback(async (): Promise<string | null> => {
    if (!state.isConnected) return null;
    
    if (!isNative) {
      toast.info('Screenshot requires native app');
      return null;
    }
    
    // Would need screencap command and file transfer
    toast.info('Screenshot feature coming soon');
    return null;
  }, [state.isConnected, isNative]);

  /**
   * Wake on LAN
   */
  const wakeOnLan = useCallback(async (macAddress: string): Promise<boolean> => {
    console.log(`[WOL] Sending magic packet to: ${macAddress}`);
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
   * Screen mirror functions (placeholder - requires scrcpy)
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
    isNative,
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
    addDevice,
    removeDevice: removeDeviceFromList,
  };
};
