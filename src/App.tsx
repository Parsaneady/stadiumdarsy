import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import Index from "./pages/Index";
import WeeklyPlan from "./pages/WeeklyPlan";
import DailyLog from "./pages/DailyLog";
import Analytics from "./pages/Analytics";
import Pomodoro from "./pages/Pomodoro";
import TestExam from "./pages/TestExam";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/weekly-plan" element={<WeeklyPlan />} />
            <Route path="/daily-log" element={<DailyLog />} />
            <Route path="/pomodoro" element={<Pomodoro />} />
            <Route path="/test-exam" element={<TestExam />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
