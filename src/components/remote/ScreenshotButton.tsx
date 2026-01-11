import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Camera, Loader2, X, Download, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

interface ScreenshotButtonProps {
  onScreenshot: () => Promise<string | null>;
  disabled?: boolean;
}

export const ScreenshotButton = ({ onScreenshot, disabled = false }: ScreenshotButtonProps) => {
  const [isCapturing, setIsCapturing] = useState(false);
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const handleCapture = useCallback(async () => {
    setIsCapturing(true);
    try {
      const url = await onScreenshot();
      if (url) {
        setScreenshotUrl(url);
        setShowPreview(true);
        toast.success('Screenshot captured!');
      } else {
        toast.error('Failed to capture screenshot');
      }
    } catch (error) {
      toast.error('Screenshot failed');
    } finally {
      setIsCapturing(false);
    }
  }, [onScreenshot]);

  const handleDownload = useCallback(() => {
    if (screenshotUrl) {
      const link = document.createElement('a');
      link.href = screenshotUrl;
      link.download = `tv-screenshot-${Date.now()}.png`;
      link.click();
      toast.success('Screenshot downloaded!');
    }
  }, [screenshotUrl]);

  const handleClose = useCallback(() => {
    setShowPreview(false);
    if (screenshotUrl) {
      URL.revokeObjectURL(screenshotUrl);
      setScreenshotUrl(null);
    }
  }, [screenshotUrl]);

  return (
    <>
      <motion.button
        className="remote-button p-3 flex items-center gap-2"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleCapture}
        disabled={disabled || isCapturing}
      >
        {isCapturing ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <Camera className="w-5 h-5" />
        )}
        <span className="text-sm">Screenshot</span>
      </motion.button>

      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-3xl bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>TV Screenshot</span>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={handleDownload}>
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
                <Button size="sm" variant="ghost" onClick={handleClose}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>
          
          <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
            {screenshotUrl && (
              <img
                src={screenshotUrl}
                alt="TV Screenshot"
                className="w-full h-full object-contain"
              />
            )}
          </div>
          
          <p className="text-xs text-muted-foreground text-center">
            Screenshot captured at {new Date().toLocaleTimeString()}
          </p>
        </DialogContent>
      </Dialog>
    </>
  );
};
