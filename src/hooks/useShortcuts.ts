import { useState, useEffect, useCallback } from 'react';
import { RemoteShortcut } from '@/types/adb';

const DEFAULT_SHORTCUTS: RemoteShortcut[] = [
  { 
    id: '1', 
    name: 'Netflix', 
    key: 'n', 
    command: 'com.netflix.ninja', 
    icon: 'https://upload.wikimedia.org/wikipedia/commons/0/0c/Netflix_2015_N_logo.svg' 
  },
  { 
    id: '2', 
    name: 'YouTube', 
    key: 'y', 
    command: 'com.google.android.youtube.tv', 
    icon: 'https://upload.wikimedia.org/wikipedia/commons/0/09/YouTube_full-color_icon_%282017%29.svg' 
  },
  { 
    id: '3', 
    name: 'Prime Video', 
    key: 'p', 
    command: 'com.amazon.amazonvideo.livingroom', 
    icon: 'https://upload.wikimedia.org/wikipedia/commons/1/11/Amazon_Prime_Video_logo.svg' 
  },
  { 
    id: '4', 
    name: 'Plex', 
    key: 'x', 
    command: 'com.plexapp.android', 
    icon: 'https://www.vectorlogo.zone/logos/plex/plex-icon.svg' 
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
