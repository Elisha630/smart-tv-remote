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
    <div className="flex flex-wrap items-center justify-center gap-2">
      {shortcuts.map((shortcut) => (
        <motion.button
          key={shortcut.id}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl
                      bg-secondary/50 border border-border/30 hover:border-primary/50
                      transition-colors ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          whileHover={disabled ? {} : { scale: 1.05 }}
          whileTap={disabled ? {} : { scale: 0.95 }}
          onClick={() => onLaunch(shortcut.command)}
          disabled={disabled}
        >
          <span className="text-lg">{shortcut.icon}</span>
          <span className="text-sm font-medium">{shortcut.name}</span>
          {shortcut.key && (
            <span className="text-xs text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">
              {shortcut.key.toUpperCase()}
            </span>
          )}
        </motion.button>
      ))}
    </div>
  );
};
