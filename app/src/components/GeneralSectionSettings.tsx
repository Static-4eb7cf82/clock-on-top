import Box from "@mui/joy/Box";
import Button from "@mui/joy/Button";
import Stack from "@mui/joy/Stack";
import Switch from "@mui/joy/Switch";
import { GeneralSectionProps } from "./SettingsSectionProps";
import SettingRow from "./SettingRow";

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
