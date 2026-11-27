const COLOR_PRESETS = {
  green: "#00FF00",
  amber: "#FFB000",
  red: "#FF0000",
  cyan: "#00FFFF",
  white: "#FFFFFF",
} as const;

const COLORS = [...Object.keys(COLOR_PRESETS), "custom"] as ColorPreset[];
const SHAPES = ["square", "rectangle", "long", "fill"] as const;
const SPACINGS = ["tight", "medium", "wide"] as const;
const TIME_FORMATS = ["24h", "12h"] as const;
const EFFECTS = ["none", "fade"] as const;

const HEX_COLOR = /^#[0-9a-fA-F]{6}([0-9a-fA-F]{2})?$/;

export type ColorPreset = keyof typeof COLOR_PRESETS | "custom";
export type Shape = (typeof SHAPES)[number];
export type Spacing = (typeof SPACINGS)[number];
export type TimeFormat = (typeof TIME_FORMATS)[number];
export type Effect = (typeof EFFECTS)[number];

export interface Settings {
  color: ColorPreset;
  custom_color: string;
  shape: Shape;
  spacing: Spacing;
  show_seconds: boolean;
  time_format: TimeFormat;
  effect: Effect;
}

export const DEFAULTS: Settings = {
  color: "green",
  custom_color: "#00FF00",
  shape: "square",
  spacing: "medium",
  show_seconds: true,
  time_format: "24h",
  effect: "none",
};

export const OFF_COLOR = "#262626";
export const BACKGROUND = "#000000";

function oneOf<T extends string>(allowed: readonly T[], value: unknown, fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

export function resolveSettings(values: unknown): Settings {
  const v = (typeof values === "object" && values !== null ? values : {}) as Record<string, unknown>;
  const custom = v.custom_color;

  return {
    color: oneOf(COLORS, v.color, DEFAULTS.color),
    custom_color: typeof custom === "string" && HEX_COLOR.test(custom) ? custom.slice(0, 7) : DEFAULTS.custom_color,
    shape: oneOf(SHAPES, v.shape, DEFAULTS.shape),
    spacing: oneOf(SPACINGS, v.spacing, DEFAULTS.spacing),
    show_seconds: typeof v.show_seconds === "boolean" ? v.show_seconds : DEFAULTS.show_seconds,
    time_format: oneOf(TIME_FORMATS, v.time_format, DEFAULTS.time_format),
    effect: oneOf(EFFECTS, v.effect, DEFAULTS.effect),
  };
}

export function onColor(settings: Settings): string {
  return settings.color === "custom" ? settings.custom_color : COLOR_PRESETS[settings.color];
}

/** A color between two "#RRGGBB" colors; t is 0 for the first and 1 for the second. */
export function mix(from: string, to: string, t: number): string {
  const part = (i: number) => {
    const a = parseInt(from.slice(i, i + 2), 16);
    const b = parseInt(to.slice(i, i + 2), 16);
    return ("0" + Math.round(a + (b - a) * t).toString(16)).slice(-2);
  };

  return "#" + part(1) + part(3) + part(5);
}

/** A color for every symbol of a frame; "a" and "b" are the in-between levels of the fade. */
export function framePalette(settings: Settings): Record<string, string> {
  const on = onColor(settings);

  return { ".": BACKGROUND, o: OFF_COLOR, a: mix(OFF_COLOR, on, 1 / 3), b: mix(OFF_COLOR, on, 2 / 3), "#": on };
}
