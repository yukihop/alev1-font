import type { FC, ReactNode } from "react";
import Link from "next/link";

import type { ArticleEntry } from "@/lib/articles";

import styles from "./DocsShell.module.css";
import ThemeToggle from "./ThemeToggle";

type DocsShellProps = {
  current: ArticleEntry;
  entries: ArticleEntry[];
  children: ReactNode;
  prev?: ArticleEntry | null;
  next?: ArticleEntry | null;
};

const DocsShell: FC<DocsShellProps> = (props) => {
  const { current, entries, children, prev, next } = props;
  const heading = current.heading ?? current.title;

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarInner}>
          <Link className={styles.brand} href="/">
            <span className={styles.brandMark}>ALEV-1</span>
          </Link>
          <nav className={styles.nav} aria-label="Documentation">
            {entries.map((entry) => (
              <Link
                key={entry.slug}
                className={`${styles.navLink} ${entry.slug === current.slug ? styles.navLinkActive : ""}`.trim()}
                href={entry.path}
              >
                {entry.title}
              </Link>
            ))}
          </nav>
        </div>
      </aside>
      <div className={styles.main}>
        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>ALEV-1 Language & Font</p>
            <h1 className={styles.title}>{heading}</h1>
          </div>
          <ThemeToggle />
        </header>
        <main className={styles.content}>
          {children}
          {prev || next ? (
            <nav className={styles.pagination} aria-label="Page navigation">
              <div className={styles.paginationSlot}>
                {prev ? <Link href={prev.path}>前: {prev.title}</Link> : null}
              </div>
              <div className={styles.paginationSlot}>
                {next ? <Link href={next.path}>次: {next.title}</Link> : null}
              </div>
            </nav>
          ) : null}
        </main>
      </div>
    </div>
  );
};

export default DocsShell;
