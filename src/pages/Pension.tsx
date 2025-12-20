import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { GlassCard } from '@/components/GlassCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Users, 
  Crown, 
  Link as LinkIcon, 
  Copy, 
  Plus,
  Clock,
  FileText,
  Trophy,
  LogOut,
  Trash2,
  Bell,
  Calendar,
  Play,
  Edit,
  X
} from 'lucide-react';
import { format } from 'date-fns-jalali';

interface PensionMember {
  id: string;
  user_id: string;
  role: string;
  joined_at: string;
  profile?: {
    username: string | null;
    display_name: string | null;
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
    total_study_minutes: number;
    total_tests: number;
  };
}

interface Pension {
  id: string;
  name: string;
  leader_id: string;
  invite_code: string;
  invite_enabled: boolean;
  member_count: number;
  max_members: number;
}

interface PensionAnnouncement {
  id: string;
  pension_id: string;
  created_by: string;
  title: string;
  content: string;
  created_at: string;
}

interface PensionExam {
  id: string;
  pension_id: string;
  created_by: string;
  title: string;
  description: string | null;
  exam_type: string;
  lessons: any[];
  start_time: string;
  end_time: string;
  duration_minutes: number | null;
  is_active: boolean;
  created_at: string;
}

const Pension = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [pension, setPension] = useState<Pension | null>(null);
  const [members, setMembers] = useState<PensionMember[]>([]);
  const [isLeader, setIsLeader] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pensionName, setPensionName] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // Announcements state
  const [announcements, setAnnouncements] = useState<PensionAnnouncement[]>([]);
  const [isAnnouncementDialogOpen, setIsAnnouncementDialogOpen] = useState(false);
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementContent, setAnnouncementContent] = useState('');

  // Exams state
  const [exams, setExams] = useState<PensionExam[]>([]);
  const [isExamDialogOpen, setIsExamDialogOpen] = useState(false);
  const [examTitle, setExamTitle] = useState('');
  const [examDescription, setExamDescription] = useState('');
  const [examStartTime, setExamStartTime] = useState('');
  const [examEndTime, setExamEndTime] = useState('');
  const [examDuration, setExamDuration] = useState('');

  useEffect(() => {
    if (user) {
      fetchPension();
    }
  }, [user]);

  const fetchPension = async () => {
    if (!user) return;

    try {
      // Check if user is in a pension
      const { data: membership } = await supabase
        .from('pension_members')
        .select('pension_id, role')
        .eq('user_id', user.id)
        .maybeSingle();

      if (membership) {
        setIsLeader(membership.role === 'leader');
        
        // Fetch pension details
        const { data: pensionData } = await supabase
          .from('pensions')
          .select('*')
          .eq('id', membership.pension_id)
          .single();

        if (pensionData) {
          setPension(pensionData);
          
          // Fetch members with profiles
          const { data: membersData } = await supabase
            .from('pension_members')
            .select('*')
            .eq('pension_id', pensionData.id)
            .order('joined_at');

          if (membersData) {
            // Fetch profiles for each member
            const membersWithProfiles = await Promise.all(
              membersData.map(async (member) => {
                const { data: profileData } = await supabase
                  .from('profiles')
                  .select('username, display_name, first_name, last_name, avatar_url, total_study_minutes, total_tests')
                  .eq('user_id', member.user_id)
                  .maybeSingle();
                return { ...member, profile: profileData } as PensionMember;
              })
            );
            
            // Sort by total study minutes (leaderboard)
            membersWithProfiles.sort((a, b) => 
              (b.profile?.total_study_minutes || 0) - (a.profile?.total_study_minutes || 0)
            );
            
            setMembers(membersWithProfiles);
          }

          // Fetch announcements
          const { data: announcementsData } = await supabase
            .from('pension_announcements')
            .select('*')
            .eq('pension_id', pensionData.id)
            .order('created_at', { ascending: false });

          if (announcementsData) {
            setAnnouncements(announcementsData);
          }

          // Fetch exams
          const { data: examsData } = await supabase
            .from('pension_exams')
            .select('*')
            .eq('pension_id', pensionData.id)
            .order('start_time', { ascending: true });

          if (examsData) {
            setExams(examsData as PensionExam[]);
          }
        }
      }
    } catch (error) {
      if (import.meta.env.DEV) console.error('[Debug]', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePension = async () => {
    if (!pensionName.trim() || !user) {
      toast.error('نام پانسیون را وارد کنید');
      return;
    }

    try {
      // Create pension
      const { data: newPension, error: pensionError } = await supabase
        .from('pensions')
        .insert({
          name: pensionName,
          leader_id: user.id,
        })
        .select()
        .single();

      if (pensionError) throw pensionError;

      // Add creator as leader member
      const { error: memberError } = await supabase
        .from('pension_members')
        .insert({
          pension_id: newPension.id,
          user_id: user.id,
          role: 'leader',
        });

      if (memberError) throw memberError;

      toast.success('پانسیون با موفقیت ایجاد شد');
      setIsCreateDialogOpen(false);
      setPensionName('');
      fetchPension();
    } catch (error) {
      if (import.meta.env.DEV) console.error('[Debug]', error);
      toast.error('خطا در ایجاد پانسیون');
    }
  };

  const copyInviteLink = () => {
    if (!pension) return;
    const link = `${window.location.origin}/pension/invite/${pension.invite_code}`;
    navigator.clipboard.writeText(link);
    toast.success('لینک دعوت کپی شد');
  };

  const toggleInviteLink = async () => {
    if (!pension) return;

    try {
      await supabase
        .from('pensions')
        .update({ invite_enabled: !pension.invite_enabled })
        .eq('id', pension.id);

      setPension({ ...pension, invite_enabled: !pension.invite_enabled });
      toast.success(pension.invite_enabled ? 'لینک غیرفعال شد' : 'لینک فعال شد');
    } catch (error) {
      toast.error('خطا در تغییر وضعیت لینک');
    }
  };

  const handleLeavePension = async () => {
    if (!pension || !user) return;
    
    if (isLeader) {
      toast.error('سرگروه نمی‌تواند پانسیون را ترک کند');
      return;
    }

    try {
      await supabase
        .from('pension_members')
        .delete()
        .eq('pension_id', pension.id)
        .eq('user_id', user.id);

      toast.success('از پانسیون خارج شدید');
      setPension(null);
      setMembers([]);
    } catch (error) {
      toast.error('خطا در خروج از پانسیون');
    }
  };

  const handleDeletePension = async () => {
    if (!pension || !user || !isLeader) return;

    try {
      // First delete all members
      await supabase
        .from('pension_members')
        .delete()
        .eq('pension_id', pension.id);

      // Then delete the pension
      await supabase
        .from('pensions')
        .delete()
        .eq('id', pension.id);

      toast.success('پانسیون حذف شد');
      setPension(null);
      setMembers([]);
    } catch (error) {
      toast.error('خطا در حذف پانسیون');
    }
  };

  const handleCreateAnnouncement = async () => {
    if (!announcementTitle.trim() || !announcementContent.trim() || !pension || !user) {
      toast.error('عنوان و محتوای اعلان را وارد کنید');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('pension_announcements')
        .insert({
          pension_id: pension.id,
          created_by: user.id,
          title: announcementTitle,
          content: announcementContent,
        })
        .select()
        .single();

      if (error) throw error;

      setAnnouncements([data, ...announcements]);
      setIsAnnouncementDialogOpen(false);
      setAnnouncementTitle('');
      setAnnouncementContent('');
      toast.success('اعلان ایجاد شد');
    } catch (error) {
      if (import.meta.env.DEV) console.error('[Debug]', error);
      toast.error('خطا در ایجاد اعلان');
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    try {
      await supabase
        .from('pension_announcements')
        .delete()
        .eq('id', id);

      setAnnouncements(announcements.filter(a => a.id !== id));
      toast.success('اعلان حذف شد');
    } catch (error) {
      toast.error('خطا در حذف اعلان');
    }
  };

  const handleCreateExam = async () => {
    if (!examTitle.trim() || !examStartTime || !examEndTime || !pension || !user) {
      toast.error('اطلاعات آزمون را کامل وارد کنید');
      return;
    }

    const startDate = new Date(examStartTime);
    const endDate = new Date(examEndTime);

    if (endDate <= startDate) {
      toast.error('زمان پایان باید بعد از زمان شروع باشد');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('pension_exams')
        .insert({
          pension_id: pension.id,
          created_by: user.id,
          title: examTitle,
          description: examDescription || null,
          exam_type: 'tashrihi',
          start_time: startDate.toISOString(),
          end_time: endDate.toISOString(),
          duration_minutes: examDuration ? parseInt(examDuration) : null,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;

      setExams([...exams, data as PensionExam]);
      setIsExamDialogOpen(false);
      setExamTitle('');
      setExamDescription('');
      setExamStartTime('');
      setExamEndTime('');
      setExamDuration('');
      toast.success('آزمون ایجاد شد');
    } catch (error) {
      if (import.meta.env.DEV) console.error('[Debug]', error);
      toast.error('خطا در ایجاد آزمون');
    }
  };

  const handleDeleteExam = async (id: string) => {
    try {
      await supabase
        .from('pension_exams')
        .delete()
        .eq('id', id);

      setExams(exams.filter(e => e.id !== id));
      toast.success('آزمون حذف شد');
    } catch (error) {
      toast.error('خطا در حذف آزمون');
    }
  };

  const formatStudyTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}:${mins.toString().padStart(2, '0')}`;
  };

  const getExamStatus = (exam: PensionExam) => {
    const now = new Date();
    const start = new Date(exam.start_time);
    const end = new Date(exam.end_time);

    if (now < start) {
      return { label: 'در انتظار', color: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30' };
    } else if (now >= start && now <= end) {
      return { label: 'در حال برگزاری', color: 'bg-green-500/20 text-green-500 border-green-500/30' };
    } else {
      return { label: 'پایان یافته', color: 'bg-muted text-muted-foreground border-muted' };
    }
  };

  const canTakeExam = (exam: PensionExam) => {
    const now = new Date();
    const start = new Date(exam.start_time);
    const end = new Date(exam.end_time);
    return now >= start && now <= end && exam.is_active;
  };

  const formatDateTime = (dateString: string) => {
    try {
      return format(new Date(dateString), 'yyyy/MM/dd - HH:mm');
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </AppLayout>
    );
  }

  // No pension - show create option
  if (!pension) {
    return (
      <AppLayout>
        <div className="space-y-6 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">پانسیون</h1>
              <p className="text-muted-foreground text-sm">با دوستانت گروهی مطالعه کن</p>
            </div>
          </div>

          <GlassCard className="p-12 text-center">
            <Users className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-medium mb-2">هنوز عضو پانسیونی نیستید</h3>
            <p className="text-muted-foreground text-sm mb-6">
              می‌توانید پانسیون جدید بسازید یا با لینک دعوت به پانسیون دوستانتان بپیوندید
            </p>
            
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  ایجاد پانسیون
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>ایجاد پانسیون جدید</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <Input
                    value={pensionName}
                    onChange={(e) => setPensionName(e.target.value)}
                    placeholder="نام پانسیون"
                    className="bg-white/5"
                  />
                  <Button onClick={handleCreatePension} className="w-full">
                    ایجاد
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </GlassCard>
        </div>
      </AppLayout>
    );
  }

  // Show pension
  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{pension.name}</h1>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="w-4 h-4" />
                <span>{pension.member_count} / {pension.max_members} عضو</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isLeader && (
              <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30">
                <Crown className="w-3 h-3 ml-1" />
                سرگروه
              </Badge>
            )}
          </div>
        </div>

        {/* Invite Link (Leader only) */}
        {isLeader && (
          <GlassCard className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <LinkIcon className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-medium">لینک دعوت</p>
                  <p className="text-sm text-muted-foreground">
                    {pension.invite_enabled 
                      ? pension.member_count >= pension.max_members 
                        ? 'پانسیون پر است' 
                        : 'فعال'
                      : 'غیرفعال'}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={copyInviteLink}
                  disabled={!pension.invite_enabled || pension.member_count >= pension.max_members}
                >
                  <Copy className="w-4 h-4 ml-1" />
                  کپی لینک
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={toggleInviteLink}
                >
                  {pension.invite_enabled ? 'غیرفعال کردن' : 'فعال کردن'}
                </Button>
              </div>
            </div>
          </GlassCard>
        )}

        {/* Pension Tabs */}
        <Tabs defaultValue="leaderboard" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="leaderboard">
              <Trophy className="w-4 h-4 ml-1" />
              جدول امتیازات
            </TabsTrigger>
            <TabsTrigger value="exams">
              <FileText className="w-4 h-4 ml-1" />
              آزمون
            </TabsTrigger>
            <TabsTrigger value="announcements">
              <Bell className="w-4 h-4 ml-1" />
              اعلان‌ها
            </TabsTrigger>
          </TabsList>

          {/* Leaderboard Tab */}
          <TabsContent value="leaderboard">
            <GlassCard>
              <div className="flex items-center gap-2 mb-4">
                <Trophy className="w-5 h-5 text-yellow-500" />
                <h2 className="font-bold text-lg">جدول امتیازات</h2>
              </div>

              <div className="space-y-2">
                {members.map((member, index) => (
                  <div 
                    key={member.id}
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      index === 0 ? 'bg-yellow-500/10 border border-yellow-500/20' :
                      index === 1 ? 'bg-gray-400/10 border border-gray-400/20' :
                      index === 2 ? 'bg-orange-500/10 border border-orange-500/20' :
                      'bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        index === 0 ? 'bg-yellow-500 text-black' :
                        index === 1 ? 'bg-gray-400 text-black' :
                        index === 2 ? 'bg-orange-500 text-black' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        {index + 1}
                      </div>
                      <Avatar className="w-10 h-10 border border-white/10">
                        <AvatarImage src={member.profile?.avatar_url || ''} />
                        <AvatarFallback className="bg-primary/20 text-primary text-sm">
                          {member.profile?.first_name?.[0] || member.profile?.username?.[0] || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium flex items-center gap-2">
                          @{member.profile?.username || 'بدون نام'}
                          {member.role === 'leader' && (
                            <Crown className="w-4 h-4 text-yellow-500" />
                          )}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {member.profile?.first_name} {member.profile?.last_name}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        <span>{formatStudyTime(member.profile?.total_study_minutes || 0)}</span>
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <FileText className="w-4 h-4" />
                        <span>{member.profile?.total_tests || 0} تست</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          </TabsContent>

          {/* Exams Tab */}
          <TabsContent value="exams">
            <GlassCard>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  <h2 className="font-bold text-lg">آزمون‌های پانسیون</h2>
                </div>
                {isLeader && (
                  <Dialog open={isExamDialogOpen} onOpenChange={setIsExamDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" className="gap-1">
                        <Plus className="w-4 h-4" />
                        ایجاد آزمون
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>ایجاد آزمون جدید</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 mt-4">
                        <div>
                          <label className="text-sm text-muted-foreground mb-1 block">عنوان آزمون</label>
                          <Input
                            value={examTitle}
                            onChange={(e) => setExamTitle(e.target.value)}
                            placeholder="مثال: آزمون جامع هفتگی"
                            className="bg-white/5"
                          />
                        </div>
                        <div>
                          <label className="text-sm text-muted-foreground mb-1 block">توضیحات (اختیاری)</label>
                          <Textarea
                            value={examDescription}
                            onChange={(e) => setExamDescription(e.target.value)}
                            placeholder="توضیحات آزمون..."
                            className="bg-white/5"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-sm text-muted-foreground mb-1 block">زمان شروع</label>
                            <Input
                              type="datetime-local"
                              value={examStartTime}
                              onChange={(e) => setExamStartTime(e.target.value)}
                              className="bg-white/5"
                            />
                          </div>
                          <div>
                            <label className="text-sm text-muted-foreground mb-1 block">زمان پایان</label>
                            <Input
                              type="datetime-local"
                              value={examEndTime}
                              onChange={(e) => setExamEndTime(e.target.value)}
                              className="bg-white/5"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-sm text-muted-foreground mb-1 block">مدت زمان (دقیقه - اختیاری)</label>
                          <Input
                            type="number"
                            value={examDuration}
                            onChange={(e) => setExamDuration(e.target.value)}
                            placeholder="مثال: 60"
                            className="bg-white/5"
                          />
                        </div>
                        <Button onClick={handleCreateExam} className="w-full">
                          ایجاد آزمون
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </div>

              {exams.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p>هنوز آزمونی ایجاد نشده است</p>
                  {isLeader && <p className="text-sm">برای ایجاد آزمون روی دکمه بالا کلیک کنید</p>}
                </div>
              ) : (
                <div className="space-y-3">
                  {exams.map((exam) => {
                    const status = getExamStatus(exam);
                    const canTake = canTakeExam(exam);
                    return (
                      <div 
                        key={exam.id}
                        className="p-4 rounded-lg bg-white/5 border border-white/10 space-y-3"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-medium">{exam.title}</h3>
                            {exam.description && (
                              <p className="text-sm text-muted-foreground mt-1">{exam.description}</p>
                            )}
                          </div>
                          <Badge className={status.color}>
                            {status.label}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>شروع: {formatDateTime(exam.start_time)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>پایان: {formatDateTime(exam.end_time)}</span>
                          </div>
                          {exam.duration_minutes && (
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              <span>مدت: {exam.duration_minutes} دقیقه</span>
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          {canTake && !isLeader && (
                            <Button 
                              size="sm" 
                              className="gap-1"
                              onClick={() => navigate(`/exam-panel?examId=${exam.id}`)}
                            >
                              <Play className="w-4 h-4" />
                              شرکت در آزمون
                            </Button>
                          )}
                          {isLeader && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  className="gap-1 text-destructive border-destructive/30 hover:bg-destructive/10"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  حذف
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>حذف آزمون</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    آیا مطمئن هستید که می‌خواهید این آزمون را حذف کنید؟
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter className="gap-2">
                                  <AlertDialogCancel>انصراف</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => handleDeleteExam(exam.id)}
                                    className="bg-destructive hover:bg-destructive/90"
                                  >
                                    حذف
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </GlassCard>
          </TabsContent>

          {/* Announcements Tab */}
          <TabsContent value="announcements">
            <GlassCard>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-primary" />
                  <h2 className="font-bold text-lg">اعلان‌های پانسیون</h2>
                </div>
                {isLeader && (
                  <Dialog open={isAnnouncementDialogOpen} onOpenChange={setIsAnnouncementDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" className="gap-1">
                        <Plus className="w-4 h-4" />
                        اعلان جدید
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>ایجاد اعلان جدید</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 mt-4">
                        <Input
                          value={announcementTitle}
                          onChange={(e) => setAnnouncementTitle(e.target.value)}
                          placeholder="عنوان اعلان"
                          className="bg-white/5"
                        />
                        <Textarea
                          value={announcementContent}
                          onChange={(e) => setAnnouncementContent(e.target.value)}
                          placeholder="متن اعلان..."
                          rows={4}
                          className="bg-white/5"
                        />
                        <Button onClick={handleCreateAnnouncement} className="w-full">
                          ایجاد اعلان
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </div>

              {announcements.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Bell className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p>هنوز اعلانی ایجاد نشده است</p>
                  {isLeader && <p className="text-sm">برای ایجاد اعلان روی دکمه بالا کلیک کنید</p>}
                </div>
              ) : (
                <div className="space-y-3">
                  {announcements.map((announcement) => (
                    <div 
                      key={announcement.id}
                      className="p-4 rounded-lg bg-white/5 border border-white/10"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium">{announcement.title}</h3>
                          <p className="text-sm text-muted-foreground mt-2 whitespace-pre-wrap">
                            {announcement.content}
                          </p>
                          <p className="text-xs text-muted-foreground mt-3">
                            {formatDateTime(announcement.created_at)}
                          </p>
                        </div>
                        {isLeader && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                size="icon" 
                                variant="ghost"
                                className="text-destructive hover:bg-destructive/10"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>حذف اعلان</AlertDialogTitle>
                                <AlertDialogDescription>
                                  آیا مطمئن هستید که می‌خواهید این اعلان را حذف کنید؟
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter className="gap-2">
                                <AlertDialogCancel>انصراف</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => handleDeleteAnnouncement(announcement.id)}
                                  className="bg-destructive hover:bg-destructive/90"
                                >
                                  حذف
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </GlassCard>
          </TabsContent>
        </Tabs>

        {/* Action Buttons */}
        <div className="flex gap-3">
          {!isLeader && (
            <Button 
              variant="outline" 
              className="flex-1 text-destructive border-destructive/30 hover:bg-destructive/10"
              onClick={handleLeavePension}
            >
              <LogOut className="w-4 h-4 ml-2" />
              خروج از پانسیون
            </Button>
          )}
          
          {isLeader && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="outline" 
                  className="flex-1 text-destructive border-destructive/30 hover:bg-destructive/10"
                >
                  <Trash2 className="w-4 h-4 ml-2" />
                  حذف پانسیون
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>آیا مطمئن هستید؟</AlertDialogTitle>
                  <AlertDialogDescription>
                    با حذف پانسیون، تمام اعضا و اطلاعات آن حذف خواهد شد. این عمل قابل بازگشت نیست.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="gap-2">
                  <AlertDialogCancel>انصراف</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleDeletePension}
                    className="bg-destructive hover:bg-destructive/90"
                  >
                    حذف پانسیون
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default Pension;
