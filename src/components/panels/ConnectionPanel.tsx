import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, RefreshCw, Wifi, WifiOff, Monitor, Smartphone } from 'lucide-react';
import { Device } from '@/types/adb';
import { Button } from '@/components/ui/button';

interface ConnectionPanelProps {
  isOpen: boolean;
  onClose: () => void;
  devices: Device[];
  isScanning: boolean;
  onScan: () => void;
  onConnect: (device: Device) => void;
  connectedDevice: Device | null;
  onDisconnect: () => void;
}

export const ConnectionPanel = ({
  isOpen,
  onClose,
  devices,
  isScanning,
  onScan,
  onConnect,
  connectedDevice,
  onDisconnect,
}: ConnectionPanelProps) => {
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
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="rounded-full"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-4 space-y-4">
              {/* Scan Button */}
              <Button
                onClick={onScan}
                disabled={isScanning}
                className="w-full gap-2"
                variant="secondary"
              >
                <RefreshCw className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} />
                {isScanning ? 'Scanning network...' : 'Scan for devices'}
              </Button>

              {/* Connected Device */}
              {connectedDevice && (
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
                  {devices.length > 0 ? `Found ${devices.length} device(s)` : 'No devices found'}
                </h3>
                
                {devices.map((device) => (
                  <DeviceCard
                    key={device.id}
                    device={device}
                    isConnected={connectedDevice?.id === device.id}
                    onConnect={() => onConnect(device)}
                  />
                ))}

                {devices.length === 0 && !isScanning && (
                  <div className="text-center py-8 text-muted-foreground">
                    <WifiOff className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">No Android TV devices found</p>
                    <p className="text-xs mt-1">Make sure devices are on the same network</p>
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
  onConnect: () => void;
}

const DeviceCard = ({ device, isConnected, onConnect }: DeviceCardProps) => (
  <motion.div
    className={`p-3 rounded-xl border transition-colors cursor-pointer
      ${isConnected 
        ? 'bg-primary/10 border-primary/30' 
        : 'bg-secondary/50 border-border/30 hover:border-primary/50'
      }`}
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    onClick={onConnect}
  >
    <div className="flex items-center gap-3">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center
        ${isConnected ? 'bg-primary/20' : 'bg-secondary'}`}
      >
        <Monitor className={`w-5 h-5 ${isConnected ? 'text-primary' : 'text-muted-foreground'}`} />
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
    </div>
  </motion.div>
);
