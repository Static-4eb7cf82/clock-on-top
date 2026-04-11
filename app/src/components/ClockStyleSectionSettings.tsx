import Box from "@mui/joy/Box";
import Button from "@mui/joy/Button";
import Divider from "@mui/joy/Divider";
import FormControl from "@mui/joy/FormControl";
import FormLabel from "@mui/joy/FormLabel";
import IconButton from "@mui/joy/IconButton";
import Input from "@mui/joy/Input";
import Slider from "@mui/joy/Slider";
import Stack from "@mui/joy/Stack";
import Tooltip from "@mui/joy/Tooltip";
import Typography from "@mui/joy/Typography";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import RestartAltRoundedIcon from "@mui/icons-material/RestartAltRounded";
import { SETTINGS_DEFAULTS } from "../settings";
import { ClockStyleSectionProps } from "./SettingsSectionProps";

const sliderSlotSx = {
  flex: 1,
  minHeight: 28,
  display: "flex",
  alignItems: "center",
};

const sliderSx = {
  my: 0,
  py: 0,
};

interface SettingRowProps {
  label: string;
  labelAdornment?: React.ReactNode;
  isDirty: boolean;
  onReset: () => void;
  children: React.ReactNode;
}

function SettingRow({
  label,
  labelAdornment,
  isDirty,
  onReset,
  children,
}: SettingRowProps) {
  return (
    <FormControl>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          minHeight: 24,
          mb: 0.75,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, minHeight: 24 }}>
          <FormLabel
            sx={{
              mb: 0,
              lineHeight: 1,
              display: "flex",
              alignItems: "center",
              minHeight: 24,
            }}
          >
            {label}
          </FormLabel>
          {labelAdornment}
        </Box>
        <Box
          sx={{
            width: 24,
            height: 24,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {isDirty && (
            <Tooltip title="Reset to default" size="md" placement="top" variant="soft">
              <IconButton
                size="sm"
                color="neutral"
                variant="soft"
                onClick={onReset}
                sx={{ minWidth: 24, minHeight: 24, width: 24, height: 24 }}
              >
                <RestartAltRoundedIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>
      <Box
        sx={{
          width: "60%",
          ml: "auto",
          minWidth: 0,
        }}
      >
        {children}
      </Box>
    </FormControl>
  );
}

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
      <Box sx={sliderSlotSx}>
        <Slider
          size="sm"
          min={0}
          max={1}
          step={0.01}
          value={opacityValue}
          onChange={(_, v) => onOpacityChange(v as number)}
          sx={sliderSx}
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

function ClockStyleSectionSettings({
  local,
  update,
  resetOne,
  isDiff,
  onResetAll,
}: ClockStyleSectionProps) {
  return (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column", minHeight: 0 }}>
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          overflowX: "auto",
          px: 2.5,
          py: 2.5,
        }}
      >
        <Stack spacing={2.5}>
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

          <Divider />

          <SettingRow
            label="Font Size"
            isDirty={isDiff("fontSize")}
            onReset={() => resetOne("fontSize")}
          >
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Typography
                level="body-xs"
                sx={{
                  minWidth: 42,
                  textAlign: "right",
                  fontVariantNumeric: "tabular-nums",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-end",
                  minHeight: 28,
                }}
              >
                {local.fontSize}px
              </Typography>
              <Box sx={sliderSlotSx}>
                <Slider
                  size="sm"
                  min={10}
                  max={400}
                  step={1}
                  value={local.fontSize}
                  onChange={(_, v) => update({ fontSize: v as number })}
                  sx={sliderSx}
                />
              </Box>
            </Stack>
          </SettingRow>

          <Divider />

          <SettingRow
            label="Text Color & Opacity"
            isDirty={isDiff("foregroundColor") || isDiff("foregroundOpacity")}
            onReset={() =>
              update({
                foregroundColor: SETTINGS_DEFAULTS.clock.foregroundColor,
                foregroundOpacity: SETTINGS_DEFAULTS.clock.foregroundOpacity,
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

          <Divider />

          <SettingRow
            label="Background Color & Opacity"
            isDirty={isDiff("backgroundColor") || isDiff("backgroundOpacity")}
            onReset={() =>
              update({
                backgroundColor: SETTINGS_DEFAULTS.clock.backgroundColor,
                backgroundOpacity: SETTINGS_DEFAULTS.clock.backgroundOpacity,
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

          <SettingRow
            label="Background Border Radius"
            isDirty={isDiff("borderRadius")}
            onReset={() => resetOne("borderRadius")}
          >
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Typography
                level="body-xs"
                sx={{
                  minWidth: 42,
                  textAlign: "right",
                  fontVariantNumeric: "tabular-nums",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-end",
                  minHeight: 28,
                }}
              >
                {local.borderRadius}px
              </Typography>
              <Box sx={sliderSlotSx}>
                <Slider
                  size="sm"
                  min={0}
                  max={270}
                  step={1}
                  value={local.borderRadius}
                  onChange={(_, v) => update({ borderRadius: v as number })}
                  sx={sliderSx}
                />
              </Box>
            </Stack>
          </SettingRow>

          <Divider />

          <SettingRow
            label="Text Shadow"
            labelAdornment={
              <Tooltip
                size="md"
                placement="top"
                variant="soft"
                title={
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <Typography level="body-sm" sx={{ color: "text.primary" }}>
                      Accepts valid text-shadow CSS. Learn more here
                    </Typography>
                    <IconButton
                      size="sm"
                      component="a"
                      href="https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/text-shadow"
                      target="_blank"
                      rel="noopener noreferrer"
                      variant="plain"
                      color="neutral"
                      sx={{ minWidth: 22, minHeight: 22, width: 22, height: 22 }}
                    >
                      <OpenInNewRoundedIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Box>
                }
              >
                <IconButton
                  size="sm"
                  color="neutral"
                  variant="plain"
                  sx={{
                    minWidth: 22,
                    minHeight: 22,
                    width: 22,
                    height: 22,
                    cursor: "default",
                    "&:hover": { cursor: "default" },
                  }}
                >
                  <InfoOutlinedIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </Tooltip>
            }
            isDirty={isDiff("textShadow")}
            onReset={() => resetOne("textShadow")}
          >
            <Input
              size="sm"
              value={local.textShadow}
              placeholder="e.g. 1px 1px 3px rgba(0,0,0,0.5)"
              onChange={(e) => update({ textShadow: e.target.value })}
            />
          </SettingRow>

          <Divider />

          <SettingRow
            label="Padding"
            isDirty={isDiff("paddingVertical") || isDiff("paddingHorizontal")}
            onReset={() =>
              update({
                paddingVertical: SETTINGS_DEFAULTS.clock.paddingVertical,
                paddingHorizontal: SETTINGS_DEFAULTS.clock.paddingHorizontal,
              })
            }
          >
            <Stack spacing={1.5}>
              <FormControl size="sm" sx={{ flex: 1 }}>
                <FormLabel>Vertical</FormLabel>
                <Input
                  size="sm"
                  value={local.paddingVertical}
                  placeholder="0em"
                  onChange={(e) => update({ paddingVertical: e.target.value })}
                />
              </FormControl>
              <FormControl size="sm" sx={{ flex: 1 }}>
                <FormLabel>Horizontal</FormLabel>
                <Input
                  size="sm"
                  value={local.paddingHorizontal}
                  placeholder="0.2em"
                  onChange={(e) => update({ paddingHorizontal: e.target.value })}
                />
              </FormControl>
            </Stack>
          </SettingRow>
        </Stack>
      </Box>

      <Box
        sx={{
          px: 2.5,
          py: 2,
          borderTop: "1px solid",
          borderColor: "divider",
          flexShrink: 0,
          display: "flex",
          justifyContent: "flex-end",
        }}
      >
        <Button color="neutral" variant="outlined" size="sm" onClick={onResetAll}>
          Reset All to Defaults
        </Button>
      </Box>
    </Box>
  );
}

export default ClockStyleSectionSettings;
