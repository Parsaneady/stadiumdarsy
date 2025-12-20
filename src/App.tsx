import { lazy, Suspense } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { SeasonProvider } from "./contexts/SeasonContext";

// Lazy load pages for code splitting
const Dashboard = lazy(() => import("./pages/Dashboard"));
const WeeklyProgram = lazy(() => import("./pages/WeeklyProgram"));
const DailyLog = lazy(() => import("./pages/DailyLog"));
const Pomodoro = lazy(() => import("./pages/Pomodoro"));
const Analytics = lazy(() => import("./pages/Analytics"));
const PerformanceHistory = lazy(() => import("./pages/PerformanceHistory"));
const Auth = lazy(() => import("./pages/Auth"));
const Pension = lazy(() => import("./pages/Pension"));
const PensionInvite = lazy(() => import("./pages/PensionInvite"));
const ExamPanel = lazy(() => import("./pages/TestExam"));
const Profile = lazy(() => import("./pages/Profile"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Loading fallback component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen bg-background">
    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

// Configure QueryClient with optimized settings
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 30,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <SeasonProvider>
        <TooltipProvider delayDuration={300}>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/auth" element={<Auth />} />
                <Route path="/" element={<Dashboard />} />
                <Route path="/weekly-plan" element={<WeeklyProgram />} />
                <Route path="/daily-log" element={<DailyLog />} />
                <Route path="/pomodoro" element={<Pomodoro />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/history" element={<PerformanceHistory />} />
                <Route path="/exam" element={<ExamPanel />} />
                <Route path="/pension" element={<Pension />} />
                <Route path="/pension/invite/:code" element={<PensionInvite />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </TooltipProvider>
      </SeasonProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
