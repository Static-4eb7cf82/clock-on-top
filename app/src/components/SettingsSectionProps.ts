import {
  ClockSettings,
  GeneralSettings,
  VisibilitySettings,
} from "../settings";

export interface GeneralSectionProps {
  local: GeneralSettings;
  update: (updates: Partial<GeneralSettings>) => void;
  resetOne: (key: keyof GeneralSettings) => void;
  isDiff: (key: keyof GeneralSettings) => boolean;
  onResetAll: () => void;
}

export interface VisibilitySectionProps {
  local: VisibilitySettings;
  update: (updates: Partial<VisibilitySettings>) => void;
  resetOne: <K extends keyof VisibilitySettings>(key: K) => void;
  isDiff: <K extends keyof VisibilitySettings>(key: K) => boolean;
  onResetAll: () => void;
}

export interface ClockStyleSectionProps {
  local: ClockSettings;
  update: (updates: Partial<ClockSettings>) => void;
  resetOne: (key: keyof ClockSettings) => void;
  isDiff: (key: keyof ClockSettings) => boolean;
  onResetAll: () => void;
}
