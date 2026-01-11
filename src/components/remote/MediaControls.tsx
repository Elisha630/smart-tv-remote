import { motion } from 'framer-motion';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Rewind, 
  FastForward,
  Square
} from 'lucide-react';
import { KeyCode } from '@/types/adb';
import { useState } from 'react';

interface MediaControlsProps {
  onKey: (keyCode: KeyCode) => void;
  disabled?: boolean;
}

export const MediaControls = ({ onKey, disabled }: MediaControlsProps) => {
  const [isPlaying, setIsPlaying] = useState(true);

  const handlePlayPause = () => {
    if (disabled) return;
    setIsPlaying(!isPlaying);
    onKey('KEYCODE_MEDIA_PLAY_PAUSE');
  };

  return (
    <div className="flex items-center justify-center gap-2">
      <MediaButton
        icon={SkipBack}
        onClick={() => onKey('KEYCODE_MEDIA_PREVIOUS')}
        disabled={disabled}
        size="sm"
      />
      <MediaButton
        icon={Rewind}
        onClick={() => onKey('KEYCODE_MEDIA_REWIND')}
        disabled={disabled}
        size="sm"
      />
      <MediaButton
        icon={isPlaying ? Pause : Play}
        onClick={handlePlayPause}
        disabled={disabled}
        size="lg"
        primary
      />
      <MediaButton
        icon={FastForward}
        onClick={() => onKey('KEYCODE_MEDIA_FAST_FORWARD')}
        disabled={disabled}
        size="sm"
      />
      <MediaButton
        icon={SkipForward}
        onClick={() => onKey('KEYCODE_MEDIA_NEXT')}
        disabled={disabled}
        size="sm"
      />
    </div>
  );
};

interface MediaButtonProps {
  icon: React.ElementType;
  onClick: () => void;
  disabled?: boolean;
  size?: 'sm' | 'lg';
  primary?: boolean;
}

const MediaButton = ({ 
  icon: Icon, 
  onClick, 
  disabled, 
  size = 'sm',
  primary = false,
}: MediaButtonProps) => (
  <motion.button
    className={`remote-button ${
      size === 'lg' ? 'w-14 h-14' : 'w-10 h-10'
    } ${
      primary ? 'remote-button-primary' : ''
    } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    whileHover={disabled ? {} : { scale: 1.1 }}
    whileTap={disabled ? {} : { scale: 0.9 }}
    onClick={onClick}
    disabled={disabled}
  >
    <Icon className={size === 'lg' ? 'w-6 h-6' : 'w-5 h-5'} />
  </motion.button>
);
