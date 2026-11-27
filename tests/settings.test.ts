import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { DEFAULTS, framePalette, mix, onColor, resolveSettings, type ColorPreset } from "../src/settings.ts";

test("no values give the defaults", () => {
  for (const v of [undefined, null, {}, "x", 5]) {
    assert.deepEqual(resolveSettings(v), DEFAULTS);
  }
});

test("valid values are kept", () => {
  const v = {
    color: "amber",
    custom_color: "#12ab34",
    shape: "rectangle",
    spacing: "wide",
    show_seconds: false,
    time_format: "12h",
    effect: "fade",
  };
  assert.deepEqual(resolveSettings(v), v);
});

test("every shape is accepted", () => {
  for (const shape of ["square", "rectangle", "long", "fill"]) {
    assert.equal(resolveSettings({ shape }).shape, shape);
  }
});

test("a bad field falls back alone", () => {
  const s = resolveSettings({ color: "pink", shape: "rectangle", spacing: 3, show_seconds: 0, time_format: "12h" });
  assert.deepEqual(s, { ...DEFAULTS, shape: "rectangle", time_format: "12h" });
});

test("custom color drops alpha and rejects non-hex", () => {
  assert.equal(resolveSettings({ custom_color: "#12AB34FF" }).custom_color, "#12AB34");
  for (const bad of ["red", "", "#123", "#12AB3G", 7]) {
    assert.equal(resolveSettings({ custom_color: bad }).custom_color, "#00FF00");
  }
});

test("onColor maps presets and custom", () => {
  const of = (color: string) => onColor({ ...DEFAULTS, color: color as ColorPreset, custom_color: "#123456" });
  assert.deepEqual(
    ["green", "amber", "red", "cyan", "white", "custom"].map(of),
    ["#00FF00", "#FFB000", "#FF0000", "#00FFFF", "#FFFFFF", "#123456"],
  );
});

test("settings.json offers what the code accepts", () => {
  const schema = JSON.parse(readFileSync(new URL("../src/appmeta/settings.json", import.meta.url), "utf8"));
  const fields: Record<string, { default: unknown; options?: { value: string }[] }> = schema.fields;

  assert.deepEqual(Object.keys(fields), Object.keys(DEFAULTS));

  for (const [key, field] of Object.entries(fields)) {
    assert.equal(field.default, DEFAULTS[key as keyof typeof DEFAULTS], key);

    for (const option of field.options ?? []) {
      const resolved = resolveSettings({ [key]: option.value });
      assert.equal(resolved[key as keyof typeof DEFAULTS], option.value, key + " " + option.value);
    }
  }
});

test("the change effect is off unless asked for", () => {
  assert.equal(DEFAULTS.effect, "none");
  assert.equal(resolveSettings({ effect: "fade" }).effect, "fade");
  assert.equal(resolveSettings({ effect: "sparkle" }).effect, "none");
});

test("mix blends two colors", () => {
  assert.equal(mix("#262626", "#00FF00", 0), "#262626");
  assert.equal(mix("#262626", "#00FF00", 1 / 3), "#196e19");
  assert.equal(mix("#262626", "#00FF00", 2 / 3), "#0db70d");
  assert.equal(mix("#262626", "#00FF00", 1), "#00ff00");
});

test("framePalette has a color for every symbol a frame can hold", () => {
  assert.deepEqual(framePalette({ ...DEFAULTS, color: "red" }), {
    ".": "#000000",
    o: "#262626",
    a: "#6e1919",
    b: "#b70d0d",
    "#": "#FF0000",
  });
});
