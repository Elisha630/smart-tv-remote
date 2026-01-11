import { useRef, useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MousePointer2, ArrowLeft, ArrowRight, ZoomIn, ZoomOut } from 'lucide-react';
import { TrackpadPosition } from '@/types/adb';
import { KeyCode } from '@/types/adb';
import { toast } from 'sonner';

interface TrackpadProps {
  onMove: (position: TrackpadPosition) => void;
  onTap: () => void;
  onScroll: (deltaY: number) => void;
  onKey?: (keyCode: KeyCode) => void;
  disabled?: boolean;
}

const SWIPE_THRESHOLD = 80; // pixels
const PINCH_THRESHOLD = 0.3; // scale factor change

export const Trackpad = ({ onMove, onTap, onScroll, onKey, disabled }: TrackpadProps) => {
  const trackpadRef = useRef<HTMLDivElement>(null);
  const [isActive, setIsActive] = useState(false);
  const [cursorPos, setCursorPos] = useState({ x: 50, y: 50 });
  const [gestureHint, setGestureHint] = useState<string | null>(null);
  const lastPosRef = useRef({ x: 0, y: 0 });
  const startPosRef = useRef({ x: 0, y: 0 });
  const isTrackingRef = useRef(false);
  const touchesRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const initialPinchDistanceRef = useRef<number | null>(null);
  const gestureTimeoutRef = useRef<NodeJS.Timeout>();

  const showGestureHint = useCallback((hint: string) => {
    setGestureHint(hint);
    if (gestureTimeoutRef.current) clearTimeout(gestureTimeoutRef.current);
    gestureTimeoutRef.current = setTimeout(() => setGestureHint(null), 1000);
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (disabled) return;
    e.preventDefault();
    setIsActive(true);
    isTrackingRef.current = true;
    lastPosRef.current = { x: e.clientX, y: e.clientY };
    startPosRef.current = { x: e.clientX, y: e.clientY };
    touchesRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [disabled]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isTrackingRef.current || disabled) return;
    
    touchesRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    
    // Handle pinch zoom with 2 fingers
    if (touchesRef.current.size === 2) {
      const touches = Array.from(touchesRef.current.values());
      const distance = Math.hypot(
        touches[1].x - touches[0].x,
        touches[1].y - touches[0].y
      );
      
      if (initialPinchDistanceRef.current === null) {
        initialPinchDistanceRef.current = distance;
      } else {
        const scale = distance / initialPinchDistanceRef.current;
        if (scale > 1 + PINCH_THRESHOLD) {
          // Zoom in
          showGestureHint('Zoom In');
          onScroll(-100); // Zoom in via scroll
          initialPinchDistanceRef.current = distance;
        } else if (scale < 1 - PINCH_THRESHOLD) {
          // Zoom out
          showGestureHint('Zoom Out');
          onScroll(100); // Zoom out via scroll
          initialPinchDistanceRef.current = distance;
        }
      }
      return;
    }

    const deltaX = e.clientX - lastPosRef.current.x;
    const deltaY = e.clientY - lastPosRef.current.y;
    lastPosRef.current = { x: e.clientX, y: e.clientY };

    // Update visual cursor position
    setCursorPos(prev => ({
      x: Math.max(0, Math.min(100, prev.x + deltaX * 0.5)),
      y: Math.max(0, Math.min(100, prev.y + deltaY * 0.5)),
    }));

    // Send movement to TV (scale for larger movements)
    onMove({ x: deltaX * 2, y: deltaY * 2 });
  }, [onMove, onScroll, disabled, showGestureHint]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (disabled) return;
    
    touchesRef.current.delete(e.pointerId);
    
    if (touchesRef.current.size === 0) {
      // Check for swipe gestures
      const totalDeltaX = e.clientX - startPosRef.current.x;
      const totalDeltaY = e.clientY - startPosRef.current.y;
      
      if (Math.abs(totalDeltaX) > SWIPE_THRESHOLD && Math.abs(totalDeltaX) > Math.abs(totalDeltaY)) {
        if (totalDeltaX > 0) {
          // Swipe right = Forward
          showGestureHint('Forward →');
          onKey?.('KEYCODE_MEDIA_FAST_FORWARD');
        } else {
          // Swipe left = Back
          showGestureHint('← Back');
          onKey?.('KEYCODE_BACK');
        }
      }
      
      setIsActive(false);
      isTrackingRef.current = false;
      initialPinchDistanceRef.current = null;
    }
    
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  }, [disabled, onKey, showGestureHint]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    if (disabled) return;
    // Only tap if minimal movement
    const totalDelta = Math.abs(e.clientX - startPosRef.current.x) + Math.abs(e.clientY - startPosRef.current.y);
    if (totalDelta < 10 && e.detail === 1) {
      onTap();
    }
  }, [onTap, disabled]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (disabled) return;
    e.preventDefault();
    onScroll(e.deltaY);
  }, [onScroll, disabled]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (gestureTimeoutRef.current) clearTimeout(gestureTimeoutRef.current);
    };
  }, []);

  return (
    <motion.div
      ref={trackpadRef}
      className={`trackpad relative w-full aspect-[4/3] select-none touch-none ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      }`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onClick={handleClick}
      onWheel={handleWheel}
      whileHover={disabled ? {} : { borderColor: 'hsl(var(--primary))' }}
      tabIndex={0}
    >
      {/* Trackpad surface pattern */}
      <div className="absolute inset-0 opacity-10">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* Gesture indicators on edges */}
      <div className="absolute left-2 top-1/2 -translate-y-1/2 opacity-20">
        <ArrowLeft className="w-5 h-5" />
      </div>
      <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-20">
        <ArrowRight className="w-5 h-5" />
      </div>

      {/* Virtual cursor */}
      <motion.div
        className="absolute w-4 h-4 pointer-events-none"
        style={{
          left: `${cursorPos.x}%`,
          top: `${cursorPos.y}%`,
          transform: 'translate(-50%, -50%)',
        }}
        animate={{
          scale: isActive ? 0.8 : 1,
          opacity: isActive ? 1 : 0.6,
        }}
      >
        <MousePointer2 className="w-full h-full text-primary drop-shadow-lg" />
      </motion.div>

      {/* Gesture Hint Overlay */}
      {gestureHint && (
        <motion.div
          className="absolute inset-0 flex items-center justify-center bg-primary/10 backdrop-blur-sm pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="flex items-center gap-2 text-primary font-medium">
            {gestureHint.includes('Zoom In') && <ZoomIn className="w-6 h-6" />}
            {gestureHint.includes('Zoom Out') && <ZoomOut className="w-6 h-6" />}
            {gestureHint.includes('Back') && <ArrowLeft className="w-6 h-6" />}
            {gestureHint.includes('Forward') && <ArrowRight className="w-6 h-6" />}
            <span className="text-lg">{gestureHint}</span>
          </div>
        </motion.div>
      )}

      {/* Label */}
      <div className="absolute bottom-2 left-0 right-0 text-center text-xs text-muted-foreground pointer-events-none">
        {isActive ? 'Moving...' : 'Swipe ←→ for back/forward • Pinch to zoom'}
      </div>
    </motion.div>
  );
};
