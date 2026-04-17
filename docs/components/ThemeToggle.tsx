'use client';

import type { FC } from 'react';
import { useEffect, useId, useRef, useState } from 'react';

import alevTextStyles from '@/components/mdx/AlevText.module.css';

import styles from './ThemeToggle.module.css';

const themeKey = 'alev-docs-theme';
type Theme = 'dark' | 'light';

const ThemeToggle: FC = () => {
  const [theme, setTheme] = useState<Theme>('dark');
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const switchId = useId();

  useEffect(() => {
    const currentTheme: Theme =
      document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
    setTheme(currentTheme);
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (!target || rootRef.current?.contains(target)) {
        return;
      }

      setOpen(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const applyTheme = (nextTheme: Theme) => {
    document.documentElement.dataset.theme = nextTheme;
    localStorage.setItem(themeKey, nextTheme);
    setTheme(nextTheme);
  };

  const lightMode = theme === 'light';

  return (
    <div ref={rootRef} className={styles.root}>
      <button
        className={styles.trigger}
        type="button"
        aria-label="Open theme settings"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => {
          setOpen((current) => !current);
        }}
      >
        <span className={`${styles.triggerText} ${alevTextStyles.glyphText}`}>
          :visualize:
        </span>
      </button>

      {open ? (
        <div className={styles.popover} role="dialog" aria-label="Theme settings">
          <div className={styles.popoverHeader}>
            <span className={styles.popoverTitle}>Theme</span>
          </div>
          <label className={styles.switchRow} htmlFor={switchId}>
            <span className={styles.switchLabel}>Dark</span>
            <span className={styles.switchWrap}>
              <input
                id={switchId}
                className={styles.switchInput}
                type="checkbox"
                role="switch"
                aria-label="Toggle light and dark theme"
                checked={lightMode}
                onChange={(event) => {
                  applyTheme(event.target.checked ? 'light' : 'dark');
                }}
              />
              <span className={styles.switchTrack} aria-hidden="true">
                <span className={styles.switchThumb} />
              </span>
            </span>
            <span className={styles.switchLabel}>Light</span>
          </label>
        </div>
      ) : null}
    </div>
  );
};

export default ThemeToggle;
