import { NavLink, useLocation } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { 
  LayoutDashboard, 
  Calendar, 
  BookOpen,
  Sparkles,
  FileText,
  Users,
  User,
  Timer,
  BarChart3,
  ClipboardList,
  History,
  ChevronDown,
  GraduationCap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getTodayQuote } from '@/lib/quotes';
import { motion, AnimatePresence } from 'framer-motion';

// Navigation structure with groups
const navGroups = [
  {
    id: 'main',
    items: [
      { path: '/', icon: LayoutDashboard, label: 'داشبورد' },
    ]
  },
  {
    id: 'study-desk',
    label: 'میز مطالعه',
    icon: BookOpen,
    items: [
      { path: '/weekly-plan', icon: Calendar, label: 'برنامه هفتگی' },
      { path: '/daily-log', icon: ClipboardList, label: 'ثبت روزانه' },
      { path: '/pomodoro', icon: Timer, label: 'پومودورو' },
      { path: '/exam', icon: FileText, label: 'پنل آزمون' },
      { path: '/pension', icon: Users, label: 'پانسیون' },
    ]
  },
  {
    id: 'analytics',
    items: [
      { path: '/analytics', icon: BarChart3, label: 'تحلیل‌ها' },
      { path: '/history', icon: History, label: 'تاریخچه عملکرد' },
    ]
  },
  {
    id: 'user',
    items: [
      { path: '/profile', icon: User, label: 'پروفایل' },
    ]
  }
];

export const Sidebar = () => {
  const location = useLocation();
  const todayQuote = useMemo(() => getTodayQuote(), []);
  const [studyDeskOpen, setStudyDeskOpen] = useState(true);

  const isStudyDeskActive = navGroups.find(g => g.id === 'study-desk')?.items.some(
    item => location.pathname === item.path
  );

  const NavItem = ({ item, nested = false }: { item: typeof navGroups[0]['items'][0], nested?: boolean }) => {
    const isActive = location.pathname === item.path;
    return (
      <NavLink
        to={item.path}
        className={cn(
          'flex items-center gap-3 rounded-xl transition-all duration-200',
          nested ? 'px-3 py-2.5 mr-4' : 'px-4 py-3',
          isActive
            ? 'bg-primary/20 text-primary border border-primary/30'
            : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
        )}
      >
        <item.icon className={cn('shrink-0', nested ? 'w-4 h-4' : 'w-5 h-5')} />
        <span className={cn('font-medium', nested && 'text-sm')}>{item.label}</span>
        {isActive && (
          <div className="mr-auto w-2 h-2 rounded-full bg-primary" />
        )}
      </NavLink>
    );
  };

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
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navGroups.map((group) => (
          <div key={group.id}>
            {/* Collapsible Group (Study Desk) */}
            {group.label ? (
              <div className="mb-1">
                <button
                  onClick={() => setStudyDeskOpen(!studyDeskOpen)}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200',
                    isStudyDeskActive
                      ? 'bg-gradient-to-l from-primary/10 to-accent/10 text-primary border border-primary/20'
                      : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
                  )}
                >
                  {group.icon && <group.icon className="w-5 h-5" />}
                  <span className="font-medium">{group.label}</span>
                  <motion.div
                    className="mr-auto"
                    animate={{ rotate: studyDeskOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </motion.div>
                </button>
                
                <AnimatePresence initial={false}>
                  {studyDeskOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <div className="pt-1 pr-2 space-y-1 border-r-2 border-primary/20 mr-6 mt-1">
                        {group.items.map((item) => (
                          <NavItem key={item.path} item={item} nested />
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              /* Regular items */
              group.items.map((item) => (
                <NavItem key={item.path} item={item} />
              ))
            )}
          </div>
        ))}
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
