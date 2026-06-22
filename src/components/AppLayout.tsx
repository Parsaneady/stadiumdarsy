import { ReactNode, useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme, ThemeMode } from '@/contexts/ThemeContext';
import { useCloudSync } from '@/hooks/useCloudSync';
import { 
  LayoutDashboard, 
  Calendar,
  FileText,
  Users,
  LogOut,
  Loader2,
  ClipboardList,
  BarChart3,
  History,
  User,
  BookOpen,
  GraduationCap,
  TreePine,
  Menu,
  X,
  Sun,
  Moon,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

// Study desk items - removed from sidebar, now on StudyDesk page

const otherNavItems = [
  { path: '/', icon: LayoutDashboard, label: 'داشبورد' },
  { path: '/discipline-tree', icon: TreePine, label: 'درخت دیسیپلین' },
  { path: '/analytics', icon: BarChart3, label: 'تحلیل‌ها' },
  { path: '/history', icon: History, label: 'تاریخچه عملکرد' },
  { path: '/profile', icon: User, label: 'پروفایل' },
];

interface AppLayoutProps {
  children: ReactNode;
}

export const AppLayout = ({ children }: AppLayoutProps) => {
  const { user, profile, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { theme, setTheme } = useTheme();
  
  // Enable cloud sync for logged in users
  useCloudSync();

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

  const NavItem = ({ item }: { item: { path: string; icon: any; label: string } }) => {
    const isActive = location.pathname === item.path;
    return (
      <button
        onClick={() => navigate(item.path)}
        className={cn(
          'w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200',
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
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-background flex" dir="rtl">
      {/* Background Effects — luxurious emerald & gold haze */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 left-1/3 w-[32rem] h-[32rem] bg-primary/15 rounded-full blur-[120px]" />
        <div className="absolute -bottom-32 right-1/4 w-[28rem] h-[28rem] bg-accent/20 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 left-0 w-72 h-72 bg-secondary/10 rounded-full blur-[100px]" />
      </div>

      {/* Toggle Button - Always visible */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className={cn(
          "fixed top-4 z-[60] w-10 h-10 rounded-xl glass-card border border-white/10 flex items-center justify-center transition-all duration-300",
          sidebarOpen ? "right-[17rem]" : "right-4"
        )}
      >
        {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Sidebar - Right side for RTL */}
      <aside className={cn(
        "fixed right-0 top-0 h-screen w-64 glass-card border-l border-white/10 z-50 flex flex-col transition-transform duration-300",
        sidebarOpen ? "translate-x-0" : "translate-x-full"
      )}>
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
        <nav className="flex-1 p-3 space-y-4 overflow-y-auto">
          {/* Study Desk Section - Link to page */}
          <button
            onClick={() => navigate('/study-desk')}
            className="w-full p-3 rounded-xl bg-gradient-to-br from-primary/5 to-accent/5 border border-primary/20 hover:border-primary/40 transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <div className="text-right flex-1">
                <span className="font-semibold text-primary">میز مطالعه</span>
                <p className="text-[10px] text-muted-foreground">برنامه، تایمر، آزمون</p>
              </div>
            </div>
          </button>

          {/* Other Navigation Items */}
          <div className="space-y-1">
            {otherNavItems.map((item) => (
              <NavItem key={item.path} item={item} />
            ))}
          </div>
        </nav>

        {/* Theme Switcher */}
        <div className="p-3 border-t border-white/10">
          <p className="text-[10px] text-muted-foreground mb-2 px-1">حالت نمایش</p>
          <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-muted/40 border border-white/5">
            {([
              { id: 'modern-light', icon: Sun, label: 'روشن' },
              { id: 'modern-dark', icon: Moon, label: 'تاریک' },
              { id: 'classic', icon: Sparkles, label: 'کلاسیک' },
            ] as { id: ThemeMode; icon: any; label: string }[]).map((t) => {
              const active = theme === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTheme(t.id)}
                  className={cn(
                    'flex flex-col items-center justify-center gap-1 py-2 rounded-lg text-[10px] transition-all',
                    active
                      ? 'bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-md'
                      : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                  )}
                  aria-label={t.label}
                >
                  <t.icon className="w-4 h-4" />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>

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
      <main className={cn(
        "flex-1 p-6 relative z-10 transition-all duration-300",
        sidebarOpen ? "mr-64" : "mr-0"
      )}>
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};