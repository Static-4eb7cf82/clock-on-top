import Box from "@mui/joy/Box";
import FormControl from "@mui/joy/FormControl";
import FormLabel from "@mui/joy/FormLabel";
import IconButton from "@mui/joy/IconButton";
import Tooltip from "@mui/joy/Tooltip";
import RestartAltRoundedIcon from "@mui/icons-material/RestartAltRounded";

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

export default SettingRow;
