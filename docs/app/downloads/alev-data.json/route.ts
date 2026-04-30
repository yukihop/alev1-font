import {
  loadCorpus,
  loadKeywordMap,
  loadLexicon,
  loadUsageCounts,
} from "@/lib/alev";
import {
  binaryToHex,
  type KeywordMap,
  normalizeAlevLineToBinaryText,
} from "@/lib/alev-shared";

export const dynamic = "force-static";

function normalizeAlevLinesToBinary(
  lines: string[] | null,
  keywordMap: KeywordMap,
): string | null {
  if (lines === null) return null;
  return lines
    .map((line) => normalizeAlevLineToBinaryText(line, keywordMap))
    .join("\n");
}

export function GET() {
  const lexicon = loadLexicon();
  const corpus = loadCorpus();
  const keywordMap = loadKeywordMap();
  const usageCounts = loadUsageCounts();
  const data = {
    lexicon: Array.from(lexicon.values())
      .sort((left, right) => left.binary.localeCompare(right.binary))
      .map((entry) => ({
        binary: entry.binary,
        hex: binaryToHex(entry.binary),
        keywords: entry.keywords,
        comment: entry.comment,
        usageCount: usageCounts[entry.binary] ?? 0,
      })),
    corpus: corpus.sections.map((section) => ({
      section: section.title,
      items: section.items.map((item) => {
        if (item.type === "paragraph") {
          return {
            type: "paragraphComment" as const,
            text: item.text,
          };
        }

        return {
          type: "entry" as const,
          position: item.position,
          anchor: item.anchor,
          japanese: item.japanese,
          alev: normalizeAlevLinesToBinary(item.alevLines, keywordMap),
          comments: item.comments,
        };
      }),
    })),
  };

  return new Response(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}
