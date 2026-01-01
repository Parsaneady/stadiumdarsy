import { ReactNode, useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useCloudSync } from '@/hooks/useCloudSync';
import { 
  LayoutDashboard, 
  Calendar,
  FileText,
  Users,
  LogOut,
  Loader2,
  ClipboardList,
  Timer,
  BarChart3,
  History,
  User,
  BookOpen,
  ChevronDown,
  GraduationCap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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

interface AppLayoutProps {
  children: ReactNode;
}

export const AppLayout = ({ children }: AppLayoutProps) => {
  const { user, profile, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [studyDeskOpen, setStudyDeskOpen] = useState(true);
  
  // Enable cloud sync for logged in users - automatically loads and saves data
  useCloudSync();

  // Check if current path is in study desk group
  const isStudyDeskActive = navGroups.find(g => g.id === 'study-desk')?.items.some(
    item => location.pathname === item.path
  );

  useEffect(() => {
    // Auto-expand study desk if active route is inside
    if (isStudyDeskActive) {
      setStudyDeskOpen(true);
    }
  }, [isStudyDeskActive]);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const getInitials = () => {
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name[0]}${profile.last_name[0]}`.toUpperCase();
    }
    if (profile?.display_name) {
      return profile.display_name.slice(0, 2).toUpperCase();
    }
    return 'U';
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/auth');
  };

  const NavItem = ({ item, nested = false }: { item: typeof navGroups[0]['items'][0], nested?: boolean }) => {
    const isActive = location.pathname === item.path;
    return (
      <button
        onClick={() => navigate(item.path)}
        className={cn(
          'w-full flex items-center gap-3 rounded-xl transition-all duration-200',
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
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-background flex" dir="rtl">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
      </div>

      {/* Sidebar - Right side for RTL */}
      <aside className="fixed right-0 top-0 h-screen w-64 glass-card border-l border-white/10 z-50 flex flex-col">
        {/* Logo/Brand */}
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold gradient-text">استادیوم</h1>
              <p className="text-[10px] text-muted-foreground">برنامه‌ریز هوشمند</p>
            </div>
          </div>
        </div>

        {/* User Profile - Compact */}
        <div className="p-3 border-b border-white/10">
          <button 
            onClick={() => navigate('/profile')}
            className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors"
          >
            <Avatar className="w-9 h-9 border-2 border-primary/30">
              <AvatarImage src={profile?.avatar_url || ''} />
              <AvatarFallback className="bg-primary/20 text-primary font-bold text-sm">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0 text-right">
              <p className="text-sm font-medium truncate">
                {profile?.first_name} {profile?.last_name}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                @{profile?.username || 'user'}
              </p>
            </div>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
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

        {/* Logout & Footer */}
        <div className="p-3 border-t border-white/10">
          <Button 
            variant="ghost" 
            className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            onClick={handleLogout}
          >
            <LogOut className="w-5 h-5" />
            خروج
          </Button>
        </div>
        <div className="p-2 text-center border-t border-white/10">
          <p className="text-[10px] text-muted-foreground">
            طراح سایت: پارسا عیدی‌دهنه
          </p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 mr-64 p-6 relative z-10">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};