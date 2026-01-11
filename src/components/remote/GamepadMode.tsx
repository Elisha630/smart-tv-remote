import { useState, useCallback, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Gamepad2 } from 'lucide-react';
import { KeyCode } from '@/types/adb';

interface GamepadModeProps {
  onKey: (keyCode: KeyCode) => void;
  onMove: (position: { x: number; y: number }) => void;
  onTap: () => void;
  disabled?: boolean;
}

export const GamepadMode = ({ onKey, onMove, onTap, disabled = false }: GamepadModeProps) => {
  const [isActive, setIsActive] = useState(false);

  if (!isActive) {
    return (
      <motion.button
        className="remote-button p-3 flex items-center gap-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsActive(true)}
        disabled={disabled}
      >
        <Gamepad2 className="w-5 h-5" />
        <span className="text-sm">Gamepad</span>
      </motion.button>
    );
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border/30">
        <div className="flex items-center gap-2">
          <Gamepad2 className="w-5 h-5 text-purple-400" />
          <span className="font-semibold">Gamepad Mode</span>
        </div>
        <motion.button
          className="px-4 py-2 rounded-lg bg-secondary hover:bg-secondary/80 text-sm"
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsActive(false)}
        >
          Exit Gamepad
        </motion.button>
      </div>

      {/* Gamepad Layout */}
      <div className="flex-1 flex items-center justify-between p-6">
        {/* Left Joystick */}
        <div className="flex flex-col items-center gap-4">
          <VirtualJoystick
            onMove={(dx, dy) => onMove({ x: dx * 3, y: dy * 3 })}
            onTap={onTap}
            disabled={disabled}
            label="Move"
          />
          {/* L1/L2 Buttons */}
          <div className="flex gap-2">
            <GameButton label="L1" onClick={() => onKey('KEYCODE_MEDIA_PREVIOUS')} disabled={disabled} />
            <GameButton label="L2" onClick={() => onKey('KEYCODE_MEDIA_REWIND')} disabled={disabled} />
          </div>
        </div>

        {/* Center Area */}
        <div className="flex flex-col items-center gap-4">
          {/* Top buttons */}
          <div className="flex gap-4">
            <GameButton label="SELECT" onClick={() => onKey('KEYCODE_BACK')} disabled={disabled} small />
            <GameButton label="HOME" onClick={() => onKey('KEYCODE_HOME')} disabled={disabled} small />
            <GameButton label="START" onClick={() => onKey('KEYCODE_MENU')} disabled={disabled} small />
          </div>
          
          {/* Logo */}
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500/30 to-blue-500/30 flex items-center justify-center">
            <Gamepad2 className="w-8 h-8 text-purple-400" />
          </div>
        </div>

        {/* Right - Action Buttons */}
        <div className="flex flex-col items-center gap-4">
          {/* ABXY Layout */}
          <div className="relative w-32 h-32">
            {/* Y - Top */}
            <motion.button
              className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-yellow-500/30 border border-yellow-500/50 text-yellow-400 font-bold"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => onKey('KEYCODE_DPAD_UP')}
              disabled={disabled}
            >
              Y
            </motion.button>
            {/* X - Left */}
            <motion.button
              className="absolute left-0 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-blue-500/30 border border-blue-500/50 text-blue-400 font-bold"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => onKey('KEYCODE_DPAD_LEFT')}
              disabled={disabled}
            >
              X
            </motion.button>
            {/* B - Right */}
            <motion.button
              className="absolute right-0 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-red-500/30 border border-red-500/50 text-red-400 font-bold"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => onKey('KEYCODE_BACK')}
              disabled={disabled}
            >
              B
            </motion.button>
            {/* A - Bottom */}
            <motion.button
              className="absolute bottom-0 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-green-500/30 border border-green-500/50 text-green-400 font-bold"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => onKey('KEYCODE_DPAD_CENTER')}
              disabled={disabled}
            >
              A
            </motion.button>
          </div>
          
          {/* R1/R2 Buttons */}
          <div className="flex gap-2">
            <GameButton label="R1" onClick={() => onKey('KEYCODE_MEDIA_NEXT')} disabled={disabled} />
            <GameButton label="R2" onClick={() => onKey('KEYCODE_MEDIA_FAST_FORWARD')} disabled={disabled} />
          </div>
        </div>
      </div>

      {/* Footer hint */}
      <div className="p-4 text-center text-xs text-muted-foreground">
        Use the virtual joystick to navigate • A = Select • B = Back • Tap joystick to click
      </div>
    </motion.div>
  );
};

// Virtual Joystick Component
interface VirtualJoystickProps {
  onMove: (dx: number, dy: number) => void;
  onTap: () => void;
  disabled?: boolean;
  label?: string;
}

const VirtualJoystick = ({ onMove, onTap, disabled, label }: VirtualJoystickProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isActive, setIsActive] = useState(false);
  const lastMoveRef = useRef<NodeJS.Timeout>();

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (disabled) return;
    e.preventDefault();
    setIsActive(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [disabled]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isActive || disabled || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    let dx = e.clientX - centerX;
    let dy = e.clientY - centerY;
    
    // Limit to circle
    const distance = Math.sqrt(dx * dx + dy * dy);
    const maxDistance = rect.width / 2 - 20;
    
    if (distance > maxDistance) {
      dx = (dx / distance) * maxDistance;
      dy = (dy / distance) * maxDistance;
    }
    
    setPosition({ x: dx, y: dy });
    
    // Send movement (throttled)
    if (lastMoveRef.current) clearTimeout(lastMoveRef.current);
    lastMoveRef.current = setTimeout(() => {
      onMove(dx / 10, dy / 10);
    }, 16);
  }, [isActive, disabled, onMove]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (disabled) return;
    
    // Check for tap (small movement)
    if (Math.abs(position.x) < 5 && Math.abs(position.y) < 5) {
      onTap();
    }
    
    setIsActive(false);
    setPosition({ x: 0, y: 0 });
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  }, [disabled, position, onTap]);

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        ref={containerRef}
        className={`relative w-32 h-32 rounded-full bg-secondary/50 border-2 border-border/50 ${
          disabled ? 'opacity-50' : ''
        }`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        {/* Outer ring */}
        <div className="absolute inset-2 rounded-full border border-border/30" />
        
        {/* Stick */}
        <motion.div
          className="absolute w-12 h-12 rounded-full bg-gradient-to-br from-primary/60 to-primary/30 border border-primary/50 shadow-lg"
          style={{
            left: '50%',
            top: '50%',
            x: position.x - 24,
            y: position.y - 24,
          }}
          animate={{
            scale: isActive ? 0.9 : 1,
          }}
        />
      </div>
      {label && <span className="text-xs text-muted-foreground">{label}</span>}
    </div>
  );
};

// Game Button Component
interface GameButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  small?: boolean;
}

const GameButton = ({ label, onClick, disabled, small }: GameButtonProps) => (
  <motion.button
    className={`${small ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm'} rounded-lg bg-secondary/70 border border-border/50 font-medium hover:bg-secondary`}
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.9 }}
    onClick={onClick}
    disabled={disabled}
  >
    {label}
  </motion.button>
);
