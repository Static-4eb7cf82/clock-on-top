import { useState, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { CssVarsProvider } from "@mui/joy/styles";
import Box from "@mui/joy/Box";
import Sheet from "@mui/joy/Sheet";
import Typography from "@mui/joy/Typography";
import FormControl from "@mui/joy/FormControl";
import FormLabel from "@mui/joy/FormLabel";
import Input from "@mui/joy/Input";
import Slider from "@mui/joy/Slider";
import IconButton from "@mui/joy/IconButton";
import Button from "@mui/joy/Button";
import Stack from "@mui/joy/Stack";
import Divider from "@mui/joy/Divider";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import RestartAltRoundedIcon from "@mui/icons-material/RestartAltRounded";
import { ClockSettings, DEFAULTS } from "../settings";

// ── Row wrapper ──────────────────────────────────────────────────────────────

interface SettingRowProps {
  label: string;
  isDirty: boolean;
  onReset: () => void;
  children: React.ReactNode;
}

function SettingRow({ label, isDirty, onReset, children }: SettingRowProps) {
  return (
    <FormControl>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 0.75,
        }}
      >
        <FormLabel sx={{ mb: 0, fontFamily: "Inter, sans-serif" }}>
          {label}
        </FormLabel>
        {isDirty && (
          <IconButton
            size="sm"
            variant="plain"
            color="neutral"
            onClick={onReset}
            title="Reset to default"
          >
            <RestartAltRoundedIcon sx={{ fontSize: 15 }} />
          </IconButton>
        )}
      </Box>
      {children}
    </FormControl>
  );
}

// ── Color + Opacity row ───────────────────────────────────────────────────────

interface ColorRowProps {
  colorValue: string;
  opacityValue: number;
  onColorChange: (v: string) => void;
  onOpacityChange: (v: number) => void;
}

function ColorRow({
  colorValue,
  opacityValue,
  onColorChange,
  onOpacityChange,
}: ColorRowProps) {
  return (
    <Stack direction="row" spacing={1.5} alignItems="center">
      <input
        type="color"
        value={colorValue}
        onChange={(e) => onColorChange(e.target.value)}
        style={{
          width: 36,
          height: 28,
          padding: 2,
          border: "1px solid var(--joy-palette-neutral-outlinedBorder)",
          borderRadius: 4,
          background: "none",
          cursor: "pointer",
          flexShrink: 0,
        }}
      />
      <Box sx={{ flex: 1 }}>
        <Slider
          size="sm"
          min={0}
          max={1}
          step={0.01}
          value={opacityValue}
          onChange={(_, v) => onOpacityChange(v as number)}
        />
      </Box>
      <Typography
        level="body-xs"
        sx={{ minWidth: 34, textAlign: "right", fontVariantNumeric: "tabular-nums" }}
      >
        {Math.round(opacityValue * 100)}%
      </Typography>
    </Stack>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

function Settings() {
  const [local, setLocal] = useState<ClockSettings>(DEFAULTS);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    invoke<ClockSettings>("read_settings").then(setLocal).catch(console.error);
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  const save = (next: ClockSettings) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      invoke("write_settings", { settings: next }).catch(console.error);
    }, 300);
  };

  const update = (updates: Partial<ClockSettings>) => {
    setLocal((prev) => {
      const next = { ...prev, ...updates };
      save(next);
      return next;
    });
  };

  const resetOne = <K extends keyof ClockSettings>(key: K) =>
    update({ [key]: DEFAULTS[key] });

  const isDiff = <K extends keyof ClockSettings>(key: K) =>
    local[key] !== DEFAULTS[key];

  const resetAll = () => {
    setLocal(DEFAULTS);
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    invoke("write_settings", { settings: DEFAULTS }).catch(console.error);
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
    <CssVarsProvider defaultMode="dark">
      <Sheet
        sx={{
          width: "100vw",
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          fontFamily: "Inter, sans-serif",
          bgcolor: "#f7f8fa",
          color: "#101418",
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
            px: 2,
            py: 1.25,
            cursor: "grab",
            userSelect: "none",
            borderBottom: "1px solid",
            borderColor: "divider",
            flexShrink: 0,
          }}
        >
          <Typography
            level="title-sm"
            sx={{ fontFamily: "Inter, sans-serif", fontWeight: 600, color: "#101418" }}
          >
            Clock Settings
          </Typography>
          <IconButton
            size="sm"
            variant="plain"
            color="neutral"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={() =>
              invoke("close_settings_window").catch(console.error)
            }
            title="Close"
          >
            <CloseRoundedIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Box>

        {/* ── Settings content ── */}
        <Box
          sx={{
            flex: 1,
            overflowY: "auto",
            px: 2.5,
            py: 2.5,
            display: "flex",
            flexDirection: "column",
            gap: 0,
          }}
        >
          <Stack spacing={2.5}>
            {/* Font Family */}
            <SettingRow
              label="Font Family"
              isDirty={isDiff("fontFamily")}
              onReset={() => resetOne("fontFamily")}
            >
              <Input
                size="sm"
                value={local.fontFamily}
                onChange={(e) => update({ fontFamily: e.target.value })}
                placeholder="e.g. Space Grotesk"
                sx={{ fontFamily: `${local.fontFamily}, sans-serif` }}
              />
            </SettingRow>

            {/* Font Size */}
            <SettingRow
              label={`Font Size — ${local.fontSize}px`}
              isDirty={isDiff("fontSize")}
              onReset={() => resetOne("fontSize")}
            >
              <Slider
                size="sm"
                min={10}
                max={96}
                step={1}
                value={local.fontSize}
                onChange={(_, v) => update({ fontSize: v as number })}
              />
            </SettingRow>

            <Divider />

            {/* Foreground Color */}
            <SettingRow
              label="Text Color & Opacity"
              isDirty={isDiff("foregroundColor") || isDiff("foregroundOpacity")}
              onReset={() =>
                update({
                  foregroundColor: DEFAULTS.foregroundColor,
                  foregroundOpacity: DEFAULTS.foregroundOpacity,
                })
              }
            >
              <ColorRow
                colorValue={local.foregroundColor}
                opacityValue={local.foregroundOpacity}
                onColorChange={(v) => update({ foregroundColor: v })}
                onOpacityChange={(v) => update({ foregroundOpacity: v })}
              />
            </SettingRow>

            {/* Background Color */}
            <SettingRow
              label="Background Color & Opacity"
              isDirty={
                isDiff("backgroundColor") || isDiff("backgroundOpacity")
              }
              onReset={() =>
                update({
                  backgroundColor: DEFAULTS.backgroundColor,
                  backgroundOpacity: DEFAULTS.backgroundOpacity,
                })
              }
            >
              <ColorRow
                colorValue={local.backgroundColor}
                opacityValue={local.backgroundOpacity}
                onColorChange={(v) => update({ backgroundColor: v })}
                onOpacityChange={(v) => update({ backgroundOpacity: v })}
              />
            </SettingRow>

            <Divider />

            {/* Text Shadow */}
            <SettingRow
              label="Text Shadow"
              isDirty={isDiff("textShadow")}
              onReset={() => resetOne("textShadow")}
            >
              <Input
                size="sm"
                value={local.textShadow}
                placeholder="e.g. 1px 1px 3px rgba(0,0,0,0.9)"
                onChange={(e) => update({ textShadow: e.target.value })}
              />
            </SettingRow>

            <Divider />

            {/* Padding */}
            <SettingRow
              label="Padding"
              isDirty={isDiff("paddingVertical") || isDiff("paddingHorizontal")}
              onReset={() =>
                update({
                  paddingVertical: DEFAULTS.paddingVertical,
                  paddingHorizontal: DEFAULTS.paddingHorizontal,
                })
              }
            >
              <Stack direction="row" spacing={1.5}>
                <FormControl size="sm" sx={{ flex: 1 }}>
                  <FormLabel sx={{ fontFamily: "Inter, sans-serif" }}>
                    Vertical
                  </FormLabel>
                  <Input
                    size="sm"
                    value={local.paddingVertical}
                    placeholder="0em"
                    onChange={(e) => update({ paddingVertical: e.target.value })}
                  />
                </FormControl>
                <FormControl size="sm" sx={{ flex: 1 }}>
                  <FormLabel sx={{ fontFamily: "Inter, sans-serif" }}>
                    Horizontal
                  </FormLabel>
                  <Input
                    size="sm"
                    value={local.paddingHorizontal}
                    placeholder="0.2em"
                    onChange={(e) =>
                      update({ paddingHorizontal: e.target.value })
                    }
                  />
                </FormControl>
              </Stack>
            </SettingRow>
          </Stack>
        </Box>

        {/* ── Footer ── */}
        <Box
          sx={{
            px: 2.5,
            py: 2,
            borderTop: "1px solid",
            borderColor: "divider",
            flexShrink: 0,
          }}
        >
          <Button
            variant="soft"
            color="neutral"
            size="sm"
            fullWidth
            onClick={resetAll}
            sx={{ fontFamily: "Inter, sans-serif" }}
          >
            Reset All to Defaults
          </Button>
        </Box>
      </Sheet>
    </CssVarsProvider>
  );
}

export default Settings;
