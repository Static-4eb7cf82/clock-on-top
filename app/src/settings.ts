export interface ClockSettings {
  fontFamily: string;
  fontSize: number;
  foregroundColor: string;
  foregroundOpacity: number;
  backgroundColor: string;
  backgroundOpacity: number;
  borderRadius: number;
  textShadow: string;
  paddingVertical: string;
  paddingHorizontal: string;
}

export interface GeneralSettings {
  enableAutomaticUpdates: boolean;
}

export interface SettingsFile {
  general: GeneralSettings;
  clock: ClockSettings;
}

export const CLOCK_DEFAULTS: ClockSettings = {
  fontFamily: "Space Grotesk",
  fontSize: 26,
  foregroundColor: "#ffffff",
  foregroundOpacity: 0.9,
  backgroundColor: "#000000",
  backgroundOpacity: 0.2,
  borderRadius: 8,
  textShadow: "1px 1px 3px rgba(0,0,0,0.5)",
  paddingVertical: "0em",
  paddingHorizontal: "0.2em",
};

export const GENERAL_DEFAULTS: GeneralSettings = {
  enableAutomaticUpdates: true,
};

export const DEFAULT_SETTINGS_FILE: SettingsFile = {
  clock: CLOCK_DEFAULTS,
  general: GENERAL_DEFAULTS,
};

export function hexToRgba(hex: string, alpha: number): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return `rgba(0,0,0,${alpha})`;
  const r = parseInt(result[1], 16);
  const g = parseInt(result[2], 16);
  const b = parseInt(result[3], 16);
  return `rgba(${r},${g},${b},${alpha})`;
}
