import { Layout } from "@/components/Layout";
import { LiveLogsPanel } from "@/components/dashboard/LiveLogsPanel";
import { Activity } from "lucide-react";

const LiveMonitoring = () => (
  <Layout>
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-safe/10 flex items-center justify-center">
          <Activity className="w-5 h-5 text-safe" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">Live Monitoring</h2>
          <p className="text-sm text-muted-foreground">Real-time log stream analysis</p>
        </div>
        <span className="ml-auto flex items-center gap-2 text-xs text-safe">
          <span className="w-2 h-2 rounded-full bg-safe pulse-dot" />
          Streaming Active
        </span>
      </div>
      <LiveLogsPanel />
    </div>
  </Layout>
);

export default LiveMonitoring;
