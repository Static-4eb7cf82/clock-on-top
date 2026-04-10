import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { ClockSettings, CLOCK_DEFAULTS, SettingsFile } from "../settings";

function useSettings() {
  const [settings, setSettings] = useState<ClockSettings>(CLOCK_DEFAULTS);

  useEffect(() => {
    invoke<SettingsFile>("read_settings")
      .then((next) => setSettings(next.clock))
      .catch(console.error);

    let unlisten: (() => void) | undefined;
    listen<SettingsFile>("settings-updated", (event) => {
      setSettings(event.payload.clock);
    })
      .then((fn) => {
        unlisten = fn;
      })
      .catch(console.error);

    return () => {
      unlisten?.();
    };
  }, []);

  return settings;
}

export default useSettings;
