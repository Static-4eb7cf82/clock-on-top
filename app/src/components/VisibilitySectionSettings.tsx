import Box from "@mui/joy/Box";
import Button from "@mui/joy/Button";
import Option from "@mui/joy/Option";
import Select from "@mui/joy/Select";
import Slider from "@mui/joy/Slider";
import Stack from "@mui/joy/Stack";
import Typography from "@mui/joy/Typography";
import { VisibilitySectionProps } from "./SettingsSectionProps";
import SettingRow from "./SettingRow";

const sliderSx = { my: 0, py: 0, minWidth: 200 };

function DurationControl({
  value,
  min,
  max,
  step,
  unit,
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (value: number) => void;
}) {
  return (
    <Stack direction="row" spacing={1.5} alignItems="center">
      <Typography level="body-xs" sx={{ minWidth: 48, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
        {value} {unit}
      </Typography>
      <Slider
        size="sm"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(_, next) => onChange(next as number)}
        sx={sliderSx}
      />
    </Stack>
  );
}

function VisibilitySectionSettings({ local, update, resetOne, isDiff, onResetAll }: VisibilitySectionProps) {
  return (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column", minHeight: 0 }}>
      <Box sx={{ flex: 1, minHeight: 0, overflowY: "auto", overflowX: "auto", px: 2.5, py: 2.5 }}>
        <Stack spacing={2.5}>
          <SettingRow
            label="Fade In"
            description="Duration used when the clock appears"
            isDirty={isDiff("fadeInDurationMs")}
            onReset={() => resetOne("fadeInDurationMs")}
          >
            <DurationControl value={local.fadeInDurationMs} min={0} max={2000} step={50} unit="ms" onChange={(value) => update({ fadeInDurationMs: value })} />
          </SettingRow>

          <SettingRow
            label="Fade Out"
            description="Duration used when the clock disappears"
            isDirty={isDiff("fadeOutDurationMs")}
            onReset={() => resetOne("fadeOutDurationMs")}
          >
            <DurationControl value={local.fadeOutDurationMs} min={0} max={2000} step={50} unit="ms" onChange={(value) => update({ fadeOutDurationMs: value })} />
          </SettingRow>

          <SettingRow
            label="Scheduled Show Duration"
            description="How long a scheduled appearance stays visible"
            isDirty={isDiff("scheduledShowDurationSeconds")}
            onReset={() => resetOne("scheduledShowDurationSeconds")}
          >
            <DurationControl value={local.scheduledShowDurationSeconds} min={5} max={300} step={5} unit="sec" onChange={(value) => update({ scheduledShowDurationSeconds: value })} />
          </SettingRow>

          <SettingRow
            label="Schedule Behavior"
            description="Keep the clock visible and flash every interval, or hide it between intervals then show it briefly"
            isDirty={isDiff("scheduleMode")}
            onReset={() => resetOne("scheduleMode")}
          >
            <Select
              size="sm"
              value={local.scheduleMode}
              onChange={(_, value) => {
                if (value !== null) update({ scheduleMode: value });
              }}
              sx={{ minWidth: 190 }}
            >
              <Option value="briefShow">Hide and show briefly</Option>
              <Option value="flash">Keep visible and flash</Option>
            </Select>
          </SettingRow>

          <SettingRow
            label="Schedule Interval"
            description="Choose a recurring interval minute mark"
            isDirty={isDiff("scheduleIntervalMinutes")}
            onReset={() => resetOne("scheduleIntervalMinutes")}
          >
            <Select
              size="sm"
              value={local.scheduleIntervalMinutes}
              onChange={(_, value) => {
                if (value !== null) update({ scheduleIntervalMinutes: value });
              }}
              sx={{ minWidth: 160 }}
            >
              <Option value={0}>Off</Option>
              <Option value={15}>Every 15 minutes</Option>
              <Option value={30}>Every 30 minutes</Option>
              <Option value={45}>At :45 each hour</Option>
              <Option value={60}>Every hour</Option>
            </Select>
          </SettingRow>
        </Stack>
      </Box>

      <Box sx={{ px: 2.5, py: 2, borderTop: "1px solid", borderColor: "divider", flexShrink: 0, display: "flex", justifyContent: "flex-end" }}>
        <Button color="neutral" variant="outlined" size="sm" onClick={onResetAll}>
          Reset Page to Defaults
        </Button>
      </Box>
    </Box>
  );
}

export default VisibilitySectionSettings;