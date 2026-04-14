import Box from "@mui/joy/Box";
import FormControl from "@mui/joy/FormControl";
import FormLabel from "@mui/joy/FormLabel";
import IconButton from "@mui/joy/IconButton";
import Tooltip from "@mui/joy/Tooltip";
import Typography from "@mui/joy/Typography";
import RestartAltRoundedIcon from "@mui/icons-material/RestartAltRounded";

interface SettingRowProps {
  label: string;
  description?: string;
  isDirty: boolean;
  onReset: () => void;
  children: React.ReactNode;
}

function SettingRow({
  label,
  description,
  isDirty,
  onReset,
  children,
}: SettingRowProps) {
  return (
    <FormControl>
      <Box
        sx={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 2,
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 0.5,
            minWidth: 0,
            flex: "1 1 0",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, minHeight: 24, minWidth: 0 }}>
            <FormLabel
              sx={{
                mb: 0,
                lineHeight: 1,
                display: "flex",
                alignItems: "center",
                minHeight: 24,
                minWidth: 0,
              }}
            >
              {label}
            </FormLabel>
          </Box>
          {description && (
            <Typography level="body-xs" sx={{ color: "text.tertiary", pr: 1 }}>
              {description}
            </Typography>
          )}
        </Box>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: 1,
            minWidth: 0,
            flexShrink: 0,
          }}
        >
          {isDirty && (
            <Tooltip title="Reset to default" size="md" placement="top" variant="outlined">
              <IconButton
                size="sm"
                color="neutral"
                variant="soft"
                onClick={onReset}
                sx={{ minWidth: 24, minHeight: 24, width: 24, height: 24, flexShrink: 0 }}
              >
                <RestartAltRoundedIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
          )}
          {children}
        </Box>
      </Box>
    </FormControl>
  );
}

export default SettingRow;
