import type { FC } from 'react';
import { useRef, useState } from 'react';

import styles from './Glyphs.module.css';

type CopyPillButtonProps = {
  className: string;
  copyId: string;
  copyValue: string;
  text: string;
  copied: boolean;
  onCopy: (copyId: string, copyValue: string) => void;
};

export const useCopyFeedback = () => {
  const timerRef = useRef<number | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyText = async (copyId: string, copyValue: string) => {
    try {
      await navigator.clipboard.writeText(copyValue);
      setCopiedId(copyId);
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
      timerRef.current = window.setTimeout(() => {
        setCopiedId(current => (current === copyId ? null : current));
      }, 1200);
    } catch {
      setCopiedId(null);
    }
  };

  return {
    copiedId,
    copyText,
  };
};

export const CopyIcon: FC<{ className?: string }> = ({ className }) => (
  <svg
    viewBox="0 0 16 16"
    aria-hidden="true"
    className={className ?? styles.copyPillIcon}
    fill="none"
    stroke="currentColor"
    strokeWidth="1.4"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="5" y="3" width="8" height="10" rx="1.8" />
    <path d="M3.5 10.5H3A1.5 1.5 0 0 1 1.5 9V4A1.5 1.5 0 0 1 3 2.5h5" />
  </svg>
);

export const CheckIcon: FC<{ className?: string }> = ({ className }) => (
  <svg
    viewBox="0 0 16 16"
    aria-hidden="true"
    className={
      className ?? `${styles.copyPillIcon} ${styles.copyPillIconCopied}`
    }
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M3.5 8.5 6.4 11.4 12.5 5.3" />
  </svg>
);

const CopyPillButton: FC<CopyPillButtonProps> = props => {
  const { className, copyId, copyValue, text, copied, onCopy } = props;

  return (
    <button
      type="button"
      className={className}
      aria-label={`Copy ${text}`}
      onClick={() => {
        void onCopy(copyId, copyValue);
      }}
    >
      <span className={styles.copyPillContent}>
        <span>{text}</span>
        {copied ? <CheckIcon /> : <CopyIcon />}
      </span>
    </button>
  );
};

export default CopyPillButton;
