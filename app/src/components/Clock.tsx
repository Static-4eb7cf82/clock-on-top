import { useEffect, useState, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { listen } from "@tauri-apps/api/event";
import useSettings from "../hooks/useSettings";
import { hexToRgba } from "../settings";

function Clock() {
  const [now, setNow] = useState(() => new Date());
  const [isDragging, setIsDragging] = useState(false);
  const [opacity, setOpacity] = useState(0);
  const [fadeDirection, setFadeDirection] = useState<"in" | "out">("in");
  const [isFlashing, setIsFlashing] = useState(false);
  const clockRef = useRef<HTMLDivElement>(null);
  const hideTimerRef = useRef<number>();
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
    let unlistenShow: (() => void) | undefined;
    let unlistenHide: (() => void) | undefined;
    let cancelled = false;

    const animateIn = () => {
      setIsFlashing(false);
      setFadeDirection("in");
      setOpacity(0);
      requestAnimationFrame(() => requestAnimationFrame(() => setOpacity(1)));
    };

    listen<boolean>("clock-show", (event) => {
      if (hideTimerRef.current !== undefined) window.clearTimeout(hideTimerRef.current);
      if (event.payload) {
        setFadeDirection("in");
        setOpacity(1);
        setIsFlashing(false);
        requestAnimationFrame(() => setIsFlashing(true));
      } else {
        animateIn();
      }
    }).then((unlisten) => {
      if (cancelled) unlisten();
      else unlistenShow = unlisten;
    }).catch(console.error);

    listen("clock-hide", () => {
      if (hideTimerRef.current !== undefined) window.clearTimeout(hideTimerRef.current);
      setIsFlashing(false);
      setFadeDirection("out");
      setOpacity(0);
      hideTimerRef.current = window.setTimeout(() => {
        invoke("hide_clock_window").catch(console.error);
        hideTimerRef.current = undefined;
      }, settings.visibility.fadeOutDurationMs);
    }).then((unlisten) => {
      if (cancelled) unlisten();
      else unlistenHide = unlisten;
    }).catch(console.error);

    requestAnimationFrame(() => {
      setFadeDirection("in");
      setOpacity(1);
    });
    return () => {
      cancelled = true;
      unlistenShow?.();
      unlistenHide?.();
      if (hideTimerRef.current !== undefined) window.clearTimeout(hideTimerRef.current);
    };
  }, [settings.visibility.fadeOutDurationMs]);

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
        style={{
          fontFamily: settings.clock.fontFamily,
          fontSize: `${settings.clock.fontSize}px`,
          color: hexToRgba(settings.clock.foregroundColor, settings.clock.foregroundOpacity),
          backgroundColor: hexToRgba(settings.clock.backgroundColor, settings.clock.backgroundOpacity),
          borderRadius: `${settings.clock.borderRadius}px`,
          textShadow: settings.clock.textShadow || undefined,
          padding: `${settings.clock.paddingVertical} ${settings.clock.paddingHorizontal}`,
          opacity,
          transition: `opacity ${fadeDirection === "in" ? settings.visibility.fadeInDurationMs : settings.visibility.fadeOutDurationMs}ms ease`,
          animationDuration: `${settings.visibility.fadeInDurationMs + settings.visibility.fadeOutDurationMs}ms`,
        }}
        className={`clock ${isDragging ? "dragging" : ""} ${isFlashing ? "flashing" : ""}`}
        onAnimationEnd={() => setIsFlashing(false)}
        onMouseDown={handleMouseDown}
        onContextMenu={handleContextMenu}
      >
        {clockDisplayString}
    </div>
  )
}

export default Clock