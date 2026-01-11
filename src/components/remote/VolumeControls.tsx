import { motion } from 'framer-motion';
import { Volume2, VolumeX, Volume1, ChevronUp, ChevronDown } from 'lucide-react';
import { KeyCode } from '@/types/adb';
import { useState } from 'react';

interface VolumeControlsProps {
  onKey: (keyCode: KeyCode) => void;
  disabled?: boolean;
}

export const VolumeControls = ({ onKey, disabled }: VolumeControlsProps) => {
  const [isMuted, setIsMuted] = useState(false);

  const handleMute = () => {
    if (disabled) return;
    setIsMuted(!isMuted);
    onKey('KEYCODE_VOLUME_MUTE');
  };

  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-xs text-muted-foreground mb-1">Volume</span>
      <motion.button
        className={`remote-button w-10 h-10 ${disabled ? 'opacity-50' : ''}`}
        whileHover={disabled ? {} : { scale: 1.1 }}
        whileTap={disabled ? {} : { scale: 0.9 }}
        onClick={() => onKey('KEYCODE_VOLUME_UP')}
        disabled={disabled}
      >
        <ChevronUp className="w-5 h-5" />
      </motion.button>
      
      <motion.button
        className={`remote-button w-12 h-12 ${
          isMuted ? 'remote-button-destructive' : ''
        } ${disabled ? 'opacity-50' : ''}`}
        whileHover={disabled ? {} : { scale: 1.1 }}
        whileTap={disabled ? {} : { scale: 0.9 }}
        onClick={handleMute}
        disabled={disabled}
      >
        {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
      </motion.button>
      
      <motion.button
        className={`remote-button w-10 h-10 ${disabled ? 'opacity-50' : ''}`}
        whileHover={disabled ? {} : { scale: 1.1 }}
        whileTap={disabled ? {} : { scale: 0.9 }}
        onClick={() => onKey('KEYCODE_VOLUME_DOWN')}
        disabled={disabled}
      >
        <ChevronDown className="w-5 h-5" />
      </motion.button>
    </div>
  );
};
