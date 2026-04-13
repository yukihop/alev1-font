'use client';

import type { FC } from 'react';
import { useEffect, useState } from 'react';

import styles from './ThemeToggle.module.css';

const themeKey = 'alev-docs-theme';
type Theme = 'dark' | 'light';

const ThemeToggle: FC = () => {
  const [theme, setTheme] = useState<Theme>('dark');

  useEffect(() => {
    const currentTheme: Theme = document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
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
};

export default ThemeToggle;
