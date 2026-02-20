import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users, Book, Moon } from 'lucide-react';
import { cn } from '@/lib/utils';

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

const getAvatarSrc = (avatarUrl?: string): string | undefined => {
  if (!avatarUrl) return undefined;
  if (avatarUrl.startsWith('student-')) return AVATAR_IMAGES[avatarUrl];
  if (avatarUrl.length > 4) return avatarUrl;
  return undefined;
};

interface MemberStatus {
  userId: string;
  displayName: string;
  avatarUrl?: string;
  isStudying: boolean;
  currentSubject?: string;
  studyMode?: string;
}

export const PensionMembersStatus = () => {
  const { user } = useAuth();
  const [members, setMembers] = useState<MemberStatus[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchMembers = async () => {
      try {
        // Get user's pension
        const { data: memberData } = await supabase
          .from('pension_members')
          .select('pension_id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!memberData) {
          setLoading(false);
          return;
        }

        // Get all pension members
        const { data: pensionMembers } = await supabase
          .from('pension_members')
          .select('user_id')
          .eq('pension_id', memberData.pension_id);

        if (!pensionMembers) {
          setLoading(false);
          return;
        }

        const memberIds = pensionMembers.map(m => m.user_id);

        // Get profiles
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, display_name, first_name, last_name, avatar_url')
          .in('user_id', memberIds);

        // Get study statuses
        const { data: statuses } = await supabase
          .from('user_study_status')
          .select('*')
          .in('user_id', memberIds);

        const memberStatuses: MemberStatus[] = memberIds.map(userId => {
          const profile = profiles?.find(p => p.user_id === userId);
          const status = statuses?.find(s => s.user_id === userId);
          
          return {
            userId,
            displayName: profile?.display_name || (profile?.first_name && profile?.last_name 
              ? `${profile.first_name} ${profile.last_name}`
              : profile?.first_name || 'کاربر'),
            avatarUrl: profile?.avatar_url || undefined,
            isStudying: status?.is_studying || false,
            currentSubject: status?.current_subject || undefined,
            studyMode: status?.study_mode || undefined,
          };
        });

        // Sort: studying members first
        memberStatuses.sort((a, b) => (b.isStudying ? 1 : 0) - (a.isStudying ? 1 : 0));
        
        setMembers(memberStatuses);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching members:', error);
        setLoading(false);
      }
    };

    fetchMembers();

    // Subscribe to study status realtime updates
    const studyChannel = supabase
      .channel('study-status-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_study_status',
        },
        (payload) => {
          setMembers(prev => {
            const updated = [...prev];
            const index = updated.findIndex(m => m.userId === (payload.new as any)?.user_id);
            if (index >= 0) {
              updated[index] = {
                ...updated[index],
                isStudying: (payload.new as any)?.is_studying || false,
                currentSubject: (payload.new as any)?.current_subject,
                studyMode: (payload.new as any)?.study_mode,
              };
              updated.sort((a, b) => (b.isStudying ? 1 : 0) - (a.isStudying ? 1 : 0));
            }
            return updated;
          });
        }
      )
      .subscribe();

    // Subscribe to profile changes so display names update in real-time
    const profileChannel = supabase
      .channel('profile-changes-status')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
        },
        (payload) => {
          const updatedProfile = payload.new as any;
          setMembers(prev => prev.map(m => {
            if (m.userId === updatedProfile.user_id) {
              return {
                ...m,
                displayName: updatedProfile.display_name || (updatedProfile.first_name && updatedProfile.last_name
                  ? `${updatedProfile.first_name} ${updatedProfile.last_name}`
                  : updatedProfile.first_name || m.displayName),
                avatarUrl: updatedProfile.avatar_url || m.avatarUrl,
              };
            }
            return m;
          }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(studyChannel);
      supabase.removeChannel(profileChannel);
    };
  }, [user]);

  if (loading) {
    return (
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <Users className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">اعضای پانسیون</h3>
        </div>
        <div className="flex gap-3 animate-pulse">
          {[1, 2, 3].map(i => (
            <div key={i} className="w-12 h-12 rounded-full bg-muted/50" />
          ))}
        </div>
      </div>
    );
  }

  if (members.length === 0) {
    return (
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <Users className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">اعضای پانسیون</h3>
        </div>
        <p className="text-sm text-muted-foreground text-center py-4">
          شما هنوز عضو پانسیونی نیستید
        </p>
      </div>
    );
  }

  const studyingCount = members.filter(m => m.isStudying).length;

  return (
    <div className="glass-card rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Users className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">اعضای پانسیون</h3>
        </div>
        <span className="text-xs text-muted-foreground">
          {studyingCount} نفر در حال مطالعه
        </span>
      </div>

      <div className="flex flex-wrap gap-3">
        {members.map((member) => (
          <div
            key={member.userId}
            className={cn(
              'relative group flex flex-col items-center gap-2 p-3 rounded-xl transition-all',
              member.isStudying 
                ? 'bg-success/10 border border-success/30' 
                : 'bg-muted/20 border border-white/5'
            )}
          >
            <div className="relative">
              <Avatar className="w-12 h-12 border-2 border-white/20">
                <AvatarImage src={getAvatarSrc(member.avatarUrl)} />
                <AvatarFallback className="bg-primary/20 text-primary font-bold">
                  {member.displayName.slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              
              {/* Status indicator */}
              <div 
                className={cn(
                  'absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-background flex items-center justify-center',
                  member.isStudying ? 'bg-success' : 'bg-muted-foreground'
                )}
              >
                {member.isStudying ? (
                  <Book className="w-2.5 h-2.5 text-white" />
                ) : (
                  <Moon className="w-2.5 h-2.5 text-white" />
                )}
              </div>
            </div>

            <div className="text-center">
              <p className="text-xs font-medium truncate max-w-[80px]">
                {member.displayName}
              </p>
              {member.isStudying && member.currentSubject && (
                <p className="text-[10px] text-success truncate max-w-[80px]">
                  {member.currentSubject}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};