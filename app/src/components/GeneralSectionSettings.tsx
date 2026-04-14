import Box from "@mui/joy/Box";
import Button from "@mui/joy/Button";
import Stack from "@mui/joy/Stack";
import Switch from "@mui/joy/Switch";
import Select from "@mui/joy/Select";
import Option from "@mui/joy/Option";
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
            label="Launch On Startup"
            description="Launch Clock On Top when your computer starts up"
            isDirty={isDiff("launchOnStartup")}
            onReset={() => resetOne("launchOnStartup")}
          >
            <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
              <Switch
                checked={local.launchOnStartup}
                onChange={(e) => update({ launchOnStartup: e.target.checked })}
              />
            </Box>
          </SettingRow>

          <SettingRow
            label="Enable Automatic Updates"
            description="Automatically download and install updates when the app starts"
            isDirty={isDiff("enableAutomaticUpdates")}
            onReset={() => resetOne("enableAutomaticUpdates")}
          >
            <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
              <Switch
                checked={local.enableAutomaticUpdates}
                onChange={(e) => update({ enableAutomaticUpdates: e.target.checked })}
              />
            </Box>
          </SettingRow>

          <SettingRow
            label="Theme"
            isDirty={isDiff("appTheme")}
            onReset={() => resetOne("appTheme")}
          >
            <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
              <Select
                value={local.appTheme}
                onChange={(_, value) => {
                  if (value) update({ appTheme: value as "light" | "dark" | "system" });
                }}
                size="sm"
                sx={{ backgroundColor: "background.level1", minWidth: 100 }}
              >
                <Option value="system">System</Option>
                <Option value="light">Light</Option>
                <Option value="dark">Dark</Option>
              </Select>
            </Box>
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
