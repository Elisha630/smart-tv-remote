import { motion } from 'framer-motion';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Circle } from 'lucide-react';
import { KeyCode } from '@/types/adb';

interface DPadProps {
  onKey: (keyCode: KeyCode) => void;
  disabled?: boolean;
}

export const DPad = ({ onKey, disabled }: DPadProps) => {
  const handlePress = (keyCode: KeyCode) => {
    if (disabled) return;
    onKey(keyCode);
  };

  return (
    <div className="relative w-40 h-40">
      {/* Background circle */}
      <div className="absolute inset-0 rounded-full bg-secondary/50 border border-border/50" />

      {/* Up */}
      <DPadButton
        direction="up"
        icon={ChevronUp}
        onPress={() => handlePress('KEYCODE_DPAD_UP')}
        disabled={disabled}
        className="absolute top-0 left-1/2 -translate-x-1/2"
      />

      {/* Down */}
      <DPadButton
        direction="down"
        icon={ChevronDown}
        onPress={() => handlePress('KEYCODE_DPAD_DOWN')}
        disabled={disabled}
        className="absolute bottom-0 left-1/2 -translate-x-1/2"
      />

      {/* Left */}
      <DPadButton
        direction="left"
        icon={ChevronLeft}
        onPress={() => handlePress('KEYCODE_DPAD_LEFT')}
        disabled={disabled}
        className="absolute left-0 top-1/2 -translate-y-1/2"
      />

      {/* Right */}
      <DPadButton
        direction="right"
        icon={ChevronRight}
        onPress={() => handlePress('KEYCODE_DPAD_RIGHT')}
        disabled={disabled}
        className="absolute right-0 top-1/2 -translate-y-1/2"
      />

      {/* Center - OK/Select */}
      <motion.button
        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 
                    w-14 h-14 rounded-full bg-primary/20 border-2 border-primary/50
                    flex items-center justify-center text-primary font-semibold
                    hover:bg-primary/30 transition-colors
                    ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        whileHover={disabled ? {} : { scale: 1.05 }}
        whileTap={disabled ? {} : { scale: 0.9 }}
        onClick={() => handlePress('KEYCODE_DPAD_CENTER')}
        disabled={disabled}
      >
        OK
      </motion.button>
    </div>
  );
};

interface DPadButtonProps {
  direction: 'up' | 'down' | 'left' | 'right';
  icon: React.ElementType;
  onPress: () => void;
  disabled?: boolean;
  className?: string;
}

const DPadButton = ({ 
  direction, 
  icon: Icon, 
  onPress, 
  disabled, 
  className 
}: DPadButtonProps) => {
  const isVertical = direction === 'up' || direction === 'down';
  
  return (
    <motion.button
      className={`dpad-button ${isVertical ? 'w-12 h-10' : 'w-10 h-12'} 
                  ${disabled ? 'opacity-50 cursor-not-allowed' : ''} 
                  ${className}`}
      whileHover={disabled ? {} : { scale: 1.1 }}
      whileTap={disabled ? {} : { scale: 0.8 }}
      onClick={onPress}
      disabled={disabled}
    >
      <Icon className="w-6 h-6 text-foreground/80" />
    </motion.button>
  );
};
