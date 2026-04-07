import { useEffect, useRef } from "react";
import { TrayIcon, TrayIconOptions } from "@tauri-apps/api/tray";
import { Menu } from "@tauri-apps/api/menu/menu";
import { PredefinedMenuItem } from "@tauri-apps/api/menu";
import { Image } from "@tauri-apps/api/image";
import { exit } from "@tauri-apps/plugin-process";
import { invoke } from "@tauri-apps/api/core";
import { resolveResource } from "@tauri-apps/api/path";

function useTray() {
  const initialized = useRef(false);

  useEffect(() => {
    // Prevent running more than once even with StrictMode
    if (initialized.current) return;
    initialized.current = true;

    const initTray = async () => {
      try {
        const menu = await Menu.new({
          items: [
            {
              id: "settings",
              text: "Settings",
              action: () => {
                invoke("open_settings_window").catch((error) => {
                  console.error("Failed to open settings window:", error);
                });
              },
            },
            await PredefinedMenuItem.new({ item: "Separator" }),
            {
              id: "quit",
              text: "Quit",
              action: () => {
                console.log("quit pressed");
                exit(0).catch((error) => {
                  console.error("Failed to quit app:", error);
                });
              },
            },
          ],
        });

        const iconPath = await resolveResource("icons/32x32.png");
        const icon = await Image.fromPath(iconPath);
        const options: TrayIconOptions = {
          menu: menu,
          icon: icon,
          tooltip: "Clock On Top",
        };

        await TrayIcon.new(options);
      } catch (error) {
        console.error("Failed to create tray icon:", error);
      }
    };

    initTray();
  }, []);
}

export default useTray;
