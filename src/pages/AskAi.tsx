import { Layout } from "@/components/Layout";
import { AiAnalysisPanel } from "@/components/dashboard/AiAnalysisPanel";
import { Bot } from "lucide-react";

const AskAi = () => (
  <Layout>
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Bot className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">Ask AI</h2>
          <p className="text-sm text-muted-foreground">Get AI-powered insights about your logs and threats</p>
        </div>
      </div>
      <AiAnalysisPanel />
    </div>
  </Layout>
);

export default AskAi;
