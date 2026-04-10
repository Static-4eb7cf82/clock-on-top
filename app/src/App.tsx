import "./App.css";
import Clock from "./components/Clock";
import Settings from "./components/Settings";
import About from "./components/About";
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

  if (windowLabel === "settings") return <Settings />;
  if (windowLabel === "about") return <About />;
  return <Clock />;
}

export default App;
