import { useState, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { CssVarsProvider } from "@mui/joy/styles";
import CssBaseline from "@mui/joy/CssBaseline";
import { useColorScheme } from "@mui/joy/styles";
import Box from "@mui/joy/Box";
import Sheet from "@mui/joy/Sheet";
import Typography from "@mui/joy/Typography";
import Button from "@mui/joy/Button";
import TuneRoundedIcon from '@mui/icons-material/TuneRounded';
import PaletteRoundedIcon from '@mui/icons-material/PaletteRounded';
import { ClockSettings, GeneralSettings, SETTINGS_DEFAULTS, SettingsFile } from "../settings";
import ClockStyleSectionSettings from "./ClockStyleSectionSettings";
import GeneralSectionSettings from "./GeneralSectionSettings";

// ── Theme Controller ──────────────────────────────────────────────────────────

function ThemeController({ appTheme }: { appTheme: string }) {
  const { setMode } = useColorScheme();
  
  useEffect(() => {
    if (appTheme === "system") {
      setMode("system" as any);
    } else {
      setMode(appTheme as "light" | "dark");
    }
  }, [appTheme, setMode]);
  
  return null;
}

// ── Main component ────────────────────────────────────────────────────────────

function Settings() {
  const [local, setLocal] = useState<SettingsFile>(SETTINGS_DEFAULTS);
  const [activeSection, setActiveSection] = useState<"general" | "clock-style">(
    "general",
  );
  const saveTimerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    invoke<SettingsFile>("read_settings")
      .then((next) => setLocal(next))
      .catch(console.error);
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  const save = (next: SettingsFile) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      invoke("write_settings", { settings: next }).catch(console.error);
    }, 300);
  };

  const updateClock = (updates: Partial<ClockSettings>) => {
    setLocal((prev) => {
      const next = {
        ...prev,
        clock: { ...prev.clock, ...updates },
      };
      save(next);
      return next;
    });
  };

  const updateGeneral = (updates: Partial<GeneralSettings>) => {
    setLocal((prev) => {
      const next = {
        ...prev,
        general: { ...prev.general, ...updates },
      };
      save(next);
      return next;
    });
  };

  const resetClockOne = <K extends keyof ClockSettings>(key: K) =>
    updateClock({ [key]: SETTINGS_DEFAULTS.clock[key] });

  const isClockDiff = <K extends keyof ClockSettings>(key: K) =>
    local.clock[key] !== SETTINGS_DEFAULTS.clock[key];

  const resetGeneralOne = <K extends keyof GeneralSettings>(key: K) =>
    updateGeneral({ [key]: SETTINGS_DEFAULTS.general[key] });

  const isGeneralDiff = <K extends keyof GeneralSettings>(key: K) =>
    local.general[key] !== SETTINGS_DEFAULTS.general[key];

  const resetGeneralAll = () => {
    setLocal((prev) => {
      const next = {
        ...prev,
        general: SETTINGS_DEFAULTS.general,
      };
      save(next);
      return next;
    });
  };

  const resetClockAll = () => {
    setLocal((prev) => {
      const next = {
        ...prev,
        clock: SETTINGS_DEFAULTS.clock,
      };
      save(next);
      return next;
    });
  };

  return (
    <CssVarsProvider defaultMode="dark">
      <ThemeController appTheme={local.general.appTheme} />
      <CssBaseline />
      <Sheet
        sx={{
          width: "100vw",
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          bgcolor: "background.level1",
          color: "text.primary",
          overflow: "hidden",
          borderRadius: 0,
        }}
      >
        <Box
          sx={{
            flex: 1,
            minHeight: 0,
            display: "flex",
            overflow: "hidden",
          }}
        >
          <Sheet
            variant="soft"
            sx={{
              width: 200,
              borderRight: "1px solid",
              borderColor: "divider",
              p: 1,
              flexShrink: 0,
              bgcolor: "neutral.softBg",
            }}
          >
            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
              <Button
                fullWidth
                size="sm"
                color="neutral"
                variant="soft"
                startDecorator={<TuneRoundedIcon sx={{ color: activeSection === "general" ? "neutral.softActiveColor" : undefined }} />}
                onClick={() => setActiveSection("general")}
                sx={{ justifyContent: "flex-start", bgcolor: activeSection === "general" ? "neutral.softHoverBg" : undefined }}
              >
                <Typography level="body-sm" sx={{ color: activeSection === "general" ? "neutral.softActiveColor" : undefined }}>
                  General
                </Typography>
              </Button>
              <Button
                fullWidth
                size="sm"
                color="neutral"
                variant="soft"
                startDecorator={<PaletteRoundedIcon sx={{ color: activeSection === "clock-style" ? "neutral.softActiveColor" : undefined }} />}
                onClick={() => setActiveSection("clock-style")}
                sx={{ justifyContent: "flex-start", bgcolor: activeSection === "clock-style" ? "neutral.softHoverBg" : undefined }}
              >
                <Typography level="body-sm" sx={{ color: activeSection === "clock-style" ? "neutral.softActiveColor" : undefined }}>
                  Clock Style
                </Typography>
              </Button>
            </Box>
          </Sheet>

          <Box sx={{ flex: 1, minWidth: 0, minHeight: 0 }}>
            {activeSection === "general" ? (
              <GeneralSectionSettings
                local={local.general}
                update={updateGeneral}
                resetOne={resetGeneralOne}
                isDiff={isGeneralDiff}
                onResetAll={resetGeneralAll}
              />
            ) : (
              <ClockStyleSectionSettings
                local={local.clock}
                update={updateClock}
                resetOne={resetClockOne}
                isDiff={isClockDiff}
                onResetAll={resetClockAll}
              />
            )}
          </Box>
        </Box>
      </Sheet>
    </CssVarsProvider>
  );
}

export default Settings;
