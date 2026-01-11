import { useRef, useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MousePointer2 } from 'lucide-react';
import { TrackpadPosition } from '@/types/adb';

interface TrackpadProps {
  onMove: (position: TrackpadPosition) => void;
  onTap: () => void;
  onScroll: (deltaY: number) => void;
  disabled?: boolean;
}

export const Trackpad = ({ onMove, onTap, onScroll, disabled }: TrackpadProps) => {
  const trackpadRef = useRef<HTMLDivElement>(null);
  const [isActive, setIsActive] = useState(false);
  const [cursorPos, setCursorPos] = useState({ x: 50, y: 50 });
  const lastPosRef = useRef({ x: 0, y: 0 });
  const isTrackingRef = useRef(false);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (disabled) return;
    e.preventDefault();
    setIsActive(true);
    isTrackingRef.current = true;
    lastPosRef.current = { x: e.clientX, y: e.clientY };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [disabled]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isTrackingRef.current || disabled) return;
    
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
  }, [onMove, disabled]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (disabled) return;
    setIsActive(false);
    isTrackingRef.current = false;
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  }, [disabled]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    if (disabled) return;
    // Double-tap detection could be added here
    if (e.detail === 1) {
      onTap();
    }
  }, [onTap, disabled]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (disabled) return;
    e.preventDefault();
    onScroll(e.deltaY);
  }, [onScroll, disabled]);

  return (
    <motion.div
      ref={trackpadRef}
      className={`trackpad relative w-full aspect-[4/3] select-none ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      }`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
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

      {/* Label */}
      <div className="absolute bottom-2 left-0 right-0 text-center text-xs text-muted-foreground pointer-events-none">
        {isActive ? 'Moving...' : 'Trackpad - Click to tap'}
      </div>
    </motion.div>
  );
};
