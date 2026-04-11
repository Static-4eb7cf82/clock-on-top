import { ClockSettings, GeneralSettings } from "../settings";

export interface GeneralSectionProps {
  local: GeneralSettings;
  update: (updates: Partial<GeneralSettings>) => void;
  resetOne: (key: keyof GeneralSettings) => void;
  isDiff: (key: keyof GeneralSettings) => boolean;
  onResetAll: () => void;
}

export interface ClockStyleSectionProps {
  local: ClockSettings;
  update: (updates: Partial<ClockSettings>) => void;
  resetOne: (key: keyof ClockSettings) => void;
  isDiff: (key: keyof ClockSettings) => boolean;
  onResetAll: () => void;
}
