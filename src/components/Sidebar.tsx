import { NavLink, useLocation } from 'react-router-dom';
import { useMemo } from 'react';
import { 
  LayoutDashboard, 
  Calendar, 
  ClipboardList, 
  BarChart3, 
  Timer,
  BookOpen,
  Sparkles,
  FileText,
  History,
  Trophy,
  User
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getTodayQuote } from '@/lib/quotes';

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'داشبورد' },
  { path: '/weekly-plan', icon: Calendar, label: 'برنامه هفتگی' },
  { path: '/daily-log', icon: ClipboardList, label: 'ثبت روزانه' },
  { path: '/pomodoro', icon: Timer, label: 'پومودورو' },
  { path: '/test-exam', icon: FileText, label: 'پنل آزمون' },
  { path: '/challenges', icon: Trophy, label: 'چالش‌ها' },
  { path: '/analytics', icon: BarChart3, label: 'تحلیل‌ها' },
  { path: '/history', icon: History, label: 'تاریخچه عملکرد' },
  { path: '/profile', icon: User, label: 'پروفایل' },
];

export const Sidebar = () => {
  const location = useLocation();
  const todayQuote = useMemo(() => getTodayQuote(), []);
  return (
    <aside className="fixed right-0 top-0 h-screen w-72 glass-card border-l border-white/10 z-50 flex flex-col animate-fade-in">
      {/* Logo */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold gradient-text">استادیوم</h1>
            <p className="text-xs text-muted-foreground">برنامه‌ریز مطالعه هوشمند</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300',
                isActive
                  ? 'bg-primary/20 text-primary border border-primary/30'
                  : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
              )}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
              {isActive && (
                <div className="mr-auto w-2 h-2 rounded-full bg-primary" />
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Motivational Quote */}
      <div className="p-4 m-4 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 border border-white/10">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-primary">انگیزه امروز</span>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          «{todayQuote.quote}»
        </p>
        <p className="text-xs text-muted-foreground/70 mt-1">— {todayQuote.author}</p>
      </div>

      {/* Footer Credit */}
      <div className="p-4 border-t border-white/10 text-center">
        <p className="text-xs text-muted-foreground">
          طراح سایت: پارسا عیدی‌دهنه
        </p>
      </div>
    </aside>
  );
};
