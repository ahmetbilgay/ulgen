import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import { DashboardScreen } from "./screens/DashboardScreen";
import { LandingScreen } from "./screens/LandingScreen";

export function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<LandingScreen />} />
        <Route path="/app" element={<Navigate to="/app/home" replace />} />
        <Route path="/app/:section" element={<DashboardScreen />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
}
