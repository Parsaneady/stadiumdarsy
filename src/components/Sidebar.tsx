import { NavLink, useLocation } from 'react-router-dom';
import { useMemo } from 'react';
import { 
  LayoutDashboard, 
  Calendar, 
  BookOpen,
  Sparkles,
  FileText,
  Users,
  User,
  BarChart3,
  ClipboardList,
  History,
  GraduationCap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getTodayQuote } from '@/lib/quotes';

// Study Desk items as islands/cards
const studyDeskItems = [
  { path: '/weekly-plan', icon: Calendar, label: 'برنامه هفتگی' },
  { path: '/daily-log', icon: ClipboardList, label: 'ثبت روزانه' },
  { path: '/exam', icon: FileText, label: 'پنل آزمون' },
  { path: '/pension', icon: Users, label: 'پانسیون' },
];

const otherNavItems = [
  { path: '/', icon: LayoutDashboard, label: 'داشبورد' },
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
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold gradient-text">استادیوم</h1>
            <p className="text-xs text-muted-foreground">برنامه‌ریز مطالعه هوشمند</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-4 overflow-y-auto">
        {/* Study Desk Section - As cards/islands */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 px-3 py-2">
            <BookOpen className="w-4 h-4 text-primary" />
            <span className="text-xs font-semibold text-primary uppercase tracking-wide">میز مطالعه</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {studyDeskItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={cn(
                    'flex flex-col items-center gap-2 p-3 rounded-xl transition-all duration-200',
                    isActive
                      ? 'bg-gradient-to-br from-primary/20 to-accent/20 text-primary border border-primary/30 shadow-lg shadow-primary/10'
                      : 'bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground border border-white/5'
                  )}
                >
                  <item.icon className={cn('w-5 h-5', isActive && 'text-primary')} />
                  <span className="text-xs font-medium text-center leading-tight">{item.label}</span>
                </NavLink>
              );
            })}
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-white/10" />

        {/* Other Navigation Items */}
        <div className="space-y-1">
          {otherNavItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200',
                  isActive
                    ? 'bg-primary/20 text-primary border border-primary/30'
                    : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
                )}
              >
                <item.icon className="w-5 h-5 shrink-0" />
                <span className="font-medium">{item.label}</span>
                {isActive && (
                  <div className="mr-auto w-2 h-2 rounded-full bg-primary" />
                )}
              </NavLink>
            );
          })}
        </div>
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
