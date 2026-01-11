import { motion } from 'framer-motion';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { KeyCode } from '@/types/adb';

interface ChannelControlsProps {
  onKey: (keyCode: KeyCode) => void;
  disabled?: boolean;
}

export const ChannelControls = ({ onKey, disabled }: ChannelControlsProps) => {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-xs text-muted-foreground mb-1">Channel</span>
      <motion.button
        className={`remote-button w-10 h-10 ${disabled ? 'opacity-50' : ''}`}
        whileHover={disabled ? {} : { scale: 1.1 }}
        whileTap={disabled ? {} : { scale: 0.9 }}
        onClick={() => onKey('KEYCODE_CHANNEL_UP')}
        disabled={disabled}
      >
        <ChevronUp className="w-5 h-5" />
      </motion.button>
      
      <div className="w-12 h-12 rounded-xl bg-secondary/30 flex items-center justify-center">
        <span className="text-sm font-bold text-muted-foreground">CH</span>
      </div>
      
      <motion.button
        className={`remote-button w-10 h-10 ${disabled ? 'opacity-50' : ''}`}
        whileHover={disabled ? {} : { scale: 1.1 }}
        whileTap={disabled ? {} : { scale: 0.9 }}
        onClick={() => onKey('KEYCODE_CHANNEL_DOWN')}
        disabled={disabled}
      >
        <ChevronDown className="w-5 h-5" />
      </motion.button>
    </div>
  );
};
