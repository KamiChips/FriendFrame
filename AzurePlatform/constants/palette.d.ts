export type ThemeName = "light" | "dark";

export type Palette = {
  canvas: string;
  surface: string;
  soft: string;
  line: string;
  ink: string;
  muted: string;
  faint: string;
  link: string;
  accent: string;
  accentSoft: string;
  onAccentSoft: string;
  action: string;
  onAction: string;
  success: string;
  successSoft: string;
  noticeSoft: string;
  onNoticeSoft: string;
  danger: string;
  dangerSoft: string;
  onDangerSoft: string;
  warnSoft: string;
  onWarnSoft: string;
  highlight: string;
};

export type Tone = keyof Palette;

export const palette: Record<ThemeName, Palette>;
export const chartSeries: string[];
