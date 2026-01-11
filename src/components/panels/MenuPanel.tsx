import { motion, AnimatePresence } from 'framer-motion';
import { X, Tv, Monitor, Radio, Usb, Cable } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { KeyCode } from '@/types/adb';

interface MenuPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onKey: (keyCode: KeyCode) => void;
  isConnected: boolean;
}

const INPUT_OPTIONS = [
  { id: 'hdmi1', label: 'HDMI 1', icon: Monitor },
  { id: 'hdmi2', label: 'HDMI 2', icon: Monitor },
  { id: 'hdmi3', label: 'HDMI 3', icon: Monitor },
  { id: 'usb', label: 'USB', icon: Usb },
  { id: 'antenna', label: 'Antenna', icon: Radio },
  { id: 'av', label: 'AV', icon: Cable },
];

export const MenuPanel = ({
  isOpen,
  onClose,
  onKey,
  isConnected,
}: MenuPanelProps) => {
  const handleInputSelect = () => {
    onKey('KEYCODE_TV_INPUT');
  };

  const handleSettings = () => {
    onKey('KEYCODE_SETTINGS');
  };

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
            className="fixed inset-x-4 bottom-4 md:inset-auto md:bottom-4 md:left-1/2 md:-translate-x-1/2 md:w-96
                       glass-panel rounded-2xl z-50 overflow-hidden"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border/30">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Tv className="w-5 h-5 text-primary" />
                TV Menu
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
            <div className="p-4 space-y-4">
              {/* Quick Actions */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">Quick Actions</h3>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="secondary"
                    className="h-auto py-3 flex-col gap-1"
                    onClick={handleInputSelect}
                    disabled={!isConnected}
                  >
                    <Monitor className="w-5 h-5" />
                    <span className="text-xs">Input Source</span>
                  </Button>
                  <Button
                    variant="secondary"
                    className="h-auto py-3 flex-col gap-1"
                    onClick={handleSettings}
                    disabled={!isConnected}
                  >
                    <Tv className="w-5 h-5" />
                    <span className="text-xs">TV Settings</span>
                  </Button>
                  <Button
                    variant="secondary"
                    className="h-auto py-3 flex-col gap-1"
                    onClick={handleSettings}
                    disabled={!isConnected}
                  >
                    <Tv className="w-5 h-5" />
                    <span className="text-xs">TV Settings</span>
                  </Button>
                </div>
              </div>

              {/* Input Sources */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">Input Sources</h3>
                <div className="grid grid-cols-3 gap-2">
                  {INPUT_OPTIONS.map((input) => (
                    <motion.button
                      key={input.id}
                      className={`p-3 rounded-xl flex flex-col items-center gap-1.5
                                  bg-secondary/50 border border-border/30 hover:border-primary/50
                                  transition-colors ${!isConnected ? 'opacity-50 cursor-not-allowed' : ''}`}
                      whileHover={isConnected ? { scale: 1.05 } : {}}
                      whileTap={isConnected ? { scale: 0.95 } : {}}
                      onClick={handleInputSelect}
                      disabled={!isConnected}
                    >
                      <input.icon className="w-5 h-5 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{input.label}</span>
                    </motion.button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
