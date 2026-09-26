import { useEffect, useState, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import useSettings from "../hooks/useSettings";
import { hexToRgba } from "../settings";

function Clock() {
  const [now, setNow] = useState(() => new Date());
  const [isDragging, setIsDragging] = useState(false);
  const clockRef = useRef<HTMLDivElement>(null);
  const settings = useSettings();

  const hours = now.getHours();
  const minutes = now.getMinutes();
  const displayHours = hours % 12 === 0 ? 12 : hours % 12;
  const displayMinutes = minutes.toString().padStart(2, "0");
  const clockDisplayString = `${displayHours}:${displayMinutes} ${hours >= 12 ? "PM" : "AM"}`;

  const resizeWindowToClock = async () => {
    if (!clockRef.current) {
      return;
    }

    const rect = clockRef.current.getBoundingClientRect();
    try {
      const scaleFactor = await getCurrentWindow().scaleFactor();
      const cssToLogicalScale = window.devicePixelRatio / scaleFactor;
      const width = Math.ceil(rect.width * cssToLogicalScale);
      const height = Math.ceil(rect.height * cssToLogicalScale);
      console.log("Resizing window to:", {
        width,
        height,
        devicePixelRatio: window.devicePixelRatio,
        scaleFactor,
      });
      await invoke<void>("resize_window", { width, height });
    } catch (e) {
      console.error("Failed to resize window:", e);
    }
  };

  useEffect(() => {
    const interval = window.setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    resizeWindowToClock();
    if (document.fonts?.ready) {
      document.fonts.ready.then(resizeWindowToClock).catch(() => undefined);
    }
  }, []);

  useEffect(() => {
    resizeWindowToClock();
  }, [clockDisplayString, settings.clock.fontFamily, settings.clock.fontSize, settings.clock.paddingVertical, settings.clock.paddingHorizontal]);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) {
      return;
    }

    e.preventDefault();
    setIsDragging(true);
    getCurrentWindow()
      .startDragging()
      .then(() => invoke<void>("wait_for_left_mouse_button_release"))
      .catch((error) => console.error("Failed to drag clock:", error))
      .finally(() => setIsDragging(false));
  };

  return (
    <div
        ref={clockRef}
        className={`clock ${isDragging ? "dragging" : ""}`}
        style={{
          fontFamily: settings.clock.fontFamily,
          fontSize: `${settings.clock.fontSize}px`,
          color: hexToRgba(settings.clock.foregroundColor, settings.clock.foregroundOpacity),
          backgroundColor: hexToRgba(settings.clock.backgroundColor, settings.clock.backgroundOpacity),
          borderRadius: `${settings.clock.borderRadius}px`,
          textShadow: settings.clock.textShadow || undefined,
          padding: `${settings.clock.paddingVertical} ${settings.clock.paddingHorizontal}`,
        }}
        onMouseDown={handleMouseDown}
        onContextMenu={handleContextMenu}
      >
        {clockDisplayString}
    </div>
  )
}

export default Clock