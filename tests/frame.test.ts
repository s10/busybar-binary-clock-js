import assert from "node:assert/strict";
import { test } from "node:test";
import { frameGrid, timeDigits } from "../src/frame.ts";
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
    ["rectangle", "tight", 4, 21, 49],
    ["rectangle", "medium", 4, 19, 52],
    ["rectangle", "wide", 4, 15, 56],
  ];

  for (const [shape, spacing, n, first, last] of cases) {
    const row = frameGrid([1, 4, 5, 4, 3, 7].slice(0, n), { ...DEFAULTS, shape, spacing })[1];
    assert.deepEqual([row.search(/[o#]/), row.search(/[o#]\.*$/)], [first, last], `${shape} ${spacing} ${n}`);
  }
});
