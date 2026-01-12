import { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAdbConnection } from '@/hooks/useAdbConnection';
import { useShortcuts } from '@/hooks/useShortcuts';
import { Header } from '@/components/remote/Header';
import { Trackpad } from '@/components/remote/Trackpad';
import { DPad } from '@/components/remote/DPad';
import { MediaControls } from '@/components/remote/MediaControls';
import { VolumeControls } from '@/components/remote/VolumeControls';
import { ChannelControls } from '@/components/remote/ChannelControls';
import { NavigationButtons } from '@/components/remote/NavigationButtons';
import { QuickLaunch } from '@/components/remote/QuickLaunch';
import { TextInput } from '@/components/remote/TextInput';
import { VoiceInput } from '@/components/remote/VoiceInput';
import { ScreenshotButton } from '@/components/remote/ScreenshotButton';
import { ScreenMirror } from '@/components/remote/ScreenMirror';
import { WakeOnLan } from '@/components/remote/WakeOnLan';
import { GamepadMode } from '@/components/remote/GamepadMode';
import { ConnectionPanel } from '@/components/panels/ConnectionPanel';
import { AppsPanel } from '@/components/panels/AppsPanel';
import { MenuPanel } from '@/components/panels/MenuPanel';
import { SetupPanel } from '@/components/panels/SetupPanel';
import { ShortcutsPanel } from '@/components/panels/ShortcutsPanel';
import { Device } from '@/types/adb';
import { toast } from 'sonner';
import { Power } from 'lucide-react';

const Index = () => {
  const {
    state,
    apps,
    isScanning,
    discoveredDevices,
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
    savedMacAddress,
    saveMacAddress,
    startScreenMirror,
    stopScreenMirror,
    getScreenFrame,
  } = useAdbConnection();

  const {
    shortcuts,
    addShortcut,
    updateShortcut,
    removeShortcut,
    resetToDefaults,
  } = useShortcuts();

  const [showConnections, setShowConnections] = useState(false);
  const [showApps, setShowApps] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  
  const [multiSelectMode, setMultiSelectMode] = useState(false);
  const [selectedDevices, setSelectedDevices] = useState<Device[]>([]);
  const [connectedDevices, setConnectedDevices] = useState<Device[]>([]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      
      const shortcut = shortcuts.find(s => s.key.toLowerCase() === e.key.toLowerCase());
      if (shortcut && state.isConnected) {
        e.preventDefault();
        launchApp(shortcut.command);
        toast.success(`Launching ${shortcut.name}`);
        return;
      }

      switch (e.key) {
        case 'ArrowUp': sendKey('KEYCODE_DPAD_UP'); break;
        case 'ArrowDown': sendKey('KEYCODE_DPAD_DOWN'); break;
        case 'ArrowLeft': sendKey('KEYCODE_DPAD_LEFT'); break;
        case 'ArrowRight': sendKey('KEYCODE_DPAD_RIGHT'); break;
        case 'Enter': sendKey('KEYCODE_DPAD_CENTER'); break;
        case 'Escape':
        case 'Backspace': sendKey('KEYCODE_BACK'); break;
        case 'Home': sendKey('KEYCODE_HOME'); break;
        case ' ':
          e.preventDefault();
          sendKey('KEYCODE_MEDIA_PLAY_PAUSE');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [sendKey, shortcuts, launchApp, state.isConnected]);

  const handlePowerOff = useCallback(() => {
    if (confirm('Are you sure you want to power off the TV?')) {
      powerOff();
      toast.info('Power off command sent');
    }
  }, [powerOff]);

  const handleLaunchApp = useCallback((packageName: string) => {
    launchApp(packageName);
    setShowApps(false);
    toast.success('App launched');
  }, [launchApp]);

  const handleToggleMultiSelect = useCallback(() => {
    setMultiSelectMode(prev => !prev);
    setSelectedDevices([]);
  }, []);

  const handleToggleDeviceSelection = useCallback((device: Device) => {
    setSelectedDevices(prev => {
      const exists = prev.some(d => d.id === device.id);
      if (exists) return prev.filter(d => d.id !== device.id);
      return [...prev, device];
    });
  }, []);

  const handleConnectSelected = useCallback(() => {
    selectedDevices.forEach(device => connect(device));
    setConnectedDevices(prev => [...prev, ...selectedDevices.filter(sd => !prev.some(pd => pd.id === sd.id))]);
    setSelectedDevices([]);
    toast.success(`Connecting to ${selectedDevices.length} device(s)`);
  }, [selectedDevices, connect]);

  const handleDisconnectDevice = useCallback((device: Device) => {
    setConnectedDevices(prev => prev.filter(d => d.id !== device.id));
    disconnect();
    toast.info(`Disconnected from ${device.name}`);
  }, [disconnect]);

  useEffect(() => {
    if (state.error) toast.error(state.error);
  }, [state.error]);

  useEffect(() => {
    if (state.device && !connectedDevices.some(d => d.id === state.device?.id)) {
      setConnectedDevices(prev => [...prev, state.device!]);
    }
  }, [state.device, connectedDevices]);

  return (
    <div className="h-screen bg-background flex flex-col safe-area-inset overflow-hidden">
      <Header
        device={state.device}
        isConnected={state.isConnected}
        onConnectionClick={() => setShowConnections(true)}
        onSetupClick={() => setShowSetup(true)}
        onSettingsClick={() => setShowShortcuts(true)}
        onPowerClick={handlePowerOff}
      />

      <main className="flex-1 flex flex-col items-center p-2 gap-3 overflow-y-auto overflow-x-hidden">
        {/* Top Controls: Power & Wake */}
        <div className="flex items-center gap-4 mt-1">
          <motion.button
            className={`remote-button p-3 flex items-center gap-2 bg-destructive/10 hover:bg-destructive/20 text-destructive border-destructive/20 ${!state.isConnected ? 'opacity-50 grayscale' : ''}`}
            whileHover={!state.isConnected ? {} : { scale: 1.05 }}
            whileTap={!state.isConnected ? {} : { scale: 0.95 }}
            onClick={handlePowerOff}
            disabled={!state.isConnected}
            title="Power Off TV"
          >
            <Power className="w-5 h-5" />
            <span className="text-xs font-bold">Power</span>
          </motion.button>
          <WakeOnLan 
            onWake={wakeOnLan} 
            savedMacAddress={savedMacAddress}
            onSaveMac={saveMacAddress}
          />
        </div>

        {/* D-Pad and Volume/Channel */}
        <motion.section className="flex items-center justify-center gap-4">
          <VolumeControls onKey={sendKey} disabled={!state.isConnected} />
          <DPad onKey={sendKey} disabled={!state.isConnected} />
          <ChannelControls onKey={sendKey} disabled={!state.isConnected} />
        </motion.section>

        {/* Navigation & Media Controls */}
        <div className="flex flex-col items-center gap-3 scale-90 sm:scale-100">
          <NavigationButtons
            onKey={sendKey}
            onAppsClick={() => setShowApps(true)}
            onMenuClick={() => setShowMenu(true)}
            disabled={!state.isConnected}
          />
          <MediaControls onKey={sendKey} disabled={!state.isConnected} />
        </div>

        {/* Text & Voice Input (Side by Side) */}
        <div className="flex items-center justify-center gap-3 w-full max-w-md">
          <TextInput onSendText={sendText} disabled={!state.isConnected} />
          <VoiceInput onSendText={sendText} disabled={!state.isConnected} />
        </div>

        {/* Quick Launch Shortcuts */}
        <div className="w-full max-w-lg px-2">
          <QuickLaunch
            shortcuts={shortcuts}
            onLaunch={handleLaunchApp}
            disabled={!state.isConnected}
          />
        </div>

        {/* Extra Utils Row (Compact) */}
        <div className="flex items-center gap-2 flex-wrap justify-center scale-90">
          <GamepadMode onKey={sendKey} onMove={moveCursor} onTap={tap} disabled={!state.isConnected} />
          <ScreenMirror isConnected={state.isConnected} onStartMirror={startScreenMirror} onStopMirror={stopScreenMirror} onGetFrame={getScreenFrame} />
          <ScreenshotButton onScreenshot={takeScreenshot} disabled={!state.isConnected} />
        </div>

        {/* Trackpad at Bottom - Compact size */}
        <div className="w-full max-w-md mt-auto pb-2">
          <Trackpad
            onMove={moveCursor}
            onTap={tap}
            onScroll={scroll}
            onKey={sendKey}
            disabled={!state.isConnected}
          />
        </div>
      </main>

      {/* Panels */}
      <ConnectionPanel isOpen={showConnections} onClose={() => setShowConnections(false)} devices={discoveredDevices} isScanning={isScanning} onScan={scanNetwork} onConnect={connect} connectedDevice={state.device} connectedDevices={connectedDevices} onDisconnect={disconnect} onDisconnectDevice={handleDisconnectDevice} multiSelectMode={multiSelectMode} onToggleMultiSelect={handleToggleMultiSelect} selectedDevices={selectedDevices} onToggleDeviceSelection={handleToggleDeviceSelection} onConnectSelected={handleConnectSelected} />
      <AppsPanel isOpen={showApps} onClose={() => setShowApps(false)} apps={apps} onRefresh={fetchApps} onLaunch={handleLaunchApp} isConnected={state.isConnected} />
      <MenuPanel isOpen={showMenu} onClose={() => setShowMenu(false)} onKey={sendKey} isConnected={state.isConnected} />
      <SetupPanel isOpen={showSetup} onClose={() => setShowSetup(false)} />
      <ShortcutsPanel isOpen={showShortcuts} onClose={() => setShowShortcuts(false)} shortcuts={shortcuts} onAdd={addShortcut} onUpdate={updateShortcut} onRemove={removeShortcut} onReset={resetToDefaults} />
    </div>
  );
};

export default Index;
