import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Settings, Plus, Trash2, RotateCcw, Keyboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RemoteShortcut } from '@/types/adb';

interface ShortcutsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  shortcuts: RemoteShortcut[];
  onAdd: (shortcut: Omit<RemoteShortcut, 'id'>) => void;
  onUpdate: (id: string, updates: Partial<RemoteShortcut>) => void;
  onRemove: (id: string) => void;
  onReset: () => void;
}

export const ShortcutsPanel = ({
  isOpen,
  onClose,
  shortcuts,
  onAdd,
  onUpdate,
  onRemove,
  onReset,
}: ShortcutsPanelProps) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newShortcut, setNewShortcut] = useState({
    name: '',
    key: '',
    command: '',
    icon: '📱',
  });

  const handleAdd = () => {
    if (newShortcut.name && newShortcut.command) {
      onAdd(newShortcut);
      setNewShortcut({ name: '', key: '', command: '', icon: '📱' });
      setIsAdding(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          
          {/* Panel */}
          <motion.div
            className="fixed inset-x-4 top-16 bottom-4 md:inset-auto md:top-16 md:right-4 md:w-96 md:max-h-[calc(100vh-5rem)]
                       glass-panel rounded-2xl z-50 flex flex-col overflow-hidden"
            initial={{ opacity: 0, x: 20, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.95 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border/30">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Settings className="w-5 h-5 text-primary" />
                Shortcuts
              </h2>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onReset}
                  className="rounded-full"
                  title="Reset to defaults"
                >
                  <RotateCcw className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="rounded-full"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-4 space-y-4">
              {/* Add Button */}
              {!isAdding ? (
                <Button
                  variant="secondary"
                  className="w-full gap-2"
                  onClick={() => setIsAdding(true)}
                >
                  <Plus className="w-4 h-4" />
                  Add Shortcut
                </Button>
              ) : (
                <motion.div
                  className="p-4 rounded-xl bg-secondary/30 border border-border/30 space-y-3"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                >
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      placeholder="Name"
                      value={newShortcut.name}
                      onChange={(e) => setNewShortcut({ ...newShortcut, name: e.target.value })}
                      className="bg-background/50"
                    />
                    <Input
                      placeholder="Icon (emoji)"
                      value={newShortcut.icon}
                      onChange={(e) => setNewShortcut({ ...newShortcut, icon: e.target.value })}
                      className="bg-background/50"
                    />
                  </div>
                  <Input
                    placeholder="Package name (e.g., com.netflix.ninja)"
                    value={newShortcut.command}
                    onChange={(e) => setNewShortcut({ ...newShortcut, command: e.target.value })}
                    className="bg-background/50"
                  />
                  <Input
                    placeholder="Keyboard shortcut (e.g., n)"
                    value={newShortcut.key}
                    onChange={(e) => setNewShortcut({ ...newShortcut, key: e.target.value.slice(0, 1) })}
                    className="bg-background/50"
                    maxLength={1}
                  />
                  <div className="flex gap-2">
                    <Button variant="ghost" onClick={() => setIsAdding(false)} className="flex-1">
                      Cancel
                    </Button>
                    <Button onClick={handleAdd} className="flex-1">
                      Add
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* Shortcuts List */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Keyboard className="w-4 h-4" />
                  Configured Shortcuts
                </h3>
                
                {shortcuts.map((shortcut) => (
                  <ShortcutCard
                    key={shortcut.id}
                    shortcut={shortcut}
                    onRemove={() => onRemove(shortcut.id)}
                  />
                ))}

                {shortcuts.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No shortcuts configured
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

interface ShortcutCardProps {
  shortcut: RemoteShortcut;
  onRemove: () => void;
}

const ShortcutCard = ({ shortcut, onRemove }: ShortcutCardProps) => (
  <motion.div
    className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30 border border-border/30"
    initial={{ opacity: 0, x: -10 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: 10 }}
    layout
  >
    <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center text-lg">
      {shortcut.icon}
    </div>
    <div className="flex-1 min-w-0">
      <div className="font-medium text-sm">{shortcut.name}</div>
      <div className="text-xs text-muted-foreground truncate">{shortcut.command}</div>
    </div>
    {shortcut.key && (
      <div className="px-2 py-1 rounded bg-primary/20 text-primary text-xs font-mono">
        {shortcut.key.toUpperCase()}
      </div>
    )}
    <Button
      variant="ghost"
      size="icon"
      onClick={onRemove}
      className="text-destructive hover:bg-destructive/20"
    >
      <Trash2 className="w-4 h-4" />
    </Button>
  </motion.div>
);
