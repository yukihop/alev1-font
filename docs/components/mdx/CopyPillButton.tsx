import type { FC } from 'react';
import { useRef, useState } from 'react';

type CopyPillButtonProps = {
  className: string;
  copyId: string;
  copyValue: string;
  text: string;
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

const CopyPillButton: FC<CopyPillButtonProps> = props => {
  const { className, copyId, copyValue, text, onCopy } = props;

  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        void onCopy(copyId, copyValue);
      }}
    >
      {text}
    </button>
  );
};

export default CopyPillButton;
