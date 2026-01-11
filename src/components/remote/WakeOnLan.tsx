import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Power, Loader2, Wifi } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

interface WakeOnLanProps {
  onWake: (macAddress: string) => Promise<boolean>;
  savedMacAddress?: string;
  onSaveMac?: (mac: string) => void;
}

export const WakeOnLan = ({ onWake, savedMacAddress, onSaveMac }: WakeOnLanProps) => {
  const [isWaking, setIsWaking] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [macAddress, setMacAddress] = useState(savedMacAddress || '');

  const formatMacAddress = useCallback((value: string) => {
    // Remove all non-hex characters
    const cleaned = value.replace(/[^a-fA-F0-9]/g, '').toUpperCase();
    // Add colons every 2 characters
    const formatted = cleaned.match(/.{1,2}/g)?.join(':') || cleaned;
    return formatted.slice(0, 17); // Max length for MAC (XX:XX:XX:XX:XX:XX)
  }, []);

  const handleMacChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setMacAddress(formatMacAddress(e.target.value));
  }, [formatMacAddress]);

  const handleWake = useCallback(async () => {
    if (!macAddress || macAddress.length < 17) {
      toast.error('Please enter a valid MAC address');
      return;
    }

    setIsWaking(true);
    try {
      const success = await onWake(macAddress);
      if (success) {
        toast.success('Wake-on-LAN packet sent! TV should turn on shortly.');
        onSaveMac?.(macAddress);
        setShowDialog(false);
      } else {
        toast.error('Failed to send Wake-on-LAN packet');
      }
    } catch (error) {
      toast.error('Wake-on-LAN failed');
    } finally {
      setIsWaking(false);
    }
  }, [macAddress, onWake, onSaveMac]);

  const handleQuickWake = useCallback(async () => {
    if (savedMacAddress) {
      setMacAddress(savedMacAddress);
      setIsWaking(true);
      try {
        const success = await onWake(savedMacAddress);
        if (success) {
          toast.success('Wake-on-LAN sent! TV should turn on shortly.');
        } else {
          toast.error('Wake-on-LAN failed');
        }
      } catch (error) {
        toast.error('Wake-on-LAN failed');
      } finally {
        setIsWaking(false);
      }
    } else {
      setShowDialog(true);
    }
  }, [savedMacAddress, onWake]);

  return (
    <>
      <motion.button
        className="remote-button p-3 flex items-center gap-2 bg-green-500/20 hover:bg-green-500/30 text-green-400"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleQuickWake}
        disabled={isWaking}
        title="Wake TV (Wake-on-LAN)"
      >
        {isWaking ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <Power className="w-5 h-5" />
        )}
        <span className="text-sm">Wake TV</span>
      </motion.button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wifi className="w-5 h-5 text-green-400" />
              Wake-on-LAN Setup
            </DialogTitle>
            <DialogDescription>
              Enter your TV's MAC address to wake it up when it's completely off.
              You can usually find this in your TV's network settings.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">MAC Address</label>
              <Input
                type="text"
                placeholder="AA:BB:CC:DD:EE:FF"
                value={macAddress}
                onChange={handleMacChange}
                className="font-mono bg-secondary/50 border-border/50"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Format: XX:XX:XX:XX:XX:XX (e.g., 00:1A:2B:3C:4D:5E)
              </p>
            </div>

            <div className="glass-panel p-3 rounded-lg">
              <h4 className="text-sm font-medium mb-2">How to find MAC address:</h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Android TV: Settings → Device Preferences → About → Status</li>
                <li>• Samsung TV: Settings → General → Network → Network Status</li>
                <li>• LG TV: Settings → Network → Wi-Fi Connection → Advanced</li>
                <li>• Check your router's connected devices list</li>
              </ul>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleWake} 
              disabled={isWaking || macAddress.length < 17}
              className="bg-green-600 hover:bg-green-700"
            >
              {isWaking ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Waking...
                </>
              ) : (
                <>
                  <Power className="w-4 h-4 mr-2" />
                  Wake TV
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
