import styles from './RichText.module.css';

export default function RichText({ children }: { children: React.ReactNode }) {
  return <article className={styles.richText}>{children}</article>;
}
