import { lazy, Suspense } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { SeasonProvider } from "./contexts/SeasonContext";

// Lazy load pages for code splitting
const Index = lazy(() => import("./pages/Index"));
const WeeklyPlan = lazy(() => import("./pages/WeeklyPlan"));
const DailyLog = lazy(() => import("./pages/DailyLog"));
const Analytics = lazy(() => import("./pages/Analytics"));
const Pomodoro = lazy(() => import("./pages/Pomodoro"));
const TestExam = lazy(() => import("./pages/TestExam"));
const PerformanceHistory = lazy(() => import("./pages/PerformanceHistory"));
const Auth = lazy(() => import("./pages/Auth"));
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
                <Route path="/profile" element={<Profile />} />
                <Route path="/" element={<Index />} />
                <Route path="/weekly-plan" element={<WeeklyPlan />} />
                <Route path="/daily-log" element={<DailyLog />} />
                <Route path="/pomodoro" element={<Pomodoro />} />
                <Route path="/test-exam" element={<TestExam />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/history" element={<PerformanceHistory />} />
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
