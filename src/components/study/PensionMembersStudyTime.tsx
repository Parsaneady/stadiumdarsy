import { useEffect, useState } from 'react';
import { getEffectiveDateString } from '@/lib/timeUtils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Clock, Trophy } from 'lucide-react';

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

interface MemberStudyTime {
  userId: string;
  displayName: string;
  avatarUrl?: string;
  totalMinutes: number;
}

export const PensionMembersStudyTime = () => {
  const { user } = useAuth();
  const [members, setMembers] = useState<MemberStudyTime[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchMembersStudyTime = async () => {
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

        if (!pensionMembers || pensionMembers.length === 0) {
          setLoading(false);
          return;
        }

        const memberIds = pensionMembers.map(m => m.user_id);

        // Get profiles with total study time
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, display_name, first_name, last_name, avatar_url, total_study_minutes')
          .in('user_id', memberIds);

        // Get today's activities for each member
        const today = getEffectiveDateString();
        const { data: todayActivities } = await supabase
          .from('study_activities')
          .select('user_id, start_time, end_time')
          .in('user_id', memberIds)
          .eq('activity_date', today)
          .eq('activity_type', 'study');

        // Calculate today's study time per member
        const todayMinutesMap: Record<string, number> = {};
        todayActivities?.forEach(activity => {
          if (activity.end_time && activity.start_time) {
            const [startH, startM] = activity.start_time.split(':').map(Number);
            const [endH, endM] = activity.end_time.split(':').map(Number);
            const minutes = (endH * 60 + endM) - (startH * 60 + startM);
            if (minutes > 0) {
              todayMinutesMap[activity.user_id] = (todayMinutesMap[activity.user_id] || 0) + minutes;
            }
          }
        });

        const memberStudyTimes: MemberStudyTime[] = memberIds.map(userId => {
          const profile = profiles?.find(p => p.user_id === userId);
          
          return {
            userId,
            displayName: profile?.display_name || (profile?.first_name && profile?.last_name 
              ? `${profile.first_name} ${profile.last_name}`
              : profile?.first_name || 'کاربر'),
            avatarUrl: profile?.avatar_url || undefined,
            totalMinutes: todayMinutesMap[userId] || 0,
          };
        });

        // Sort by study time (descending)
        memberStudyTimes.sort((a, b) => b.totalMinutes - a.totalMinutes);
        
        setMembers(memberStudyTimes);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching member study times:', error);
        setLoading(false);
      }
    };

    fetchMembersStudyTime();

    // Refresh every 2 minutes
    const interval = setInterval(fetchMembersStudyTime, 120000);

    // Subscribe to profile changes so display names update in real-time
    const profileChannel = supabase
      .channel('profile-changes-studytime')
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
      clearInterval(interval);
      supabase.removeChannel(profileChannel);
    };
  }, [user]);

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}:${String(mins).padStart(2, '0')}`;
    }
    return `${mins} دقیقه`;
  };

  if (loading) {
    return (
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <Clock className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">ساعت مطالعه امروز اعضا</h3>
        </div>
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-12 rounded-lg bg-muted/50" />
          ))}
        </div>
      </div>
    );
  }

  if (members.length === 0) {
    return null;
  }

  return (
    <div className="glass-card rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <Clock className="w-5 h-5 text-primary" />
        <h3 className="font-semibold">ساعت مطالعه امروز اعضا</h3>
      </div>

      <div className="space-y-2">
        {members.map((member, index) => (
          <div
            key={member.userId}
            className="flex items-center gap-3 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
          >
            {/* Rank */}
            <div className="w-6 text-center">
              {index === 0 && member.totalMinutes > 0 ? (
                <Trophy className="w-4 h-4 text-warning mx-auto" />
              ) : (
                <span className="text-xs text-muted-foreground">{index + 1}</span>
              )}
            </div>

            <Avatar className="w-8 h-8 border-2 border-white/20">
              <AvatarImage src={getAvatarSrc(member.avatarUrl)} />
              <AvatarFallback className="bg-primary/20 text-primary text-xs font-bold">
                {member.displayName.slice(0, 2)}
              </AvatarFallback>
            </Avatar>

            <span className="flex-1 text-sm font-medium truncate">
              {member.displayName}
            </span>

            <span className={`text-sm font-mono ${member.totalMinutes > 0 ? 'text-primary' : 'text-muted-foreground'}`}>
              {member.totalMinutes > 0 ? formatTime(member.totalMinutes) : '-'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
