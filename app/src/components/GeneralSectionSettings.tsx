import Box from "@mui/joy/Box";
import Button from "@mui/joy/Button";
import FormControl from "@mui/joy/FormControl";
import FormLabel from "@mui/joy/FormLabel";
import IconButton from "@mui/joy/IconButton";
import Stack from "@mui/joy/Stack";
import Switch from "@mui/joy/Switch";
import Tooltip from "@mui/joy/Tooltip";
import RestartAltRoundedIcon from "@mui/icons-material/RestartAltRounded";
import { GeneralSectionProps } from "./SettingsSectionProps";

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
          minHeight: 24,
          mb: 0.75,
        }}
      >
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

function GeneralSectionSettings({ local, update, resetOne, isDiff, onResetAll }: GeneralSectionProps) {
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
            label="Enable Automatic Updates"
            isDirty={isDiff("enableAutomaticUpdates")}
            onReset={() => resetOne("enableAutomaticUpdates")}
          >
            <Switch
              checked={local.enableAutomaticUpdates}
              onChange={(e) => update({ enableAutomaticUpdates: e.target.checked })}
            />
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

export default GeneralSectionSettings;
