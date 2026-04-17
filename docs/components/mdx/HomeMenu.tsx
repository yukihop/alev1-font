import type { FC } from 'react';
import Link from 'next/link';
import type { ReactNode } from 'react';

import styles from './HomeMenu.module.css';

type HomeMenuProps = {
  children: ReactNode;
};

type HomeMenuSectionProps = {
  title: string;
  lead: string;
  children: ReactNode;
};

type HomeMenuCardProps = {
  title: string;
  description: string;
  href: string;
  external?: boolean;
};

const HomeMenu: FC<HomeMenuProps> = (props) => {
  const { children } = props;

  return (
    <div className={styles.root}>{children}</div>
  );
};

export const HomeMenuSection: FC<HomeMenuSectionProps> = (props) => {
  const { title, lead, children } = props;

  return (
    <section className={styles.section}>
      <div className={styles.sectionHeader}>
        <p className={styles.sectionEyebrow}>{title}</p>
        <p className={styles.sectionLead}>{lead}</p>
      </div>
      <div className={styles.grid}>{children}</div>
    </section>
  );
};

export const HomeMenuCard: FC<HomeMenuCardProps> = (props) => {
  const { title, description, href, external = false } = props;
  const content = (
    <>
      <div className={styles.cardBody}>
        <h3 className={styles.cardTitle}>{title}</h3>
        <p className={styles.cardDescription}>{description}</p>
      </div>
    </>
  );

  return external ? (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={styles.card}
    >
      {content}
    </a>
  ) : (
    <Link href={href} className={styles.card}>
      {content}
    </Link>
  );
};

export default HomeMenu;
