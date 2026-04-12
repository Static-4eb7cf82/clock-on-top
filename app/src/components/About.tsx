import { useEffect, useState } from "react";
import { getVersion } from "@tauri-apps/api/app";
import { invoke } from "@tauri-apps/api/core";
import { resolveResource } from '@tauri-apps/api/path';
import { openPath, openUrl } from "@tauri-apps/plugin-opener";
import { CssVarsProvider } from "@mui/joy/styles";
import CssBaseline from "@mui/joy/CssBaseline";
import Box from "@mui/joy/Box";
import Sheet from "@mui/joy/Sheet";
import Typography from "@mui/joy/Typography";
import Button from "@mui/joy/Button";
import Stack from "@mui/joy/Stack";
import GitHubIcon from "@mui/icons-material/GitHub";
import BugReportIcon from "@mui/icons-material/BugReport";
import GavelRoundedIcon from '@mui/icons-material/GavelRounded';
import WindowTitleBar from "./WindowTitleBar";

const GITHUB_URL = "https://github.com/Static-4eb7cf82/clock-on-top";
const ISSUES_URL = "https://github.com/Static-4eb7cf82/clock-on-top/issues";

function About() {
  const [version, setVersion] = useState("-");

  const handleViewLicense = async () => {
    try {
      // opens the LICENSE file using the default program
      console.log("Attempting to open bundled license file...");
      const licensePath = await resolveResource('LICENSE');
      await openPath(licensePath);
    } catch (err) {
      console.error("Failed to open bundled license file:", err);
    }
  };

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
            alignSelf: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "flex-start",
            py: 3,
            px: 4,
          }}
        >
          {/* Metadata */}
          <Stack spacing={1} alignItems="flex-start" sx={{ mb: 5 }}>
            <Typography level="title-md">Clock On Top</Typography>
            <Typography level="body-sm" textColor="text.secondary">
              Version {version}
            </Typography>
            <Typography level="body-sm" textColor="text.secondary">
              Copyright © 2026 Static-4eb7cf82
            </Typography>
            <Typography level="body-sm" textColor="text.secondary">
              Licensed under the GNU General Public License v3.0 or later. This software is provided "as is", without warranty of any kind.
            </Typography>
          </Stack>

          {/* Action buttons */}
          <Stack direction="column" spacing={1} justifyContent="center" width="50%">
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
            <Button
              variant="outlined"
              color="neutral"
              size="sm"
              endDecorator={<GavelRoundedIcon />}
              onClick={() => {
                void handleViewLicense();
              }}
            >
              View License
            </Button>
          </Stack>
        </Box>
      </Sheet>
    </CssVarsProvider>
  );
}

export default About;
