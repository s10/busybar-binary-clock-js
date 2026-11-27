import type { Settings, Spacing } from "./settings.ts";

export const WIDTH = 72;
export const HEIGHT = 16;

const BIT_HEIGHT = 3;
const SQUARE_WIDTH = 3;
const RECTANGLE_WIDTH = 6;
const FULL_COLUMNS = 6;

interface Gaps {
  pair: number;
  group: number;
}

const GAPS: Record<Spacing, Gaps> = {
  tight: { pair: 1, group: 3 },
  medium: { pair: 2, group: 6 },
  wide: { pair: 4, group: 10 },
};

function gapsWidth(columns: number, gaps: Gaps): number {
  const pairs = columns / 2;
  return pairs * gaps.pair + (pairs - 1) * gaps.group;
}

/** Rectangles widen so that fewer columns keep the width of the six-column layout. */
function bitWidth(settings: Settings, columns: number): number {
  if (settings.shape === "square") {
    return SQUARE_WIDTH;
  }

  const gaps = GAPS[settings.spacing];
  const fullWidth = FULL_COLUMNS * RECTANGLE_WIDTH + gapsWidth(FULL_COLUMNS, gaps);
  return Math.floor((fullWidth - gapsWidth(columns, gaps)) / columns);
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

/** HEIGHT rows of WIDTH characters: "." background, "o" 0 bit, "#" 1 bit. */
export function frameGrid(digits: number[], settings: Settings): string[] {
  const gaps = GAPS[settings.spacing];
  const bit = bitWidth(settings, digits.length);
  const width = digits.length * bit + gapsWidth(digits.length, gaps);
  const left = Math.floor((WIDTH - width) / 2);
  const blank = ".".repeat(WIDTH);

  const grid = [blank];
  for (let place = 3; place >= 0; place--) {
    let row = ".".repeat(left);
    digits.forEach((digit, column) => {
      row += ((digit >> place) & 1 ? "#" : "o").repeat(bit);
      if (column < digits.length - 1) {
        row += ".".repeat(column % 2 === 0 ? gaps.pair : gaps.group);
      }
    });
    row += ".".repeat(WIDTH - row.length);

    for (let i = 0; i < BIT_HEIGHT; i++) {
      grid.push(row);
    }
    if (place > 0) {
      grid.push(blank);
    }
  }

  return grid;
}
