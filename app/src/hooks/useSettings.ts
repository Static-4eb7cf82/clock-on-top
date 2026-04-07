import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { ClockSettings, DEFAULTS } from "../settings";

function useSettings() {
  const [settings, setSettings] = useState<ClockSettings>(DEFAULTS);

  useEffect(() => {
    invoke<ClockSettings>("read_settings")
      .then(setSettings)
      .catch(console.error);

    let unlisten: (() => void) | undefined;
    listen<ClockSettings>("settings-updated", (event) => {
      setSettings(event.payload);
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
