import { motion } from 'framer-motion';
import { RemoteShortcut } from '@/types/adb';
import { BRAND_ICONS } from '@/components/icons/BrandIcons';

interface QuickLaunchProps {
  shortcuts: RemoteShortcut[];
  onLaunch: (command: string) => void;
  disabled?: boolean;
}

export const QuickLaunch = ({ shortcuts, onLaunch, disabled }: QuickLaunchProps) => {
  if (shortcuts.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      {shortcuts.map((shortcut) => {
        const BrandIcon = BRAND_ICONS[shortcut.command];
        
        return (
          <motion.button
            key={shortcut.id}
            className={`flex flex-col items-center gap-1 group
                        transition-all ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            whileHover={disabled ? {} : { scale: 1.1 }}
            whileTap={disabled ? {} : { scale: 0.95 }}
            onClick={() => onLaunch(shortcut.command)}
            disabled={disabled}
          >
            <div className="w-12 h-12 rounded-xl overflow-hidden">
              {BrandIcon ? (
                <BrandIcon />
              ) : shortcut.icon && shortcut.icon.startsWith('http') ? (
                <div className="w-full h-full bg-secondary/30 flex items-center justify-center p-2 border border-border/30 group-hover:border-primary/50">
                  <img src={shortcut.icon} alt={shortcut.name} className="w-full h-full object-contain" />
                </div>
              ) : (
                <div className="w-full h-full bg-secondary/30 flex items-center justify-center border border-border/30 group-hover:border-primary/50">
                  <span className="text-2xl">{shortcut.icon || '📱'}</span>
                </div>
              )}
            </div>
            <span className="text-[10px] font-medium text-muted-foreground group-hover:text-foreground">
              {shortcut.name}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
};
