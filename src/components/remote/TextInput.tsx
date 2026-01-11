import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Keyboard, Send, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface TextInputProps {
  onSendText: (text: string) => void;
  disabled?: boolean;
}

export const TextInput = ({ onSendText, disabled = false }: TextInputProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [text, setText] = useState('');

  const handleSend = useCallback(() => {
    if (text.trim()) {
      onSendText(text);
      setText('');
    }
  }, [text, onSendText]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    e.stopPropagation();
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  if (!isExpanded) {
    return (
      <motion.button
        className="glass-panel p-3 rounded-xl flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setIsExpanded(true)}
        disabled={disabled}
      >
        <Keyboard className="w-5 h-5" />
        <span className="text-sm">Type on TV</span>
      </motion.button>
    );
  }

  return (
    <motion.div
      className="glass-panel p-3 rounded-xl w-full max-w-md"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center gap-2">
        <Input
          type="text"
          placeholder="Type text to send to TV..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 bg-secondary/50 border-border/50"
          autoFocus
          disabled={disabled}
        />
        <Button
          size="icon"
          variant="default"
          onClick={handleSend}
          disabled={disabled || !text.trim()}
          className="shrink-0"
        >
          <Send className="w-4 h-4" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          onClick={() => {
            setIsExpanded(false);
            setText('');
          }}
          className="shrink-0"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
      <p className="text-xs text-muted-foreground mt-2">
        Press Enter to send • Use for search, passwords, etc.
      </p>
    </motion.div>
  );
};
