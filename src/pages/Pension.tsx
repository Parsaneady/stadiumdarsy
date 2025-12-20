import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { GlassCard } from '@/components/GlassCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
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
  LogOut
} from 'lucide-react';

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

const Pension = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [pension, setPension] = useState<Pension | null>(null);
  const [members, setMembers] = useState<PensionMember[]>([]);
  const [isLeader, setIsLeader] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pensionName, setPensionName] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

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

  const formatStudyTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}:${mins.toString().padStart(2, '0')}`;
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

          {isLeader && (
            <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30">
              <Crown className="w-3 h-3 ml-1" />
              سرگروه
            </Badge>
          )}
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

        {/* Members Leaderboard */}
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
                    <span>{member.profile?.total_tests || 0} آزمون</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Leave Button (non-leaders) */}
        {!isLeader && (
          <Button 
            variant="outline" 
            className="w-full text-destructive border-destructive/30 hover:bg-destructive/10"
            onClick={handleLeavePension}
          >
            <LogOut className="w-4 h-4 ml-2" />
            خروج از پانسیون
          </Button>
        )}
      </div>
    </AppLayout>
  );
};

export default Pension;