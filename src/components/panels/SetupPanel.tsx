import { motion, AnimatePresence } from 'framer-motion';
import { X, BookOpen, Wifi, Terminal, Smartphone, Monitor, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SetupPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const SETUP_STEPS = [
  {
    number: 1,
    title: 'Enable Developer Options',
    description: 'Go to Settings → About → Build number, tap it 7 times to enable Developer Options.',
    icon: Monitor,
  },
  {
    number: 2,
    title: 'Enable ADB Debugging',
    description: 'Go to Settings → Developer Options → Enable "USB debugging" and "ADB over network".',
    icon: Terminal,
  },
  {
    number: 3,
    title: 'Connect to Same Network',
    description: 'Make sure your Android TV and this device are connected to the same WiFi network.',
    icon: Wifi,
  },
  {
    number: 4,
    title: 'Run the ADB Bridge Server',
    description: 'On your computer, run the ADB bridge server to enable communication between this app and your TV.',
    icon: Smartphone,
  },
];

export const SetupPanel = ({ isOpen, onClose }: SetupPanelProps) => {
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
            className="fixed inset-x-4 top-16 bottom-4 md:inset-auto md:top-1/2 md:left-1/2 
                       md:-translate-x-1/2 md:-translate-y-1/2 md:w-[500px] md:max-h-[80vh]
                       glass-panel rounded-2xl z-50 flex flex-col overflow-hidden"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border/30">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                Setup Guide
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
              <p className="text-sm text-muted-foreground">
                Follow these steps to connect your Android TV to this remote control app:
              </p>

              <div className="space-y-4">
                {SETUP_STEPS.map((step, index) => (
                  <motion.div
                    key={step.number}
                    className="flex gap-4 p-4 rounded-xl bg-secondary/30 border border-border/30"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/20 
                                    flex items-center justify-center text-primary font-bold">
                      {step.number}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium mb-1 flex items-center gap-2">
                        <step.icon className="w-4 h-4 text-primary" />
                        {step.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {step.description}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Bridge Server Instructions */}
              <div className="p-4 rounded-xl bg-accent/10 border border-accent/30">
                <h3 className="font-medium mb-2 flex items-center gap-2 text-accent">
                  <Terminal className="w-4 h-4" />
                  ADB Bridge Server
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  To run the bridge server on your computer (requires ADB installed):
                </p>
                <div className="bg-background/50 rounded-lg p-3 font-mono text-xs overflow-x-auto">
                  <code>python3 adb_bridge.py</code>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  The bridge server connects this web app to your Android TV via ADB commands.
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
