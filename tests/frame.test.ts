import assert from "node:assert/strict";
import { test } from "node:test";
import { frameGrid, msToNextSecond, timeDigits } from "../src/frame.ts";
import { DEFAULTS, type Shape, type Spacing } from "../src/settings.ts";

const at = (h: number, m: number, s: number) => new Date(2026, 10, 27, h, m, s);
const h12 = { ...DEFAULTS, time_format: "12h" as const };

test("timeDigits, 24h", () => {
  assert.deepEqual(timeDigits(at(14, 54, 37), DEFAULTS), [1, 4, 5, 4, 3, 7]);
  assert.deepEqual(timeDigits(at(0, 0, 0), DEFAULTS), [0, 0, 0, 0, 0, 0]);
  assert.deepEqual(timeDigits(at(9, 7, 3), DEFAULTS), [0, 9, 0, 7, 0, 3]);
});

test("timeDigits without seconds", () => {
  assert.deepEqual(timeDigits(at(14, 54, 37), { ...DEFAULTS, show_seconds: false }), [1, 4, 5, 4]);
});

test("timeDigits, 12h", () => {
  assert.deepEqual(timeDigits(at(0, 5, 9), h12), [1, 2, 0, 5, 0, 9]);
  assert.deepEqual(timeDigits(at(12, 5, 9), h12), [1, 2, 0, 5, 0, 9]);
  assert.deepEqual(timeDigits(at(14, 54, 37), h12), [0, 2, 5, 4, 3, 7]);
  assert.deepEqual(timeDigits(at(23, 59, 59), h12), [1, 1, 5, 9, 5, 9]);
});

test("frameGrid, default settings, 14:54:37", () => {
  const g = frameGrid([1, 4, 5, 4, 3, 7], DEFAULTS);
  assert.equal(g.length, 16);
  assert.ok(g.every((row) => row.length === 72));

  const blank = ".".repeat(72);
  for (const y of [0, 4, 8, 12]) {
    assert.equal(g[y], blank);
  }

  const rows = [
    "..................ooo..ooo......ooo..ooo......ooo..ooo..................",
    "..................ooo..###......###..###......ooo..###..................",
    "..................ooo..ooo......ooo..ooo......###..###..................",
    "..................###..ooo......###..ooo......###..###..................",
  ];
  rows.forEach((row, r) => {
    for (const dy of [0, 1, 2]) {
      assert.equal(g[1 + r * 4 + dy], row);
    }
  });
});

test("frameGrid bits, 8 on top", () => {
  const g = frameGrid([0, 8, 9, 6, 1, 2], DEFAULTS);
  const bits = (x: number) => [1, 5, 9, 13].map((y) => g[y][x]).join("");
  assert.deepEqual([18, 23, 32, 37, 46, 51].map(bits), ["oooo", "#ooo", "#oo#", "o##o", "ooo#", "oo#o"]);
});

test("frameGrid span for every shape, spacing and column count", () => {
  const cases: [Shape, Spacing, number, number, number][] = [
    ["square", "tight", 6, 22, 48],
    ["square", "medium", 6, 18, 53],
    ["square", "wide", 6, 11, 60],
    ["square", "tight", 4, 27, 43],
    ["square", "medium", 4, 25, 46],
    ["square", "wide", 4, 21, 50],
    ["rectangle", "tight", 6, 13, 57],
    ["rectangle", "medium", 6, 9, 62],
    ["rectangle", "wide", 6, 2, 69],
    ["rectangle", "tight", 4, 13, 57],
    ["rectangle", "medium", 4, 9, 62],
    ["rectangle", "wide", 4, 3, 68],
  ];

  for (const [shape, spacing, n, first, last] of cases) {
    const row = frameGrid([1, 4, 5, 4, 3, 7].slice(0, n), { ...DEFAULTS, shape, spacing })[1];
    assert.deepEqual([row.search(/[o#]/), row.search(/[o#]\.*$/)], [first, last], `${shape} ${spacing} ${n}`);
  }
});

test("rectangle bits widen when seconds are off, squares do not", () => {
  const widths = (shape: Shape, spacing: Spacing, n: number) => {
    const row = frameGrid([8, 8, 8, 8, 8, 8].slice(0, n), { ...DEFAULTS, shape, spacing })[1];
    return (row.match(/#+/g) ?? []).map((run) => run.length);
  };

  assert.deepEqual(widths("rectangle", "tight", 6), [6, 6, 6, 6, 6, 6]);
  assert.deepEqual(widths("rectangle", "tight", 4), [10, 10, 10, 10]);
  assert.deepEqual(widths("rectangle", "medium", 4), [11, 11, 11, 11]);
  assert.deepEqual(widths("rectangle", "wide", 4), [12, 12, 12, 12]);
  assert.deepEqual(widths("square", "wide", 4), [3, 3, 3, 3]);
});

test("msToNextSecond lands on the next whole second", () => {
  assert.equal(msToNextSecond(1500), 500);
  assert.equal(msToNextSecond(1999), 1);
  assert.equal(msToNextSecond(2000), 1000);
  assert.equal(msToNextSecond(1795785600123), 877);
});
