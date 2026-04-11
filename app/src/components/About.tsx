import { useEffect, useState } from "react";
import { getVersion } from "@tauri-apps/api/app";
import { openUrl } from "@tauri-apps/plugin-opener";
import { CssVarsProvider } from "@mui/joy/styles";
import CssBaseline from "@mui/joy/CssBaseline";
import Box from "@mui/joy/Box";
import Sheet from "@mui/joy/Sheet";
import Typography from "@mui/joy/Typography";
import Button from "@mui/joy/Button";
import Stack from "@mui/joy/Stack";
import GitHubIcon from "@mui/icons-material/GitHub";
import BugReportIcon from "@mui/icons-material/BugReport";
import WindowTitleBar from "./WindowTitleBar";

const GITHUB_URL = "https://github.com/Static-4eb7cf82/clock-on-top";
const ISSUES_URL = "https://github.com/Static-4eb7cf82/clock-on-top/issues";

function About() {
  const [version, setVersion] = useState("-");

  useEffect(() => {
    let isMounted = true;

    getVersion()
      .then((appVersion) => {
        if (isMounted) {
          setVersion(appVersion);
        }
      })
      .catch((err) => {
        console.error("Failed to read app version:", err);
      });

    return () => {
      isMounted = false;
    };
  }, []);

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
          bgcolor: "background.level1",
          color: "text.primary",
          overflow: "hidden",
          borderRadius: 0,
        }}
      >
        <WindowTitleBar
          title="About"
          closeCommand="close_about_window"
          closeButtonVariant="soft"
        />

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
            p: 3,
          }}
        >
          {/* App name */}
          <Box
            sx={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              gap: 1.5,
              mb: 2,
            }}
          >
            <Typography level="title-md">Clock On Top</Typography>
          </Box>

          {/* Metadata */}
          <Stack spacing={0.3} alignItems="flex-start" sx={{ mb: 5 }}>
            <Typography level="body-sm" textColor="text.secondary">
              Version: {version}
            </Typography>
            <Typography level="body-sm" textColor="text.secondary">
              License: MIT
            </Typography>
            <Typography level="body-sm" textColor="text.secondary">
              Created by Static-4eb7cf82
            </Typography>
          </Stack>

          {/* Action buttons */}
          <Stack direction="column" spacing={1} justifyContent="center" width="100%">
            <Button
              variant="outlined"
              color="neutral"
              size="sm"
              endDecorator={<GitHubIcon />}
              onClick={() => openUrl(GITHUB_URL).catch(console.error)}
            >
              GitHub
            </Button>
            <Button
              variant="outlined"
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
