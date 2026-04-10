import "./App.css";
import Clock from "./components/Clock";
import Settings from "./components/Settings";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useEffect, useMemo, useRef } from "react";
import { check } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";

function App() {
  const hasCheckedUpdates = useRef(false);

  const windowLabel = useMemo(() => {
    try {
      return getCurrentWindow().label;
    } catch {
      return "clock";
    }
  }, []);

  useEffect(() => {
    if (windowLabel !== "clock" || hasCheckedUpdates.current) {
      return;
    }

    hasCheckedUpdates.current = true;
    let disposed = false;

    const checkForUpdates = async () => {
      try {
        const update = await check();
        if (!update || disposed) {
          return;
        }

        const notes = update.body ? `\n\nRelease notes:\n${update.body}` : "";
        const shouldInstall = window.confirm(
          `Version ${update.version} is available. Install now?${notes}`,
        );
        if (!shouldInstall || disposed) {
          return;
        }

        await update.downloadAndInstall();
        if (disposed) {
          return;
        }

        const shouldRestart = window.confirm(
          "Update installed successfully. Restart now?",
        );
        if (shouldRestart) {
          await relaunch();
        }
      } catch (error) {
        console.error("Automatic update check failed:", error);
      }
    };

    void checkForUpdates();

    return () => {
      disposed = true;
    };
  }, [windowLabel]);

  return windowLabel === "settings" ? <Settings /> : <Clock />;
}

export default App;
