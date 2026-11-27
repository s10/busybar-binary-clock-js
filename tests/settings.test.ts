import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { DEFAULTS, onColor, resolveSettings, type ColorPreset } from "../src/settings.ts";

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
