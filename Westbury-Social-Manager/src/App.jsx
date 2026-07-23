import React, { useEffect, useState } from "react";
import Sidebar from "./components/Sidebar.jsx";
import { api } from "./lib/api.js";

import Dashboard from "./pages/Dashboard.jsx";
import Posts from "./pages/Posts.jsx";
import Generator from "./pages/Generator.jsx";
import Approval from "./pages/Approval.jsx";
import Calendar from "./pages/Calendar.jsx";
import Automation from "./pages/Automation.jsx";
import Analytics from "./pages/Analytics.jsx";
import Settings from "./pages/Settings.jsx";

export default function App() {
  const [page, setPage] = useState("dashboard");
  const [config, setConfig] = useState(null);

  useEffect(() => {
    api.getConfig().then(setConfig);
  }, []);

  const pages = {
    dashboard: <Dashboard config={config} onNavigate={setPage} />,
    posts: <Posts />,
    generator: <Generator />,
    approval: <Approval />,
    calendar: <Calendar />,
    automation: <Automation config={config} />,
    analytics: <Analytics />,
    settings: <Settings config={config} />,
  };

  return (
    <div className="app">
      <Sidebar active={page} onNavigate={setPage} />
      <main className="main">{pages[page]}</main>
    </div>
  );
}
