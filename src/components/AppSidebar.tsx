import { useState } from "react";
import {
  Home, LayoutDashboard, Activity, Search, History, Bot,
  Settings, Shield, LogOut, User, ChevronUp,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface NavItem {
  title: string;
  url: string;
  icon: React.ElementType;
  dot?: boolean;
}

interface NavGroup {
  title: string;
  icon: React.ElementType;
  items: NavItem[];
}

const topItems: NavItem[] = [
  { title: "Home", url: "/", icon: Home },
];

const navGroups: NavGroup[] = [
  {
    title: "Monitor",
    icon: Activity,
    items: [
      { title: "Live Monitoring", url: "/monitoring", icon: Activity, dot: true },
      { title: "Analyze Logs", url: "/analyze", icon: Search },
    ],
  },
  {
    title: "Investigate",
    icon: Bot,
    items: [
      { title: "Ask AI", url: "/ask-ai", icon: Bot },
      { title: "History", url: "/history", icon: History },
    ],
  },
  {
    title: "Overview",
    icon: LayoutDashboard,
    items: [
      { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
    ],
  },
];

const bottomItems: NavItem[] = [
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [expanded, setExpanded] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    Monitor: true,
    Investigate: true,
    Overview: true,
  });

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const isActive = (url: string) =>
    url === "/" ? location.pathname === "/" : location.pathname.startsWith(url);

  const isGroupActive = (group: NavGroup) =>
    group.items.some((item) => isActive(item.url));

  const toggleGroup = (title: string) => {
    setOpenGroups((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  return (
    <aside
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
      className={`min-h-screen bg-sidebar border-r border-sidebar-border flex flex-col shrink-0 transition-all duration-300 ease-in-out overflow-hidden ${
        expanded ? "w-56" : "w-14"
      }`}
      style={{ zIndex: 40 }}
    >
      {/* ── Brand ── */}
      <div className="h-14 border-b border-sidebar-border flex items-center px-3 gap-3 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center glow-primary shrink-0">
          <Shield className="w-4 h-4 text-primary" />
        </div>
        <div className={`transition-all duration-200 overflow-hidden ${expanded ? "opacity-100 w-auto" : "opacity-0 w-0"}`}>
          <p className="text-sm font-bold text-foreground whitespace-nowrap leading-tight">Thread Lens</p>
          <p className="text-[10px] text-primary/80 uppercase tracking-widest whitespace-nowrap">Security</p>
        </div>
      </div>

      {/* ── Top standalone items ── */}
      <div className="px-2 pt-3 pb-1 space-y-0.5">
        {topItems.map((item) => (
          <SidebarItem
            key={item.url}
            item={item}
            active={isActive(item.url)}
            expanded={expanded}
            onClick={() => navigate(item.url)}
          />
        ))}
      </div>

      {/* ── Grouped nav ── */}
      <nav className="flex-1 px-2 py-1 space-y-1 overflow-y-auto scrollbar-cyber">
        {navGroups.map((group) => (
          <div key={group.title}>
            {/* Group header */}
            {expanded ? (
              <button
                onClick={() => toggleGroup(group.title)}
                className={`w-full flex items-center justify-between px-2 py-1.5 rounded-md transition-colors group ${
                  isGroupActive(group) ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
                data-testid={`sidebar-group-${group.title.toLowerCase()}`}
              >
                <div className="flex items-center gap-2">
                  <group.icon className="w-3.5 h-3.5 shrink-0" />
                  <span className="text-[10px] font-bold uppercase tracking-widest whitespace-nowrap">
                    {group.title}
                  </span>
                </div>
                <ChevronUp
                  className={`w-3 h-3 shrink-0 transition-transform duration-200 ${
                    openGroups[group.title] ? "rotate-0" : "rotate-180"
                  }`}
                />
              </button>
            ) : (
              /* Collapsed: show group icon as separator/hint */
              <div className={`flex items-center justify-center h-8 ${isGroupActive(group) ? "text-primary" : "text-muted-foreground/40"}`}>
                <group.icon className="w-3.5 h-3.5" />
              </div>
            )}

            {/* Group items */}
            <div
              className={`space-y-0.5 overflow-hidden transition-all duration-200 ${
                expanded
                  ? openGroups[group.title]
                    ? "max-h-96 opacity-100"
                    : "max-h-0 opacity-0"
                  : "max-h-96 opacity-100"
              }`}
            >
              {group.items.map((item) => (
                <SidebarItem
                  key={item.url}
                  item={item}
                  active={isActive(item.url)}
                  expanded={expanded}
                  onClick={() => navigate(item.url)}
                  indented={expanded}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* ── Bottom section ── */}
      <div className="border-t border-sidebar-border px-2 py-3 space-y-1">
        {bottomItems.map((item) => (
          <SidebarItem
            key={item.url}
            item={item}
            active={isActive(item.url)}
            expanded={expanded}
            onClick={() => navigate(item.url)}
          />
        ))}

        {/* System status (expanded only) */}
        {expanded && (
          <div className="glass-panel rounded-lg px-3 py-2 mt-2">
            <p className="text-[10px] text-muted-foreground">System Status</p>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-safe shrink-0" />
              <span className="text-[10px] text-safe font-medium whitespace-nowrap">All Systems Normal</span>
            </div>
          </div>
        )}

        {/* User row */}
        <div className={`flex items-center gap-2 px-1 pt-1 ${!expanded && "justify-center"}`}>
          <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
            <User className="w-3.5 h-3.5 text-primary" />
          </div>
          {expanded && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-foreground truncate whitespace-nowrap">{user?.name ?? "Analyst"}</p>
              <p className="text-[10px] text-muted-foreground truncate whitespace-nowrap">{user?.email ?? ""}</p>
            </div>
          )}
          {expanded && (
            <button
              onClick={handleLogout}
              data-testid="button-logout"
              title="Sign out"
              className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}

interface SidebarItemProps {
  item: NavItem;
  active: boolean;
  expanded: boolean;
  onClick: () => void;
  indented?: boolean;
}

function SidebarItem({ item, active, expanded, onClick, indented }: SidebarItemProps) {
  return (
    <button
      onClick={onClick}
      data-testid={`sidebar-item-${item.title.toLowerCase().replace(/\s+/g, "-")}`}
      title={!expanded ? item.title : undefined}
      className={`w-full flex items-center gap-3 rounded-lg transition-all duration-150 ${
        expanded ? `px-3 py-2 ${indented ? "pl-5" : ""}` : "justify-center p-2"
      } ${
        active
          ? "bg-primary/15 text-primary"
          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
      }`}
    >
      <item.icon className="w-4 h-4 shrink-0" />
      {expanded && (
        <span className="text-sm font-medium whitespace-nowrap flex-1 text-left">{item.title}</span>
      )}
      {expanded && item.dot && (
        <span className="w-1.5 h-1.5 rounded-full bg-safe pulse-dot shrink-0" />
      )}
    </button>
  );
}
