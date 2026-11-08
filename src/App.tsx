import { lazy, Suspense } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
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
const StudyDesk = lazy(() => import("./pages/StudyDesk"));
const TestBookPanel = lazy(() => import("./pages/TestBookPanel"));
const DisciplineTree = lazy(() => import("./pages/DisciplineTree"));
const ArenaLayout = lazy(() => import("./features/shell/ArenaLayout"));
const TodayPage = lazy(() => import("./features/daily/TodayPage"));
const StudyDeskPage = lazy(() => import("./features/daily/StudyDeskPage"));
const AdvisorPage = lazy(() => import("./features/daily/AdvisorPage"));
const StadiumPage = lazy(() => import("./features/dashboard/StadiumPage"));
const SettingsPage = lazy(() => import("./features/settings/SettingsPage"));
const LibraryPage = lazy(() => import("./features/library/LibraryPage"));
const ArenaSections = lazy(() => import("./features/shell/sections"));
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
                <Route element={<ArenaLayout />}>
                  <Route path="/" element={<TodayPage />} />
                  <Route path="/index" element={<Navigate to="/" replace />} />
                  <Route path="/daily-log" element={<Navigate to="/" replace />} />
                  <Route path="/stadium" element={<StadiumPage />} />
                  <Route path="/study-desk" element={<StudyDeskPage />} />
                  <Route path="/advisor" element={<AdvisorPage />} />
                  <Route path="/library" element={<LibraryPage />} />
                  <Route path="/topics" element={<ArenaSections section="topics" />} />
                  <Route path="/planner" element={<Navigate to="/weekly-plan" replace />} />
                  <Route path="/practice" element={<Navigate to="/exam" replace />} />
                  
                  <Route path="/exam-style" element={<ArenaSections section="exam-style" />} />
                  <Route path="/settings" element={<SettingsPage />} />
                </Route>
                <Route path="/classic" element={<Dashboard />} />
                <Route path="/weekly-plan" element={<WeeklyProgram />} />
                <Route path="/daily-log-classic" element={<DailyLog />} />
                <Route path="/pomodoro" element={<Pomodoro />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/history" element={<PerformanceHistory />} />
                <Route path="/exam" element={<ExamPanel />} />
                <Route path="/pension" element={<Pension />} />
                <Route path="/pension/invite/:code" element={<PensionInvite />} />
                <Route path="/profile" element={<Profile />} />
                
                <Route path="/test-book" element={<TestBookPanel />} />
                <Route path="/discipline-tree" element={<DisciplineTree />} />
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
