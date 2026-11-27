const COLOR_PRESETS = {
  green: "#00FF00",
  amber: "#FFB000",
  red: "#FF0000",
  cyan: "#00FFFF",
  white: "#FFFFFF",
} as const;

const COLORS = [...Object.keys(COLOR_PRESETS), "custom"] as ColorPreset[];
const SHAPES = ["square", "rectangle"] as const;
const SPACINGS = ["tight", "medium", "wide"] as const;
const TIME_FORMATS = ["24h", "12h"] as const;

const HEX_COLOR = /^#[0-9a-fA-F]{6}([0-9a-fA-F]{2})?$/;

export type ColorPreset = keyof typeof COLOR_PRESETS | "custom";
export type Shape = (typeof SHAPES)[number];
export type Spacing = (typeof SPACINGS)[number];
export type TimeFormat = (typeof TIME_FORMATS)[number];

export interface Settings {
  color: ColorPreset;
  custom_color: string;
  shape: Shape;
  spacing: Spacing;
  show_seconds: boolean;
  time_format: TimeFormat;
}

export const DEFAULTS: Settings = {
  color: "green",
  custom_color: "#00FF00",
  shape: "square",
  spacing: "medium",
  show_seconds: true,
  time_format: "24h",
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
  };
}

export function onColor(settings: Settings): string {
  return settings.color === "custom" ? settings.custom_color : COLOR_PRESETS[settings.color];
}
