import { type FC, useEffect, useState } from 'react';
import clsx from 'clsx';

import fontUrl from '../../font/dist/alev1.woff2?url';

type GlyphRecord = {
  binary: string;
  hex: string;
  glyphName: string;
  codepoint: string;
  char: string;
  bits: boolean[];
  components: string[];
  keywords: string[];
  label?: string | null;
  description?: string | null;
  notes?: string | null;
};

type Manifest = {
  familyName: string;
  styleName: string;
  outputFileBase: string;
  glyphCount: number;
  glyphs: GlyphRecord[];
};

type DictionaryEntry = {
  keyword: string;
  glyph: GlyphRecord;
  synonyms: string[];
};

const rows = '0123456789ABCDEF'.split('');
const cols = '0123456789ABCDEF'.split('');
const INITIAL_TEST_TEXT = ':i: :love: :straylight:';
const manifestUrl = new URL('../../font/dist/manifest.json', import.meta.url).href;

const App: FC = () => {
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [manifestError, setManifestError] = useState<string>('');
  const [testText, setTestText] = useState<string>(INITIAL_TEST_TEXT);

  useEffect(() => {
    let active = true;

    const loadManifest = async () => {
      try {
        const response = await fetch(manifestUrl);
        if (!response.ok) {
          throw new Error(`Failed to load manifest: ${response.status}`);
        }

        const data = (await response.json()) as Manifest;
        if (active) {
          setManifest(data);
          setManifestError('');
        }
      } catch (error) {
        if (active) {
          setManifestError(error instanceof Error ? error.message : 'Failed to load manifest.');
        }
      }
    };

    void loadManifest();

    return () => {
      active = false;
    };
  }, []);

  const glyphs = manifest?.glyphs ?? [];
  const glyphMap = new Map(glyphs.map((glyph) => [glyph.hex, glyph]));
  const dictionaryEntries: DictionaryEntry[] = glyphs
    .flatMap((glyph) =>
      glyph.keywords.map((keyword) => ({
        keyword,
        glyph,
        synonyms: glyph.keywords.filter((entry) => entry !== keyword),
      })),
    )
    .sort((left, right) => left.keyword.localeCompare(right.keyword));

  return (
    <>
      <FontFace familyName={manifest?.familyName ?? 'Alev1'} />
      <div className="app-shell">
        <header className="hero">
          <p className="eyebrow">Alev1 Font Demo</p>
          <h1>{manifest?.familyName ?? 'Alev1'}</h1>
          <p className="lede">
            Generated glyph count: {manifest?.glyphCount ?? 0}. Use <code>:word:</code> for concept tokens,
            <code> 0xFF</code> for hex values, and <code>0b11111111</code> for binary values.
          </p>
          {manifestError ? <p className="muted">{manifestError}</p> : null}
        </header>
        <main className="layout">
          <section className="panel">
            <SectionHeading
              title="Ligature Tester"
              description="Type :word:, 0xFF, or 0b11111111 tokens. The preview updates immediately using the current font."
            />
            <LigatureTester testText={testText} setTestText={setTestText} />
          </section>
          <section className="panel">
            <SectionHeading
              title="16x16 Grid"
              description="Rows are upper 4 bits. Columns are lower 4 bits. Click a glyph to jump to its detail row."
            />
            <GlyphMatrix rows={rows} cols={cols} glyphMap={glyphMap} />
          </section>
          <section className="panel">
            <SectionHeading
              title="Glyph List"
              description="Full list of glyphs with their binary and hex codes and linked concept words."
            />
            <GlyphList glyphs={glyphs} />
          </section>
          <section className="panel">
            <SectionHeading
              title="Concept Dictionary"
              description="Alphabetical keywords. Synonyms appear inline when multiple words point at the same glyph."
            />
            <DictionaryList entries={dictionaryEntries} />
          </section>
        </main>
      </div>
    </>
  );
};

const FontFace: FC<{ familyName: string }> = (props) => {
  const { familyName } = props;
  return (
    <style>{`
      @font-face {
        font-family: "${familyName}";
        src: url("${fontUrl}") format("woff2");
        font-display: swap;
      }

      :root {
        --alev-font-family: "${familyName}";
      }
    `}</style>
  );
};

const SectionHeading: FC<{ title: string; description: string }> = (props) => {
  const { title, description } = props;
  return (
    <div className="section-heading">
      <h2>{title}</h2>
      <p>{description}</p>
    </div>
  );
};

const LigatureTester: FC<{
  testText: string;
  setTestText: (value: string) => void;
}> = (props) => {
  const { testText, setTestText } = props;

  return (
    <div className="tester">
      <label className="tester-label" htmlFor="ligature-input">
        Input
      </label>
      <textarea
        id="ligature-input"
        className="tester-input"
        value={testText}
        onChange={(event) => {
          setTestText(event.target.value);
        }}
        spellCheck={false}
      />
      <div className="tester-preview-wrap">
        <div className="tester-caption">Preview</div>
        <div className="tester-preview">{testText}</div>
      </div>
    </div>
  );
};

const GlyphMatrix: FC<{ rows: string[]; cols: string[]; glyphMap: Map<string, GlyphRecord> }> = (props) => {
  const { rows: rowLabels, cols: colLabels, glyphMap: glyphLookup } = props;

  return (
    <div className="matrix-wrap">
      <table className="matrix">
        <thead>
          <tr>
            <th aria-label="corner" />
            {colLabels.map((col) => (
              <th key={col}>{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rowLabels.map((row) => (
            <tr key={row}>
              <th>{row}</th>
              {colLabels.map((col) => {
                const hex = `${row}${col}`;
                const glyph = glyphLookup.get(hex);
                return (
                  <td key={hex}>
                    {glyph ? (
                      <a className="matrix-link" href={`#glyph-${hex}`} aria-label={`Jump to glyph ${hex}`}>
                        <span className="glyph-mark">{glyph.char}</span>
                      </a>
                    ) : (
                      <span className="matrix-empty">-</span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const GlyphList: FC<{ glyphs: GlyphRecord[] }> = (props) => {
  const { glyphs: allGlyphs } = props;

  return (
    <ol className="glyph-list">
      {allGlyphs.map((glyph) => (
        <GlyphRow key={glyph.hex} glyph={glyph} />
      ))}
    </ol>
  );
};

const GlyphRow: FC<{ glyph: GlyphRecord }> = (props) => {
  const { glyph } = props;

  return (
    <li id={`glyph-${glyph.hex}`} className="glyph-row">
      <div className="glyph-cell" title={glyph.codepoint}>
        {glyph.char}
      </div>
      <div className="glyph-detail">
        <div className="glyph-meta">
          <span className="binary-pill">0b{glyph.binary}</span>
          <span className="hex-pill">0x{glyph.hex}</span>
          <span>{glyph.codepoint}</span>
          <span>{glyph.glyphName}</span>
        </div>
        <div className="keyword-line">
          {glyph.keywords.length > 0 ? (
            glyph.keywords.map((keyword) => (
              <a key={keyword} className="keyword-pill" href={`#dict-${keyword}`}>
                {keyword}
              </a>
            ))
          ) : (
            <span className="muted">No concept words yet.</span>
          )}
        </div>
        <div className="component-line">
          {glyph.components.length > 0 ? glyph.components.join(', ') : 'No active components'}
        </div>
      </div>
    </li>
  );
};

const DictionaryList: FC<{ entries: DictionaryEntry[] }> = (props) => {
  const { entries } = props;

  if (entries.length === 0) {
    return <p className="muted">No concept words defined.</p>;
  }

  return (
    <ul className="dictionary-list">
      {entries.map((entry) => (
        <DictionaryRow key={entry.keyword} entry={entry} />
      ))}
    </ul>
  );
};

const DictionaryRow: FC<{ entry: DictionaryEntry }> = (props) => {
  const { entry } = props;
  const { keyword, glyph, synonyms } = entry;

  return (
    <li id={`dict-${keyword}`} className="dictionary-row">
      <div className="dictionary-word">
        <a href={`#glyph-${glyph.hex}`}>{keyword}</a>
      </div>
      <div className="dictionary-glyph">{glyph.char}</div>
      <div className="dictionary-hex">0x{glyph.hex} / 0b{glyph.binary}</div>
      <div className={clsx('dictionary-synonyms', synonyms.length === 0 && 'muted')}>
        {synonyms.length > 0 ? synonyms.join(', ') : 'No synonyms'}
      </div>
    </li>
  );
};

export { App };
