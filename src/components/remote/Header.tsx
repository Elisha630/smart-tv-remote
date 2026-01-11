import { Tv, Info, Power, Settings, Wifi } from 'lucide-react';
import { motion } from 'framer-motion';
import { Device } from '@/types/adb';

interface HeaderProps {
  device: Device | null;
  isConnected: boolean;
  onConnectionClick: () => void;
  onSetupClick: () => void;
  onSettingsClick: () => void;
  onPowerClick: () => void;
}

export const Header = ({
  device,
  isConnected,
  onConnectionClick,
  onSetupClick,
  onSettingsClick,
  onPowerClick,
}: HeaderProps) => {
  return (
    <header className="glass-panel px-4 py-3 flex items-center justify-between">
      {/* Logo & Connection Status */}
      <div className="flex items-center gap-3">
        <motion.div
          className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Wifi className="w-4 h-4 text-primary" />
        </motion.div>
        
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">
              {device ? device.name : 'Connect to a device...'}
            </span>
            <div className={`connection-dot ${isConnected ? 'connected' : 'disconnected'}`} />
          </div>
          {device && (
            <span className="text-xs text-muted-foreground">
              {device.ip}:{device.port}
            </span>
          )}
        </div>
      </div>

      {/* Action Icons */}
      <div className="flex items-center gap-1">
        <HeaderButton icon={Tv} onClick={onConnectionClick} tooltip="Connections" />
        <HeaderButton icon={Info} onClick={onSetupClick} tooltip="Setup Guide" />
        <HeaderButton 
          icon={Power} 
          onClick={onPowerClick} 
          tooltip="Power Off TV"
          variant="destructive"
          disabled={!isConnected}
        />
        <HeaderButton icon={Settings} onClick={onSettingsClick} tooltip="Shortcuts" />
      </div>
    </header>
  );
};

interface HeaderButtonProps {
  icon: React.ElementType;
  onClick: () => void;
  tooltip: string;
  variant?: 'default' | 'destructive';
  disabled?: boolean;
}

const HeaderButton = ({ 
  icon: Icon, 
  onClick, 
  tooltip, 
  variant = 'default',
  disabled = false,
}: HeaderButtonProps) => (
  <motion.button
    className={`p-2 rounded-lg transition-colors ${
      variant === 'destructive' 
        ? 'hover:bg-destructive/20 text-destructive disabled:text-destructive/40' 
        : 'hover:bg-secondary text-foreground'
    } disabled:opacity-50 disabled:cursor-not-allowed`}
    whileHover={disabled ? {} : { scale: 1.1 }}
    whileTap={disabled ? {} : { scale: 0.9 }}
    onClick={onClick}
    disabled={disabled}
    title={tooltip}
  >
    <Icon className="w-5 h-5" />
  </motion.button>
);
