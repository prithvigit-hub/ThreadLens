import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import LiveMonitoring from "./pages/LiveMonitoring.tsx";
import AnalyzeLogs from "./pages/AnalyzeLogs.tsx";
import HistoryPage from "./pages/HistoryPage.tsx";
import AskAi from "./pages/AskAi.tsx";
import SettingsPage from "./pages/SettingsPage.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/monitoring" element={<LiveMonitoring />} />
          <Route path="/analyze" element={<AnalyzeLogs />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/ask-ai" element={<AskAi />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
