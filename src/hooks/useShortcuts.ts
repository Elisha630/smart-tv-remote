import { useState, useEffect, useCallback } from 'react';
import { RemoteShortcut } from '@/types/adb';

const DEFAULT_SHORTCUTS: RemoteShortcut[] = [
  { 
    id: '1', 
    name: 'Netflix', 
    key: 'n', 
    command: 'com.netflix.ninja', 
    icon: '🔴' // Netflix red
  },
  { 
    id: '2', 
    name: 'YouTube', 
    key: 'y', 
    command: 'com.google.android.youtube.tv', 
    icon: '▶️' // YouTube play
  },
  { 
    id: '3', 
    name: 'Prime', 
    key: 'p', 
    command: 'com.amazon.amazonvideo.livingroom', 
    icon: '📺' // Prime Video
  },
  { 
    id: '4', 
    name: 'Plex', 
    key: 'x', 
    command: 'com.plexapp.android', 
    icon: '🎬' // Plex
  },
];

const STORAGE_KEY = 'tv_remote_shortcuts';

export const useShortcuts = () => {
  const [shortcuts, setShortcuts] = useState<RemoteShortcut[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setShortcuts(JSON.parse(stored));
      } catch {
        setShortcuts(DEFAULT_SHORTCUTS);
      }
    } else {
      setShortcuts(DEFAULT_SHORTCUTS);
    }
  }, []);

  const saveShortcuts = useCallback((newShortcuts: RemoteShortcut[]) => {
    setShortcuts(newShortcuts);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newShortcuts));
  }, []);

  const addShortcut = useCallback((shortcut: Omit<RemoteShortcut, 'id'>) => {
    const newShortcut = {
      ...shortcut,
      id: Date.now().toString(),
    };
    saveShortcuts([...shortcuts, newShortcut]);
  }, [shortcuts, saveShortcuts]);

  const updateShortcut = useCallback((id: string, updates: Partial<RemoteShortcut>) => {
    saveShortcuts(shortcuts.map(s => s.id === id ? { ...s, ...updates } : s));
  }, [shortcuts, saveShortcuts]);

  const removeShortcut = useCallback((id: string) => {
    saveShortcuts(shortcuts.filter(s => s.id !== id));
  }, [shortcuts, saveShortcuts]);

  const resetToDefaults = useCallback(() => {
    saveShortcuts(DEFAULT_SHORTCUTS);
  }, [saveShortcuts]);

  return {
    shortcuts,
    addShortcut,
    updateShortcut,
    removeShortcut,
    resetToDefaults,
  };
};
