'use client';

import { useRouter } from 'next/navigation';
import type { FC } from 'react';
import { useEffect, useRef } from 'react';

import { useAlevClientData } from '@/lib/alev-data-context';
import { binaryToHex, HEX_DIGITS } from '@/lib/alev-shared';
import glyphData from '@/lib/generated/alev-glyph-data';

import styles from './AlevSignalDemo.module.css';

// 冬優子・あさひ・愛依・ALEV-1
const symbolColors = ['#5aff19', '#ff3737', '#f550ff', '#008cff'];

// 拡大した字が消え始める時刻（演出開始からの秒数）
const releaseAt = 3.25;
const eventDuration = releaseAt + 0.5;
// 注目演出はおよそこの間隔で毎回起き、開始時刻は最大 eventJitter 秒揺らぐ。
// 間隔が詰まったときは前の演出と点灯が重なって2つ同時になる
const eventInterval = 1.8;
const eventJitter = 0.9;

// 奥行きの異なる文字の帯。y と size は高さに対する比。
// speed は帯が流れる速さ、sweep は解析ヘッドの速さ（いずれも秒あたりの字数）、spacing はヘッドの間隔（字数）
const rows = [
  { y: 0.1, size: 0.045, alpha: 0.3, speed: 1.2, sweep: 4, spacing: 60 },
  { y: 0.22, size: 0.07, alpha: 0.5, speed: -0.9, sweep: 3, spacing: 40 },
  { y: 0.37, size: 0.11, alpha: 0.8, speed: 0.7, sweep: 1.8, spacing: 26 },
  { y: 0.5, size: 0.045, alpha: 0.25, speed: -1.8, sweep: 4.5, spacing: 70 },
  { y: 0.63, size: 0.11, alpha: 0.8, speed: -0.7, sweep: 2, spacing: 30 },
  { y: 0.78, size: 0.07, alpha: 0.5, speed: 0.9, sweep: 3.2, spacing: 44 },
  { y: 0.9, size: 0.045, alpha: 0.3, speed: -1.2, sweep: 3.8, spacing: 56 },
];
// 注目する字はこれらの帯から選ぶ
const nearRows = [2, 4, 5];
// 直近この回数の演出で選んだ字は選ばない
const recentEvents = 5;
// 注目した字を拡大したときの大きさ（高さに対する比）
const ghostScale = 0.42;
// 帯の中身はこの字数ごとに区切って生成する
const rowChunk = 48;

type Shape = (typeof glyphData.parts)[keyof typeof glyphData.parts] | typeof glyphData.brackets.open;

const shapePathData = (shape: Shape) =>
  shape.elements
    .map(element => ('d' in element.attributes ? element.attributes.d : `M${element.attributes.points}Z`))
    .join('');

const partPathData = Object.values(glyphData.parts).map(shapePathData);

// 括弧の形は字の半分の幅しかないので、字の枠の中央に置いておき、描くときに括る字の側へ寄せる
const bracketShapes = [
  { glyph: '[', data: shapePathData(glyphData.brackets.open) },
  { glyph: ']', data: shapePathData(glyphData.brackets.close) },
];

// 括弧は文の一部として表示するが、拡大や詳細表示の対象にはしない
const isBracket = (glyph: string) => glyph === '[' || glyph === ']';

// 幅 cell の枠に置いた括弧を、括る側の隣の字から字の大きさの 0.27 倍の位置まで寄せるずらし量。
// advance と size は隣の字の送り幅と大きさ
const bracketShift = (glyph: string, cell: number, advance: number, size: number) =>
  (glyph === '[' ? 1 : -1) * (cell / 2 + (advance - size) / 2 - size * 0.27);

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
const fract = (value: number) => value - Math.floor(value);
const easeOutExpo = (value: number) => (value >= 1 ? 1 : 1 - 2 ** (-10 * value));
const easeInOutCubic = (value: number) =>
  value < 0.5 ? 4 * value ** 3 : 1 - (-2 * value + 2) ** 3 / 2;
const hash = (value: number) => fract(Math.sin(value * 12.9898) * 43758.5453);
const toBinary = (value: number) => value.toString(2).padStart(8, '0');

const pulse = (v: number, at: number, duration: number) =>
  v > at && v < at + duration ? 1 - (v - at) / duration : 0;

const eventStart = (id: number) => id * eventInterval + hash(id * 3.3) * eventJitter;

// 時刻 t に進行中の注目演出と、それぞれの経過時間
const activeEvents = (t: number) => {
  const latest = Math.floor(t / eventInterval);
  return [latest - 3, latest - 2, latest - 1, latest].flatMap(id => {
    const start = eventStart(id);
    return t >= start && t < start + eventDuration ? [{ id, start, v: t - start }] : [];
  });
};

const glitchAmount = (t: number) =>
  activeEvents(t).reduce((sum, { v }) => sum + pulse(v, 0.3, 0.14) * 0.45 + pulse(v, 1.0, 0.1) * 0.2, 0);

type Scene = {
  width: number;
  height: number;
  paths: Path2D[];
  // 帯の slot 番目の字。null は字間の空白
  slotAt: (rowIndex: number, slot: number) => Slot | null;
  sprite: (binary: string, size: number) => HTMLCanvasElement;
  // 注目する字を選ぶときの重み。頻出する字ばかり選ばれないよう、コーパス中の出現回数の平方根の逆数にする
  weights: Map<string, number>;
  // 演出ごとに選んだ字。直前の演出との位置関係を見るために覚えておく
  targets: Map<number, EventTarget>;
  // クリックで選んだ字。閉じたあとも、フォーカス中と重なっていた演出を出さないよう残しておく
  selection: Selection | null;
  fonts: { ui: string; mono: string };
  // 詳細に表示する意味（キーワード）
  meaning: (binary: string) => string;
};

// 帯に並ぶ字と、それが属するコーパスの文（sentences の添字）と文中の位置
type Slot = {
  // ビット表現、または括弧の '[' ']'
  binary: string;
  sentence: number;
  position: number;
};

type Selection = {
  // 親用例と、そのうち詳細を表示している字の位置
  sentence: string[];
  position: number;
  accent: string;
  openedAt: number;
  // 開いている間は Infinity
  closedAt: number;
  // 親用例の字に切り替えた時刻。切り替えるまでは openedAt と同じ
  switchedAt: number;
};

// 詳細の最終行。字のページへのリンクになる
const detailsLabel = '>> DETAILS';

// 選んだ字を引き寄せる（戻す）のにかかる秒数
const selectDuration = 0.9;

// 引き寄せの進み具合。0 で元の位置、1 で引き寄せ終わり。引き寄せ途中で閉じたときはその位置から戻る
const selectionProgress = (selection: Selection, t: number) => {
  const opened = clamp01((Math.min(t, selection.closedAt) - selection.openedAt) / selectDuration);
  return Math.max(0, opened - Math.max(0, t - selection.closedAt) / selectDuration);
};

// フォーカス中と時間が重なる演出は、選んだ字の演出も含めて出さない
const hiddenBySelection = (scene: Scene, start: number) =>
  scene.selection !== null && start < scene.selection.closedAt && start + eventDuration > scene.selection.openedAt;


// 選んだ字を引き寄せる先。右側に詳細を、下に親用例を表示する
const selectionHome = (scene: Scene) => ({
  x: scene.width / 2 - scene.height * ghostScale * 0.9,
  y: scene.height * 0.4,
});

// 詳細の欄。行の高さを上から順に並べ、全体を引き寄せた字の高さに揃える
const infoLayout = (scene: Scene) => {
  const small = Math.max(11, scene.height * 0.042);
  const large = Math.max(16, scene.height * 0.075);
  const heights = [small * 1.8, small * 1.8, large * 1.6, small * 2];
  const total = heights.reduce((sum, value) => sum + value, 0);
  const centerY = selectionHome(scene).y;
  return {
    x: scene.width / 2 + 16,
    top: centerY - total / 2,
    bottom: centerY + total / 2,
    small,
    large,
    heights,
  };
};

// 親用例の列。字数によらず横幅に収まるようにする
// 括弧は字の半分の枠に収める
const sentenceLayout = (scene: Scene, sentence: string[]) => {
  const cells = sentence.map(glyph => (isBracket(glyph) ? 0.5 : 1));
  const total = cells.reduce((sum, value) => sum + value, 0);
  const size = Math.min(scene.height * 0.074, (scene.width - 32) / total / 1.6);
  const advance = size * 1.6;
  let cursor = (scene.width - total * advance) / 2;
  const xs = sentence.map((glyph, index) => {
    const cell = cells[index] * advance;
    const center = cursor + cell / 2;
    cursor += cell;
    return isBracket(glyph) ? center + bracketShift(glyph, cell, advance, size) : center;
  });
  return { advance, size, y: scene.height * 0.84, xs };
};

const rowMetrics = (scene: Scene, rowIndex: number, t: number) => {
  const row = rows[rowIndex];
  const size = scene.height * row.size;
  const advance = size * 1.3;
  const offset = t * row.speed;
  return {
    row,
    size,
    advance,
    y: scene.height * row.y,
    first: Math.floor(offset) - 1,
    last: Math.ceil(offset + scene.width / advance) + 1,
    slotX: (slot: number) => (slot - offset) * advance,
  };
};

type EventTarget = Slot & {
  rowIndex: number;
  slot: number;
  metrics: ReturnType<typeof rowMetrics>;
  hi: number;
  lo: number;
};

// その演出で照準を合わせる字（帯・位置・字形）
const eventTarget = (scene: Scene, id: number): EventTarget => {
  const cached = scene.targets.get(id);
  if (cached) {
    return cached;
  }

  const candidates = nearRows.flatMap(rowIndex => {
    const metrics = rowMetrics(scene, rowIndex, eventStart(id) + 0.3);
    return Array.from({ length: metrics.last - metrics.first + 1 }, (_, index) => metrics.first + index).flatMap(slot => {
      const glyph = scene.slotAt(rowIndex, slot);
      const x = metrics.slotX(slot);
      return glyph && !isBracket(glyph.binary) && x > metrics.size && x < scene.width - metrics.size
        ? [
            {
              ...glyph,
              rowIndex,
              slot,
              metrics,
              hi: Number.parseInt(glyph.binary.slice(0, 4), 2),
              lo: Number.parseInt(glyph.binary.slice(4), 2),
            },
          ]
        : [];
    });
  });
  // 最近選んだ字は避ける。また直前の演出と点灯が重なっても拡大した字同士がぶつからないよう、格子上で十分離れた字を選ぶ
  const recent = Array.from({ length: recentEvents }, (_, index) => scene.targets.get(id - 1 - index)?.binary);
  const previous = scene.targets.get(id - 1);
  const clear = candidates.filter(
    candidate =>
      !recent.includes(candidate.binary) &&
      (!previous ||
        Math.abs(latticeX(scene, candidate.lo) - latticeX(scene, previous.lo)) > scene.height * ghostScale * 1.05),
  );
  const pool = clear.length > 0 ? clear : candidates;
  const weightOf = (candidate: (typeof pool)[number]) => scene.weights.get(candidate.binary) ?? 1;
  let remaining = hash(id * 3.7 + 1) * pool.reduce((sum, candidate) => sum + weightOf(candidate), 0);
  const target = pool.find(candidate => (remaining -= weightOf(candidate)) < 0) ?? pool.at(-1) ?? {
    rowIndex: nearRows[0],
    slot: 0,
    binary: '11111111',
    sentence: -1,
    position: 0,
    metrics: rowMetrics(scene, nearRows[0], eventStart(id) + 0.3),
    hi: 15,
    lo: 15,
  };

  for (const key of scene.targets.keys()) {
    if (key < id - recentEvents) {
      scene.targets.delete(key);
    }
  }
  scene.targets.set(id, target);
  return target;
};

type FocusEvent = ReturnType<typeof activeEvents>[number] & {
  accent: string;
  target: EventTarget;
};

// 256文字の空間を表す16×16の格子。上位4ビットが行、下位4ビットが列
const latticeX = (scene: Scene, lo: number) => scene.width * 0.22 + lo * ((scene.width * 0.56) / 15);
const latticeY = (scene: Scene, hi: number) => scene.height * 0.3 + hi * ((scene.height * 0.4) / 15);
const arrivedAmount = (v: number) => clamp01((v - 0.9) / 0.3) * (1 - clamp01((v - releaseAt) / 0.4));

const drawFrame = (ctx: CanvasRenderingContext2D, scene: Scene, t: number) => {
  const { width, height } = scene;
  const events: FocusEvent[] = activeEvents(t)
    .filter(event => !hiddenBySelection(scene, event.start))
    .map(event => ({
      ...event,
      accent: symbolColors[event.id % symbolColors.length],
      target: eventTarget(scene, event.id),
    }));

  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#020409';
  ctx.fillRect(0, 0, width, height);
  ctx.globalCompositeOperation = 'lighter';

  // 漂う4色の光。周期を互いに割り切れない値にして配置が繰り返されないようにする
  symbolColors.forEach((color, index) => {
    const x = width * (0.5 + 0.42 * Math.sin(t * 0.13 * (1 + index * 0.17) + index * 1.7));
    const y = height * (0.5 + 0.45 * Math.cos(t * 0.19 * (1 + index * 0.23) + index * 2.3));
    const radius = Math.max(width, height) * 0.42;
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, color);
    gradient.addColorStop(1, `${color}00`);
    ctx.globalAlpha = 0.13;
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  });

  // 注目中の字の行と列にあたる格子点を色付きで光らせる
  for (let row = 0; row < 16; row += 1) {
    for (let col = 0; col < 16; col += 1) {
      const cross = events.find(
        event => arrivedAmount(event.v) > 0 && (row === event.target.hi || col === event.target.lo),
      );
      ctx.globalAlpha = 0.16 + (cross ? arrivedAmount(cross.v) * 0.5 : 0);
      ctx.fillStyle = cross ? cross.accent : '#ffffff';
      ctx.fillRect(latticeX(scene, col) - 0.75, latticeY(scene, row) - 0.75, 1.5, 1.5);
    }
  }

  // 文字の帯。解析ヘッドの周辺では字が変異し、通過後に本来の字に定まって減衰する
  rows.forEach((row, rowIndex) => {
    const metrics = rowMetrics(scene, rowIndex, t);
    const head = t * row.sweep + hash(rowIndex + 0.5) * row.spacing;
    const trail = row.spacing * 0.3;
    const color = symbolColors[rowIndex % symbolColors.length];

    // ヘッドの下を流れる色の光
    for (
      let headSlot = head - Math.floor((head - metrics.first + 4) / row.spacing) * row.spacing;
      headSlot <= metrics.last + 4;
      headSlot += row.spacing
    ) {
      const headX = metrics.slotX(headSlot);
      const streak = ctx.createRadialGradient(headX, metrics.y, 0, headX, metrics.y, metrics.advance * 4);
      streak.addColorStop(0, color);
      streak.addColorStop(1, `${color}00`);
      ctx.save();
      ctx.translate(headX, metrics.y);
      ctx.scale(1, 0.3);
      ctx.translate(-headX, -metrics.y);
      ctx.globalAlpha = 0.5 * row.alpha;
      ctx.fillStyle = streak;
      ctx.fillRect(headX - metrics.advance * 4, metrics.y - metrics.advance * 4, metrics.advance * 8, metrics.advance * 8);
      ctx.restore();
    }

    for (let slot = metrics.first; slot <= metrics.last; slot += 1) {
      const binary = scene.slotAt(rowIndex, slot)?.binary;
      if (!binary) {
        continue;
      }

      const behind = fract((head - slot) / row.spacing) * row.spacing;
      const mutating = behind < 1.5 || hash(slot * 7.3 + rowIndex * 31 + Math.floor(t * 8)) > 0.994;
      const focused = events.some(
        event => event.v < 1.0 && event.target.rowIndex === rowIndex && event.target.slot === slot,
      );
      const shown =
        mutating && !focused
          ? toBinary(1 + Math.floor(hash(slot * 3.1 + rowIndex * 17 + Math.floor(t * 24)) * 255))
          : binary;
      const glow = behind < 1.5 ? 1 : Math.exp(-(behind - 1.5) / trail);
      const x =
        metrics.slotX(slot) + (isBracket(shown) ? bracketShift(shown, metrics.advance, metrics.advance, metrics.size) : 0);

      ctx.globalAlpha = focused ? 1 : Math.min(1, row.alpha * (0.2 + 1.1 * glow));
      ctx.drawImage(scene.sprite(shown, metrics.size), x - metrics.size / 2, metrics.y - metrics.size / 2, metrics.size, metrics.size);
    }
  });

  events.forEach(event => drawFocus(ctx, scene, event, t));
  drawSelection(ctx, scene, t);
};

const drawFocus = (ctx: CanvasRenderingContext2D, scene: Scene, event: FocusEvent, t: number) => {
  const { width, height } = scene;
  const { id, v, accent, target } = event;

  // 照準が流れている字を捕まえ、その字の座標まで移動する
  const moveP = easeInOutCubic(clamp01((v - 0.3) / 0.7));
  const sourceX = rowMetrics(scene, target.rowIndex, v < 0.3 ? t : event.start + 0.3).slotX(target.slot);
  const gx = sourceX + (latticeX(scene, target.lo) - sourceX) * moveP;
  const gy = target.metrics.y + (latticeY(scene, target.hi) - target.metrics.y) * moveP;
  const ghostSize = height * ghostScale;
  const fade = 1 - clamp01((v - releaseAt) / 0.4);
  const lineAlpha = clamp01(v / 0.3) * fade;

  ctx.fillStyle = accent;
  ctx.globalAlpha = 0.55 * lineAlpha;
  ctx.fillRect(0, gy - 0.5, width, 1);
  ctx.fillRect(gx - 0.5, 0, 1, height);

  const bracket =
    (target.metrics.size + (ghostSize - target.metrics.size) * moveP) *
    0.75 *
    (1 + 0.9 * (1 - easeOutExpo(clamp01(v / 0.35))));
  const tick = Math.max(6, bracket * 0.24);
  ctx.globalAlpha = 0.9 * lineAlpha;
  for (const [sx, sy] of [
    [-1, -1],
    [1, -1],
    [-1, 1],
    [1, 1],
  ]) {
    const cx = gx + sx * bracket;
    const cy = gy + sy * bracket;
    ctx.fillRect(cx - (sx > 0 ? tick : 0), cy - 0.75, tick, 1.5);
    ctx.fillRect(cx - 0.75, cy - (sy > 0 ? tick : 0), 1.5, tick);
  }

  if (v < 0.95 || v > releaseAt + 0.4) {
    return;
  }

  // 部品1つを管1本とみなし、ネオン管のように不規則に点灯し、不規則に落ちる
  const frame = Math.floor(v * 30);
  const tubes = [...target.binary].map((bit, partIndex): number => {
    const seed = id * 8 + partIndex;
    const onAt = 1.0 + hash(seed) * 0.35;
    const offAt = releaseAt - 0.05 + hash(seed + 0.3) * 0.4;
    if (bit !== '1' || v < onAt || v > offAt) {
      return 0;
    }
    if (v < onAt + 0.3) {
      return hash(seed * 3 + frame) < 0.2 + (v - onAt) / 0.3 ? 1 : 0.1;
    }
    if (v > offAt - 0.15) {
      return hash(seed * 5 + frame) < 0.5 ? 1 : 0.1;
    }
    return hash(seed * 7 + frame) < 0.015 ? 0.35 : 1;
  });
  const presence = clamp01((v - 0.95) / 0.15) * fade;

  drawGhost(ctx, scene, { x: gx, y: gy, size: ghostSize, binary: target.binary, accent, tubes, presence });
};

type Ghost = {
  x: number;
  y: number;
  size: number;
  binary: string;
  accent: string;
  // 部品ごとの点灯の度合い
  tubes: number[];
  presence: number;
};

// 拡大した字を、周囲の帯を沈めて光で包んで描く
const drawGhost = (ctx: CanvasRenderingContext2D, scene: Scene, ghost: Ghost) => {
  const { x, y, size, binary, accent, tubes, presence } = ghost;
  const litCount = [...binary].filter(bit => bit === '1').length;
  const lit = tubes.reduce((sum, value) => sum + value, 0) / Math.max(1, litCount);

  const shade = ctx.createRadialGradient(x, y, 0, x, y, size * 1.2);
  shade.addColorStop(0, 'rgba(2, 4, 9, 0.85)');
  shade.addColorStop(1, 'rgba(2, 4, 9, 0)');
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = presence;
  ctx.fillStyle = shade;
  ctx.fillRect(x - size * 1.2, y - size * 1.2, size * 2.4, size * 2.4);
  ctx.globalCompositeOperation = 'lighter';

  const aura = ctx.createRadialGradient(x, y, 0, x, y, size * 1.4);
  aura.addColorStop(0, accent);
  aura.addColorStop(1, `${accent}00`);
  ctx.globalAlpha = 0.3 * lit;
  ctx.fillStyle = aura;
  ctx.fillRect(x - size * 1.4, y - size * 1.4, size * 2.8, size * 2.8);

  // 点かない管もガラスとしてうっすら見せる
  ctx.save();
  ctx.translate(x - size / 2, y - size / 2);
  ctx.scale(size / 1000, size / 1000);
  ctx.fillStyle = '#ffffff';
  scene.paths.forEach((path, partIndex) => {
    ctx.globalAlpha = binary[partIndex] === '1' ? Math.max(tubes[partIndex], 0.06 * presence) : 0.06 * presence;
    ctx.fill(path);
  });
  ctx.restore();
};

// クリックで選んだ字。背景を沈め、字を引き寄せて照準を締め、詳細の欄へ線を引き、下に親用例を並べる
const drawSelection = (ctx: CanvasRenderingContext2D, scene: Scene, t: number) => {
  const { selection, width, height } = scene;
  if (!selection) {
    return;
  }
  const p = selectionProgress(selection, t);
  const amount = easeInOutCubic(p);
  // 開くときは拡大表示されていた字からそのまま引き継ぎ、閉じるときは戻りながら消える
  const open = selection.closedAt === Infinity;
  const alpha = open ? 1 : amount;
  if (alpha <= 0) {
    return;
  }

  const { sentence, position, accent } = selection;
  const binary = sentence[position];
  const home = selectionHome(scene);
  const row = sentenceLayout(scene, sentence);
  // 格子上の元の位置から引き寄せる
  const latticeHomeX = latticeX(scene, Number.parseInt(binary.slice(4), 2));
  const latticeHomeY = latticeY(scene, Number.parseInt(binary.slice(0, 4), 2));
  const x = latticeHomeX + (home.x - latticeHomeX) * amount;
  const y = latticeHomeY + (home.y - latticeHomeY) * amount;
  const size = height * ghostScale * (1 + 0.12 * amount);
  const sinceOpen = t - selection.openedAt;
  const sinceSwitch = t - selection.switchedAt;
  const switched = selection.switchedAt > selection.openedAt;
  // 詳細の文字は、切り替えるたびに定まり直す
  const since = open ? sinceSwitch : Infinity;

  // 親用例の字に切り替えた直後は、字がでたらめに乱れたあと、新しい字の管が1本ずつ不規則に灯る
  const switching = switched ? sinceSwitch : Infinity;
  const frame = Math.floor(t * 24);
  const shownBinary = switching < 0.35 ? toBinary(1 + Math.floor(hash(frame * 1.7) * 255)) : binary;
  const tubes = [...shownBinary].map((bit, partIndex) => {
    if (bit !== '1') {
      return 0;
    }
    if (switching < 0.35) {
      return hash(frame + partIndex * 3.1) < 0.6 ? 1 : 0.2;
    }
    const onAt = 0.35 + hash(selection.switchedAt + partIndex) * 0.25;
    if (switching < onAt) {
      return 0;
    }
    if (switching < onAt + 0.3) {
      return hash(partIndex * 3 + frame) < 0.2 + (switching - onAt) / 0.3 ? 1 : 0.1;
    }
    return 1;
  });

  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 0.6 * amount;
  ctx.fillStyle = '#020409';
  ctx.fillRect(0, 0, width, height);
  ctx.globalCompositeOperation = 'lighter';

  drawGhost(ctx, scene, { x, y, size, binary: shownBinary, accent, tubes: tubes.map(level => level * alpha), presence: alpha });

  ctx.fillStyle = accent;

  // 大きく開いた照準が字に向かって締まり、締まったあとはゆっくり呼吸する
  const bracket = size * 0.62 * (1 + 0.8 * (1 - easeOutExpo(p))) * (1 + 0.015 * Math.sin(t * 2.4));
  const tick = Math.max(6, bracket * 0.22);
  ctx.globalAlpha = 0.9 * amount;
  for (const [sx, sy] of [
    [-1, -1],
    [1, -1],
    [-1, 1],
    [1, 1],
  ]) {
    const cx = x + sx * bracket;
    const cy = y + sy * bracket;
    ctx.fillRect(cx - (sx > 0 ? tick : 0), cy - 0.75, tick, 1.5);
    ctx.fillRect(cx - 0.75, cy - (sy > 0 ? tick : 0), 1.5, tick);
  }

  // 照準の右端から詳細の欄へ伸びる線
  const lineFrom = x + bracket + 6;
  const lineTo = width / 2 + 12;
  const lineP = easeInOutCubic(clamp01((p - 0.45) / 0.45));
  ctx.globalAlpha = 0.7 * amount;
  ctx.fillRect(lineFrom, y - 0.5, Math.max(0, (lineTo - lineFrom) * lineP), 1);

  // 引き寄せ終わる間際から、開いている間は字の上を走査線が定期的に走る
  const scanP = ((since - 0.5) % 2.2) / 0.45;
  if (scanP > 0 && scanP < 1) {
    ctx.globalAlpha = Math.sin(scanP * Math.PI) * 0.8;
    ctx.fillRect(x - size * 0.55, y - size / 2 + size * scanP - 1, size * 1.1, 2);
  }

  // 詳細を1行ずつ、でたらめな文字が左から定まっていくように浮かび上がらせる。閉じるときは全体が薄れて消える
  // 表示し終えたあとも、行ごとにときどき一瞬だけ一部の文字が乱れる
  const layout = infoLayout(scene);
  const maxWidth = width - layout.x - 16;
  const lines = [
    { label: 'BIN', text: binary, noise: '01', size: layout.small, weight: 400, family: scene.fonts.mono },
    {
      label: 'HEX',
      text: `0x${binaryToHex(binary)}`,
      noise: HEX_DIGITS.join(''),
      size: layout.small,
      weight: 400,
      family: scene.fonts.mono,
    },
    {
      label: '',
      text: scene.meaning(binary),
      noise: 'abcdefghijklmnopqrstuvwxyz',
      size: layout.large,
      weight: 600,
      family: scene.fonts.ui,
    },
    {
      label: '',
      text: detailsLabel,
      noise: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
      size: layout.small,
      weight: 400,
      family: scene.fonts.mono,
    },
  ];
  ctx.textBaseline = 'middle';
  let lineTop = layout.top;
  lines.forEach((line, index) => {
    const lineY = lineTop + layout.heights[index] / 2;
    lineTop += layout.heights[index];
    // 開いたときは薄く現れながら、切り替えたときはその場で、でたらめな文字が定まっていく
    const fadeIn = clamp01((sinceOpen - 0.5 - index * 0.15) / 0.3);
    if (fadeIn <= 0) {
      return;
    }
    const reveal = clamp01((since - (switched ? 0.1 : 0.5) - index * 0.15) / 0.6);
    const burstClock = since - 1.6 - index * 0.7;
    const burst = Math.floor(burstClock / 2.4);
    const bursting = burstClock > 0 && burstClock % 2.4 < 0.3 && hash(burst * 5.1 + index) < 0.7;
    const chars = [...line.text];
    const shown = chars
      .map((char, charIndex) =>
        charIndex < reveal * chars.length && !(bursting && hash(charIndex * 1.3 + burst * 7 + index) < 0.25)
          ? char
          : line.noise[Math.floor(hash(charIndex + index * 17 + Math.floor(t * 20)) * line.noise.length)],
      )
      .join('');

    ctx.font = `${line.weight} ${line.size}px ${line.family}`;
    ctx.globalAlpha = fadeIn * alpha;
    let textX = layout.x;
    if (line.label) {
      ctx.fillStyle = accent;
      ctx.fillText(line.label, textX, lineY);
      textX += ctx.measureText(`${line.label}  `).width;
    }
    // 長い意味は欄の幅に収まるまで縮める
    const fitted = line.size * Math.min(1, (maxWidth - (textX - layout.x)) / ctx.measureText(line.text).width);
    ctx.font = `${line.weight} ${fitted}px ${line.family}`;
    ctx.fillStyle = index === 3 ? accent : '#eff3ff';
    ctx.shadowColor = accent;
    ctx.shadowBlur = index === 2 ? 12 : 0;
    ctx.fillText(shown, textX, lineY);
    ctx.shadowBlur = 0;
    if (index === 3) {
      ctx.fillRect(textX, lineY + fitted * 0.7, ctx.measureText(shown).width, 1);
    }
  });

  // 親用例を下からふわりと浮かせて並べ、詳細を表示中の字に印を付ける。表示し終えたあとも、ときどき一瞬だけ一部の字が乱れる
  sentence.forEach((glyph, index) => {
    const appear = open ? easeInOutCubic(clamp01((sinceOpen - 0.7 - index * 0.04) / 0.6)) : 1;
    if (appear <= 0) {
      return;
    }
    const gx = row.xs[index];
    const gy = row.y + (1 - appear) * row.size * 0.6;
    const burstClock = sinceOpen - 2 - index * 0.37;
    const burst = Math.floor(burstClock / 2.8);
    const scrambled = !isBracket(glyph) && open && burstClock > 0 && burstClock % 2.8 < 0.25 && hash(burst * 3.7 + index * 1.9) < 0.3;
    const shown = scrambled ? toBinary(1 + Math.floor(hash(index * 5.3 + Math.floor(t * 24)) * 255)) : glyph;
    const current = index === position;
    ctx.globalAlpha = appear * alpha * (current ? 1 : 0.5);
    ctx.drawImage(scene.sprite(shown, row.size), gx - row.size / 2, gy - row.size / 2, row.size, row.size);
    if (current) {
      ctx.fillStyle = accent;
      ctx.fillRect(gx - row.size * 0.4, gy + row.size * 0.62, row.size * 0.8, 2);
    }
  });
};

const vertexShader = `#version 300 es
in vec2 aPosition;
out vec2 vUv;
void main() {
  vUv = vec2(aPosition.x, -aPosition.y) * 0.5 + 0.5;
  gl_Position = vec4(aPosition, 0.0, 1.0);
}`;

const fragmentShader = `#version 300 es
precision highp float;
uniform sampler2D uTex;
uniform float uTime;
uniform float uGlitch;
in vec2 vUv;
out vec4 outColor;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

vec3 blurred(vec2 uv, float lod) {
  vec2 px = 1.0 / vec2(textureSize(uTex, int(lod)));
  return (
    textureLod(uTex, uv + px * vec2(-1.0, -1.0), lod).rgb +
    textureLod(uTex, uv + px * vec2(1.0, -1.0), lod).rgb +
    textureLod(uTex, uv + px * vec2(-1.0, 1.0), lod).rgb +
    textureLod(uTex, uv + px * vec2(1.0, 1.0), lod).rgb
  ) * 0.25;
}

void main() {
  vec2 uv = vUv;
  float frame = floor(uTime * 30.0);
  float band = floor(uv.y * 36.0);
  float slice = step(1.0 - uGlitch * 0.5, hash(vec2(band, frame)));
  uv.x += slice * (hash(vec2(band, frame + 7.0)) - 0.5) * 0.1 * uGlitch;

  vec2 dir = uv - 0.5;
  float aberration = 0.0015 + uGlitch * 0.008;
  vec3 color = vec3(
    texture(uTex, uv + dir * aberration).r,
    texture(uTex, uv).g,
    texture(uTex, uv - dir * aberration).b
  );

  vec3 bloom =
    blurred(uv, 1.0) * 0.35 +
    blurred(uv, 2.0) * 0.35 +
    blurred(uv, 3.0) * 0.3 +
    blurred(uv, 4.0) * 0.3 +
    blurred(uv, 5.0) * 0.25 +
    blurred(uv, 6.0) * 0.2;
  color += bloom * 0.8;

  color *= 1.0 - dot(dir, dir) * 1.1;
  color += (hash(gl_FragCoord.xy + fract(uTime * 7.13) * 100.0) - 0.5) * 0.05;
  outColor = vec4(color, 1.0);
}`;

const createPost = (gl: WebGL2RenderingContext) => {
  const program = gl.createProgram();
  for (const [type, source] of [
    [gl.VERTEX_SHADER, vertexShader],
    [gl.FRAGMENT_SHADER, fragmentShader],
  ] as const) {
    const shader = gl.createShader(type);
    if (!shader) {
      return null;
    }
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    gl.attachShader(program, shader);
  }
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    return null;
  }
  gl.useProgram(program);

  // 画面全体を覆う1枚の三角形
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const position = gl.getAttribLocation(program, 'aPosition');
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

  gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  const timeLocation = gl.getUniformLocation(program, 'uTime');
  const glitchLocation = gl.getUniformLocation(program, 'uGlitch');

  return (source: HTMLCanvasElement, time: number) => {
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.uniform1f(timeLocation, time % 1000);
    gl.uniform1f(glitchLocation, glitchAmount(time));
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };
};

// 中心 (cx, cy) の拡大した字に (x, y) が重なっているか
const hitsGhost = (scene: Scene, cx: number, cy: number, x: number, y: number) =>
  Math.abs(x - cx) < (scene.height * ghostScale) / 2 && Math.abs(y - cy) < (scene.height * ghostScale) / 2;

// 座標 (x, y) で拡大表示されている字の演出
const focusedEventAt = (scene: Scene, t: number, x: number, y: number) =>
  activeEvents(t).find(({ id, start, v }) => {
    if (hiddenBySelection(scene, start) || v < 0.95 || v > releaseAt + 0.4) {
      return false;
    }
    const target = eventTarget(scene, id);
    return hitsGhost(scene, latticeX(scene, target.lo), latticeY(scene, target.hi), x, y);
  });

type AlevSignalDemoClientProps = {
  // コーパスの各行をビット表現（括弧は '[' ']'）の配列にしたもの
  sentences: string[][];
};

const AlevSignalDemoClient: FC<AlevSignalDemoClientProps> = props => {
  const { sentences } = props;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { lexiconMap } = useAlevClientData();
  const router = useRouter();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const gl = canvas.getContext('webgl2', { alpha: false, antialias: false });
    const post = gl ? createPost(gl) : null;
    const source = gl ? document.createElement('canvas') : canvas;
    const ctx = source.getContext('2d', { alpha: false });
    if (!ctx || (gl && !post)) {
      return;
    }

    const paths = partPathData.map(data => new Path2D(data));
    const bracketPaths = new Map(
      bracketShapes.map(shape => [shape.glyph, new Path2D(shape.data)]),
    );
    const sprites = new Map<string, HTMLCanvasElement>();
    const chunks = new Map<string, (Slot | null)[]>();
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // 描画はすべて時刻から決まるので、起点をずらしてリロードのたびに違う状況から始める
    const origin = Math.random() * 100000;
    let dpr = 1;
    let frameId = 0;
    let lastTime = origin;

    const sprite = (binary: string, size: number) => {
      const pixels = Math.ceil(size * dpr);
      const key = `${binary}@${pixels}`;
      const cached = sprites.get(key);
      if (cached) {
        return cached;
      }
      const image = document.createElement('canvas');
      image.width = image.height = pixels;
      const imageCtx = image.getContext('2d');
      if (imageCtx) {
        imageCtx.scale(pixels / 1000, pixels / 1000);
        imageCtx.fillStyle = '#ffffff';
        const bracket = bracketPaths.get(binary);
        if (bracket) {
          imageCtx.translate(250, 0);
          imageCtx.fill(bracket);
        } else {
          paths.forEach((path, index) => binary[index] === '1' && imageCtx.fill(path));
        }
      }
      sprites.set(key, image);
      return image;
    };

    // 帯ごとにコーパスの文を空白を挟んで並べる。区切りごとに位置から決まる文を選ぶので、何度流れても同じ並びにならない
    const slotAt = (rowIndex: number, slot: number) => {
      const chunk = Math.floor(slot / rowChunk);
      const key = `${rowIndex}:${chunk}`;
      let glyphs = chunks.get(key);
      if (!glyphs) {
        glyphs = [];
        let sentence = Math.floor(hash(rowIndex * 7.919 + chunk * 1.37) * sentences.length);
        while (sentences.length > 0 && glyphs.length < rowChunk) {
          const index = sentence % sentences.length;
          glyphs.push(...sentences[index].map((binary, position) => ({ binary, sentence: index, position })), null, null);
          sentence += 1 + Math.floor(hash(sentence * 1.7 + chunk) * 7);
        }
        if (chunks.size > 256) {
          chunks.clear();
        }
        chunks.set(key, glyphs);
      }
      return glyphs[slot - chunk * rowChunk] ?? null;
    };

    const counts = new Map<string, number>();
    sentences.flat().forEach(binary => counts.set(binary, (counts.get(binary) ?? 0) + 1));
    const weights = new Map([...counts].map(([binary, count]) => [binary, 1 / Math.sqrt(count)]));

    const style = getComputedStyle(canvas);
    const scene: Scene = {
      width: 0,
      height: 0,
      paths,
      slotAt,
      sprite,
      weights,
      targets: new Map(),
      selection: null,
      fonts: { ui: style.getPropertyValue('--font-ui'), mono: style.getPropertyValue('--font-mono') },
      meaning: binary => lexiconMap.get(binary)?.keywords.join(', ') || '未解読',
    };

    const render = (t: number) => {
      lastTime = t;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      drawFrame(ctx, scene, t);
      post?.(source, t);
    };

    const tick = (now: number) => {
      render(origin + now / 1000);
      frameId = requestAnimationFrame(tick);
    };

    const resizeObserver = new ResizeObserver(() => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      scene.width = canvas.clientWidth;
      scene.height = canvas.clientHeight;
      canvas.width = source.width = Math.round(scene.width * dpr);
      canvas.height = source.height = Math.round(scene.height * dpr);
      sprites.clear();
      scene.targets.clear();
      if (reducedMotion) {
        // 最初の注目演出で字が点灯している瞬間を1枚だけ描く
        render(eventStart(Math.floor(origin / eventInterval)) + 1.9);
      }
    });

    // 画面外にある間は描画を止める
    const intersectionObserver = new IntersectionObserver(([entry]) => {
      cancelAnimationFrame(frameId);
      if (entry.isIntersecting) {
        frameId = requestAnimationFrame(tick);
      }
    });

    // 詳細の欄の上にあるか
    const hitsInfo = (x: number, y: number) => {
      const layout = infoLayout(scene);
      return x > layout.x - 8 && x < scene.width - 8 && y > layout.top && y < layout.bottom;
    };

    // 詳細の最終行のリンクの上にあるか
    const hitsDetails = (x: number, y: number) => {
      const layout = infoLayout(scene);
      ctx.font = `400 ${layout.small}px ${scene.fonts.mono}`;
      const right = layout.x + ctx.measureText(detailsLabel).width;
      return x > layout.x - 4 && x < right + 4 && y > layout.bottom - layout.heights[3] && y < layout.bottom;
    };

    // 親用例の何番目の字の上にあるか。どの字の上にもなければ -1
    const sentenceIndexAt = (selection: Selection, x: number, y: number) => {
      const row = sentenceLayout(scene, selection.sentence);
      return Math.abs(y - row.y) < row.advance / 2
        ? selection.sentence.findIndex(
            (glyph, index) => !isBracket(glyph) && Math.abs(x - row.xs[index]) < row.advance / 2,
          )
        : -1;
    };

    // 拡大表示中の字をクリックすると引き寄せて詳細を表示する。リンクをクリックすると字のページへ移り、
    // 親用例の字をクリックするとその字に切り替え、それらの外をクリックすると元の演出に戻す
    const handleClick = (event: MouseEvent) => {
      const { selection } = scene;
      const { offsetX: x, offsetY: y } = event;
      if (selection?.closedAt === Infinity) {
        const home = selectionHome(scene);
        const index = sentenceIndexAt(selection, x, y);
        if (hitsDetails(x, y)) {
          router.push(`/character/${selection.sentence[selection.position]}`);
        } else if (index >= 0) {
          if (index !== selection.position) {
            // 色は今と違う3色から選び直す
            const others = symbolColors.filter(color => color !== selection.accent);
            scene.selection = {
              ...selection,
              position: index,
              accent: others[Math.floor(Math.random() * others.length)],
              switchedAt: lastTime,
            };
          }
        } else if (!hitsInfo(x, y) && !hitsGhost(scene, home.x, home.y, x, y)) {
          scene.selection = { ...selection, closedAt: lastTime };
        }
      } else {
        const focused = focusedEventAt(scene, lastTime, x, y);
        if (focused) {
          const target = eventTarget(scene, focused.id);
          scene.selection = {
            sentence: sentences[target.sentence] ?? [target.binary],
            position: target.position,
            accent: symbolColors[focused.id % symbolColors.length],
            openedAt: lastTime,
            closedAt: Infinity,
            switchedAt: lastTime,
          };
        }
      }
    };
    const handlePointerMove = (event: PointerEvent) => {
      const { selection } = scene;
      const { offsetX: x, offsetY: y } = event;
      const pointing =
        selection?.closedAt === Infinity
          ? hitsDetails(x, y) || ![-1, selection.position].includes(sentenceIndexAt(selection, x, y))
          : focusedEventAt(scene, lastTime, x, y);
      canvas.style.cursor = pointing ? 'pointer' : '';
    };
    resizeObserver.observe(canvas);
    // 動きを減らす設定では1枚絵だけを描き、字を選ぶ操作も受け付けない
    if (!reducedMotion) {
      intersectionObserver.observe(canvas);
      canvas.addEventListener('click', handleClick);
      canvas.addEventListener('pointermove', handlePointerMove);
    }

    return () => {
      cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      canvas.removeEventListener('click', handleClick);
      canvas.removeEventListener('pointermove', handlePointerMove);
    };
  }, [sentences, lexiconMap, router]);

  return (
    <div className={styles.panel}>
      <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />
    </div>
  );
};

export default AlevSignalDemoClient;
