import "./App.css";
import Clock from "./components/Clock";
import Settings from "./components/Settings";
import useTray from "./hooks/useTray";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { Component, ReactNode, useMemo } from "react";

class RenderErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; message: string }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, message: "" };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, message: error?.message ?? "Unknown render error" };
  }

  render() {
    if (this.state.hasError) {
      return (
        <main
          style={{
            width: "100vw",
            height: "100vh",
            padding: "16px",
            fontFamily: "Inter, sans-serif",
            background: "#fff",
            color: "#111",
          }}
        >
          <strong>Render error</strong>
          <div>{this.state.message}</div>
        </main>
      );
    }

    return this.props.children;
  }
}

function ClockApp() {
  useTray();
  return (
    <main className="overlay">
      <Clock />
    </main>
  );
}

function App() {
  const windowLabel = useMemo(() => {
    if (window.location.pathname.endsWith("/settings.html")) {
      return "settings";
    }
    const fromQuery = new URLSearchParams(window.location.search).get("window");
    if (fromQuery) {
      return fromQuery;
    }
    try {
      return getCurrentWindow().label;
    } catch {
      return "main";
    }
  }, []);

  return (
    <RenderErrorBoundary>
      {windowLabel === "settings" ? <Settings /> : <ClockApp />}
    </RenderErrorBoundary>
  );
}

export default App;
