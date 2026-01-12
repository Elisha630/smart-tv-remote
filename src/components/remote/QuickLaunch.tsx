import { motion } from 'framer-motion';
import { RemoteShortcut } from '@/types/adb';

interface QuickLaunchProps {
  shortcuts: RemoteShortcut[];
  onLaunch: (command: string) => void;
  disabled?: boolean;
}

export const QuickLaunch = ({ shortcuts, onLaunch, disabled }: QuickLaunchProps) => {
  if (shortcuts.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      {shortcuts.map((shortcut) => (
        <motion.button
          key={shortcut.id}
          className={`flex flex-col items-center gap-1 group
                      transition-all ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          whileHover={disabled ? {} : { scale: 1.1 }}
          whileTap={disabled ? {} : { scale: 0.95 }}
          onClick={() => onLaunch(shortcut.command)}
          disabled={disabled}
        >
          <div className="w-12 h-12 rounded-xl bg-secondary/30 flex items-center justify-center p-2 
                        border border-border/30 group-hover:border-primary/50 group-hover:bg-secondary/50 overflow-hidden">
            {shortcut.icon && shortcut.icon.startsWith('http') ? (
              <img src={shortcut.icon} alt={shortcut.name} className="w-full h-full object-contain" />
            ) : (
              <span className="text-2xl">{shortcut.icon || '📱'}</span>
            )}
          </div>
          <span className="text-[10px] font-medium text-muted-foreground group-hover:text-foreground">
            {shortcut.name}
          </span>
        </motion.button>
      ))}
    </div>
  );
};
