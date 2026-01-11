import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, RefreshCw, Package } from 'lucide-react';
import { AppInfo } from '@/types/adb';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface AppsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  apps: AppInfo[];
  onRefresh: () => void;
  onLaunch: (packageName: string) => void;
  isConnected: boolean;
}

export const AppsPanel = ({
  isOpen,
  onClose,
  apps,
  onRefresh,
  onLaunch,
  isConnected,
}: AppsPanelProps) => {
  const [search, setSearch] = useState('');
  const [showSystem, setShowSystem] = useState(false);

  const filteredApps = apps.filter(app => {
    const matchesSearch = app.label.toLowerCase().includes(search.toLowerCase()) ||
                          app.packageName.toLowerCase().includes(search.toLowerCase());
    const matchesType = showSystem || !app.isSystem;
    return matchesSearch && matchesType;
  });

  useEffect(() => {
    if (isOpen && isConnected && apps.length === 0) {
      onRefresh();
    }
  }, [isOpen, isConnected, apps.length, onRefresh]);

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
            className="fixed inset-x-4 top-16 bottom-4 md:inset-auto md:top-16 md:left-4 md:w-80 md:max-h-[calc(100vh-5rem)] 
                       glass-panel rounded-2xl z-50 flex flex-col overflow-hidden"
            initial={{ opacity: 0, x: -20, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -20, scale: 0.95 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border/30">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Package className="w-5 h-5 text-accent" />
                Apps
              </h2>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onRefresh}
                  disabled={!isConnected}
                  className="rounded-full"
                >
                  <RefreshCw className="w-4 h-4" />
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

            {/* Search */}
            <div className="p-4 border-b border-border/30 space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search apps..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 bg-secondary/50"
                />
              </div>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={showSystem}
                  onChange={(e) => setShowSystem(e.target.checked)}
                  className="rounded border-border"
                />
                <span className="text-muted-foreground">Show system apps</span>
              </label>
            </div>

            {/* App Grid */}
            <div className="flex-1 overflow-auto p-4">
              {!isConnected ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">Connect to a device first</p>
                </div>
              ) : filteredApps.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">
                    {apps.length === 0 ? 'Loading apps...' : 'No apps found'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  {filteredApps.map((app) => (
                    <AppTile
                      key={app.packageName}
                      app={app}
                      onLaunch={() => onLaunch(app.packageName)}
                    />
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

interface AppTileProps {
  app: AppInfo;
  onLaunch: () => void;
}

const AppTile = ({ app, onLaunch }: AppTileProps) => {
  // Generate a color based on package name for the icon background
  const hue = app.packageName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 360;
  
  return (
    <motion.button
      className="app-tile"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onLaunch}
    >
      <div 
        className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
        style={{ backgroundColor: `hsl(${hue}, 60%, 25%)` }}
      >
        {app.icon || app.label.charAt(0).toUpperCase()}
      </div>
      <span className="text-xs text-center line-clamp-2 leading-tight">
        {app.label}
      </span>
    </motion.button>
  );
};
