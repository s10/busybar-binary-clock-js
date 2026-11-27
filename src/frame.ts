import type { Settings, Shape, Spacing } from "./settings.ts";

export const WIDTH = 72;
export const HEIGHT = 16;

const BIT_HEIGHT = 3;
const FIXED_BIT_WIDTH: Record<Exclude<Shape, "fill">, number> = { square: 3, rectangle: 6, long: 9 };

interface Gaps {
  pair: number;
  group: number;
}

const GAPS: Record<Spacing, Gaps> = {
  tight: { pair: 1, group: 3 },
  medium: { pair: 2, group: 6 },
  wide: { pair: 4, group: 10 },
};

const WIDEST_FIRST: Spacing[] = ["wide", "medium", "tight"];

function gapsWidth(columns: number, gaps: Gaps): number {
  const pairs = columns / 2;
  return pairs * gaps.pair + (pairs - 1) * gaps.group;
}

function layout(settings: Settings, columns: number): { bit: number; gaps: Gaps } {
  if (settings.shape === "fill") {
    const gaps = GAPS[settings.spacing];
    return { bit: Math.floor((WIDTH - gapsWidth(columns, gaps)) / columns), gaps };
  }

  const bit = FIXED_BIT_WIDTH[settings.shape];
  let i = WIDEST_FIRST.indexOf(settings.spacing);
  while (i < WIDEST_FIRST.length - 1 && columns * bit + gapsWidth(columns, GAPS[WIDEST_FIRST[i]]) > WIDTH) {
    i++;
  }

  return { bit, gaps: GAPS[WIDEST_FIRST[i]] };
}

export function msToNextSecond(nowMs: number): number {
  return 1000 - (nowMs % 1000);
}

/** Tens and ones of hours, minutes and, with show_seconds, seconds. */
export function timeDigits(now: Date, settings: Settings): number[] {
  const hours = settings.time_format === "12h" ? now.getHours() % 12 || 12 : now.getHours();
  const parts = [hours, now.getMinutes()];
  if (settings.show_seconds) {
    parts.push(now.getSeconds());
  }

  const digits: number[] = [];
  for (const part of parts) {
    digits.push(Math.floor(part / 10), part % 10);
  }

  return digits;
}

/** One string per column, top bit first: "o" 0 bit, "#" 1 bit. */
export function bitColumns(digits: number[]): string[] {
  return digits.map((digit) => [3, 2, 1, 0].map((place) => ((digit >> place) & 1 ? "#" : "o")).join(""));
}

/** Columns on the way from one time to the next: a changing bit is "a" (one third lit) or "b" (two thirds). */
export function fadeColumns(from: number[], to: number[], step: 1 | 2): string[] {
  const was = bitColumns(from);

  return bitColumns(to).map((column, c) =>
    [...column].map((bit, r) => (bit === was[c][r] ? bit : (bit === "#") === (step === 2) ? "b" : "a")).join(""),
  );
}

export function frameGrid(digits: number[], settings: Settings): string[] {
  return renderGrid(bitColumns(digits), settings);
}

/** HEIGHT rows of WIDTH characters: "." background, then the symbol of each bit. */
export function renderGrid(columns: string[], settings: Settings): string[] {
  const { bit, gaps } = layout(settings, columns.length);
  const width = columns.length * bit + gapsWidth(columns.length, gaps);
  const left = Math.floor((WIDTH - width) / 2);
  const blank = ".".repeat(WIDTH);

  const grid = [blank];
  for (let r = 0; r < 4; r++) {
    let row = ".".repeat(left);
    columns.forEach((column, c) => {
      row += column[r].repeat(bit);
      if (c < columns.length - 1) {
        row += ".".repeat(c % 2 === 0 ? gaps.pair : gaps.group);
      }
    });
    row += ".".repeat(WIDTH - row.length);

    for (let i = 0; i < BIT_HEIGHT; i++) {
      grid.push(row);
    }
    if (r < 3) {
      grid.push(blank);
    }
  }

  return grid;
}
