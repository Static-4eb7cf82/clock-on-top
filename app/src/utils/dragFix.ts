// This hook centralizes manual window dragging for Tauri because native
// startDragging() can swallow left-button mouse-up events and does not expose
// a reliable "drag ended" callback. We compute DPI-aware positions (screen scaling)
// and throttle updates to keep dragging smooth while avoiding high CPU usage.
import { useEffect, useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import { getCurrentWindow, PhysicalPosition } from "@tauri-apps/api/window";

type DragContext = {
  offsetX: number;
  offsetY: number;
  scaleFactor: number;
};

type PendingMouseState = {
  screenX: number;
  screenY: number;
  buttons: number;
};

export function useDragFix(throttleMs = 50) {
  const [isDragging, setIsDragging] = useState(false);
  const dragContextRef = useRef<DragContext | null>(null);
  const lastDragUpdateAtRef = useRef(0);
  const lastDraggedWindowPositionRef = useRef<{ x: number; y: number } | null>(
    null,
  );

  const stopDragging = () => {
    dragContextRef.current = null;
    lastDragUpdateAtRef.current = 0;
    lastDraggedWindowPositionRef.current = null;
    setIsDragging(false);
  };

  useEffect(() => {
    if (!isDragging) {
      dragContextRef.current = null;
      return;
    }

    const appWindow = getCurrentWindow();
    let pendingMouseState: PendingMouseState | null = null;
    let animationFrameId: number | null = null;

    const flushDragUpdate = () => {
      animationFrameId = null;

      const dragContext = dragContextRef.current;
      if (!dragContext || !pendingMouseState) {
        return;
      }

      if ((pendingMouseState.buttons & 1) !== 1) {
        stopDragging();
        return;
      }

      const now = performance.now();
      if (now - lastDragUpdateAtRef.current < throttleMs) {
        animationFrameId = window.requestAnimationFrame(flushDragUpdate);
        return;
      }
      lastDragUpdateAtRef.current = now;

      const nextX = Math.round(
        (pendingMouseState.screenX - dragContext.offsetX) *
          dragContext.scaleFactor,
      );
      const nextY = Math.round(
        (pendingMouseState.screenY - dragContext.offsetY) *
          dragContext.scaleFactor,
      );

      const lastPosition = lastDraggedWindowPositionRef.current;
      if (
        lastPosition &&
        lastPosition.x === nextX &&
        lastPosition.y === nextY
      ) {
        return;
      }

      lastDraggedWindowPositionRef.current = { x: nextX, y: nextY };
      void appWindow.setPosition(new PhysicalPosition(nextX, nextY));
    };

    const handleMouseMove = (event: MouseEvent) => {
      if (!dragContextRef.current) {
        return;
      }

      pendingMouseState = {
        screenX: event.screenX,
        screenY: event.screenY,
        buttons: event.buttons,
      };

      if (animationFrameId === null) {
        animationFrameId = window.requestAnimationFrame(flushDragUpdate);
      }
    };

    window.addEventListener("mousemove", handleMouseMove, true);
    window.addEventListener("mouseup", stopDragging, true);
    window.addEventListener("blur", stopDragging);

    return () => {
      if (animationFrameId !== null) {
        window.cancelAnimationFrame(animationFrameId);
      }
      window.removeEventListener("mousemove", handleMouseMove, true);
      window.removeEventListener("mouseup", stopDragging, true);
      window.removeEventListener("blur", stopDragging);
    };
  }, [isDragging, throttleMs]);

  const handleMouseDown = async (e: ReactMouseEvent) => {
    if (e.button !== 0) {
      return;
    }

    e.preventDefault();

    try {
      const appWindow = getCurrentWindow();
      const [position, scaleFactor] = await Promise.all([
        appWindow.outerPosition(),
        appWindow.scaleFactor(),
      ]);

      const safeScaleFactor = scaleFactor > 0 ? scaleFactor : 1;
      dragContextRef.current = {
        offsetX: e.screenX - position.x / safeScaleFactor,
        offsetY: e.screenY - position.y / safeScaleFactor,
        scaleFactor: safeScaleFactor,
      };
      lastDragUpdateAtRef.current = 0;
      lastDraggedWindowPositionRef.current = null;
      setIsDragging(true);
    } catch (error) {
      console.error("Failed to initialize manual dragging:", error);
    }
  };

  return {
    isDragging,
    handleMouseDown,
    handleMouseUp: stopDragging,
  };
}
