import { useState, useEffect, useRef } from 'react';
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
  X,
  Target,
  ExternalLink,
  ArrowRight
} from 'lucide-react';
import { format } from 'date-fns-jalali';
import { MemberProfileModal } from '@/components/MemberProfileModal';
import { formatHoursDisplay } from '@/lib/timeUtils';
import { cn } from '@/lib/utils';
import { UrlPdfViewer, PdfViewerState, PdfViewerRef } from '@/components/exam/UrlPdfViewer';

// Import student avatars for display
import studentAvatar1 from '@/assets/avatars/student-1.png';
import studentAvatar2 from '@/assets/avatars/student-2.png';
import studentAvatar3 from '@/assets/avatars/student-3.png';
import studentAvatar4 from '@/assets/avatars/student-4.png';
import studentAvatar5 from '@/assets/avatars/student-5.png';
import studentAvatar6 from '@/assets/avatars/student-6.png';

const AVATAR_IMAGES: Record<string, string> = {
  'student-1': studentAvatar1,
  'student-2': studentAvatar2,
  'student-3': studentAvatar3,
  'student-4': studentAvatar4,
  'student-5': studentAvatar5,
  'student-6': studentAvatar6,
};

const getAvatarSrc = (avatarUrl: string | null): string | undefined => {
  if (!avatarUrl) return undefined;
  if (avatarUrl.startsWith('student-')) {
    return AVATAR_IMAGES[avatarUrl];
  }
  if (avatarUrl.length > 4) {
    return avatarUrl;
  }
  return undefined;
};

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
  weeklyStats?: {
    totalHours: number;
    totalTests: number;
  };
  wakeTime?: string | null;
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
  question_count: number;
  is_active: boolean;
  created_at: string;
  pdf_url: string | null;
  answer_key: Record<number, number> | null;
}

interface ExamResult {
  id: string;
  user_id: string;
  exam_id: string | null;
  pension_exam_id?: string | null;
  lesson_name: string | null;
  total_questions: number;
  correct_answers: number;
  wrong_answers: number;
  blank_answers: number;
  percentage: number | null;
  created_at: string;
  lessons_data?: Record<number, number | null> | null;
}

// Member Results Section Component
const MemberResultsSection = ({ pensionId, members }: { pensionId: string; members: PensionMember[] }) => {
  const [results, setResults] = useState<ExamResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const { data } = await supabase
          .from('exam_results')
          .select('*')
          .eq('pension_id', pensionId)
          .eq('exam_type', 'pension')
          .order('created_at', { ascending: false });

        if (data) {
          setResults(data as ExamResult[]);
        }
      } catch (error) {
        console.error('Error fetching results:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [pensionId]);

  const getMemberName = (userId: string) => {
    const member = members.find(m => m.user_id === userId);
    return member?.profile?.username || member?.profile?.first_name || 'کاربر';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Target className="w-12 h-12 mx-auto mb-2 opacity-30" />
        <p>هنوز نتیجه‌ای ثبت نشده است</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {results.map((result) => (
        <div 
          key={result.id}
          className="p-4 rounded-lg bg-white/5 border border-white/10"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Avatar className="w-8 h-8">
                <AvatarFallback className="bg-primary/20 text-primary text-xs">
                  {getMemberName(result.user_id)[0]}
                </AvatarFallback>
              </Avatar>
              <span className="font-medium">@{getMemberName(result.user_id)}</span>
            </div>
            <span className={`font-bold ${(result.percentage || 0) >= 50 ? 'text-green-500' : 'text-red-500'}`}>
              {(result.percentage || 0).toFixed(1)}%
            </span>
          </div>
          <div className="grid grid-cols-4 gap-2 text-center text-sm">
            <div>
              <p className="font-bold text-green-500">{result.correct_answers}</p>
              <p className="text-xs text-muted-foreground">صحیح</p>
            </div>
            <div>
              <p className="font-bold text-red-500">{result.wrong_answers}</p>
              <p className="text-xs text-muted-foreground">غلط</p>
            </div>
            <div>
              <p className="font-bold text-muted-foreground">{result.blank_answers}</p>
              <p className="text-xs text-muted-foreground">نزده</p>
            </div>
            <div>
              <p className="font-bold">{result.total_questions}</p>
              <p className="text-xs text-muted-foreground">کل</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {result.lesson_name} - {new Date(result.created_at).toLocaleDateString('fa-IR')}
          </p>
        </div>
      ))}
    </div>
  );
};

interface MemberWeeklyPlan {
  userId: string;
  displayName: string;
  username: string | null;
  avatarUrl: string | null;
  plans: {
    dayName: string;
    sessions: {
      subject: string;
      targetHours: number;
      actualHours: number;
      color: string;
    }[];
  }[];
}

// Members Weekly Plans Component
const MembersWeeklyPlans = ({ pensionId, members }: { pensionId: string; members: PensionMember[] }) => {
  const [memberPlans, setMemberPlans] = useState<MemberWeeklyPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);

  useEffect(() => {
    const fetchAllPlans = async () => {
      setLoading(true);
      try {
        // Get all member user IDs
        const userIds = members.map(m => m.user_id);
        
        // Fetch weekly plans for all members
        const { data: allPlans } = await supabase
          .from('weekly_plans')
          .select('*')
          .in('user_id', userIds)
          .order('day_index');

        if (allPlans) {
          // Group plans by user_id
          const plansByUser: Record<string, any[]> = {};
          allPlans.forEach(plan => {
            if (!plansByUser[plan.user_id]) {
              plansByUser[plan.user_id] = [];
            }
            plansByUser[plan.user_id].push(plan);
          });

          // Format for display
          const formattedPlans: MemberWeeklyPlan[] = members.map(member => {
            const userPlans = plansByUser[member.user_id] || [];
            return {
              userId: member.user_id,
              displayName: member.profile?.display_name || member.profile?.first_name || 'کاربر',
              username: member.profile?.username || null,
              avatarUrl: member.profile?.avatar_url || null,
              plans: userPlans.map(p => ({
                dayName: p.day_name,
                sessions: (p.sessions || []).map((s: any) => ({
                  subject: s.subject,
                  targetHours: s.targetHours || 0,
                  actualHours: s.actualHours || 0,
                  color: s.color || '#8b5cf6',
                })),
              })),
            };
          });

          setMemberPlans(formattedPlans);
          
          // Select first member by default
          if (formattedPlans.length > 0 && !selectedMemberId) {
            setSelectedMemberId(formattedPlans[0].userId);
          }
        }
      } catch (error) {
        console.error('Error fetching member plans:', error);
      } finally {
        setLoading(false);
      }
    };

    if (members.length > 0) {
      fetchAllPlans();
    }
  }, [members, pensionId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const selectedPlan = memberPlans.find(p => p.userId === selectedMemberId);

  return (
    <div className="space-y-4">
      {/* Member Selector */}
      <div className="flex flex-wrap gap-2">
        {memberPlans.map(plan => (
          <button
            key={plan.userId}
            onClick={() => setSelectedMemberId(plan.userId)}
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-lg transition-all',
              selectedMemberId === plan.userId
                ? 'bg-primary text-primary-foreground'
                : 'bg-white/5 hover:bg-white/10'
            )}
          >
            <Avatar className="w-6 h-6">
              <AvatarImage src={getAvatarSrc(plan.avatarUrl)} />
              <AvatarFallback className="bg-primary/20 text-primary text-xs">
                {plan.displayName[0]}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium">{plan.displayName}</span>
          </button>
        ))}
      </div>

      {/* Selected Member's Plan */}
      {selectedPlan && (
        <div className="space-y-3">
          {selectedPlan.plans.length === 0 || selectedPlan.plans.every(p => p.sessions.length === 0) ? (
            <div className="text-center py-6 text-muted-foreground">
              <Calendar className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">این کاربر هنوز برنامه‌ای تنظیم نکرده است</p>
            </div>
          ) : (
            selectedPlan.plans.filter(day => day.sessions.length > 0).map((day, idx) => (
              <div key={idx} className="p-3 rounded-lg bg-white/5 border border-white/10">
                <h4 className="font-medium mb-2 text-sm">{day.dayName}</h4>
                <div className="space-y-2">
                  {day.sessions.map((session, sIdx) => (
                    <div 
                      key={sIdx} 
                      className="flex items-center justify-between text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: session.color }}
                        />
                        <span>{session.subject}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-muted-foreground">هدف: {formatHoursDisplay(session.targetHours)}</span>
                        <span className="text-primary">انجام: {formatHoursDisplay(session.actualHours)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

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
  const [examStartHour, setExamStartHour] = useState('09');
  const [examStartMinute, setExamStartMinute] = useState('00');
  const [examEndHour, setExamEndHour] = useState('10');
  const [examEndMinute, setExamEndMinute] = useState('00');
  const [examDuration, setExamDuration] = useState('60');
  const [examQuestionCount, setExamQuestionCount] = useState('60');
  const [examPdfFile, setExamPdfFile] = useState<File | null>(null);
  
  // Exam taking state
  const [takingExam, setTakingExam] = useState<PensionExam | null>(null);
  const [examAnswers, setExamAnswers] = useState<{[key: number]: number | null}>({});
  const [examTimeLeft, setExamTimeLeft] = useState(0);
  const [isExamRunning, setIsExamRunning] = useState(false);
  const [examViewMode, setExamViewMode] = useState<'exam' | 'answer'>('exam');
  
  // User's exam results for checking if already taken
  const [userExamResults, setUserExamResults] = useState<ExamResult[]>([]);
  
  // Viewing result/report card state
  const [viewingReportCard, setViewingReportCard] = useState<ExamResult | null>(null);
  const [viewingAnswerSheet, setViewingAnswerSheet] = useState<{exam: PensionExam, result: ExamResult} | null>(null);
  const [answerSheetViewMode, setAnswerSheetViewMode] = useState<'exam' | 'answers'>('answers');
  
  // Leader answer key editing
  const [editingAnswerKey, setEditingAnswerKey] = useState<PensionExam | null>(null);
  const [answerKeyData, setAnswerKeyData] = useState<{[key: number]: number | null}>({});
  const [answerKeyViewMode, setAnswerKeyViewMode] = useState<'exam' | 'answer'>('exam');
  
  // PDF viewer state persistence
  const [examPdfState, setExamPdfState] = useState<PdfViewerState | undefined>(undefined);
  const [answerSheetPdfState, setAnswerSheetPdfState] = useState<PdfViewerState | undefined>(undefined);
  const [answerKeyPdfState, setAnswerKeyPdfState] = useState<PdfViewerState | undefined>(undefined);
  const examPdfRef = useRef<PdfViewerRef>(null);
  const answerSheetPdfRef = useRef<PdfViewerRef>(null);
  const answerKeyPdfRef = useRef<PdfViewerRef>(null);
  
  // Uploading state
  const [uploadingPdf, setUploadingPdf] = useState(false);
  
  // Member profile modal state
  const [selectedMember, setSelectedMember] = useState<PensionMember | null>(null);
  const [selectedMemberRank, setSelectedMemberRank] = useState<number | undefined>(undefined);
  
  // Wake up log state
  const [myWakeTime, setMyWakeTime] = useState<string | null>(null);
  const [loggingWakeUp, setLoggingWakeUp] = useState(false);

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
            // Get today's date for wake up logs
            const today = new Date().toISOString().split('T')[0];
            
            // Fetch profiles, weekly plans, and wake up logs for each member
            const membersWithProfiles = await Promise.all(
              membersData.map(async (member) => {
                const [profileRes, weeklyPlansRes, wakeLogRes] = await Promise.all([
                  supabase
                    .from('profiles')
                    .select('username, display_name, first_name, last_name, avatar_url, total_study_minutes, total_tests')
                    .eq('user_id', member.user_id)
                    .maybeSingle(),
                  supabase
                    .from('weekly_plans')
                    .select('sessions')
                    .eq('user_id', member.user_id),
                  supabase
                    .from('wake_up_logs')
                    .select('wake_time')
                    .eq('user_id', member.user_id)
                    .eq('pension_id', pensionData.id)
                    .eq('logged_date', today)
                    .maybeSingle()
                ]);

                // Calculate weekly stats from weekly_plans
                let weeklyHours = 0;
                let weeklyTests = 0;
                if (weeklyPlansRes.data) {
                  weeklyPlansRes.data.forEach((plan: any) => {
                    const sessions = plan.sessions || [];
                    sessions.forEach((session: any) => {
                      weeklyHours += session.actualHours || 0;
                      weeklyTests += session.actualTests || 0;
                    });
                  });
                }
                
                // Check if this is current user's wake time
                if (member.user_id === user?.id && wakeLogRes.data?.wake_time) {
                  setMyWakeTime(wakeLogRes.data.wake_time);
                }

                return { 
                  ...member, 
                  profile: profileRes.data,
                  weeklyStats: {
                    totalHours: weeklyHours,
                    totalTests: weeklyTests
                  },
                  wakeTime: wakeLogRes.data?.wake_time || null
                } as PensionMember;
              })
            );
            
            // Sort by weekly study hours (leaderboard)
            membersWithProfiles.sort((a, b) => 
              (b.weeklyStats?.totalHours || 0) - (a.weeklyStats?.totalHours || 0)
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

          // Fetch user's exam results to check which exams they've already taken
          if (user) {
            const { data: resultsData } = await supabase
              .from('exam_results')
              .select('*')
              .eq('user_id', user.id)
              .eq('pension_id', pensionData.id)
              .eq('exam_type', 'pension');

            if (resultsData) {
              setUserExamResults(resultsData as ExamResult[]);
            }
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
    if (!examTitle.trim() || !pension || !user) {
      toast.error('عنوان آزمون را وارد کنید');
      return;
    }

    if (!examPdfFile) {
      toast.error('فایل سوالات (PDF) اجباری است');
      return;
    }

    const qCount = parseInt(examQuestionCount) || 60;
    if (qCount < 1 || qCount > 200) {
      toast.error('تعداد سوالات باید بین ۱ تا ۲۰۰ باشد');
      return;
    }

    // Create today's date with selected hours
    const today = new Date();
    const startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), parseInt(examStartHour), parseInt(examStartMinute));
    const endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), parseInt(examEndHour), parseInt(examEndMinute));

    if (endDate <= startDate) {
      toast.error('ساعت پایان باید بعد از ساعت شروع باشد');
      return;
    }

    setUploadingPdf(true);
    toast.loading('در حال آپلود فایل...', { id: 'upload-toast' });
    
    try {
      // Upload PDF - using pension.id as folder name to match RLS policy
      const fileExt = examPdfFile.name.split('.').pop() || 'pdf';
      const fileName = `${pension.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('pension-exams')
        .upload(fileName, examPdfFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        toast.dismiss('upload-toast');
        if (uploadError.message.includes('row-level security') || uploadError.message.includes('policy')) {
          toast.error('فقط سرگروه می‌تواند فایل آپلود کند');
        } else if (uploadError.message.includes('The resource already exists')) {
          toast.error('فایلی با این نام وجود دارد');
        } else {
          toast.error('خطا در آپلود فایل');
        }
        console.error('[Exam] Upload error:', uploadError);
        return;
      }

      toast.loading('در حال ایجاد آزمون...', { id: 'upload-toast' });

      const { data: urlData } = supabase.storage
        .from('pension-exams')
        .getPublicUrl(fileName);

      const pdfUrl = urlData.publicUrl;

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
          duration_minutes: examDuration ? parseInt(examDuration) : 60,
          question_count: qCount,
          is_active: true,
          pdf_url: pdfUrl,
          answer_key: {},
        } as any)
        .select()
        .single();

      if (error) {
        toast.dismiss('upload-toast');
        toast.error('خطا در ذخیره آزمون');
        console.error('[Exam] Insert error:', error);
        return;
      }

      setExams([...exams, data as PensionExam]);
      setIsExamDialogOpen(false);
      setExamTitle('');
      setExamDescription('');
      setExamStartHour('09');
      setExamStartMinute('00');
      setExamEndHour('10');
      setExamEndMinute('00');
      setExamDuration('60');
      setExamQuestionCount('60');
      setExamPdfFile(null);
      toast.dismiss('upload-toast');
      toast.success('آزمون با موفقیت ایجاد شد');
    } catch (error: any) {
      toast.dismiss('upload-toast');
      toast.error('خطا در ایجاد آزمون');
      console.error('[Exam] Error:', error);
    } finally {
      setUploadingPdf(false);
    }
  };

  const handleStartExam = (exam: PensionExam) => {
    setTakingExam(exam);
    const initialAnswers: {[key: number]: number | null} = {};
    for (let i = 0; i < exam.question_count; i++) {
      initialAnswers[i] = null;
    }
    setExamAnswers(initialAnswers);
    
    const duration = exam.duration_minutes || 60;
    setExamTimeLeft(duration * 60);
    setIsExamRunning(true);
  };

  const handleExamAnswerSelect = (questionIndex: number, option: number) => {
    setExamAnswers(prev => ({
      ...prev,
      [questionIndex]: prev[questionIndex] === option ? null : option
    }));
  };

  const handleFinishAndSaveExam = async () => {
    if (!takingExam || !user || !pension) {
      toast.error('خطا: اطلاعات آزمون ناقص است');
      return;
    }
    
    setIsExamRunning(false);

    const qCount = takingExam.question_count;
    const answerKey = takingExam.answer_key || {};
    const hasAnswerKey = Object.keys(answerKey).length > 0;
    
    // Count user answers - those that have been selected
    const answeredQuestions = Object.keys(examAnswers).filter(
      key => examAnswers[Number(key)] !== null && examAnswers[Number(key)] !== undefined
    ).length;
    
    let correctCount = 0;
    let wrongCount = 0;
    let blankCount = 0;

    for (let i = 0; i < qCount; i++) {
      const myAnswer = examAnswers[i];
      const correct = hasAnswerKey ? answerKey[i] : null;
      
      if (myAnswer === null || myAnswer === undefined) {
        blankCount++;
      } else if (correct !== null && correct !== undefined && myAnswer === correct) {
        correctCount++;
      } else if (correct !== null && correct !== undefined && myAnswer !== correct) {
        wrongCount++;
      } else {
        // No answer key yet - user answered but can't calculate result
        // Don't count as blank, just mark as answered
      }
    }

    // If no answer key, count unanswered as blank
    if (!hasAnswerKey) {
      blankCount = qCount - answeredQuestions;
    }

    const percentage = hasAnswerKey && qCount > 0 
      ? ((correctCount - (wrongCount / 3)) / qCount) * 100 
      : 0;

    // Prepare data with proper type conversion for JSON storage
    const answersToStore: Record<string, number | null> = {};
    for (let i = 0; i < qCount; i++) {
      answersToStore[String(i)] = examAnswers[i] ?? null;
    }

    try {
      const insertData = {
        user_id: user.id,
        exam_type: 'pension',
        pension_id: pension.id,
        pension_exam_id: takingExam.id, // Use pension_exam_id instead of exam_id
        lesson_name: takingExam.title,
        total_questions: qCount,
        correct_answers: hasAnswerKey ? correctCount : 0,
        wrong_answers: hasAnswerKey ? wrongCount : 0,
        blank_answers: blankCount,
        percentage: Math.max(0, percentage),
        lessons_data: answersToStore,
      };

      console.log('[Exam] Saving exam result:', insertData);

      const { data: insertedResult, error } = await supabase
        .from('exam_results')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error('[Exam] Insert error details:', error);
        throw error;
      }

      console.log('[Exam] Saved successfully:', insertedResult);

      // Add to local state
      if (insertedResult) {
        setUserExamResults(prev => [...prev, insertedResult as ExamResult]);
        
        toast.success('پاسخ‌های شما ذخیره شد');
        
        // Always show the user their answer sheet after finishing
        setViewingAnswerSheet({ exam: takingExam, result: insertedResult as ExamResult });
      }

      setTakingExam(null);
      setExamAnswers({});
    } catch (error: any) {
      console.error('[Exam] Full error:', error);
      
      // More specific error messages
      if (error?.message?.includes('row-level security') || error?.message?.includes('policy')) {
        toast.error('خطا: شما دسترسی ثبت نتیجه ندارید');
      } else if (error?.message?.includes('duplicate')) {
        toast.error('شما قبلاً در این آزمون شرکت کرده‌اید');
      } else {
        toast.error('خطا در ذخیره پاسخ‌ها. لطفاً دوباره تلاش کنید.');
      }
    }
  };

  const handleExitExam = () => {
    setTakingExam(null);
    setExamAnswers({});
    setIsExamRunning(false);
  };

  // Check if user has already taken this exam
  const hasUserTakenExam = (examId: string) => {
    return userExamResults.some(r => r.pension_exam_id === examId || r.exam_id === examId);
  };

  // Get user's result for an exam
  const getUserExamResult = (examId: string) => {
    return userExamResults.find(r => r.pension_exam_id === examId || r.exam_id === examId);
  };

  // View user's answer sheet
  const handleViewAnswerSheet = (exam: PensionExam) => {
    const result = getUserExamResult(exam.id);
    if (result) {
      setViewingAnswerSheet({ exam, result });
    }
  };

  // Answer key editing functions for leader
  const handleEditAnswerKey = (exam: PensionExam) => {
    setEditingAnswerKey(exam);
    const initialKey: {[key: number]: number | null} = {};
    const existingKey = exam.answer_key || {};
    for (let i = 0; i < exam.question_count; i++) {
      initialKey[i] = existingKey[i] ?? null;
    }
    setAnswerKeyData(initialKey);
  };

  const handleAnswerKeySelect = (questionIndex: number, option: number) => {
    setAnswerKeyData(prev => ({
      ...prev,
      [questionIndex]: prev[questionIndex] === option ? null : option
    }));
  };

  const handleSaveAnswerKey = async () => {
    if (!editingAnswerKey || !pension) return;

    try {
      // Save answer key to exam
      await supabase
        .from('pension_exams')
        .update({ answer_key: answerKeyData })
        .eq('id', editingAnswerKey.id);

      // Recalculate scores for all users who took this exam
      // Use OR filter to check both pension_exam_id AND exam_id for legacy records
      const { data: allResults } = await supabase
        .from('exam_results')
        .select('*')
        .eq('pension_id', pension.id)
        .or(`pension_exam_id.eq.${editingAnswerKey.id},exam_id.eq.${editingAnswerKey.id}`);

      // Deduplicate by id
      const uniqueResults = (allResults || []).filter((result, index, self) => 
        index === self.findIndex(r => r.id === result.id)
      );

      if (uniqueResults.length > 0) {
        const qCount = editingAnswerKey.question_count;
        
        for (const result of uniqueResults) {
          const userAnswers = result.lessons_data || {};
          let correct = 0;
          let wrong = 0;
          let blank = 0;

          for (let i = 0; i < qCount; i++) {
            const userAnswer = (userAnswers as any)[i] ?? (userAnswers as any)[String(i)] ?? null;
            const correctAnswer = answerKeyData[i];
            
            if (userAnswer === null || userAnswer === undefined) {
              blank++;
            } else if (correctAnswer !== null && correctAnswer !== undefined && userAnswer === correctAnswer) {
              correct++;
            } else {
              wrong++;
            }
          }

          const rawScore = (correct * 3) - wrong;
          const maxScore = qCount * 3;
          const percentage = maxScore > 0 ? (rawScore / maxScore) * 100 : 0;

          await supabase
            .from('exam_results')
            .update({
              correct_answers: correct,
              wrong_answers: wrong,
              blank_answers: blank,
              percentage: Math.max(0, percentage),
              pension_exam_id: editingAnswerKey.id // Also fix legacy records
            })
            .eq('id', result.id);
        }

        // Refresh local exam results
        const { data: updatedResults } = await supabase
          .from('exam_results')
          .select('*')
          .eq('pension_id', pension.id);
        
        if (updatedResults) {
          setUserExamResults(updatedResults as ExamResult[]);
        }

        toast.success(`پاسخنامه ذخیره شد و کارنامه ${uniqueResults.length} نفر به‌روز شد`);
      } else {
        toast.success('پاسخنامه ذخیره شد');
      }

      // Update local exams list
      setExams(exams.map(e => 
        e.id === editingAnswerKey.id 
          ? { ...e, answer_key: answerKeyData as Record<number, number> } 
          : e
      ));

      setEditingAnswerKey(null);
      setAnswerKeyData({});
    } catch (error) {
      if (import.meta.env.DEV) console.error('[Debug]', error);
      toast.error('خطا در ذخیره پاسخنامه');
    }
  };

  const handleExitAnswerKey = () => {
    setEditingAnswerKey(null);
    setAnswerKeyData({});
  };

  // Timer effect
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (isExamRunning && examTimeLeft > 0) {
      timer = setInterval(() => {
        setExamTimeLeft(prev => {
          if (prev <= 1) {
            setIsExamRunning(false);
            toast.info('زمان آزمون تمام شد');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isExamRunning]);

  const formatExamTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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

  // Leader editing answer key view - exactly like reference image
  if (editingAnswerKey) {
    const markedCount = Object.values(answerKeyData).filter(a => a !== null).length;
    const unansweredCount = editingAnswerKey.question_count - markedCount;
    const progressPercent = editingAnswerKey.question_count > 0 ? Math.round((markedCount / editingAnswerKey.question_count) * 100) : 0;
    
    return (
      <div className="min-h-screen bg-background flex flex-col">
        {/* Header - exactly like reference image */}
        <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-xl border-b border-border/50 px-4 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            {/* Left side - save button and tabs */}
            <div className="flex items-center gap-3">
              <Button 
                onClick={handleSaveAnswerKey}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium px-6"
              >
                ذخیره پاسخنامه
              </Button>
              
              <div className="flex bg-muted/50 rounded-lg p-1">
                <button
                  onClick={() => setAnswerKeyViewMode('answer')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
                    answerKeyViewMode === 'answer' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  پاسخنامه
                </button>
                <button
                  onClick={() => setAnswerKeyViewMode('exam')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
                    answerKeyViewMode === 'exam' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  آزمون
                </button>
              </div>
            </div>

            {/* Center - progress and title */}
            <div className="flex items-center gap-6">
              <div className="text-sm text-muted-foreground">
                پیشرفت: <span className="font-bold">{markedCount}/{editingAnswerKey.question_count}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold">پاسخنامه: {editingAnswerKey.title}</span>
                <FileText className="w-5 h-5 text-primary" />
              </div>
            </div>

            {/* Right side - exit button */}
            <button 
              onClick={handleExitAnswerKey}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <FileText className="w-5 h-5" />
              <span className="text-sm">خروج از ویرایش</span>
            </button>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-hidden flex flex-col">
          {answerKeyViewMode === 'exam' ? (
            /* PDF View */
            editingAnswerKey.pdf_url ? (
              <div className="flex-1 overflow-hidden">
                <UrlPdfViewer 
                  ref={answerKeyPdfRef}
                  url={editingAnswerKey.pdf_url}
                  initialState={answerKeyPdfState}
                  onStateChange={setAnswerKeyPdfState}
                />
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                <p>فایل PDF موجود نیست</p>
              </div>
            )
          ) : (
            /* Answer Sheet View - exactly like reference image */
            <div className="flex-1 overflow-y-auto p-6">
              <h2 className="text-xl font-bold text-right mb-6">پاسخنامه</h2>
              
              {/* Questions Grid - RTL, 5 columns */}
              <div className="grid grid-cols-5 gap-4 direction-rtl" style={{ direction: 'rtl' }}>
                {Array.from({ length: editingAnswerKey.question_count }, (_, idx) => (
                  <div 
                    key={idx} 
                    className="p-4 bg-card/50 border border-border/50 rounded-xl text-center"
                  >
                    <p className="text-sm font-bold text-foreground mb-3">سوال {idx + 1}</p>
                    <div className="flex justify-center gap-2" style={{ direction: 'ltr' }}>
                      {[4, 3, 2, 1].map((opt) => {
                        const isSelected = answerKeyData[idx] === opt;
                        
                        return (
                          <button
                            key={opt}
                            onClick={() => handleAnswerKeySelect(idx, opt)}
                            className={`w-9 h-9 rounded-full text-sm font-bold transition-all ${
                              isSelected 
                                ? "bg-success text-success-foreground shadow-lg shadow-success/30" 
                                : "bg-muted/80 text-foreground hover:bg-muted"
                            }`}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer Stats - exactly like reference */}
          {answerKeyViewMode === 'answer' && (
            <div className="grid grid-cols-3 border-t border-border/50">
              <div className="p-4 text-center bg-card/30">
                <p className="text-2xl font-bold text-success">{progressPercent}%</p>
                <p className="text-sm text-muted-foreground">پیشرفت</p>
              </div>
              <div className="p-4 text-center bg-primary/10 border-x border-border/50">
                <p className="text-2xl font-bold text-primary">{unansweredCount}</p>
                <p className="text-sm text-muted-foreground">بدون پاسخ</p>
              </div>
              <div className="p-4 text-center bg-card/30">
                <p className="text-2xl font-bold text-foreground">{markedCount}</p>
                <p className="text-sm text-muted-foreground">پاسخ داده شده</p>
              </div>
            </div>
          )}
        </main>
      </div>
    );
  }

  // View answer sheet - full screen like exam panel
  if (viewingAnswerSheet) {
    const hasAnswerKey = viewingAnswerSheet.exam.answer_key && Object.keys(viewingAnswerSheet.exam.answer_key).length > 0;
    const userAnswersRaw = viewingAnswerSheet.result.lessons_data || {};
    
    return (
      <div className="fixed inset-0 z-50 bg-background overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
        </div>

        {/* Top Header Bar */}
        <div className="absolute top-0 left-0 right-0 h-16 bg-card/80 backdrop-blur-xl border-b border-white/10 flex items-center justify-between px-6 z-10">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setViewingAnswerSheet(null)}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowRight className="w-5 h-5" />
              <span className="text-sm">بازگشت</span>
            </button>
            <div className="h-6 w-px bg-white/20" />
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              <span className="font-semibold">پاسخبرگ شما - {viewingAnswerSheet.exam.title}</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Status Badge */}
            {hasAnswerKey ? (
              <Badge variant="outline" className="bg-success/10 text-success border-success/30">
                تصحیح شده
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-warning/10 text-warning border-warning/30">
                در انتظار تصحیح
              </Badge>
            )}

            <div className="h-6 w-px bg-white/20" />

            {/* View mode toggle */}
            <div className="flex items-center gap-1 bg-muted/30 rounded-lg p-1">
              {viewingAnswerSheet.exam.pdf_url && (
                <Button
                  variant={answerSheetViewMode === 'exam' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setAnswerSheetViewMode('exam')}
                  className="gap-2"
                >
                  <FileText className="w-4 h-4" />
                  سوالات
                </Button>
              )}
              <Button
                variant={answerSheetViewMode === 'answers' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setAnswerSheetViewMode('answers')}
                className="gap-2"
              >
                <FileText className="w-4 h-4" />
                پاسخبرگ
              </Button>
            </div>

            {/* Report Card Button */}
            {hasAnswerKey && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setViewingReportCard(viewingAnswerSheet.result);
                  setViewingAnswerSheet(null);
                }}
                className="gap-2"
              >
                <Trophy className="w-4 h-4" />
                کارنامه
              </Button>
            )}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="absolute top-16 bottom-0 left-0 right-0 flex">
          {/* PDF Viewer */}
          {answerSheetViewMode === 'exam' && viewingAnswerSheet.exam.pdf_url && (
            <div className="w-full h-full bg-card/30">
              <UrlPdfViewer 
                ref={answerSheetPdfRef}
                url={viewingAnswerSheet.exam.pdf_url}
                initialState={answerSheetPdfState}
                onStateChange={setAnswerSheetPdfState}
              />
            </div>
          )}

          {/* Answer Sheet View */}
          {answerSheetViewMode === 'answers' && (
            <div className="w-full h-full overflow-hidden flex flex-col">
              {/* Stats Summary */}
              <div className="p-4 border-b border-white/10 bg-card/30">
                <div className="grid grid-cols-4 gap-3 max-w-3xl mx-auto">
                  <div className="text-center p-3 bg-success/20 rounded-xl border border-success/30">
                    <p className="text-2xl font-bold text-success">{viewingAnswerSheet.result.correct_answers}</p>
                    <p className="text-xs text-muted-foreground">صحیح</p>
                  </div>
                  <div className="text-center p-3 bg-destructive/20 rounded-xl border border-destructive/30">
                    <p className="text-2xl font-bold text-destructive">{viewingAnswerSheet.result.wrong_answers}</p>
                    <p className="text-xs text-muted-foreground">غلط</p>
                  </div>
                  <div className="text-center p-3 bg-muted rounded-xl border border-white/10">
                    <p className="text-2xl font-bold">{viewingAnswerSheet.result.blank_answers}</p>
                    <p className="text-xs text-muted-foreground">نزده</p>
                  </div>
                  <div className="text-center p-3 bg-primary/20 rounded-xl border border-primary/30">
                    <p className="text-2xl font-bold text-primary">
                      {hasAnswerKey ? `${(viewingAnswerSheet.result.percentage || 0).toFixed(1)}%` : '---'}
                    </p>
                    <p className="text-xs text-muted-foreground">درصد</p>
                  </div>
                </div>

                {/* Grading Status Message */}
                {!hasAnswerKey && (
                  <div className="mt-4 p-3 bg-warning/10 border border-warning/30 rounded-xl text-center max-w-3xl mx-auto">
                    <p className="text-warning text-sm font-medium">
                      ⏳ سرگروه هنوز پاسخنامه را وارد نکرده است
                    </p>
                  </div>
                )}
              </div>
              
              {/* Answer Grid */}
              <div className="flex-1 overflow-auto p-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 max-w-6xl mx-auto">
                  {Array.from({ length: viewingAnswerSheet.exam.question_count }, (_, idx) => {
                    const userAnswer = (userAnswersRaw as any)[idx] ?? (userAnswersRaw as any)[String(idx)] ?? null;
                    const answerKey = viewingAnswerSheet.exam.answer_key || {};
                    const correctAnswer = answerKey[idx];
                    
                    let status = 'blank';
                    if (userAnswer !== null && userAnswer !== undefined) {
                      if (hasAnswerKey && correctAnswer !== null && correctAnswer !== undefined) {
                        status = userAnswer === correctAnswer ? 'correct' : 'wrong';
                      } else {
                        status = 'answered';
                      }
                    }
                    
                    return (
                      <div 
                        key={idx} 
                        className={cn(
                          "p-4 rounded-xl text-center border transition-all",
                          status === 'correct' && 'bg-success/10 border-success/30',
                          status === 'wrong' && 'bg-destructive/10 border-destructive/30',
                          status === 'answered' && 'bg-primary/10 border-primary/30',
                          status === 'blank' && 'bg-card/50 border-white/10'
                        )}
                      >
                        <p className="text-sm font-bold mb-3">سوال {idx + 1}</p>
                        <div className="grid grid-cols-4 gap-1">
                          {[1, 2, 3, 4].map((opt) => {
                            const isUserAnswer = userAnswer === opt;
                            const isCorrectAnswer = hasAnswerKey && correctAnswer === opt;
                            
                            return (
                              <div
                                key={opt}
                                className={cn(
                                  "w-8 h-8 rounded-md text-xs font-bold flex items-center justify-center mx-auto",
                                  isCorrectAnswer && isUserAnswer && 'bg-success text-white',
                                  isCorrectAnswer && !isUserAnswer && 'bg-success/50 text-white ring-2 ring-success',
                                  isUserAnswer && !isCorrectAnswer && hasAnswerKey && 'bg-destructive text-white',
                                  isUserAnswer && !hasAnswerKey && 'bg-primary text-white',
                                  !isUserAnswer && !isCorrectAnswer && 'bg-muted/30 text-muted-foreground'
                                )}
                              >
                                {opt}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Footer Legend */}
              <div className="p-4 border-t border-white/10 bg-card/30">
                <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-primary"></div>
                    <span>پاسخ شما (در انتظار تصحیح)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-success"></div>
                    <span>پاسخ صحیح شما</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-destructive"></div>
                    <span>پاسخ غلط شما</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-success/50 ring-2 ring-success"></div>
                    <span>پاسخ صحیح (نزده)</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Taking exam view - exactly like ExamPanel (TestExam.tsx) reference
  if (takingExam) {
    const answeredCount = Object.values(examAnswers).filter(a => a !== null).length;
    const unansweredCount = takingExam.question_count - answeredCount;
    const progressPercent = takingExam.question_count > 0 ? Math.round((answeredCount / takingExam.question_count) * 100) : 0;
    
    return (
      <div className="fixed inset-0 z-50 bg-background overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
        </div>

        {/* Top Header Bar */}
        <div className="absolute top-0 left-0 right-0 h-16 bg-card/80 backdrop-blur-xl border-b border-white/10 flex items-center justify-between px-6 z-10">
          <div className="flex items-center gap-4">
            <button
              onClick={handleExitExam}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <FileText className="w-5 h-5" />
              <span className="text-sm">خروج از آزمون</span>
            </button>
            <div className="h-6 w-px bg-white/20" />
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              <span className="font-semibold">آزمون درحال برگزاری</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Progress */}
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">پیشرفت:</span>
              <span className="font-bold text-primary">{answeredCount}/{takingExam.question_count}</span>
              <div className="w-24 h-2 bg-muted/30 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            <div className="h-6 w-px bg-white/20" />

            {/* Timer */}
            {isExamRunning && (
              <div className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full font-mono",
                examTimeLeft < 60 ? "bg-destructive/20 text-destructive" : "bg-primary/20 text-primary"
              )}>
                <Clock className="w-5 h-5" />
                <span className="font-bold text-xl tabular-nums">{formatExamTime(examTimeLeft)}</span>
              </div>
            )}

            <div className="flex items-center gap-1 bg-muted/30 rounded-lg p-1">
              <Button
                variant={examViewMode === 'exam' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setExamViewMode('exam')}
                className="gap-2"
              >
                <FileText className="w-4 h-4" />
                آزمون
              </Button>
              <Button
                variant={examViewMode === 'answer' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setExamViewMode('answer')}
                className="gap-2"
              >
                <FileText className="w-4 h-4" />
                پاسخنامه
              </Button>
            </div>

            <Button
              onClick={handleFinishAndSaveExam}
              className="bg-warning hover:bg-warning/90 text-warning-foreground"
            >
              پایان آزمون
            </Button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="absolute top-16 bottom-0 left-0 right-0 flex">
          {/* PDF Viewer - Full Screen when in exam mode */}
          {examViewMode === 'exam' && takingExam.pdf_url && (
            <div className="w-full h-full bg-card/30">
              <UrlPdfViewer 
                ref={examPdfRef}
                url={takingExam.pdf_url}
                initialState={examPdfState}
                onStateChange={setExamPdfState}
              />
            </div>
          )}

          {examViewMode === 'exam' && !takingExam.pdf_url && (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              <p>فایل PDF موجود نیست</p>
            </div>
          )}

          {/* Answer Sheet - Full Screen when in answer mode */}
          {examViewMode === 'answer' && (
            <div className="w-full h-full overflow-hidden flex flex-col">
              <div className="p-4 border-b border-white/10 bg-card/30">
                <h3 className="text-lg font-semibold">پاسخنامه</h3>
              </div>
              
              <div className="flex-1 overflow-auto p-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 max-w-6xl mx-auto">
                  {Array.from({ length: takingExam.question_count }, (_, idx) => {
                    const isSelected = examAnswers[idx] !== null && examAnswers[idx] !== undefined;
                    return (
                      <div
                        key={idx}
                        className={cn(
                          "p-4 rounded-xl backdrop-blur-sm border transition-colors",
                          isSelected ? "bg-primary/10 border-primary/30" : "bg-card/50 border-white/10 hover:border-primary/30"
                        )}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <span className="font-bold text-lg">سوال {idx + 1}</span>
                          {isSelected && (
                            <div className="w-5 h-5 rounded-full bg-success flex items-center justify-center">
                              <span className="text-xs text-white">✓</span>
                            </div>
                          )}
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                          {[1, 2, 3, 4].map((option) => (
                            <button
                              key={option}
                              onClick={() => handleExamAnswerSelect(idx, option)}
                              className={cn(
                                "w-12 h-12 rounded-lg text-base font-bold transition-all",
                                examAnswers[idx] === option
                                  ? "bg-primary text-white shadow-lg shadow-primary/30"
                                  : "bg-muted/30 hover:bg-muted/50"
                              )}
                            >
                              {option}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Bottom Stats Bar */}
              <div className="p-4 border-t border-white/10 bg-card/30">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
                    <p className="text-2xl font-bold text-primary">{answeredCount}</p>
                    <p className="text-xs text-muted-foreground">پاسخ داده شده</p>
                  </div>
                  <div className="p-3 rounded-xl bg-warning/10 border border-warning/20">
                    <p className="text-2xl font-bold text-warning">{unansweredCount}</p>
                    <p className="text-xs text-muted-foreground">بدون پاسخ</p>
                  </div>
                  <div className="p-3 rounded-xl bg-success/10 border border-success/20">
                    <p className="text-2xl font-bold text-success">{progressPercent}%</p>
                    <p className="text-xs text-muted-foreground">پیشرفت</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

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
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="leaderboard">
              <Trophy className="w-4 h-4 ml-1" />
              امتیازات
            </TabsTrigger>
            <TabsTrigger value="exams">
              <FileText className="w-4 h-4 ml-1" />
              آزمون
            </TabsTrigger>
            <TabsTrigger value="results">
              <Target className="w-4 h-4 ml-1" />
              عملکرد
            </TabsTrigger>
            <TabsTrigger value="announcements">
              <Bell className="w-4 h-4 ml-1" />
              اعلان‌ها
            </TabsTrigger>
          </TabsList>

          {/* Leaderboard Tab */}
          <TabsContent value="leaderboard">
            <GlassCard>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-500" />
                  <h2 className="font-bold text-lg">جدول امتیازات</h2>
                </div>
                
                {/* Wake Up Button */}
                <Button
                  size="sm"
                  variant={myWakeTime ? "outline" : "default"}
                  disabled={loggingWakeUp || !!myWakeTime}
                  onClick={async () => {
                    if (!user || !pension || myWakeTime) return;
                    
                    setLoggingWakeUp(true);
                    try {
                      const now = new Date();
                      const wakeTime = now.toTimeString().split(' ')[0].substring(0, 5);
                      const today = now.toISOString().split('T')[0];
                      
                      const { error } = await supabase
                        .from('wake_up_logs')
                        .upsert({
                          user_id: user.id,
                          pension_id: pension.id,
                          wake_time: wakeTime,
                          logged_date: today
                        }, {
                          onConflict: 'user_id,pension_id,logged_date'
                        });
                      
                      if (error) throw error;
                      
                      setMyWakeTime(wakeTime);
                      // Update local members list
                      setMembers(prev => prev.map(m => 
                        m.user_id === user.id ? { ...m, wakeTime } : m
                      ));
                      toast.success(`ساعت بیداری ثبت شد: ${wakeTime}`);
                    } catch (error) {
                      console.error('Error logging wake up:', error);
                      toast.error('خطا در ثبت ساعت بیداری');
                    } finally {
                      setLoggingWakeUp(false);
                    }
                  }}
                  className="gap-1"
                >
                  <Clock className="w-4 h-4" />
                  {myWakeTime ? `بیداری: ${myWakeTime}` : 'ثبت بیداری'}
                </Button>
              </div>

              <div className="space-y-2">
                {members.map((member, index) => (
                  <div 
                    key={member.id}
                    onClick={() => {
                      if (member.profile) {
                        setSelectedMember(member);
                        setSelectedMemberRank(index + 1);
                      }
                    }}
                    className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all hover:scale-[1.01] ${
                      index === 0 ? 'bg-yellow-500/10 border border-yellow-500/20 hover:bg-yellow-500/20' :
                      index === 1 ? 'bg-gray-400/10 border border-gray-400/20 hover:bg-gray-400/20' :
                      index === 2 ? 'bg-orange-500/10 border border-orange-500/20 hover:bg-orange-500/20' :
                      'bg-white/5 hover:bg-white/10'
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
                        <AvatarImage src={getAvatarSrc(member.profile?.avatar_url || null)} />
                        <AvatarFallback className="bg-primary/20 text-primary text-sm">
                          {member.profile?.avatar_url && member.profile.avatar_url.length <= 4 && !member.profile.avatar_url.startsWith('student-')
                            ? member.profile.avatar_url
                            : member.profile?.first_name?.[0] || member.profile?.username?.[0] || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium flex items-center gap-2">
                          {member.profile?.display_name || member.profile?.username || 'بدون نام'}
                          {member.role === 'leader' && (
                            <Crown className="w-4 h-4 text-yellow-500" />
                          )}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {member.profile?.username ? `@${member.profile.username}` : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      {member.wakeTime && (
                        <div className="flex items-center gap-1 text-green-500">
                          <Clock className="w-4 h-4" />
                          <span>{member.wakeTime}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        <span>{formatHoursDisplay(member.weeklyStats?.totalHours || 0)} ساعت</span>
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <FileText className="w-4 h-4" />
                        <span>{member.weeklyStats?.totalTests || 0} تست</span>
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
                        <DialogTitle>ایجاد آزمون جدید (امروز)</DialogTitle>
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
                            <label className="text-sm text-muted-foreground mb-1 block">ساعت شروع</label>
                            <div className="flex gap-1">
                              <select
                                value={examStartHour}
                                onChange={(e) => setExamStartHour(e.target.value)}
                                className="flex-1 h-10 rounded-md border border-input bg-white/5 px-3 py-2 text-sm"
                              >
                                {Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0')).map(h => (
                                  <option key={h} value={h}>{h}</option>
                                ))}
                              </select>
                              <span className="flex items-center">:</span>
                              <select
                                value={examStartMinute}
                                onChange={(e) => setExamStartMinute(e.target.value)}
                                className="flex-1 h-10 rounded-md border border-input bg-white/5 px-3 py-2 text-sm"
                              >
                                {['00', '15', '30', '45'].map(m => (
                                  <option key={m} value={m}>{m}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                          <div>
                            <label className="text-sm text-muted-foreground mb-1 block">ساعت پایان</label>
                            <div className="flex gap-1">
                              <select
                                value={examEndHour}
                                onChange={(e) => setExamEndHour(e.target.value)}
                                className="flex-1 h-10 rounded-md border border-input bg-white/5 px-3 py-2 text-sm"
                              >
                                {Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0')).map(h => (
                                  <option key={h} value={h}>{h}</option>
                                ))}
                              </select>
                              <span className="flex items-center">:</span>
                              <select
                                value={examEndMinute}
                                onChange={(e) => setExamEndMinute(e.target.value)}
                                className="flex-1 h-10 rounded-md border border-input bg-white/5 px-3 py-2 text-sm"
                              >
                                {['00', '15', '30', '45'].map(m => (
                                  <option key={m} value={m}>{m}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-sm text-muted-foreground mb-1 block">مدت زمان (دقیقه)</label>
                            <Input
                              type="number"
                              value={examDuration}
                              onChange={(e) => setExamDuration(e.target.value)}
                              placeholder="مثال: 60"
                              className="bg-white/5"
                            />
                          </div>
                          <div>
                            <label className="text-sm text-muted-foreground mb-1 block">تعداد سوالات</label>
                            <Input
                              type="number"
                              value={examQuestionCount}
                              onChange={(e) => setExamQuestionCount(e.target.value)}
                              placeholder="مثال: 60"
                              className="bg-white/5"
                              min={1}
                              max={200}
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-sm text-muted-foreground mb-1 block">
                            فایل سوالات (PDF) <span className="text-destructive">*</span>
                          </label>
                          <Input
                            type="file"
                            accept=".pdf"
                            onChange={(e) => setExamPdfFile(e.target.files?.[0] || null)}
                            className="bg-white/5"
                            required
                          />
                          {examPdfFile && (
                            <p className="text-xs text-success mt-1">
                              ✓ فایل انتخاب شده: {examPdfFile.name}
                            </p>
                          )}
                        </div>
                        <Button 
                          onClick={handleCreateExam} 
                          className="w-full"
                          disabled={uploadingPdf}
                        >
                          {uploadingPdf ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin ml-2" />
                              در حال آپلود...
                            </>
                          ) : (
                            'ایجاد آزمون'
                          )}
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
                          <div className="flex items-center gap-1">
                            <FileText className="w-4 h-4" />
                            <span>{exam.question_count} سوال</span>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {/* User hasn't taken this exam yet and can take it */}
                          {canTake && !hasUserTakenExam(exam.id) && (
                            <Button 
                              size="sm" 
                              className="gap-1"
                              onClick={() => handleStartExam(exam)}
                            >
                              <Play className="w-4 h-4" />
                              شرکت در آزمون
                            </Button>
                          )}
                          
                          {/* User has already taken this exam - show view answer sheet button */}
                          {hasUserTakenExam(exam.id) && (
                            <>
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="gap-1"
                                onClick={() => handleViewAnswerSheet(exam)}
                              >
                                <FileText className="w-4 h-4" />
                                مشاهده پاسخبرگ
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="gap-1"
                                onClick={() => setViewingReportCard(getUserExamResult(exam.id) || null)}
                              >
                                <Trophy className="w-4 h-4" />
                                مشاهده کارنامه
                              </Button>
                              <Badge variant="outline" className="bg-success/10 text-success border-success/30">
                                آزمون داده شده ✓
                              </Badge>
                            </>
                          )}
                          
                          {isLeader && (
                            <>
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="gap-1"
                                onClick={() => handleEditAnswerKey(exam)}
                              >
                                <Edit className="w-4 h-4" />
                                {exam.answer_key && Object.keys(exam.answer_key).length > 0 ? 'ویرایش پاسخنامه' : 'افزودن پاسخنامه'}
                              </Button>
                              {exam.pdf_url && (
                                <Badge variant="outline" className="bg-success/10 text-success border-success/30">
                                  <FileText className="w-3 h-3 ml-1" />
                                  PDF
                                </Badge>
                              )}
                              {exam.answer_key && Object.keys(exam.answer_key).length > 0 && (
                                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                                  کلید: {Object.keys(exam.answer_key).length} سوال
                                </Badge>
                              )}
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
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </GlassCard>
          </TabsContent>

          {/* Results Tab */}
          <TabsContent value="results">
            <GlassCard>
              <div className="flex items-center gap-2 mb-4">
                <Target className="w-5 h-5 text-primary" />
                <h2 className="font-bold text-lg">عملکرد اعضا در آزمون‌ها</h2>
              </div>

              <MemberResultsSection pensionId={pension.id} members={members} />
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
        
        {/* Member Profile Modal */}
        <MemberProfileModal
          isOpen={!!selectedMember}
          onClose={() => {
            setSelectedMember(null);
            setSelectedMemberRank(undefined);
          }}
          profile={selectedMember?.profile || null}
          weeklyStats={selectedMember?.weeklyStats}
          rank={selectedMemberRank}
        />

        {/* Report Card Modal */}
        {viewingReportCard && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setViewingReportCard(null)}>
            <div className="bg-card rounded-2xl p-6 max-w-lg w-full max-h-[80vh] overflow-auto" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-xl flex items-center gap-2">
                  <Trophy className="w-6 h-6 text-primary" />
                  کارنامه آزمون
                </h3>
                <Button variant="ghost" size="icon" onClick={() => setViewingReportCard(null)}>
                  <X className="w-5 h-5" />
                </Button>
              </div>
              
              <div className="text-center mb-6">
                <p className="text-lg font-medium text-muted-foreground">{viewingReportCard.lesson_name}</p>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 bg-success/20 rounded-xl">
                  <p className="text-3xl font-bold text-success">{viewingReportCard.correct_answers}</p>
                  <p className="text-sm text-muted-foreground">صحیح</p>
                </div>
                <div className="text-center p-4 bg-destructive/20 rounded-xl">
                  <p className="text-3xl font-bold text-destructive">{viewingReportCard.wrong_answers}</p>
                  <p className="text-sm text-muted-foreground">غلط</p>
                </div>
                <div className="text-center p-4 bg-muted rounded-xl">
                  <p className="text-3xl font-bold">{viewingReportCard.blank_answers}</p>
                  <p className="text-sm text-muted-foreground">نزده</p>
                </div>
              </div>

              <div className="text-center p-6 bg-primary/20 rounded-xl mb-4">
                <p className="text-5xl font-bold text-primary">{(viewingReportCard.percentage || 0).toFixed(1)}%</p>
                <p className="text-sm text-muted-foreground mt-2">درصد کل (با احتساب نمره منفی)</p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="p-3 bg-white/5 rounded-lg text-center">
                  <p className="text-lg font-bold">{viewingReportCard.total_questions}</p>
                  <p className="text-muted-foreground">تعداد سوالات</p>
                </div>
                <div className="p-3 bg-white/5 rounded-lg text-center">
                  <p className="text-lg font-bold">{new Date(viewingReportCard.created_at).toLocaleDateString('fa-IR')}</p>
                  <p className="text-muted-foreground">تاریخ آزمون</p>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </AppLayout>
  );
};

export default Pension;
