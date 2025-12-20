import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Users, Check, X, Loader2 } from 'lucide-react';

const PensionInvite = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [pension, setPension] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [alreadyMember, setAlreadyMember] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      // Redirect to auth with invite code
      navigate(`/auth?invite=${code}`);
      return;
    }

    if (user && code) {
      checkInvite();
    }
  }, [user, code, authLoading]);

  const checkInvite = async () => {
    if (!code || !user) return;

    try {
      // Check if user is already in a pension
      const { data: existingMembership } = await supabase
        .from('pension_members')
        .select('pension_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existingMembership) {
        setAlreadyMember(true);
        setError('شما در حال حاضر عضو یک پانسیون هستید');
        setLoading(false);
        return;
      }

      // Find pension by invite code
      const { data: pensionData, error: pensionError } = await supabase
        .from('pensions')
        .select('*')
        .eq('invite_code', code)
        .maybeSingle();

      if (pensionError || !pensionData) {
        setError('لینک دعوت معتبر نیست');
        setLoading(false);
        return;
      }

      if (!pensionData.invite_enabled) {
        setError('لینک دعوت غیرفعال است');
        setLoading(false);
        return;
      }

      if (pensionData.member_count >= pensionData.max_members) {
        setError('پانسیون پر است');
        setLoading(false);
        return;
      }

      setPension(pensionData);
    } catch (error) {
      setError('خطا در بررسی لینک');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!pension || !user) return;

    setJoining(true);
    try {
      const { error } = await supabase
        .from('pension_members')
        .insert({
          pension_id: pension.id,
          user_id: user.id,
          role: 'member',
        });

      if (error) throw error;

      toast.success('با موفقیت به پانسیون پیوستید');
      navigate('/pension');
    } catch (error) {
      toast.error('خطا در پیوستن به پانسیون');
    } finally {
      setJoining(false);
    }
  };

  const handleReject = () => {
    navigate('/');
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-3xl" />
      </div>

      <Card className="w-full max-w-md glass-card border-white/10 relative z-10">
        <CardHeader className="text-center">
          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-xl">دعوت به پانسیون</CardTitle>
          {pension && (
            <CardDescription className="text-lg font-medium text-foreground mt-2">
              {pension.name}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="text-center">
              <p className="text-destructive mb-4">{error}</p>
              {alreadyMember ? (
                <Button onClick={() => navigate('/pension')} className="w-full">
                  رفتن به پانسیون
                </Button>
              ) : (
                <Button variant="outline" onClick={() => navigate('/')} className="w-full">
                  بازگشت
                </Button>
              )}
            </div>
          ) : pension ? (
            <div className="space-y-4">
              <p className="text-center text-muted-foreground">
                آیا می‌خواهید به این پانسیون بپیوندید؟
              </p>
              <p className="text-center text-sm text-muted-foreground">
                {pension.member_count} / {pension.max_members} عضو
              </p>
              <div className="flex gap-3">
                <Button 
                  onClick={handleJoin} 
                  className="flex-1 gap-2"
                  disabled={joining}
                >
                  {joining ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  پذیرش
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleReject}
                  className="flex-1 gap-2"
                >
                  <X className="w-4 h-4" />
                  رد کردن
                </Button>
              </div>
            </div>
          ) : null}

          <p className="text-center text-xs text-muted-foreground mt-6">
            طراح سایت: پارسا عیدی‌دهنه
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default PensionInvite;