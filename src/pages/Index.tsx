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
import { ConnectionPanel } from '@/components/panels/ConnectionPanel';
import { AppsPanel } from '@/components/panels/AppsPanel';
import { MenuPanel } from '@/components/panels/MenuPanel';
import { SetupPanel } from '@/components/panels/SetupPanel';
import { ShortcutsPanel } from '@/components/panels/ShortcutsPanel';
import { toast } from 'sonner';

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

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      
      // Check custom shortcuts
      const shortcut = shortcuts.find(s => s.key.toLowerCase() === e.key.toLowerCase());
      if (shortcut && state.isConnected) {
        e.preventDefault();
        launchApp(shortcut.command);
        toast.success(`Launching ${shortcut.name}`);
        return;
      }

      // Default key mappings
      switch (e.key) {
        case 'ArrowUp':
          sendKey('KEYCODE_DPAD_UP');
          break;
        case 'ArrowDown':
          sendKey('KEYCODE_DPAD_DOWN');
          break;
        case 'ArrowLeft':
          sendKey('KEYCODE_DPAD_LEFT');
          break;
        case 'ArrowRight':
          sendKey('KEYCODE_DPAD_RIGHT');
          break;
        case 'Enter':
          sendKey('KEYCODE_DPAD_CENTER');
          break;
        case 'Escape':
        case 'Backspace':
          sendKey('KEYCODE_BACK');
          break;
        case 'Home':
          sendKey('KEYCODE_HOME');
          break;
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

  // Show error toast if connection fails
  useEffect(() => {
    if (state.error) {
      toast.error(state.error);
    }
  }, [state.error]);

  return (
    <div className="min-h-screen bg-background flex flex-col safe-area-inset">
      {/* Header */}
      <Header
        device={state.device}
        isConnected={state.isConnected}
        onConnectionClick={() => setShowConnections(true)}
        onSetupClick={() => setShowSetup(true)}
        onSettingsClick={() => setShowShortcuts(true)}
        onPowerClick={handlePowerOff}
      />

      {/* Main Remote Area */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 gap-6 overflow-auto">
        {/* Trackpad */}
        <motion.section
          className="w-full max-w-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Trackpad
            onMove={moveCursor}
            onTap={tap}
            onScroll={scroll}
            disabled={!state.isConnected}
          />
        </motion.section>

        {/* D-Pad and Volume/Channel */}
        <motion.section
          className="flex items-center justify-center gap-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <VolumeControls onKey={sendKey} disabled={!state.isConnected} />
          <DPad onKey={sendKey} disabled={!state.isConnected} />
          <ChannelControls onKey={sendKey} disabled={!state.isConnected} />
        </motion.section>

        {/* Navigation Buttons */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <NavigationButtons
            onKey={sendKey}
            onAppsClick={() => setShowApps(true)}
            onMenuClick={() => setShowMenu(true)}
            disabled={!state.isConnected}
          />
        </motion.section>

        {/* Media Controls */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <MediaControls onKey={sendKey} disabled={!state.isConnected} />
        </motion.section>

        {/* Quick Launch Shortcuts */}
        <motion.section
          className="w-full max-w-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <QuickLaunch
            shortcuts={shortcuts}
            onLaunch={handleLaunchApp}
            disabled={!state.isConnected}
          />
        </motion.section>
      </main>

      {/* Panels */}
      <ConnectionPanel
        isOpen={showConnections}
        onClose={() => setShowConnections(false)}
        devices={discoveredDevices}
        isScanning={isScanning}
        onScan={scanNetwork}
        onConnect={connect}
        connectedDevice={state.device}
        onDisconnect={disconnect}
      />

      <AppsPanel
        isOpen={showApps}
        onClose={() => setShowApps(false)}
        apps={apps}
        onRefresh={fetchApps}
        onLaunch={handleLaunchApp}
        isConnected={state.isConnected}
      />

      <MenuPanel
        isOpen={showMenu}
        onClose={() => setShowMenu(false)}
        onKey={sendKey}
        isConnected={state.isConnected}
      />

      <SetupPanel
        isOpen={showSetup}
        onClose={() => setShowSetup(false)}
      />

      <ShortcutsPanel
        isOpen={showShortcuts}
        onClose={() => setShowShortcuts(false)}
        shortcuts={shortcuts}
        onAdd={addShortcut}
        onUpdate={updateShortcut}
        onRemove={removeShortcut}
        onReset={resetToDefaults}
      />
    </div>
  );
};

export default Index;
