'use client';

import type { FC } from 'react';
import { useEffect, useRef } from 'react';

import glyphData from '@/lib/generated/alev-glyph-data';

import styles from './AlevSignalDemo.module.css';

// 冬優子・あさひ・愛依・ALEV-1
const symbolColors = ['#5aff19', '#ff3737', '#f550ff', '#008cff'];

const eventDuration = 3;
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
const nearRows = [2, 4];
// 注目した字を拡大したときの大きさ（高さに対する比）
const ghostScale = 0.42;
// 帯の中身はこの字数ごとに区切って生成する
const rowChunk = 48;

const partPathData = Object.values(glyphData.parts).map(part =>
  part.elements
    .map(element => ('d' in element.attributes ? element.attributes.d : `M${element.attributes.points}Z`))
    .join(''),
);

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
  glyphAt: (rowIndex: number, slot: number) => string | null;
  sprite: (binary: string, size: number) => HTMLCanvasElement;
  // 演出ごとに選んだ字。直前の演出との位置関係を見るために覚えておく
  targets: Map<number, EventTarget>;
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

type EventTarget = {
  rowIndex: number;
  slot: number;
  binary: string;
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
      const binary = scene.glyphAt(rowIndex, slot);
      const x = metrics.slotX(slot);
      return binary && x > metrics.size && x < scene.width - metrics.size
        ? [{ rowIndex, slot, binary, metrics, hi: Number.parseInt(binary.slice(0, 4), 2), lo: Number.parseInt(binary.slice(4), 2) }]
        : [];
    });
  });
  // 直前の演出と点灯が重なっても拡大した字同士がぶつからないよう、格子上で十分離れた字を選ぶ
  const previous = scene.targets.get(id - 1);
  const clear = candidates.filter(
    candidate =>
      !previous ||
      Math.abs(latticeX(scene, candidate.lo) - latticeX(scene, previous.lo)) > scene.height * ghostScale * 1.05,
  );
  const pool = clear.length > 0 ? clear : candidates;
  const target = pool[Math.floor(hash(id * 3.7 + 1) * pool.length)] ?? {
    rowIndex: nearRows[0],
    slot: 0,
    binary: '11111111',
    metrics: rowMetrics(scene, nearRows[0], eventStart(id) + 0.3),
    hi: 15,
    lo: 15,
  };

  for (const key of scene.targets.keys()) {
    if (key < id - 8) {
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
const arrivedAmount = (v: number) => clamp01((v - 0.9) / 0.3) * (1 - clamp01((v - 2.5) / 0.4));

const drawFrame = (ctx: CanvasRenderingContext2D, scene: Scene, t: number) => {
  const { width, height } = scene;
  const events: FocusEvent[] = activeEvents(t).map(event => ({
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
      const binary = scene.glyphAt(rowIndex, slot);
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
      const x = metrics.slotX(slot);

      ctx.globalAlpha = focused ? 1 : Math.min(1, row.alpha * (0.2 + 1.1 * glow));
      ctx.drawImage(scene.sprite(shown, metrics.size), x - metrics.size / 2, metrics.y - metrics.size / 2, metrics.size, metrics.size);
    }
  });

  events.forEach(event => drawFocus(ctx, scene, event, t));
};

const drawFocus = (ctx: CanvasRenderingContext2D, scene: Scene, event: FocusEvent, t: number) => {
  const { width, height, paths } = scene;
  const { id, v, accent, target } = event;

  // 照準が流れている字を捕まえ、その字の座標まで移動する
  const moveP = easeInOutCubic(clamp01((v - 0.3) / 0.7));
  const sourceX = rowMetrics(scene, target.rowIndex, v < 0.3 ? t : event.start + 0.3).slotX(target.slot);
  const gx = sourceX + (latticeX(scene, target.lo) - sourceX) * moveP;
  const gy = target.metrics.y + (latticeY(scene, target.hi) - target.metrics.y) * moveP;
  const ghostSize = height * ghostScale;
  const fade = 1 - clamp01((v - 2.5) / 0.4);
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

  if (v < 0.95 || v > 2.9) {
    return;
  }

  // 部品1つを管1本とみなし、ネオン管のように不規則に点灯し、不規則に落ちる
  const frame = Math.floor(v * 30);
  const tubes = [...target.binary].map((bit, partIndex): number => {
    const seed = id * 8 + partIndex;
    const onAt = 1.0 + hash(seed) * 0.35;
    const offAt = 2.45 + hash(seed + 0.3) * 0.4;
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
  const litCount = [...target.binary].filter(bit => bit === '1').length;
  const lit = tubes.reduce((sum, value) => sum + value, 0) / Math.max(1, litCount);
  const presence = clamp01((v - 0.95) / 0.15) * fade;

  // 周囲の帯を沈めて字を浮かせる
  const shade = ctx.createRadialGradient(gx, gy, 0, gx, gy, ghostSize * 1.2);
  shade.addColorStop(0, 'rgba(2, 4, 9, 0.85)');
  shade.addColorStop(1, 'rgba(2, 4, 9, 0)');
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = presence;
  ctx.fillStyle = shade;
  ctx.fillRect(gx - ghostSize * 1.2, gy - ghostSize * 1.2, ghostSize * 2.4, ghostSize * 2.4);
  ctx.globalCompositeOperation = 'lighter';

  const aura = ctx.createRadialGradient(gx, gy, 0, gx, gy, ghostSize * 1.4);
  aura.addColorStop(0, accent);
  aura.addColorStop(1, `${accent}00`);
  ctx.globalAlpha = 0.3 * lit;
  ctx.fillStyle = aura;
  ctx.fillRect(gx - ghostSize * 1.4, gy - ghostSize * 1.4, ghostSize * 2.8, ghostSize * 2.8);

  // 点かない管もガラスとしてうっすら見せる
  ctx.save();
  ctx.translate(gx - ghostSize / 2, gy - ghostSize / 2);
  ctx.scale(ghostSize / 1000, ghostSize / 1000);
  ctx.fillStyle = '#ffffff';
  paths.forEach((path, partIndex) => {
    ctx.globalAlpha = target.binary[partIndex] === '1' ? Math.max(tubes[partIndex], 0.06 * presence) : 0.06 * presence;
    ctx.fill(path);
  });
  ctx.restore();
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

type AlevSignalDemoClientProps = {
  // コーパスの各行をビット表現の配列にしたもの
  sentences: string[][];
};

const AlevSignalDemoClient: FC<AlevSignalDemoClientProps> = props => {
  const { sentences } = props;
  const canvasRef = useRef<HTMLCanvasElement>(null);

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
    const sprites = new Map<string, HTMLCanvasElement>();
    const chunks = new Map<string, (string | null)[]>();
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // 描画はすべて時刻から決まるので、起点をずらしてリロードのたびに違う状況から始める
    const origin = Math.random() * 100000;
    let dpr = 1;
    let frameId = 0;

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
        paths.forEach((path, index) => binary[index] === '1' && imageCtx.fill(path));
      }
      sprites.set(key, image);
      return image;
    };

    // 帯ごとにコーパスの文を空白を挟んで並べる。区切りごとに位置から決まる文を選ぶので、何度流れても同じ並びにならない
    const glyphAt = (rowIndex: number, slot: number) => {
      const chunk = Math.floor(slot / rowChunk);
      const key = `${rowIndex}:${chunk}`;
      let glyphs = chunks.get(key);
      if (!glyphs) {
        glyphs = [];
        let sentence = Math.floor(hash(rowIndex * 7.919 + chunk * 1.37) * sentences.length);
        while (sentences.length > 0 && glyphs.length < rowChunk) {
          glyphs.push(...sentences[sentence % sentences.length], null, null);
          sentence += 1 + Math.floor(hash(sentence * 1.7 + chunk) * 7);
        }
        if (chunks.size > 256) {
          chunks.clear();
        }
        chunks.set(key, glyphs);
      }
      return glyphs[slot - chunk * rowChunk] ?? null;
    };

    const scene: Scene = { width: 0, height: 0, paths, glyphAt, sprite, targets: new Map() };

    const render = (t: number) => {
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

    resizeObserver.observe(canvas);
    if (!reducedMotion) {
      intersectionObserver.observe(canvas);
    }

    return () => {
      cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
    };
  }, [sentences]);

  return (
    <div className={styles.panel}>
      <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />
    </div>
  );
};

export default AlevSignalDemoClient;
