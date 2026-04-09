import {
  LayoutDashboard, Activity, Search, History, Bot, Settings, Shield,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";

const navItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Live Monitoring", url: "/monitoring", icon: Activity },
  { title: "Analyze Logs", url: "/analyze", icon: Search },
  { title: "History", url: "/history", icon: History },
  { title: "Ask AI", url: "/ask-ai", icon: Bot },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const location = useLocation();

  return (
    <aside className="w-60 min-h-screen bg-sidebar border-r border-sidebar-border flex flex-col shrink-0">
      <div className="p-5 border-b border-sidebar-border flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-primary/20 flex items-center justify-center glow-primary">
          <Shield className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-sm font-semibold text-foreground leading-tight">LLM Forensic</h1>
          <p className="text-xs text-muted-foreground">Investigator</p>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.url;
          return (
            <NavLink
              key={item.url}
              to={item.url}
              end
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 ${
                isActive
                  ? "bg-primary/15 text-primary font-medium"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              }`}
              activeClassName=""
            >
              <item.icon className="w-4 h-4" />
              <span>{item.title}</span>
              {item.title === "Live Monitoring" && (
                <span className="ml-auto w-2 h-2 rounded-full bg-safe pulse-dot" />
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="p-4 border-t border-sidebar-border">
        <div className="glass-panel rounded-lg p-3 text-xs">
          <p className="text-muted-foreground">System Status</p>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="w-2 h-2 rounded-full bg-safe" />
            <span className="text-safe font-medium">All Systems Normal</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
