import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { useSeason } from '@/contexts/SeasonContext';
import { useStudyStore } from '@/stores/studyStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
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
import { formatHoursDisplay } from '@/lib/timeUtils';

// Import student avatars
import studentAvatar1 from '@/assets/avatars/student-1.png';
import studentAvatar2 from '@/assets/avatars/student-2.png';
import studentAvatar3 from '@/assets/avatars/student-3.png';
import studentAvatar4 from '@/assets/avatars/student-4.png';
import studentAvatar5 from '@/assets/avatars/student-5.png';
import studentAvatar6 from '@/assets/avatars/student-6.png';

// Default avatar options - images and emojis
const AVATAR_IMAGES = [
  { url: studentAvatar1, name: 'student-1' },
  { url: studentAvatar2, name: 'student-2' },
  { url: studentAvatar3, name: 'student-3' },
  { url: studentAvatar4, name: 'student-4' },
  { url: studentAvatar5, name: 'student-5' },
  { url: studentAvatar6, name: 'student-6' },
];

const AVATAR_EMOJIS = [
  '🧑‍🎓', '👨‍💻', '👩‍💻', '📚', '🎯', '🚀', '⭐', '🌟', '💡', '🔥'
];

const Profile = () => {
  const navigate = useNavigate();
  const { user, profile, signOut, updateProfile, loading } = useAuth();
  const { season, seasonName } = useSeason();
  const { getStats, streak, weeklyPlan } = useStudyStore();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('');
  const [isAvatarDialogOpen, setIsAvatarDialogOpen] = useState(false);
  const [totalSessions, setTotalSessions] = useState(0);
  const [avgScore, setAvgScore] = useState(0);

  // Get weekly stats from store (same as dashboard)
  const weeklyStats = useMemo(() => getStats(), [getStats, weeklyPlan]);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || '');
      setUsername(profile.username || '');
      setSelectedAvatar(profile.avatar_url || '');
    }
  }, [profile]);

  useEffect(() => {
    const fetchAdditionalStats = async () => {
      if (!user) return;

      // Fetch daily logs for total sessions and avg score only
      const { data: logs } = await supabase
        .from('daily_logs')
        .select('*')
        .eq('user_id', user.id);

      if (logs) {
        const sessions = logs.reduce((sum, log) => sum + (log.total_sessions || 0), 0);
        const score = logs.length > 0 
          ? logs.reduce((sum, log) => sum + Number(log.overall_score || 0), 0) / logs.length 
          : 0;

        setTotalSessions(sessions);
        setAvgScore(score);
      }
    };

    fetchAdditionalStats();
  }, [user]);

  const handleSave = async () => {
    if (!displayName.trim()) {
      toast.error('نام نمایشی نمی‌تواند خالی باشد');
      return;
    }

    setIsSaving(true);
    const { error } = await updateProfile({ 
      display_name: displayName.trim(),
      username: username.trim() || null,
    });
    setIsSaving(false);

    if (error) {
      toast.error('خطا در ذخیره: ' + error.message);
    } else {
      toast.success('پروفایل به‌روزرسانی شد');
      setIsEditing(false);
    }
  };

  const handleAvatarSelect = async (emoji: string) => {
    setSelectedAvatar(emoji);
    const { error } = await updateProfile({ avatar_url: emoji });
    if (error) {
      toast.error('خطا در ذخیره آواتار');
    } else {
      toast.success('آواتار ذخیره شد');
      setIsAvatarDialogOpen(false);
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
              <div className="flex flex-col items-center justify-center mb-6">
                <Dialog open={isAvatarDialogOpen} onOpenChange={setIsAvatarDialogOpen}>
                  <DialogTrigger asChild>
                    <button className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-4xl font-bold text-white hover:opacity-80 transition-opacity cursor-pointer overflow-hidden">
                      {selectedAvatar?.startsWith('student-') ? (
                        <img 
                          src={AVATAR_IMAGES.find(a => a.name === selectedAvatar)?.url} 
                          alt="Avatar" 
                          className="w-full h-full object-cover"
                        />
                      ) : selectedAvatar ? (
                        selectedAvatar
                      ) : (
                        (profile?.display_name || user?.email || 'U')[0].toUpperCase()
                      )}
                    </button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>انتخاب آواتار</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                      <p className="text-sm text-muted-foreground">آواتار تصویری</p>
                      <div className="grid grid-cols-6 gap-2">
                        {AVATAR_IMAGES.map((avatar) => (
                          <button
                            key={avatar.name}
                            onClick={() => handleAvatarSelect(avatar.name)}
                            className={`w-12 h-12 rounded-xl overflow-hidden hover:ring-2 hover:ring-primary transition-all ${
                              selectedAvatar === avatar.name ? 'ring-2 ring-primary' : ''
                            }`}
                          >
                            <img src={avatar.url} alt={avatar.name} className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                      <p className="text-sm text-muted-foreground">ایموجی</p>
                      <div className="grid grid-cols-5 gap-2">
                        {AVATAR_EMOJIS.map((emoji, index) => (
                          <button
                            key={index}
                            onClick={() => handleAvatarSelect(emoji)}
                            className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl hover:bg-primary/20 transition-colors ${
                              selectedAvatar === emoji ? 'bg-primary/30 ring-2 ring-primary' : 'bg-white/5'
                            }`}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
                <p className="text-xs text-muted-foreground mt-2">برای تغییر آواتار کلیک کنید</p>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    نام نمایشی
                  </Label>
                  {isEditing ? (
                    <Input
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="bg-white/5 border-white/10"
                      placeholder="نام نمایشی"
                    />
                  ) : (
                    <p className="text-foreground">{profile?.display_name || 'تنظیم نشده'}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    نام کاربری
                  </Label>
                  {isEditing ? (
                    <Input
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="bg-white/5 border-white/10"
                      placeholder="نام کاربری (اختیاری)"
                      dir="ltr"
                    />
                  ) : (
                    <p className="text-foreground">{profile?.username ? `@${profile.username}` : 'تنظیم نشده'}</p>
                  )}
                </div>

                {isEditing ? (
                  <div className="flex gap-2">
                    <Button onClick={handleSave} disabled={isSaving} className="flex-1">
                      {isSaving ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : <Save className="h-4 w-4 ml-2" />}
                      ذخیره
                    </Button>
                    <Button variant="ghost" onClick={() => setIsEditing(false)}>
                      انصراف
                    </Button>
                  </div>
                ) : (
                  <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} className="w-full">
                    ویرایش پروفایل
                  </Button>
                )}

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
                  <p className="text-2xl font-bold">{formatHoursDisplay(weeklyStats.totalHours)}</p>
                  <p className="text-sm text-muted-foreground">ساعت مطالعه (هفته)</p>
                </div>

                <div className="p-4 rounded-lg bg-white/5 border border-white/10 text-center">
                  <Target className="h-8 w-8 text-accent mx-auto mb-2" />
                  <p className="text-2xl font-bold">{weeklyStats.totalTests}</p>
                  <p className="text-sm text-muted-foreground">تست حل شده (هفته)</p>
                </div>

                <div className="p-4 rounded-lg bg-white/5 border border-white/10 text-center">
                  <BookOpen className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold">{totalSessions}</p>
                  <p className="text-sm text-muted-foreground">جلسه مطالعه</p>
                </div>

                <div className="p-4 rounded-lg bg-white/5 border border-white/10 text-center">
                  <Flame className="h-8 w-8 text-orange-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold">{streak}</p>
                  <p className="text-sm text-muted-foreground">روز متوالی</p>
                </div>
              </div>

              <div className="mt-6 p-4 rounded-lg bg-gradient-to-r from-primary/20 to-accent/20 border border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                    <span>میانگین امتیاز</span>
                  </div>
                  <span className="text-2xl font-bold">{avgScore.toFixed(0)}%</span>
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
                <span>ثبت روزانه</span>
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
                onClick={() => navigate('/exam')}
              >
                <Target className="h-6 w-6" />
                <span>پنل آزمون</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Profile;
