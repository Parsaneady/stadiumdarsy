import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { GlassCard } from '@/components/GlassCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Plus, 
  Calendar as CalendarIcon, 
  Trophy, 
  Users, 
  CheckCircle2, 
  Clock,
  Trash2
} from 'lucide-react';
import { format } from 'date-fns-jalali';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface Challenge {
  id: string;
  title: string;
  description: string | null;
  start_date: string;
  end_date: string | null;
  created_by: string;
  created_at: string;
  participant_count?: number;
  is_participating?: boolean;
}

const Challenges = () => {
  const { user } = useAuth();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [isSargarooh, setIsSargarooh] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();

  useEffect(() => {
    if (user) {
      checkUserRole();
      fetchChallenges();
    }
  }, [user]);

  const checkUserRole = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle();
    
    setIsSargarooh(data?.role === 'سرگروه' || data?.role === 'admin');
  };

  const fetchChallenges = async () => {
    if (!user) return;
    
    try {
      // Fetch challenges
      const { data: challengesData, error } = await supabase
        .from('challenges')
        .select('*')
        .order('start_date', { ascending: false });

      if (error) throw error;

      // Fetch participants for each challenge
      const challengesWithParticipants = await Promise.all(
        (challengesData || []).map(async (challenge) => {
          const { count } = await supabase
            .from('challenge_participants')
            .select('*', { count: 'exact', head: true })
            .eq('challenge_id', challenge.id);

          const { data: participation } = await supabase
            .from('challenge_participants')
            .select('id')
            .eq('challenge_id', challenge.id)
            .eq('user_id', user.id)
            .maybeSingle();

          return {
            ...challenge,
            participant_count: count || 0,
            is_participating: !!participation,
          };
        })
      );

      setChallenges(challengesWithParticipants);
    } catch (error) {
      console.error('Error fetching challenges:', error);
      toast.error('خطا در دریافت چالش‌ها');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateChallenge = async () => {
    if (!title || !startDate) {
      toast.error('عنوان و تاریخ شروع الزامی است');
      return;
    }

    try {
      const { error } = await supabase.from('challenges').insert({
        title,
        description: description || null,
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate ? endDate.toISOString().split('T')[0] : null,
        created_by: user?.id,
      });

      if (error) throw error;

      toast.success('چالش با موفقیت ایجاد شد');
      setIsDialogOpen(false);
      setTitle('');
      setDescription('');
      setStartDate(undefined);
      setEndDate(undefined);
      fetchChallenges();
    } catch (error: any) {
      console.error('Error creating challenge:', error);
      if (error.message?.includes('row-level security')) {
        toast.error('شما دسترسی ایجاد چالش ندارید. فقط سرگروه می‌تواند چالش ایجاد کند.');
      } else {
        toast.error('خطا در ایجاد چالش');
      }
    }
  };

  const handleJoinChallenge = async (challengeId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase.from('challenge_participants').insert({
        challenge_id: challengeId,
        user_id: user.id,
      });

      if (error) throw error;

      toast.success('با موفقیت به چالش پیوستید');
      fetchChallenges();
    } catch (error) {
      console.error('Error joining challenge:', error);
      toast.error('خطا در پیوستن به چالش');
    }
  };

  const handleLeaveChallenge = async (challengeId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('challenge_participants')
        .delete()
        .eq('challenge_id', challengeId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success('از چالش خارج شدید');
      fetchChallenges();
    } catch (error) {
      console.error('Error leaving challenge:', error);
      toast.error('خطا در خروج از چالش');
    }
  };

  const handleDeleteChallenge = async (challengeId: string) => {
    try {
      const { error } = await supabase
        .from('challenges')
        .delete()
        .eq('id', challengeId);

      if (error) throw error;

      toast.success('چالش حذف شد');
      fetchChallenges();
    } catch (error) {
      console.error('Error deleting challenge:', error);
      toast.error('خطا در حذف چالش');
    }
  };

  const getChallengeStatus = (challenge: Challenge) => {
    const now = new Date();
    const start = new Date(challenge.start_date);
    const end = challenge.end_date ? new Date(challenge.end_date) : null;

    if (now < start) return 'upcoming';
    if (end && now > end) return 'ended';
    return 'active';
  };

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">چالش‌ها</h1>
              <p className="text-muted-foreground text-sm">با دوستانت در یادگیری رقابت کن</p>
            </div>
          </div>

          {isSargarooh && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  ایجاد چالش
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>ایجاد چالش جدید</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">عنوان چالش</label>
                    <Input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="مثال: چالش ۱۰۰ ساعت مطالعه"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">توضیحات</label>
                    <Textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="توضیحات چالش..."
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">تاریخ شروع</label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-start">
                            <CalendarIcon className="w-4 h-4 ml-2" />
                            {startDate ? format(startDate, 'yyyy/MM/dd') : 'انتخاب'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={startDate}
                            onSelect={setStartDate}
                            className="pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">تاریخ پایان (اختیاری)</label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-start">
                            <CalendarIcon className="w-4 h-4 ml-2" />
                            {endDate ? format(endDate, 'yyyy/MM/dd') : 'انتخاب'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={endDate}
                            onSelect={setEndDate}
                            className="pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                  <Button onClick={handleCreateChallenge} className="w-full">
                    ایجاد چالش
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Role Badge */}
        {isSargarooh && (
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
              <Trophy className="w-3 h-3 ml-1" />
              سرگروه
            </Badge>
          </div>
        )}

        {/* Challenges Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <GlassCard key={i} className="h-48 animate-pulse">
                <div className="h-full bg-muted/20 rounded-lg" />
              </GlassCard>
            ))}
          </div>
        ) : challenges.length === 0 ? (
          <GlassCard className="p-12 text-center">
            <Trophy className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-medium mb-2">هنوز چالشی وجود ندارد</h3>
            <p className="text-muted-foreground text-sm">
              {isSargarooh
                ? 'اولین چالش را ایجاد کنید!'
                : 'منتظر ایجاد چالش توسط سرگروه باشید'}
            </p>
          </GlassCard>
        ) : (
          <AnimatePresence>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {challenges.map((challenge, index) => {
                const status = getChallengeStatus(challenge);
                const isOwner = challenge.created_by === user?.id;

                return (
                  <motion.div
                    key={challenge.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <GlassCard className="p-5 h-full flex flex-col">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-bold text-lg line-clamp-1">{challenge.title}</h3>
                        </div>
                        <Badge
                          variant="outline"
                          className={cn(
                            status === 'active' && 'bg-green-500/10 text-green-500 border-green-500/30',
                            status === 'upcoming' && 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30',
                            status === 'ended' && 'bg-muted text-muted-foreground border-muted'
                          )}
                        >
                          {status === 'active' && 'فعال'}
                          {status === 'upcoming' && 'آینده'}
                          {status === 'ended' && 'پایان‌یافته'}
                        </Badge>
                      </div>

                      {challenge.description && (
                        <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                          {challenge.description}
                        </p>
                      )}

                      <div className="space-y-2 text-sm text-muted-foreground mb-4">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span>شروع: {format(new Date(challenge.start_date), 'yyyy/MM/dd')}</span>
                        </div>
                        {challenge.end_date && (
                          <div className="flex items-center gap-2">
                            <CalendarIcon className="w-4 h-4" />
                            <span>پایان: {format(new Date(challenge.end_date), 'yyyy/MM/dd')}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          <span>{challenge.participant_count} شرکت‌کننده</span>
                        </div>
                      </div>

                      <div className="mt-auto flex gap-2">
                        {challenge.is_participating ? (
                          <Button
                            variant="outline"
                            className="flex-1 gap-2"
                            onClick={() => handleLeaveChallenge(challenge.id)}
                          >
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                            شرکت کرده‌اید
                          </Button>
                        ) : (
                          <Button
                            className="flex-1"
                            onClick={() => handleJoinChallenge(challenge.id)}
                            disabled={status === 'ended'}
                          >
                            شرکت در چالش
                          </Button>
                        )}
                        
                        {isOwner && (
                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => handleDeleteChallenge(challenge.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </GlassCard>
                  </motion.div>
                );
              })}
            </div>
          </AnimatePresence>
        )}
      </div>
    </Layout>
  );
};

export default Challenges;