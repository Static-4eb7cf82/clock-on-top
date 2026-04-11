import type { MouseEvent } from "react";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import Box from "@mui/joy/Box";
import Typography from "@mui/joy/Typography";
import IconButton from "@mui/joy/IconButton";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";

type WindowTitleBarProps = {
  title?: string;
  closeCommand: string;
  closeButtonVariant?: "plain" | "soft";
  titleBarSx?: Record<string, unknown>;
};

function WindowTitleBar({
  title,
  closeCommand,
  closeButtonVariant = "soft",
  titleBarSx,
}: WindowTitleBarProps) {
  const handleTitleBarMouseDown = (e: MouseEvent) => {
    if (e.button === 0) {
      try {
        getCurrentWindow().startDragging().catch(console.error);
      } catch (err) {
        console.error("Failed to start dragging:", err);
      }
    }
  };

  const hasTitle = title !== undefined;

  return (
    <Box
      onMouseDown={handleTitleBarMouseDown}
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: hasTitle ? "space-between" : "flex-end",
        pl: 2,
        pr: 0.5,
        py: 0.5,
        userSelect: "none",
        borderBottom: "1px solid",
        borderColor: "neutral.outlinedBorder",
        flexShrink: 0,
        ...titleBarSx,
      }}
    >
      {hasTitle ? (
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
          <img
            src="/app-icon.png"
            alt="Clock On Top"
            style={{ width: 16, height: 16 }}
          />
          <Typography level="body-xs">{title}</Typography>
        </Box>
      ) : null}

      <IconButton
        size="sm"
        color="neutral"
        onMouseDown={(e) => e.stopPropagation()}
        variant={closeButtonVariant}
        onClick={() => invoke(closeCommand).catch(console.error)}
        sx={{ minWidth: 24, minHeight: 24, width: 24, height: 24 }}
      >
        <CloseRoundedIcon sx={{ fontSize: 18 }} />
      </IconButton>
    </Box>
  );
}

export default WindowTitleBar;