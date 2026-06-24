import { useEffect, useState, useCallback, useRef } from 'react';
import { Megaphone, Plus, Trash2, Upload, X } from 'lucide-react';
import Autoplay from 'embla-carousel-autoplay';
import { GlassCard } from '@/components/GlassCard';
import { Button } from '@/components/ui/button';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

type Banner = {
  id: string;
  storage_path: string;
  title: string | null;
  link_url: string | null;
  signedUrl?: string;
};

const BUCKET = 'announcement-banners';

export const AnnouncementBanners = () => {
  const { user } = useAuth();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [manageOpen, setManageOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [title, setTitle] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const autoplay = useRef(Autoplay({ delay: 5000, stopOnInteraction: true }));
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) { setIsAdmin(false); return; }
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin' as any)
        .maybeSingle();
      setIsAdmin(!!data);
    };
    checkAdmin();
  }, [user]);

  const fetchBanners = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('announcement_banners')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('خطا در دریافت بنرها');
      setLoading(false);
      return;
    }

    const withUrls = await Promise.all(
      (data || []).map(async (b: any) => {
        const { data: signed } = await supabase.storage
          .from(BUCKET)
          .createSignedUrl(b.storage_path, 60 * 60);
        return { ...b, signedUrl: signed?.signedUrl } as Banner;
      })
    );
    setBanners(withUrls);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchBanners();
  }, [fetchBanners]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('حجم فایل باید کمتر از ۵ مگابایت باشد');
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split('.').pop() || 'jpg';
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { cacheControl: '3600', upsert: false });
      if (upErr) throw upErr;

      const { error: insErr } = await supabase
        .from('announcement_banners')
        .insert({
          user_id: user.id,
          storage_path: path,
          title: title || null,
          link_url: linkUrl || null,
          sort_order: banners.length,
        });
      if (insErr) throw insErr;

      toast.success('بنر اضافه شد');
      setTitle('');
      setLinkUrl('');
      if (fileRef.current) fileRef.current.value = '';
      await fetchBanners();
    } catch (err: any) {
      toast.error(err.message || 'خطا در آپلود');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (b: Banner) => {
    if (!user) return;
    const { error } = await supabase
      .from('announcement_banners')
      .delete()
      .eq('id', b.id);
    if (error) {
      toast.error('خطا در حذف');
      return;
    }
    await supabase.storage.from(BUCKET).remove([b.storage_path]);
    toast.success('بنر حذف شد');
    fetchBanners();
  };

  // Hide the whole card for non-admin users when there are no banners
  if (!loading && banners.length === 0 && !isAdmin) return null;

  return (
    <GlassCard delay={0.18}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Megaphone className="w-5 h-5 text-primary" />
          اطلاع رسانی
        </h3>
        {isAdmin && (
        <Dialog open={manageOpen} onOpenChange={setManageOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="glass-button">
              <Plus className="w-4 h-4 ml-1" />
              مدیریت بنرها
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto" dir="rtl">
            <DialogHeader>
              <DialogTitle>مدیریت بنرهای اطلاع رسانی</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-3 p-4 rounded-xl bg-muted/20 border border-white/5">
                <div className="space-y-2">
                  <Label>عنوان (اختیاری)</Label>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="مثلاً آزمون آزمایشی شنبه" />
                </div>
                <div className="space-y-2">
                  <Label>لینک (اختیاری)</Label>
                  <Input value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="https://..." dir="ltr" />
                </div>
                <div className="space-y-2">
                  <Label>فایل تصویر</Label>
                  <Input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    onChange={handleUpload}
                    disabled={uploading}
                  />
                  {uploading && (
                    <p className="text-xs text-muted-foreground flex items-center gap-2">
                      <Upload className="w-3 h-3 animate-pulse" /> در حال آپلود...
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">بنرهای فعلی ({banners.length})</p>
                {banners.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">بنری اضافه نشده</p>
                ) : (
                  <div className="space-y-2">
                    {banners.map((b) => (
                      <div key={b.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/20 border border-white/5">
                        {b.signedUrl && (
                          <img src={b.signedUrl} alt={b.title || ''} className="w-20 h-12 object-cover rounded" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm truncate">{b.title || 'بدون عنوان'}</p>
                          {b.link_url && <p className="text-xs text-muted-foreground truncate" dir="ltr">{b.link_url}</p>}
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(b)}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
        )}
      </div>

      {loading ? (
        <div className="h-48 bg-muted/20 rounded-xl animate-pulse" />
      ) : banners.length === 0 ? (
        <div className="text-center py-10 border-2 border-dashed border-white/10 rounded-xl">
          <Megaphone className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
          <p className="text-muted-foreground mb-3">هنوز بنری اضافه نشده</p>
          <Button size="sm" onClick={() => setManageOpen(true)} className="bg-gradient-to-r from-primary to-accent">
            <Plus className="w-4 h-4 ml-1" /> افزودن اولین بنر
          </Button>
        </div>
      ) : (
        <Carousel
          opts={{ loop: true, direction: 'rtl' }}
          plugins={[autoplay.current]}
          className="w-full"
        >
          <CarouselContent>
            {banners.map((b) => (
              <CarouselItem key={b.id}>
                <div className="relative rounded-xl overflow-hidden bg-muted/20 aspect-[16/6]">
                  {b.link_url ? (
                    <a href={b.link_url} target="_blank" rel="noopener noreferrer">
                      <img src={b.signedUrl} alt={b.title || ''} className="w-full h-full object-cover" />
                    </a>
                  ) : (
                    <img src={b.signedUrl} alt={b.title || ''} className="w-full h-full object-cover" />
                  )}
                  {b.title && (
                    <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-black/70 to-transparent">
                      <p className="text-white font-medium">{b.title}</p>
                    </div>
                  )}
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          {banners.length > 1 && (
            <>
              <CarouselPrevious className="right-2 left-auto" />
              <CarouselNext className="left-2 right-auto" />
            </>
          )}
        </Carousel>
      )}
    </GlassCard>
  );
};
