import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { openUrl } from "@tauri-apps/plugin-opener";
import { CssVarsProvider } from "@mui/joy/styles";
import CssBaseline from "@mui/joy/CssBaseline";
import Box from "@mui/joy/Box";
import Sheet from "@mui/joy/Sheet";
import Typography from "@mui/joy/Typography";
import IconButton from "@mui/joy/IconButton";
import Button from "@mui/joy/Button";
import Stack from "@mui/joy/Stack";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import GitHubIcon from "@mui/icons-material/GitHub";
import BugReportIcon from "@mui/icons-material/BugReport";

const GITHUB_URL = "https://github.com/Static-4eb7cf82/clock-on-top";
const ISSUES_URL = "https://github.com/Static-4eb7cf82/clock-on-top/issues";
const VERSION = "0.6.0";

function About() {
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
    <CssVarsProvider
      defaultMode="dark"
      modeStorageKey="clock-on-top-settings-mode"
    >
      <CssBaseline />
      <Sheet
        variant="plain"
        sx={{
          width: "100vw",
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          bgcolor: "background.sheet",
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
            justifyContent: "flex-end",
            px: 1,
            py: 1,
            userSelect: "none",
            borderColor: "divider",
            flexShrink: 0,
          }}
        >
          <IconButton
            size="sm"
            color="neutral"
            onMouseDown={(e) => e.stopPropagation()}
            variant="plain"
            onClick={() => invoke("close_about_window").catch(console.error)}
          >
            <CloseRoundedIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Box>

        {/* ── Content ── */}
        <Box
          sx={{
            flex: 1,
            width: "300px",
            alignSelf: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "flex-start",
            px: 3,
            pb: 3,
            pt: 0,
          }}
        >
          {/* App icon + name */}
          <Box
            sx={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              gap: 1.5,
              mb: 2,
            }}
          >
            <img
              src="/app-icon.png"
              alt="Clock On Top"
              style={{ width: 36, height: 36 }}
            />
            <Typography level="h3">Clock On Top</Typography>
          </Box>

          {/* Metadata */}
          <Stack spacing={0.3} alignItems="flex-start" sx={{ mb: 5 }}>
            <Typography level="body-sm" textColor="text.secondary">
              Created by Static-4eb7cf82
            </Typography>
            <Typography level="body-sm" textColor="text.secondary">
              License: MIT
            </Typography>
            <Typography level="body-sm" textColor="text.secondary">
              Version: {VERSION}
            </Typography>
          </Stack>

          {/* Action buttons */}
          <Stack direction="column" spacing={1} justifyContent="center" width="100%">
            <Button
              variant="plain"
              color="neutral"
              size="sm"
              endDecorator={<GitHubIcon />}
              onClick={() => openUrl(GITHUB_URL).catch(console.error)}
            >
              GitHub
            </Button>
            <Button
              variant="plain"
              color="neutral"
              size="sm"
              endDecorator={<BugReportIcon />}
              onClick={() => openUrl(ISSUES_URL).catch(console.error)}
            >
              Report a Bug
            </Button>
          </Stack>
        </Box>
      </Sheet>
    </CssVarsProvider>
  );
}

export default About;
