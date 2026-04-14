import { useEffect, useState, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import useSettings from "../hooks/useSettings";
import { hexToRgba } from "../settings";
import { useDragFix } from "../utils/dragFix";

function Clock() {
  const [now, setNow] = useState(() => new Date());
  const clockRef = useRef<HTMLDivElement>(null);
  const settings = useSettings();
  const { isDragging, handleMouseDown, handleMouseUp } = useDragFix(10);

  const hours = now.getHours();
  const minutes = now.getMinutes();
  const displayHours = hours % 12 === 0 ? 12 : hours % 12;
  const displayMinutes = minutes.toString().padStart(2, "0");
  const clockDisplayString = `${displayHours}:${displayMinutes} ${hours >= 12 ? "PM" : "AM"}`;

  const resizeWindowToClock = () => {
    if (!clockRef.current) {
      return;
    }
    const rect = clockRef.current.getBoundingClientRect();
    const width = Math.ceil(rect.width);
    const height = Math.ceil(rect.height);
    console.log("Resizing window to:", width, height);
    invoke<void>("resize_window", {
      width,
      height,
    }).catch((e) => console.error("Failed to resize window:", e));
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
        onMouseUp={handleMouseUp}
        onContextMenu={handleContextMenu}
      >
        {clockDisplayString}
    </div>
  )
}

export default Clock