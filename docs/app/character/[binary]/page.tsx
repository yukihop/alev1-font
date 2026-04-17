import { binaryToHex } from "@alev/data";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import DocsShell from "@/components/DocsShell";
import RichText from "@/components/RichText";
import alevTextStyles from "@/components/mdx/AlevText.module.css";
import { GlyphMetaCopyPills } from "@/components/mdx/CopyPillButton";
import CorpusViewClient from "@/components/mdx/CorpusViewClient";
import InlineMdx from "@/components/mdx/InlineMdx";
import SourceDataBoundary from "@/components/mdx/SourceDataBoundary";
import glyphStyles from "@/components/mdx/Glyphs.module.css";
import { buildCorpusRenderableSections } from "@/components/mdx/corpus-renderable";
import { type ArticleEntry, scanArticles } from "@/lib/articles";
import { loadSourceData } from "@/lib/source-data";

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
  const sourceData = loadSourceData();

  return sourceData.glyphs
    .filter((glyph) => (sourceData.usageCounts[glyph.hex] ?? 0) > 0)
    .map((glyph) => ({
      binary: glyph.binary,
    }));
}

export const dynamicParams = false;

export async function generateMetadata(
  props: CharacterPageProps,
): Promise<Metadata> {
  const { binary } = await props.params;

  return isBinaryGlyphSlug(binary) ? { title: `${binary}の使用例` } : {};
}

const CharacterPage = async (props: CharacterPageProps) => {
  const { binary } = await props.params;

  if (!isBinaryGlyphSlug(binary)) {
    notFound();
  }

  const sourceData = loadSourceData();
  const hex = binaryToHex(binary);
  const glyph = sourceData.glyphs.find((entry) => entry.hex === hex);
  const usageCount = sourceData.usageCounts[hex] ?? 0;

  if (!glyph || usageCount === 0) {
    notFound();
  }

  const sections = buildCorpusRenderableSections(hex, {
    hashLinkBase: '/corpus',
  });
  const { entries } = await scanArticles();
  const current = createCharacterEntry(binary);

  return (
    <DocsShell current={current} entries={entries}>
      <SourceDataBoundary>
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
          <CorpusViewClient sections={sections} selectedHex={hex} />
        </RichText>
      </SourceDataBoundary>
    </DocsShell>
  );
};

export default CharacterPage;
