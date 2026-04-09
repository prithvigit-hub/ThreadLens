import { Layout } from "@/components/Layout";
import { Settings as SettingsIcon, Bell, Shield, Database, Monitor } from "lucide-react";

const settingsGroups = [
  {
    icon: Bell,
    title: "Notifications",
    description: "Configure alert thresholds and notification channels",
    items: ["Email alerts for high-risk threats", "Slack integration", "SMS notifications"],
  },
  {
    icon: Shield,
    title: "Security Rules",
    description: "Manage detection rules and policies",
    items: ["Brute force detection sensitivity", "Port scan threshold", "IP blocklist management"],
  },
  {
    icon: Database,
    title: "Data Sources",
    description: "Manage connected log sources and endpoints",
    items: ["Syslog UDP/TCP endpoints", "Cloud provider integrations", "File watchers"],
  },
  {
    icon: Monitor,
    title: "Display",
    description: "Customize dashboard appearance",
    items: ["Log refresh interval", "Max visible entries", "Color scheme"],
  },
];

const SettingsPage = () => (
  <Layout>
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <SettingsIcon className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">Settings</h2>
          <p className="text-sm text-muted-foreground">Configure your forensic investigator</p>
        </div>
      </div>

      <div className="space-y-4">
        {settingsGroups.map((group) => (
          <div key={group.title} className="glass-panel rounded-xl p-5 space-y-3">
            <div className="flex items-center gap-3">
              <group.icon className="w-5 h-5 text-primary" />
              <div>
                <h3 className="text-sm font-semibold text-foreground">{group.title}</h3>
                <p className="text-xs text-muted-foreground">{group.description}</p>
              </div>
            </div>
            <div className="space-y-2 pl-8">
              {group.items.map((item) => (
                <div key={item} className="flex items-center justify-between text-sm py-2 border-b border-border/30 last:border-0">
                  <span className="text-muted-foreground">{item}</span>
                  <div className="w-9 h-5 rounded-full bg-muted relative cursor-pointer">
                    <div className="w-4 h-4 rounded-full bg-primary absolute top-0.5 right-0.5" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  </Layout>
);

export default SettingsPage;
