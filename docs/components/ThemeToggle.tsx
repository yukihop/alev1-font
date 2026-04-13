'use client';

import { useEffect, useState } from 'react';

import styles from './ThemeToggle.module.css';

const themeKey = 'alev-docs-theme';

export default function ThemeToggle() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    const currentTheme = document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
    setTheme(currentTheme);
  }, []);

  return (
    <button
      className={styles.button}
      type="button"
      aria-label="Toggle theme"
      onClick={() => {
        const nextTheme = theme === 'light' ? 'dark' : 'light';
        document.documentElement.dataset.theme = nextTheme;
        localStorage.setItem(themeKey, nextTheme);
        setTheme(nextTheme);
      }}
    >
      <span>{theme === 'dark' ? 'Dark' : 'Light'}</span>
    </button>
  );
}
