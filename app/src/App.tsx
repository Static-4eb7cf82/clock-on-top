import "./App.css";
import Clock from "./components/Clock";
import Settings from "./components/Settings";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useMemo } from "react";

function App() {
  const windowLabel = useMemo(() => {
    try {
      return getCurrentWindow().label;
    } catch {
      return "clock";
    }
  }, []);

  return windowLabel === "settings" ? <Settings /> : <Clock />;
}

export default App;
