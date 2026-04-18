import type { Metadata } from "next";
import { notFound } from "next/navigation";

import DocsShell from "@/components/DocsShell";
import RichText from "@/components/RichText";
import alevTextStyles from "@/components/mdx/AlevText.module.css";
import CorpusView from "@/components/mdx/CorpusView";
import { GlyphMetaCopyPills } from "@/components/mdx/CopyPillButton";
import { createRenderableGlyphRecord } from "@/components/mdx/glyph-record";
import InlineMdx from "@/components/mdx/InlineMdx";
import glyphStyles from "@/components/mdx/Glyphs.module.css";
import { loadLexicon, loadUsageCounts } from "@/lib/alev";
import { type ArticleEntry, scanArticles } from "@/lib/articles";
import { createPageMetadata } from "@/lib/site";

type CharacterPageProps = {
  params: Promise<{
    binary: string;
  }>;
};

function isBinaryGlyphSlug(value: string): boolean {
  return /^[01]{8}$/.test(value);
}

function createCharacterEntry(binary: string): ArticleEntry {
  return {
    slug: `character/${binary}`,
    path: `/character/${binary}`,
    title: `${binary}の使用例`,
    order: Number.POSITIVE_INFINITY,
  };
}

export function generateStaticParams() {
  return Object.keys(loadUsageCounts())
    .sort((left, right) => left.localeCompare(right))
    .map((binary) => ({
      binary,
    }));
}

export const dynamicParams = false;

export async function generateMetadata(
  props: CharacterPageProps,
): Promise<Metadata> {
  const { binary } = await props.params;

  return isBinaryGlyphSlug(binary)
    ? createPageMetadata(`${binary}の使用例`, `/character/${binary}`)
    : {};
}

const CharacterPage = async (props: CharacterPageProps) => {
  const { binary } = await props.params;

  if (!isBinaryGlyphSlug(binary)) {
    notFound();
  }

  const lexicon = loadLexicon();
  const usageCounts = loadUsageCounts();
  const usageCount = usageCounts[binary] ?? 0;
  const glyph = createRenderableGlyphRecord(
    binary,
    lexicon.get(binary),
    usageCount,
  );

  if (usageCount === 0) {
    notFound();
  }

  const { entries } = await scanArticles();
  const current = createCharacterEntry(binary);

  return (
    <DocsShell current={current} entries={entries}>
      <RichText>
        <section className={glyphStyles.glyphPageHeader}>
          <div className={glyphStyles.glyphRow}>
            <div
              className={`${glyphStyles.glyphCell} ${glyphStyles.glyphHeroCell} ${alevTextStyles.glyphText}`}
              title={glyph.codepoint}
            >
              {glyph.char}
            </div>
            <div className={glyphStyles.glyphDetail}>
              <GlyphMetaCopyPills
                hex={glyph.hex}
                binary={glyph.binary}
                keywords={glyph.keywords}
              />
              <div className={glyphStyles.glyphCopyStatus}>
                <span className={glyphStyles.glyphPopoverBadge}>
                  {`出現数: ${usageCount}`}
                </span>
              </div>
              {glyph.comment ? (
                <div className={glyphStyles.glyphComment}>
                  <InlineMdx source={glyph.comment} />
                </div>
              ) : null}
            </div>
          </div>
        </section>
        <CorpusView
          filterCharacterId={binary}
          selectedCharacterId={binary}
          hashLinkBase="/corpus"
        />
      </RichText>
    </DocsShell>
  );
};

export default CharacterPage;
