import { useEffect, useState, useCallback } from 'react';

const STORAGE_KEY = 'theme'; // 'light' | 'dark'

function detectPreferred() {
  if (typeof window === 'undefined') return 'dark';
  const mq = window.matchMedia?.('(prefers-color-scheme: light)');
  return mq?.matches ? 'light' : 'dark';
}

export function useTheme() {
  const [theme, setTheme] = useState(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    return (saved === 'light' || saved === 'dark') ? saved : detectPreferred();
  });

  useEffect(() => {
    const el = document.documentElement;
    if (theme === 'light') el.classList.add('theme-light');
    else el.classList.remove('theme-light');
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const toggle = useCallback(() => {
    setTheme(t => (t === 'light' ? 'dark' : 'light'));
  }, []);

  return { theme, toggle };
}
