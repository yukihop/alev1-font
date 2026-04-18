import type { CorpusEntry, CorpusSectionItem } from '@alev/data';

import { loadCorpus, loadKeywordMap } from '@/lib/alev';
import { tokenizeAlevLine } from '@/lib/alev-shared';

import AlevLine from './AlevLine';
import InlineMdx from './InlineMdx';
import styles from './CorpusView.module.css';

type CorpusViewProps = {
  filterCharacterId?: string;
  hashLinkBase?: string;
  selectedCharacterId?: string | null;
};

function isAbsoluteUrl(value: string): boolean {
  return /^https?:\/\//.test(value);
}

function entryContainsCharacter(
  entry: CorpusEntry,
  characterId: string,
  keywordMap: Record<string, string>,
): boolean {
  if (entry.alevLines === null) {
    return false;
  }

  return entry.alevLines.some((line) =>
    tokenizeAlevLine(line, keywordMap).some(
      (fragment) =>
        fragment.type === 'token' && fragment.resolvedBinary === characterId,
    ),
  );
}

async function CorpusView(props: CorpusViewProps) {
  const { filterCharacterId, hashLinkBase, selectedCharacterId = null } = props;
  const corpus = loadCorpus();
  const keywordMap = loadKeywordMap();
  const activeCharacterId = selectedCharacterId ?? filterCharacterId ?? null;

  const renderItem = async (
    item: CorpusSectionItem,
    itemIndex: number,
  ) => {
    if (item.type === 'paragraph') {
      if (filterCharacterId) {
        return null;
      }

      return (
        <div
          key={`paragraph-${itemIndex}`}
          className={styles.paragraph}
        >
          <div className={styles.paragraphText}>
            <InlineMdx source={item.text} hashLinkBase={hashLinkBase} />
          </div>
        </div>
      );
    }

    if (
      filterCharacterId &&
      !entryContainsCharacter(item, filterCharacterId, keywordMap)
    ) {
      return null;
    }

    return (
      <article key={`${item.position}-${itemIndex}`} className={styles.entry}>
        {item.anchor ? <a id={item.anchor} aria-hidden="true"></a> : null}

        <div className={styles.bodyBlock}>
          <div className={styles.positionRow}>
            {isAbsoluteUrl(item.position) ? (
              <a href={item.position} className={styles.positionLink}>
                {item.position}
              </a>
            ) : (
              <span className={styles.position}>{item.position}</span>
            )}
          </div>

          {item.japanese === null ? (
            <p className={styles.unknown}>公式訳不明</p>
          ) : (
            <p className={styles.japanese}>
              <strong>公式訳：</strong> {item.japanese}
            </p>
          )}

          {item.alevLines === null ? (
            <p className={styles.unknown}>公式原文不明</p>
          ) : (
            <div className={styles.exampleBlock}>
              <AlevLine
                source={item.alevLines.join('\n')}
                selected={activeCharacterId ?? undefined}
              />
            </div>
          )}
        </div>

        {item.comments.length > 0 ? (
          <div className={styles.commentBlock}>
            {item.comments.map((comment, commentIndex) => (
              <div
                key={`${item.position}-comment-${commentIndex}`}
                className={styles.comment}
              >
                <InlineMdx source={comment} hashLinkBase={hashLinkBase} />
              </div>
            ))}
          </div>
        ) : null}
      </article>
    );
  };

  const sections = await Promise.all(
    corpus.sections.map(async (section, sectionIndex) => {
      const items = (
        await Promise.all(
          section.items.map((item, itemIndex) => renderItem(item, itemIndex)),
        )
      ).filter(Boolean);

      if (items.length === 0) {
        return null;
      }

      return (
        <section
          key={section.title ?? `section-${sectionIndex}`}
          className={styles.section}
        >
          {section.title ? <h2>{section.title}</h2> : null}
          <div className={styles.entries}>{items}</div>
        </section>
      );
    }),
  );

  return <div className={styles.root}>{sections.filter(Boolean)}</div>;
}

export default CorpusView;
