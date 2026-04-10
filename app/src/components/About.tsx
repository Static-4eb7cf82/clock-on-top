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
import Divider from "@mui/joy/Divider";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import GitHubIcon from "@mui/icons-material/GitHub";
import BugReportIcon from "@mui/icons-material/BugReport";

const GITHUB_URL = "https://github.com/Static-4eb7cf82/clock-on-top";
const ISSUES_URL = "https://github.com/Static-4eb7cf82/clock-on-top/issues";
const VERSION = "0.5.0";

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
            justifyContent: "space-between",
            px: 2,
            py: 2,
            userSelect: "none",
            borderBottom: "1px solid",
            borderColor: "divider",
            flexShrink: 0,
          }}
        >
          <Typography level="title-md">About Clock On Top</Typography>
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
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            px: 3,
            pb: 3,
            pt: 2,
          }}
        >
          {/* App icon + name */}
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 1.5,
              mb: 3,
            }}
          >
            <img
              src="/app-icon.png"
              alt="Clock On Top"
              style={{ width: 56, height: 56 }}
            />
            <Typography level="h3">Clock On Top</Typography>
          </Box>

          {/* Metadata */}
          <Stack spacing={0.5} alignItems="center" sx={{ mb: 3 }}>
            <Typography level="body-sm" textColor="text.secondary">
              Created by Static-4eb7cf82
            </Typography>
            <Typography level="body-sm" textColor="text.secondary">
              License: MIT
            </Typography>
            <Typography level="body-sm" textColor="text.secondary">
              Version {VERSION}
            </Typography>
          </Stack>

          <Divider sx={{ width: "60%", mb: 3 }} />

          {/* Action buttons */}
          <Stack direction="row" spacing={1.5} justifyContent="center">
            <Button
              variant="outlined"
              color="neutral"
              size="sm"
              startDecorator={<GitHubIcon sx={{ fontSize: 16 }} />}
              onClick={() => openUrl(GITHUB_URL).catch(console.error)}
            >
              GitHub
            </Button>
            <Button
              variant="outlined"
              color="neutral"
              size="sm"
              startDecorator={<BugReportIcon sx={{ fontSize: 16 }} />}
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
