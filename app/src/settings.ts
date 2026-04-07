export interface ClockSettings {
  fontFamily: string;
  fontSize: number;
  foregroundColor: string;
  foregroundOpacity: number;
  backgroundColor: string;
  backgroundOpacity: number;
  textShadow: string;
  paddingVertical: string;
  paddingHorizontal: string;
}

export const DEFAULTS: ClockSettings = {
  fontFamily: "Space Grotesk",
  fontSize: 26,
  foregroundColor: "#ffffff",
  foregroundOpacity: 0.9,
  backgroundColor: "#000000",
  backgroundOpacity: 0.2,
  textShadow: "",
  paddingVertical: "0em",
  paddingHorizontal: "0.2em",
};

export function hexToRgba(hex: string, alpha: number): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return `rgba(0,0,0,${alpha})`;
  const r = parseInt(result[1], 16);
  const g = parseInt(result[2], 16);
  const b = parseInt(result[3], 16);
  return `rgba(${r},${g},${b},${alpha})`;
}
