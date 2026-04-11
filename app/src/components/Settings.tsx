import { useState, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { CssVarsProvider } from "@mui/joy/styles";
import CssBaseline from "@mui/joy/CssBaseline";
import Box from "@mui/joy/Box";
import Sheet from "@mui/joy/Sheet";
import Typography from "@mui/joy/Typography";
import IconButton from "@mui/joy/IconButton";
import Button from "@mui/joy/Button";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import TuneRoundedIcon from '@mui/icons-material/TuneRounded';
import PaletteRoundedIcon from '@mui/icons-material/PaletteRounded';
import { ClockSettings, GeneralSettings, SETTINGS_DEFAULTS, SettingsFile } from "../settings";
import ClockStyleSectionSettings from "./ClockStyleSectionSettings";
import GeneralSectionSettings from "./GeneralSectionSettings";

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

  const resetAll = () => {
    setLocal(SETTINGS_DEFAULTS);
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    invoke("write_settings", { settings: SETTINGS_DEFAULTS }).catch(
      console.error,
    );
  };

  const handleTitleBarMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) {
      try {
        getCurrentWindow().startDragging().catch(console.error);
      } catch (err) {
        console.error("Failed to start dragging:", err);
      }
    }
  };

  return (
    <CssVarsProvider defaultMode="dark" modeStorageKey="clock-on-top-settings-mode">
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
        {/* ── Title bar ── */}
        <Box
          onMouseDown={handleTitleBarMouseDown}
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            pl: 2,
            pr: 0.5,
            py: 0.5,
            userSelect: "none",
            borderBottom: "1px solid",
            borderColor: "neutral.outlinedBorder",
            flexShrink: 0,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
            <img
              src="/app-icon.png"
              alt="Clock On Top"
              style={{ width: 16, height: 16 }}
            />
            <Typography level="body-xs">
              Settings
            </Typography>
          </Box>
          <IconButton
            size="sm"
            color="neutral"
            onMouseDown={(e) => e.stopPropagation()}
            variant="soft"
            onClick={() => invoke("close_settings_window").catch(console.error)}
            sx={{ minWidth: 24, minHeight: 24, width: 24, height: 24 }}
          >
            <CloseRoundedIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Box>

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
                onResetAll={resetAll}
              />
            ) : (
              <ClockStyleSectionSettings
                local={local.clock}
                update={updateClock}
                resetOne={resetClockOne}
                isDiff={isClockDiff}
                onResetAll={resetAll}
              />
            )}
          </Box>
        </Box>
      </Sheet>
    </CssVarsProvider>
  );
}

export default Settings;
