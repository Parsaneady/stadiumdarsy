import { ReactNode, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
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
  User
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'داشبورد' },
  { path: '/weekly-plan', icon: Calendar, label: 'برنامه هفتگی' },
  { path: '/daily-log', icon: ClipboardList, label: 'ثبت روزانه' },
  { path: '/pomodoro', icon: Timer, label: 'پومودورو' },
  { path: '/exam-panel', icon: FileText, label: 'پنل آزمون' },
  { path: '/analytics', icon: BarChart3, label: 'تحلیل‌ها' },
  { path: '/history', icon: History, label: 'تاریخچه عملکرد' },
  { path: '/pension', icon: Users, label: 'پانسیون' },
  { path: '/profile', icon: User, label: 'پروفایل' },
];

interface AppLayoutProps {
  children: ReactNode;
}

export const AppLayout = ({ children }: AppLayoutProps) => {
  const { user, profile, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

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

  return (
    <div className="min-h-screen bg-background flex" dir="rtl">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
      </div>

      {/* Sidebar - Right side for RTL */}
      <aside className="fixed right-0 top-0 h-screen w-64 glass-card border-l border-white/10 z-50 flex flex-col">
        {/* User Profile */}
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <Avatar className="w-12 h-12 border-2 border-primary/30">
              <AvatarImage src={profile?.avatar_url || ''} />
              <AvatarFallback className="bg-primary/20 text-primary font-bold">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">
                {profile?.first_name} {profile?.last_name}
              </p>
              <p className="text-sm text-muted-foreground truncate">
                @{profile?.username || 'user'}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200',
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
              </button>
            );
          })}
        </nav>

        {/* Logout & Footer */}
        <div className="p-3 border-t border-white/10">
          <Button 
            variant="ghost" 
            className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive"
            onClick={handleLogout}
          >
            <LogOut className="w-5 h-5" />
            خروج
          </Button>
        </div>
        <div className="p-3 text-center border-t border-white/10">
          <p className="text-xs text-muted-foreground">
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