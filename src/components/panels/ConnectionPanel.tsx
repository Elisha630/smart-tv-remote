import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, RefreshCw, Wifi, WifiOff, Monitor, Check, Plus, Trash2 } from 'lucide-react';
import { Device } from '@/types/adb';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface ConnectionPanelProps {
  isOpen: boolean;
  onClose: () => void;
  devices: Device[];
  isScanning: boolean;
  onScan: () => void;
  onConnect: (device: Device) => void;
  connectedDevice: Device | null;
  connectedDevices: Device[];
  onDisconnect: () => void;
  onDisconnectDevice: (device: Device) => void;
  multiSelectMode: boolean;
  onToggleMultiSelect: () => void;
  selectedDevices: Device[];
  onToggleDeviceSelection: (device: Device) => void;
  onConnectSelected: () => void;
  onAddDevice?: (ip: string, name?: string) => Device;
  onRemoveDevice?: (deviceId: string) => void;
}

export const ConnectionPanel = ({
  isOpen,
  onClose,
  devices,
  isScanning,
  onScan,
  onConnect,
  connectedDevice,
  connectedDevices = [],
  onDisconnect,
  onDisconnectDevice,
  multiSelectMode = false,
  onToggleMultiSelect,
  selectedDevices = [],
  onToggleDeviceSelection,
  onConnectSelected,
  onAddDevice,
  onRemoveDevice,
}: ConnectionPanelProps) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newDeviceIp, setNewDeviceIp] = useState('');
  const [newDeviceName, setNewDeviceName] = useState('');

  const handleAddDevice = useCallback(() => {
    if (!newDeviceIp.trim()) {
      toast.error('Please enter an IP address');
      return;
    }
    
    // Basic IP validation
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipRegex.test(newDeviceIp.trim())) {
      toast.error('Please enter a valid IP address');
      return;
    }
    
    if (onAddDevice) {
      const device = onAddDevice(newDeviceIp.trim(), newDeviceName.trim() || undefined);
      toast.success(`Added ${device.name}`);
      setNewDeviceIp('');
      setNewDeviceName('');
      setShowAddForm(false);
    }
  }, [newDeviceIp, newDeviceName, onAddDevice]);
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          
          {/* Panel */}
          <motion.div
            className="fixed inset-x-4 top-16 bottom-4 md:inset-auto md:top-16 md:right-4 md:w-96 md:max-h-[calc(100vh-5rem)] 
                       glass-panel rounded-2xl z-50 flex flex-col overflow-hidden"
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border/30">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Wifi className="w-5 h-5 text-primary" />
                Connections
              </h2>
              <div className="flex items-center gap-2">
                <Button
                  variant={multiSelectMode ? "default" : "outline"}
                  size="sm"
                  onClick={onToggleMultiSelect}
                  className="text-xs"
                >
                  {multiSelectMode ? 'Exit Multi' : 'Multi-TV'}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="rounded-full"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-4 space-y-4">
              {/* Add Device Form */}
              {showAddForm ? (
                <div className="p-3 rounded-xl bg-secondary/50 border border-border/30 space-y-3">
                  <h4 className="text-sm font-medium">Add Device Manually</h4>
                  <Input
                    placeholder="IP Address (e.g., 192.168.1.100)"
                    value={newDeviceIp}
                    onChange={(e) => setNewDeviceIp(e.target.value)}
                    className="bg-background/50"
                  />
                  <Input
                    placeholder="Device Name (optional)"
                    value={newDeviceName}
                    onChange={(e) => setNewDeviceName(e.target.value)}
                    className="bg-background/50"
                  />
                  <div className="flex gap-2">
                    <Button onClick={handleAddDevice} className="flex-1" size="sm">
                      <Plus className="w-4 h-4 mr-1" />
                      Add
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setShowAddForm(false);
                        setNewDeviceIp('');
                        setNewDeviceName('');
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Button
                    onClick={onScan}
                    disabled={isScanning}
                    className="flex-1 gap-2"
                    variant="secondary"
                  >
                    <RefreshCw className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} />
                    {isScanning ? 'Scanning...' : 'Scan'}
                  </Button>
                  <Button
                    onClick={() => setShowAddForm(true)}
                    variant="outline"
                    className="gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add
                  </Button>
                </div>
              )}

              {/* Multi-select connect button */}
              {multiSelectMode && selectedDevices.length > 0 && (
                <Button
                  onClick={onConnectSelected}
                  className="w-full gap-2"
                >
                  <Monitor className="w-4 h-4" />
                  Connect to {selectedDevices.length} device(s)
                </Button>
              )}

              {/* Connected Devices */}
              {connectedDevices.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-primary">
                    Connected ({connectedDevices.length})
                  </h3>
                  {connectedDevices.map((device) => (
                    <div 
                      key={device.id}
                      className="p-3 rounded-xl bg-primary/10 border border-primary/30"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                            <Monitor className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <div className="font-medium text-sm">{device.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {device.ip}:{device.port}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="connection-dot connected" />
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => onDisconnectDevice(device)}
                          >
                            Disconnect
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Legacy single device connection */}
              {!multiSelectMode && connectedDevice && connectedDevices.length === 0 && (
                <div className="p-3 rounded-xl bg-primary/10 border border-primary/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                        <Monitor className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <div className="font-medium text-sm">{connectedDevice.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {connectedDevice.ip}:{connectedDevice.port}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="connection-dot connected" />
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={onDisconnect}
                      >
                        Disconnect
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Device List */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">
                  {devices.length > 0 ? `Saved Devices (${devices.length})` : 'No saved devices'}
                </h3>
                
                {devices.map((device) => (
                  <DeviceCard
                    key={device.id}
                    device={device}
                    isConnected={
                      connectedDevice?.id === device.id || 
                      connectedDevices.some(d => d.id === device.id)
                    }
                    isSelected={selectedDevices.some(d => d.id === device.id)}
                    multiSelectMode={multiSelectMode}
                    onConnect={() => multiSelectMode ? onToggleDeviceSelection(device) : onConnect(device)}
                    onToggleSelect={() => onToggleDeviceSelection(device)}
                    onRemove={onRemoveDevice ? () => onRemoveDevice(device.id) : undefined}
                  />
                ))}

                {devices.length === 0 && !isScanning && (
                  <div className="text-center py-8 text-muted-foreground">
                    <WifiOff className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">No devices added yet</p>
                    <p className="text-xs mt-1">Click "Add" to enter your TV's IP address</p>
                    <p className="text-xs mt-2 text-primary/70">
                      Find your TV's IP in Settings → Network → About
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

interface DeviceCardProps {
  device: Device;
  isConnected: boolean;
  isSelected: boolean;
  multiSelectMode: boolean;
  onConnect: () => void;
  onToggleSelect: () => void;
  onRemove?: () => void;
}

const DeviceCard = ({ device, isConnected, isSelected, multiSelectMode, onConnect, onToggleSelect, onRemove }: DeviceCardProps) => (
  <motion.div
    className={`p-3 rounded-xl border transition-colors cursor-pointer
      ${isConnected 
        ? 'bg-primary/10 border-primary/30' 
        : isSelected
        ? 'bg-blue-500/10 border-blue-500/30'
        : 'bg-secondary/50 border-border/30 hover:border-primary/50'
      }`}
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    onClick={onConnect}
  >
    <div className="flex items-center gap-3">
      {multiSelectMode && (
        <Checkbox
          checked={isSelected || isConnected}
          onCheckedChange={() => onToggleSelect()}
          onClick={(e) => e.stopPropagation()}
          className="data-[state=checked]:bg-primary"
        />
      )}
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center
        ${isConnected ? 'bg-primary/20' : isSelected ? 'bg-blue-500/20' : 'bg-secondary'}`}
      >
        <Monitor className={`w-5 h-5 ${isConnected ? 'text-primary' : isSelected ? 'text-blue-400' : 'text-muted-foreground'}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm truncate">{device.name}</div>
        <div className="text-xs text-muted-foreground">
          {device.ip}:{device.port}
        </div>
        {device.model && (
          <div className="text-xs text-muted-foreground/70 truncate">
            {device.manufacturer} {device.model}
          </div>
        )}
      </div>
      {isConnected && (
        <div className="connection-dot connected" />
      )}
      {isSelected && !isConnected && (
        <Check className="w-4 h-4 text-blue-400" />
      )}
      {onRemove && !isConnected && (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-destructive"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      )}
    </div>
  </motion.div>
);