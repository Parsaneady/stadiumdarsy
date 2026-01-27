import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Mail, Lock, User, Loader2, AtSign } from 'lucide-react';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
const emailSchema = z.string().email('ایمیل معتبر وارد کنید');
const passwordSchema = z.string().min(6, 'رمز عبور باید حداقل ۶ کاراکتر باشد');
const usernameSchema = z.string().min(3, 'نام کاربری باید حداقل ۳ کاراکتر باشد').regex(/^[a-zA-Z0-9_]+$/, 'فقط حروف انگلیسی، اعداد و _ مجاز است');
const Auth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const inviteCode = searchParams.get('invite');
  const {
    user,
    signIn,
    signUp,
    loading
  } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  useEffect(() => {
    if (user && !loading) {
      // If there's an invite code, redirect to pension invite page
      if (inviteCode) {
        navigate(`/pension/invite/${inviteCode}`);
      } else {
        navigate('/');
      }
    }
  }, [user, loading, navigate, inviteCode]);
  const checkUsernameAvailable = async (username: string): Promise<boolean> => {
    const {
      data
    } = await supabase.from('profiles').select('username').eq('username', username).maybeSingle();
    return !data;
  };
  const validateForm = async (isSignUp: boolean) => {
    const newErrors: Record<string, string> = {};
    try {
      emailSchema.parse(formData.email);
    } catch (e) {
      if (e instanceof z.ZodError) {
        newErrors.email = e.errors[0].message;
      }
    }
    try {
      passwordSchema.parse(formData.password);
    } catch (e) {
      if (e instanceof z.ZodError) {
        newErrors.password = e.errors[0].message;
      }
    }
    if (isSignUp) {
      if (!formData.firstName.trim()) {
        newErrors.firstName = 'نام الزامی است';
      }
      if (!formData.lastName.trim()) {
        newErrors.lastName = 'نام خانوادگی الزامی است';
      }
      try {
        usernameSchema.parse(formData.username);
        // Check if username is available
        const isAvailable = await checkUsernameAvailable(formData.username);
        if (!isAvailable) {
          newErrors.username = 'این نام کاربری قبلاً استفاده شده است';
        }
      } catch (e) {
        if (e instanceof z.ZodError) {
          newErrors.username = e.errors[0].message;
        }
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!(await validateForm(false))) return;
    setIsSubmitting(true);
    const {
      error
    } = await signIn(formData.email, formData.password);
    setIsSubmitting(false);
    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        toast.error('ایمیل یا رمز عبور اشتباه است');
      } else {
        toast.error('خطا در ورود');
      }
    } else {
      toast.success('ورود موفق!');
    }
  };
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!(await validateForm(true))) return;
    setIsSubmitting(true);
    const {
      error
    } = await signUp(formData.email, formData.password, `${formData.firstName} ${formData.lastName}`, formData.firstName, formData.lastName, formData.username);
    setIsSubmitting(false);
    if (error) {
      if (error.message.includes('already registered')) {
        toast.error('این ایمیل قبلاً ثبت‌نام شده است');
      } else {
        toast.error('خطا در ثبت‌نام');
      }
    } else {
      toast.success('ثبت‌نام موفق! خوش آمدید');
    }
  };
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>;
  }
  return <div className="min-h-screen flex items-center justify-center bg-background p-4">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-3xl" />
      </div>

      <Card className="w-full max-w-md glass-card border-white/10 relative z-10">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl gradient-text">استادیوم درسی</CardTitle>
          <CardDescription className="text-muted-foreground">
            {inviteCode ? 'برای پیوستن به پانسیون ابتدا وارد شوید' : 'به حساب کاربری خود وارد شوید'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">ورود</TabsTrigger>
              <TabsTrigger value="register">ثبت‌نام</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email" className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    ایمیل
                  </Label>
                  <Input id="login-email" type="email" placeholder="example@email.com" value={formData.email} onChange={e => setFormData({
                  ...formData,
                  email: e.target.value
                })} className="bg-white/5 border-white/10" dir="ltr" />
                  {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="login-password" className="flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    رمز عبور
                  </Label>
                  <Input id="login-password" type="password" placeholder="••••••••" value={formData.password} onChange={e => setFormData({
                  ...formData,
                  password: e.target.value
                })} className="bg-white/5 border-white/10" dir="ltr" />
                  {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                </div>

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
                  ورود
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="register-firstName" className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      نام
                    </Label>
                    <Input id="register-firstName" type="text" placeholder="نام" value={formData.firstName} onChange={e => setFormData({
                    ...formData,
                    firstName: e.target.value
                  })} className="bg-white/5 border-white/10" />
                    {errors.firstName && <p className="text-sm text-destructive">{errors.firstName}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-lastName">نام خانوادگی</Label>
                    <Input id="register-lastName" type="text" placeholder="نام خانوادگی" value={formData.lastName} onChange={e => setFormData({
                    ...formData,
                    lastName: e.target.value
                  })} className="bg-white/5 border-white/10" />
                    {errors.lastName && <p className="text-sm text-destructive">{errors.lastName}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-username" className="flex items-center gap-2">
                    <AtSign className="h-4 w-4" />
                    نام کاربری (یونیک)
                  </Label>
                  <Input id="register-username" type="text" placeholder="username123" value={formData.username} onChange={e => setFormData({
                  ...formData,
                  username: e.target.value.toLowerCase()
                })} className="bg-white/5 border-white/10" dir="ltr" />
                  {errors.username && <p className="text-sm text-destructive">{errors.username}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-email" className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    ایمیل
                  </Label>
                  <Input id="register-email" type="email" placeholder="example@email.com" value={formData.email} onChange={e => setFormData({
                  ...formData,
                  email: e.target.value
                })} className="bg-white/5 border-white/10" dir="ltr" />
                  {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-password" className="flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    رمز عبور
                  </Label>
                  <Input id="register-password" type="password" placeholder="حداقل ۶ کاراکتر" value={formData.password} onChange={e => setFormData({
                  ...formData,
                  password: e.target.value
                })} className="bg-white/5 border-white/10" dir="ltr" />
                  {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                </div>

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
                  ثبت‌نام
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          {/* Footer */}
          <p className="text-center text-xs text-muted-foreground mt-6">
            طراح سایت: پارسا عیدی‌دهنه
          </p>
        </CardContent>
      </Card>
    </div>;
};
export default Auth;