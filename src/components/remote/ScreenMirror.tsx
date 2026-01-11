import { useState, useCallback, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Monitor, Loader2, X, Maximize2, Minimize2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

interface ScreenMirrorProps {
  onStartMirror: () => Promise<boolean>;
  onStopMirror: () => void;
  onGetFrame: () => Promise<string | null>;
  isConnected: boolean;
}

export const ScreenMirror = ({ 
  onStartMirror, 
  onStopMirror, 
  onGetFrame,
  isConnected 
}: ScreenMirrorProps) => {
  const [isMirroring, setIsMirroring] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [frameUrl, setFrameUrl] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fps, setFps] = useState(0);
  const frameIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const frameCountRef = useRef(0);
  const dialogRef = useRef<HTMLDivElement>(null);

  const startMirroring = useCallback(async () => {
    setIsStarting(true);
    try {
      const success = await onStartMirror();
      if (success) {
        setIsMirroring(true);
        setShowDialog(true);
        toast.success('Screen mirroring started');
        
        // Start frame refresh loop
        const refreshFrame = async () => {
          const frame = await onGetFrame();
          if (frame) {
            // Revoke previous URL to prevent memory leaks
            if (frameUrl) {
              URL.revokeObjectURL(frameUrl);
            }
            setFrameUrl(frame);
            frameCountRef.current++;
          }
        };
        
        // Refresh at ~5 FPS for reasonable performance
        frameIntervalRef.current = setInterval(refreshFrame, 200);
        
        // FPS counter
        const fpsInterval = setInterval(() => {
          setFps(frameCountRef.current);
          frameCountRef.current = 0;
        }, 1000);
        
        // Store fps interval for cleanup
        (frameIntervalRef.current as any).fpsInterval = fpsInterval;
        
        // Initial frame
        refreshFrame();
      } else {
        toast.error('Failed to start screen mirroring');
      }
    } catch (error) {
      toast.error('Screen mirroring failed');
    } finally {
      setIsStarting(false);
    }
  }, [onStartMirror, onGetFrame, frameUrl]);

  const stopMirroring = useCallback(() => {
    if (frameIntervalRef.current) {
      clearInterval(frameIntervalRef.current);
      if ((frameIntervalRef.current as any).fpsInterval) {
        clearInterval((frameIntervalRef.current as any).fpsInterval);
      }
      frameIntervalRef.current = null;
    }
    if (frameUrl) {
      URL.revokeObjectURL(frameUrl);
      setFrameUrl(null);
    }
    onStopMirror();
    setIsMirroring(false);
    setShowDialog(false);
    setFps(0);
    toast.info('Screen mirroring stopped');
  }, [onStopMirror, frameUrl]);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      dialogRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (frameIntervalRef.current) {
        clearInterval(frameIntervalRef.current);
        if ((frameIntervalRef.current as any).fpsInterval) {
          clearInterval((frameIntervalRef.current as any).fpsInterval);
        }
      }
      if (frameUrl) {
        URL.revokeObjectURL(frameUrl);
      }
    };
  }, []);

  // Handle dialog close
  const handleDialogChange = useCallback((open: boolean) => {
    if (!open) {
      stopMirroring();
    }
    setShowDialog(open);
  }, [stopMirroring]);

  return (
    <>
      <motion.button
        className="remote-button p-3 flex items-center gap-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={isMirroring ? () => setShowDialog(true) : startMirroring}
        disabled={!isConnected || isStarting}
        title="Mirror TV screen"
      >
        {isStarting ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <Monitor className="w-5 h-5" />
        )}
        <span className="text-sm">
          {isMirroring ? 'View Mirror' : 'Mirror Screen'}
        </span>
      </motion.button>

      <Dialog open={showDialog} onOpenChange={handleDialogChange}>
        <DialogContent 
          ref={dialogRef}
          className="max-w-5xl w-[95vw] h-[85vh] bg-black/95 border-border p-0 flex flex-col"
        >
          <DialogHeader className="p-4 pb-2 flex-shrink-0">
            <DialogTitle className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Monitor className="w-5 h-5 text-blue-400" />
                <span>TV Screen Mirror</span>
                <span className="text-xs text-muted-foreground bg-secondary/50 px-2 py-1 rounded">
                  {fps} FPS
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  size="icon" 
                  variant="ghost"
                  onClick={toggleFullscreen}
                  title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
                >
                  {isFullscreen ? (
                    <Minimize2 className="w-4 h-4" />
                  ) : (
                    <Maximize2 className="w-4 h-4" />
                  )}
                </Button>
                <Button 
                  size="icon" 
                  variant="ghost"
                  onClick={() => {
                    frameCountRef.current = 0;
                    toast.info('Refreshing...');
                  }}
                  title="Refresh"
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>
                <Button 
                  size="sm" 
                  variant="destructive"
                  onClick={stopMirroring}
                >
                  <X className="w-4 h-4 mr-2" />
                  Stop
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 flex items-center justify-center bg-black overflow-hidden p-4">
            {frameUrl ? (
              <img
                src={frameUrl}
                alt="TV Screen"
                className="max-w-full max-h-full object-contain rounded-lg"
                style={{ imageRendering: 'auto' }}
              />
            ) : (
              <div className="flex flex-col items-center gap-4 text-muted-foreground">
                <Loader2 className="w-12 h-12 animate-spin" />
                <p>Loading screen...</p>
              </div>
            )}
          </div>
          
          <div className="p-3 flex-shrink-0 border-t border-border/50">
            <p className="text-xs text-muted-foreground text-center">
              Screen is being captured from your TV. Use the remote controls below to navigate.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
