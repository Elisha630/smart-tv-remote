import { motion } from 'framer-motion';
import { Home, ArrowLeft, Menu, LayoutGrid, Tv } from 'lucide-react';
import { KeyCode } from '@/types/adb';

interface NavigationButtonsProps {
  onKey: (keyCode: KeyCode) => void;
  onAppsClick: () => void;
  onMenuClick: () => void;
  disabled?: boolean;
}

export const NavigationButtons = ({ 
  onKey, 
  onAppsClick, 
  onMenuClick,
  disabled 
}: NavigationButtonsProps) => {
  return (
    <div className="flex items-center justify-center gap-4">
      {/* Back */}
      <NavButton
        icon={ArrowLeft}
        label="Back"
        onClick={() => onKey('KEYCODE_BACK')}
        disabled={disabled}
      />
      
      {/* Home */}
      <NavButton
        icon={Home}
        label="Home"
        onClick={() => onKey('KEYCODE_HOME')}
        disabled={disabled}
        primary
      />
      
      {/* Apps/Recents */}
      <NavButton
        icon={LayoutGrid}
        label="Apps"
        onClick={onAppsClick}
        disabled={disabled}
        accent
      />
      
      {/* Menu/Input */}
      <NavButton
        icon={Menu}
        label="Menu"
        onClick={onMenuClick}
        disabled={disabled}
      />
    </div>
  );
};

interface NavButtonProps {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  primary?: boolean;
  accent?: boolean;
}

const NavButton = ({ 
  icon: Icon, 
  label, 
  onClick, 
  disabled,
  primary,
  accent,
}: NavButtonProps) => (
  <div className="flex flex-col items-center gap-1">
    <motion.button
      className={`remote-button w-12 h-12 
        ${primary ? 'remote-button-primary' : ''} 
        ${accent ? 'remote-button-accent' : ''}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      whileHover={disabled ? {} : { scale: 1.1 }}
      whileTap={disabled ? {} : { scale: 0.9 }}
      onClick={onClick}
      disabled={disabled}
    >
      <Icon className="w-5 h-5" />
    </motion.button>
    <span className="text-xs text-muted-foreground">{label}</span>
  </div>
);
