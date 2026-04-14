import { mkdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const repoDir = path.resolve(import.meta.dirname, "..");
const glyphDataPath = path.join(
  repoDir,
  "docs",
  "lib",
  "generated",
  "alev-glyph-data.ts",
);

async function main() {
  const {
    text,
    outputPath,
    color = "#000000",
    shadowColor = null,
    backgroundColor = null,
    fontSize = 36,
    letterSpacing = 0,
  } = parseArgs(process.argv.slice(2));

  if (!existsSync(glyphDataPath)) {
    throw new Error(
      "Missing docs/lib/generated/alev-glyph-data.ts. Run `pnpm --filter docs generate:glyph-data` first.",
    );
  }

  const { generateAlevSvg } = await import("../docs/lib/alev-svg.ts");
  const svg = generateAlevSvg({
    text,
    color,
    shadowColor,
    backgroundColor,
    fontSize,
    letterSpacing,
  });
  const resolvedOutputPath = path.resolve(repoDir, outputPath);

  await mkdir(path.dirname(resolvedOutputPath), { recursive: true });
  await writeFile(resolvedOutputPath, svg, "utf8");

  console.log(resolvedOutputPath);
}

function parseArgs(args: string[]) {
  let text = "";
  let outputPath = "";
  let color = "#000000";
  let shadowColor: string | null = null;
  let backgroundColor: string | null = null;
  let fontSize = 36;
  let letterSpacing = 0;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "-c" || arg === "--color") {
      color = readValue(args, ++index, arg);
      continue;
    }

    if (arg === "-sc" || arg === "--shadow-color") {
      shadowColor = readValue(args, ++index, arg);
      continue;
    }

    if (arg === "-bc" || arg === "--background-color") {
      backgroundColor = readValue(args, ++index, arg);
      continue;
    }

    if (arg === "-fs" || arg === "--font-size") {
      fontSize = Number(readValue(args, ++index, arg));
      continue;
    }

    if (arg === "-ls" || arg === "--letter-spacing") {
      letterSpacing = Number(readValue(args, ++index, arg));
      continue;
    }

    if (arg === "-out" || arg === "--out") {
      outputPath = readValue(args, ++index, arg);
      continue;
    }

    if (!text) {
      text = arg;
      continue;
    }

    throw new Error(`Unexpected argument: ${arg}`);
  }

  if (!text || !outputPath) {
    throw new Error(
      "Usage: node scripts/generate-svg.ts \"02 [ff]\" -out docs/svg-test/sample.svg [-c '#ff0000'] [-sc '#ffc43d'] [-fs 36] [-ls 0]",
    );
  }

  return {
    text,
    outputPath,
    color,
    shadowColor,
    backgroundColor,
    fontSize,
    letterSpacing,
  };
}

function readValue(args: string[], index: number, flag: string) {
  const value = args[index];
  if (!value) {
    throw new Error(`Missing value for ${flag}`);
  }

  return value;
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
