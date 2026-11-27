import type { Settings, Shape, Spacing } from "./settings.ts";

export const WIDTH = 72;
export const HEIGHT = 16;

const BIT_HEIGHT = 3;
const BIT_WIDTH: Record<Shape, number> = { square: 3, rectangle: 6 };
const GAPS: Record<Spacing, { pair: number; group: number }> = {
  tight: { pair: 1, group: 3 },
  medium: { pair: 2, group: 6 },
  wide: { pair: 4, group: 10 },
};

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
  const bitWidth = BIT_WIDTH[settings.shape];
  const gaps = GAPS[settings.spacing];
  const pairs = digits.length / 2;
  const width = digits.length * bitWidth + pairs * gaps.pair + (pairs - 1) * gaps.group;
  const left = Math.floor((WIDTH - width) / 2);
  const blank = ".".repeat(WIDTH);

  const grid = [blank];
  for (let bit = 3; bit >= 0; bit--) {
    let row = ".".repeat(left);
    digits.forEach((digit, column) => {
      row += ((digit >> bit) & 1 ? "#" : "o").repeat(bitWidth);
      if (column < digits.length - 1) {
        row += ".".repeat(column % 2 === 0 ? gaps.pair : gaps.group);
      }
    });
    row += ".".repeat(WIDTH - row.length);

    for (let i = 0; i < BIT_HEIGHT; i++) {
      grid.push(row);
    }
    if (bit > 0) {
      grid.push(blank);
    }
  }

  return grid;
}
