import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Clock, Target, Trophy } from 'lucide-react';

// Import student avatars
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

interface MemberProfile {
  username: string | null;
  display_name: string | null;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  total_study_minutes: number;
  total_tests: number;
}

interface MemberProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: MemberProfile | null;
  rank?: number;
}

export const MemberProfileModal = ({ isOpen, onClose, profile, rank }: MemberProfileModalProps) => {
  if (!profile) return null;

  const displayName = profile.display_name || profile.username || profile.first_name || 'کاربر';
  const studyHours = Math.round((profile.total_study_minutes || 0) / 60 * 10) / 10;
  
  const getAvatarContent = () => {
    if (!profile.avatar_url) return null;
    
    // Check if it's one of our student avatars
    if (profile.avatar_url.startsWith('student-')) {
      const avatarSrc = AVATAR_IMAGES[profile.avatar_url];
      if (avatarSrc) {
        return <AvatarImage src={avatarSrc} alt={displayName} />;
      }
    }
    
    // Check if it's an emoji
    if (profile.avatar_url.length <= 4) {
      return null; // Will show emoji in fallback
    }
    
    // Otherwise it's a URL
    return <AvatarImage src={profile.avatar_url} alt={displayName} />;
  };

  const getAvatarFallback = () => {
    if (profile.avatar_url && profile.avatar_url.length <= 4 && !profile.avatar_url.startsWith('student-')) {
      return profile.avatar_url;
    }
    return displayName[0]?.toUpperCase() || 'U';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-center">پروفایل کاربر</DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col items-center py-4">
          {/* Avatar */}
          <div className="relative">
            <Avatar className="w-24 h-24 border-4 border-primary/30">
              {getAvatarContent()}
              <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white text-3xl">
                {getAvatarFallback()}
              </AvatarFallback>
            </Avatar>
            {rank && rank <= 3 && (
              <div className={`absolute -top-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center ${
                rank === 1 ? 'bg-yellow-500' : rank === 2 ? 'bg-gray-400' : 'bg-amber-600'
              }`}>
                <Trophy className="w-4 h-4 text-white" />
              </div>
            )}
          </div>

          {/* Name */}
          <h3 className="mt-4 text-xl font-bold">{displayName}</h3>
          {profile.username && (
            <p className="text-sm text-muted-foreground">@{profile.username}</p>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 mt-6 w-full">
            <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 text-center">
              <Clock className="w-6 h-6 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold">{studyHours}</p>
              <p className="text-xs text-muted-foreground">ساعت مطالعه</p>
            </div>
            <div className="p-4 rounded-xl bg-accent/10 border border-accent/20 text-center">
              <Target className="w-6 h-6 text-accent mx-auto mb-2" />
              <p className="text-2xl font-bold">{profile.total_tests || 0}</p>
              <p className="text-xs text-muted-foreground">تست حل شده</p>
            </div>
          </div>

          {/* Rank badge */}
          {rank && (
            <div className="mt-4 px-4 py-2 rounded-full bg-white/5 border border-white/10">
              <span className="text-sm text-muted-foreground">رتبه در پانسیون: </span>
              <span className="font-bold text-primary">#{rank}</span>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};