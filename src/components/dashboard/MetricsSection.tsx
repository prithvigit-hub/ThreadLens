import { useEffect, useState } from "react";
import { Activity, AlertTriangle, Shield, Clock } from "lucide-react";
import { api } from "@/lib/api";

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  trend?: string;
  variant?: "default" | "danger" | "warning" | "safe";
}

function MetricCard({ title, value, icon: Icon, trend, variant = "default" }: MetricCardProps) {
  const variantStyles = {
    default: "border-border hover:border-primary/30",
    danger: "border-destructive/20 hover:border-destructive/40 glow-danger",
    warning: "border-threat-medium/20 hover:border-threat-medium/40",
    safe: "border-safe/20 hover:border-safe/40",
  };
  const iconStyles = {
    default: "text-primary bg-primary/10",
    danger: "text-destructive bg-destructive/10",
    warning: "text-threat-medium bg-threat-medium/10",
    safe: "text-safe bg-safe/10",
  };
  return (
    <div className={`metric-card ${variantStyles[variant]} animate-fade-in`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider">{title}</p>
          <p className="text-2xl font-bold text-foreground mt-1">{value}</p>
          {trend && <p className="text-xs text-muted-foreground mt-1">{trend}</p>}
        </div>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${iconStyles[variant]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}

export function MetricsSection() {
  const [stats, setStats] = useState({
    logs_analyzed: 15420,
    threats_detected: 8,
    unresolved_alerts: 3,
    risk_level: "High",
    last_incident: "14:23",
  });

  useEffect(() => {
    api.stats()
      .then((data) => {
        setStats({
          logs_analyzed: data.logs_analyzed || 15420,
          threats_detected: data.threats_detected || 8,
          unresolved_alerts: data.unresolved_alerts || 3,
          risk_level: data.risk_level || "High",
          last_incident: data.last_incident
            ? data.last_incident.toString().slice(11, 16)
            : "14:23",
        });
      })
      .catch(() => {});
  }, []);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <MetricCard
        title="Logs Analyzed"
        value={stats.logs_analyzed.toLocaleString()}
        icon={Activity}
        trend="+2,340 today"
      />
      <MetricCard
        title="Threats Detected"
        value={stats.threats_detected}
        icon={AlertTriangle}
        trend={`${stats.unresolved_alerts} unresolved`}
        variant="danger"
      />
      <MetricCard
        title="Risk Level"
        value={stats.risk_level}
        icon={Shield}
        trend="Escalated 2h ago"
        variant="warning"
      />
      <MetricCard
        title="Last Incident"
        value={stats.last_incident}
        icon={Clock}
        trend="42 min ago"
        variant="safe"
      />
    </div>
  );
}
