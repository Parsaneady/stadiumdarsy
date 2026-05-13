import { NavLink, useLocation } from 'react-router-dom';
import { useMemo } from 'react';
import { 
  LayoutDashboard, 
  BookOpen,
  User,
  BarChart3,
  History,
  GraduationCap, 
  LogOut,
  TreePine
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

const mainNavItems = [
  { path: '/study-desk', icon: BookOpen, label: 'میز مطالعه', subtitle: 'برنامه، تایمر، آزمون' },
  { path: '/discipline-tree', icon: TreePine, label: 'درخت دیسیپلین', subtitle: 'فضای ذهنی و آرامش' },
  { path: '/', icon: LayoutDashboard, label: 'داشبورد' },
  { path: '/analytics', icon: BarChart3, label: 'تحلیل‌ها' },
  { path: '/history', icon: History, label: 'تاریخچه عملکرد' },
  { path: '/profile', icon: User, label: 'پروفایل' },
];

export const Sidebar = () => {
  const location = useLocation();
  const { user, profile, signOut } = useAuth();
  const displayName = useMemo(() => {
    if (profile?.display_name) return profile.display_name;
    if (!user) return '';
    return user.user_metadata?.display_name || user.email?.split('@')[0] || 'کاربر';
  }, [user, profile]);

  const email = user?.email || '';

  return (
    <aside className="fixed right-0 top-0 h-screen w-72 glass-card border-l border-white/10 z-50 flex flex-col animate-fade-in">
      {/* Logo */}
      <div className="p-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold gradient-text">استادیوم</h1>
            <p className="text-xs text-muted-foreground">برنامه‌ریز هوشمند</p>
          </div>
        </div>
      </div>

      {/* User Info */}
      {user && (
        <div className="px-5 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary font-bold text-lg">
              {displayName.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-foreground truncate">{displayName}</div>
              <div className="text-xs text-muted-foreground truncate">@{email.split('@')[0]}</div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {mainNavItems.map((item) => {
          const isActive = item.path === '/study-desk' 
            ? location.pathname === '/study-desk' || ['/weekly-plan', '/daily-log', '/exam', '/test-book', '/pension'].includes(location.pathname)
            : location.pathname === item.path;
          
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200',
                isActive
                  ? 'bg-gradient-to-l from-primary/20 to-accent/20 text-primary border border-primary/30'
                  : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
              )}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              <div className="flex-1">
                <span className="font-medium">{item.label}</span>
                {item.subtitle && (
                  <p className="text-xs text-muted-foreground/70">{item.subtitle}</p>
                )}
              </div>
            </NavLink>
          );
        })}
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t border-white/10">
        <button
          onClick={() => signOut()}
          className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-muted-foreground hover:bg-white/5 hover:text-foreground transition-all duration-200"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">خروج</span>
        </button>
      </div>

      {/* Footer Credit */}
      <div className="px-4 pb-4 text-center">
        <p className="text-xs text-muted-foreground">
          طراح سایت: پارسا عیدی‌دهنه
        </p>
      </div>
    </aside>
  );
};
