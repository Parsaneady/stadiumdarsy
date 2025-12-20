import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { useSeason } from '@/contexts/SeasonContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { 
  User, 
  Mail, 
  Calendar, 
  Clock, 
  Target, 
  TrendingUp, 
  LogOut,
  Save,
  Loader2,
  BookOpen,
  CheckCircle2,
  Flame
} from 'lucide-react';

interface Stats {
  totalStudyHours: number;
  totalTests: number;
  totalSessions: number;
  avgScore: number;
  streak: number;
}

const Profile = () => {
  const navigate = useNavigate();
  const { user, profile, signOut, updateProfile, loading } = useAuth();
  const { season, seasonName } = useSeason();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [stats, setStats] = useState<Stats>({
    totalStudyHours: 0,
    totalTests: 0,
    totalSessions: 0,
    avgScore: 0,
    streak: 0,
  });

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || '');
    }
  }, [profile]);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;

      // Fetch daily logs for stats
      const { data: logs } = await supabase
        .from('daily_logs')
        .select('*')
        .eq('user_id', user.id);

      // Fetch user settings for streak
      const { data: settings } = await supabase
        .from('user_settings')
        .select('streak')
        .eq('user_id', user.id)
        .maybeSingle();

      if (logs) {
        const totalHours = logs.reduce((sum, log) => sum + Number(log.total_study_hours || 0), 0);
        const totalTests = logs.reduce((sum, log) => sum + (log.total_tests || 0), 0);
        const totalSessions = logs.reduce((sum, log) => sum + (log.total_sessions || 0), 0);
        const avgScore = logs.length > 0 
          ? logs.reduce((sum, log) => sum + Number(log.overall_score || 0), 0) / logs.length 
          : 0;

        setStats({
          totalStudyHours: totalHours,
          totalTests,
          totalSessions,
          avgScore,
          streak: settings?.streak || 0,
        });
      }
    };

    fetchStats();
  }, [user]);

  const handleSave = async () => {
    if (!displayName.trim()) {
      toast.error('نام کاربری نمی‌تواند خالی باشد');
      return;
    }

    setIsSaving(true);
    const { error } = await updateProfile({ display_name: displayName });
    setIsSaving(false);

    if (error) {
      toast.error('خطا در ذخیره: ' + error.message);
    } else {
      toast.success('پروفایل به‌روزرسانی شد');
      setIsEditing(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    toast.success('خروج موفق');
    navigate('/auth');
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold gradient-text">پروفایل کاربری</h1>
            <p className="text-muted-foreground mt-1">مدیریت حساب و مشاهده آمار</p>
          </div>
          <Button variant="destructive" onClick={handleSignOut}>
            <LogOut className="h-4 w-4 ml-2" />
            خروج
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Profile Info */}
          <Card className="glass-card border-white/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                اطلاعات کاربری
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-center mb-6">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-3xl font-bold text-white">
                  {(profile?.display_name || user?.email || 'U')[0].toUpperCase()}
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    نام کاربری
                  </Label>
                  {isEditing ? (
                    <div className="flex gap-2">
                      <Input
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="bg-white/5 border-white/10"
                      />
                      <Button onClick={handleSave} disabled={isSaving} size="sm">
                        {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      </Button>
                    </div>
                  ) : (
                    <div className="flex justify-between items-center">
                      <p className="text-foreground">{profile?.display_name || 'تنظیم نشده'}</p>
                      <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
                        ویرایش
                      </Button>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    ایمیل
                  </Label>
                  <p className="text-foreground" dir="ltr">{user?.email}</p>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    تاریخ عضویت
                  </Label>
                  <p className="text-foreground">
                    {user?.created_at ? new Date(user.created_at).toLocaleDateString('fa-IR') : '-'}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>فصل فعلی</Label>
                  <div className="flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full ${
                      season === 'spring' ? 'bg-pink-500' :
                      season === 'summer' ? 'bg-green-500' :
                      season === 'autumn' ? 'bg-orange-500' :
                      'bg-blue-500'
                    }`} />
                    <p className="text-foreground">{seasonName}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats Overview */}
          <Card className="glass-card border-white/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                خلاصه عملکرد
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-white/5 border border-white/10 text-center">
                  <Clock className="h-8 w-8 text-primary mx-auto mb-2" />
                  <p className="text-2xl font-bold">{stats.totalStudyHours.toFixed(1)}</p>
                  <p className="text-sm text-muted-foreground">ساعت مطالعه</p>
                </div>

                <div className="p-4 rounded-lg bg-white/5 border border-white/10 text-center">
                  <Target className="h-8 w-8 text-accent mx-auto mb-2" />
                  <p className="text-2xl font-bold">{stats.totalTests}</p>
                  <p className="text-sm text-muted-foreground">تست حل شده</p>
                </div>

                <div className="p-4 rounded-lg bg-white/5 border border-white/10 text-center">
                  <BookOpen className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold">{stats.totalSessions}</p>
                  <p className="text-sm text-muted-foreground">جلسه مطالعه</p>
                </div>

                <div className="p-4 rounded-lg bg-white/5 border border-white/10 text-center">
                  <Flame className="h-8 w-8 text-orange-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold">{stats.streak}</p>
                  <p className="text-sm text-muted-foreground">روز متوالی</p>
                </div>
              </div>

              <div className="mt-6 p-4 rounded-lg bg-gradient-to-r from-primary/20 to-accent/20 border border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                    <span>میانگین امتیاز</span>
                  </div>
                  <span className="text-2xl font-bold">{stats.avgScore.toFixed(0)}%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Links */}
        <Card className="glass-card border-white/10">
          <CardHeader>
            <CardTitle>دسترسی سریع</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button
                variant="outline"
                className="h-auto py-4 flex flex-col gap-2 border-white/10 hover:bg-white/5"
                onClick={() => navigate('/daily-log')}
              >
                <Calendar className="h-6 w-6" />
                <span>برنامه امروز</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-4 flex flex-col gap-2 border-white/10 hover:bg-white/5"
                onClick={() => navigate('/weekly-plan')}
              >
                <BookOpen className="h-6 w-6" />
                <span>برنامه هفتگی</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-4 flex flex-col gap-2 border-white/10 hover:bg-white/5"
                onClick={() => navigate('/history')}
              >
                <TrendingUp className="h-6 w-6" />
                <span>تاریخچه عملکرد</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-4 flex flex-col gap-2 border-white/10 hover:bg-white/5"
                onClick={() => navigate('/pomodoro')}
              >
                <Clock className="h-6 w-6" />
                <span>تایمر پومودورو</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Profile;
