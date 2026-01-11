import { useState, useCallback, useRef, useEffect } from 'react';
import { Device, ConnectionState, AppInfo, KeyCode, TrackpadPosition } from '@/types/adb';

const ADB_PORT = 5555;
const SCAN_TIMEOUT = 100; // ms per IP

// WebSocket server URL for ADB bridge (run locally)
const getAdbBridgeUrl = () => {
  const host = localStorage.getItem('adb_bridge_host') || 'localhost';
  const port = localStorage.getItem('adb_bridge_port') || '8765';
  return `ws://${host}:${port}`;
};

export const useAdbConnection = () => {
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
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const screenshotResolveRef = useRef<((url: string | null) => void) | null>(null);
  const wolResolveRef = useRef<((success: boolean) => void) | null>(null);

  const connectWebSocket = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const ws = new WebSocket(getAdbBridgeUrl());
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('Connected to ADB bridge');
      setState(prev => ({ ...prev, error: null }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        handleBridgeMessage(data);
      } catch (e) {
        console.error('Failed to parse message:', e);
      }
    };

    ws.onerror = () => {
      setState(prev => ({ 
        ...prev, 
        error: 'Cannot connect to ADB bridge. Make sure the bridge server is running.' 
      }));
    };

    ws.onclose = () => {
      console.log('Disconnected from ADB bridge');
      wsRef.current = null;
      // Attempt reconnect
      reconnectTimeoutRef.current = setTimeout(connectWebSocket, 3000);
    };
  }, []);

  const handleBridgeMessage = useCallback((data: any) => {
    switch (data.type) {
      case 'scan_result':
        setDiscoveredDevices(data.devices || []);
        setIsScanning(false);
        break;
      case 'connected':
        setState(prev => ({
          ...prev,
          isConnected: true,
          isConnecting: false,
          device: data.device,
          error: null,
        }));
        break;
      case 'disconnected':
        setState(prev => ({
          ...prev,
          isConnected: false,
          device: null,
        }));
        setApps([]);
        break;
      case 'apps':
        setApps(data.apps || []);
        break;
      case 'screenshot':
        if (screenshotResolveRef.current) {
          if (data.success && data.data) {
            // Convert base64 to blob URL
            const byteCharacters = atob(data.data);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
              byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: 'image/png' });
            const url = URL.createObjectURL(blob);
            screenshotResolveRef.current(url);
          } else {
            screenshotResolveRef.current(null);
          }
          screenshotResolveRef.current = null;
        }
        break;
      case 'wol_sent':
        if (wolResolveRef.current) {
          wolResolveRef.current(data.success);
          wolResolveRef.current = null;
        }
        break;
      case 'error':
        setState(prev => ({
          ...prev,
          error: data.message,
          isConnecting: false,
        }));
        if (screenshotResolveRef.current) {
          screenshotResolveRef.current(null);
          screenshotResolveRef.current = null;
        }
        if (wolResolveRef.current) {
          wolResolveRef.current(false);
          wolResolveRef.current = null;
        }
        break;
    }
  }, []);

  useEffect(() => {
    connectWebSocket();
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      wsRef.current?.close();
    };
  }, [connectWebSocket]);

  const sendCommand = useCallback((command: object) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(command));
      return true;
    }
    setState(prev => ({ 
      ...prev, 
      error: 'Not connected to ADB bridge' 
    }));
    return false;
  }, []);

  const scanNetwork = useCallback(async () => {
    setIsScanning(true);
    setDiscoveredDevices([]);
    sendCommand({ type: 'scan' });
  }, [sendCommand]);

  const connect = useCallback((device: Device) => {
    setState(prev => ({ ...prev, isConnecting: true, error: null }));
    sendCommand({ type: 'connect', device });
  }, [sendCommand]);

  const disconnect = useCallback(() => {
    sendCommand({ type: 'disconnect' });
    setState(prev => ({
      ...prev,
      isConnected: false,
      device: null,
    }));
    setApps([]);
  }, [sendCommand]);

  const sendKey = useCallback((keyCode: KeyCode) => {
    sendCommand({ type: 'key', keyCode });
  }, [sendCommand]);

  const sendText = useCallback((text: string) => {
    sendCommand({ type: 'text', text });
  }, [sendCommand]);

  const moveCursor = useCallback((position: TrackpadPosition) => {
    sendCommand({ type: 'cursor', ...position });
  }, [sendCommand]);

  const tap = useCallback(() => {
    sendCommand({ type: 'tap' });
  }, [sendCommand]);

  const scroll = useCallback((deltaY: number) => {
    sendCommand({ type: 'scroll', deltaY });
  }, [sendCommand]);

  const fetchApps = useCallback(() => {
    sendCommand({ type: 'get_apps' });
  }, [sendCommand]);

  const launchApp = useCallback((packageName: string) => {
    sendCommand({ type: 'launch', packageName });
  }, [sendCommand]);

  const powerOff = useCallback(() => {
    sendCommand({ type: 'power_off' });
  }, [sendCommand]);

  const takeScreenshot = useCallback((): Promise<string | null> => {
    return new Promise((resolve) => {
      screenshotResolveRef.current = resolve;
      const sent = sendCommand({ type: 'screenshot' });
      if (!sent) {
        resolve(null);
        screenshotResolveRef.current = null;
      }
      // Timeout after 10 seconds
      setTimeout(() => {
        if (screenshotResolveRef.current) {
          screenshotResolveRef.current(null);
          screenshotResolveRef.current = null;
        }
      }, 10000);
    });
  }, [sendCommand]);

  const wakeOnLan = useCallback((macAddress: string): Promise<boolean> => {
    return new Promise((resolve) => {
      wolResolveRef.current = resolve;
      const sent = sendCommand({ type: 'wake_on_lan', macAddress });
      if (!sent) {
        resolve(false);
        wolResolveRef.current = null;
      }
      // Timeout after 5 seconds
      setTimeout(() => {
        if (wolResolveRef.current) {
          wolResolveRef.current(false);
          wolResolveRef.current = null;
        }
      }, 5000);
    });
  }, [sendCommand]);

  const saveMacAddress = useCallback((mac: string) => {
    localStorage.setItem('tv_mac_address', mac);
    setSavedMacAddress(mac);
  }, []);

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
  };
};
