import { Layout } from "@/components/Layout";
import { MetricsSection } from "@/components/dashboard/MetricsSection";
import { LiveLogsPanel } from "@/components/dashboard/LiveLogsPanel";
import { AlertsPanel } from "@/components/dashboard/AlertsPanel";
import { AiAnalysisPanel } from "@/components/dashboard/AiAnalysisPanel";

const Index = () => {
  return (
    <Layout>
      <div className="space-y-6">
        <MetricsSection />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <LiveLogsPanel />
          <AlertsPanel />
        </div>
        <AiAnalysisPanel />
      </div>
    </Layout>
  );
};

export default Index;
