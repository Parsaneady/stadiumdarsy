import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, ArrowRight, Trash2 } from 'lucide-react';
import { format } from 'date-fns-jalali';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

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

interface ChatMessage {
  id: string;
  pension_id: string;
  user_id: string;
  message: string;
  created_at: string;
  profile?: {
    display_name: string | null;
    avatar_url: string | null;
  };
}

interface PensionChatProps {
  pensionId: string;
  pensionName: string;
  onBack: () => void;
}

export const PensionChat = ({ pensionId, pensionName, onBack }: PensionChatProps) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch messages
  const fetchMessages = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('pension_chat_messages')
        .select('*')
        .eq('pension_id', pensionId)
        .order('created_at', { ascending: true })
        .limit(100);

      if (error) throw error;

      if (data) {
        // Fetch profiles for all users
        const userIds = [...new Set(data.map(m => m.user_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, display_name, avatar_url')
          .in('user_id', userIds);

        const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

        const messagesWithProfiles = data.map(m => ({
          ...m,
          profile: profileMap.get(m.user_id) || null,
        }));

        setMessages(messagesWithProfiles);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  }, [pensionId]);

  // Initial fetch
  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel(`pension-chat-${pensionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pension_chat_messages',
          filter: `pension_id=eq.${pensionId}`,
        },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            const newMsg = payload.new as ChatMessage;
            
            // Fetch profile for the new message
            const { data: profile } = await supabase
              .from('profiles')
              .select('display_name, avatar_url')
              .eq('user_id', newMsg.user_id)
              .single();

            setMessages(prev => [...prev, { ...newMsg, profile }]);
          } else if (payload.eventType === 'DELETE') {
            const deletedId = payload.old.id;
            setMessages(prev => prev.filter(m => m.id !== deletedId));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [pensionId]);

  // Auto scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Send message
  const handleSend = async () => {
    if (!newMessage.trim() || !user || sending) return;

    setSending(true);
    try {
      const { error } = await supabase
        .from('pension_chat_messages')
        .insert({
          pension_id: pensionId,
          user_id: user.id,
          message: newMessage.trim(),
        });

      if (error) throw error;

      setNewMessage('');
      inputRef.current?.focus();
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  // Delete message
  const handleDelete = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('pension_chat_messages')
        .delete()
        .eq('id', messageId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Group messages by date
  const groupMessagesByDate = (msgs: ChatMessage[]) => {
    const groups: { date: string; messages: ChatMessage[] }[] = [];
    let currentDate = '';

    msgs.forEach(msg => {
      const msgDate = format(new Date(msg.created_at), 'yyyy-MM-dd');
      if (msgDate !== currentDate) {
        currentDate = msgDate;
        groups.push({
          date: format(new Date(msg.created_at), 'EEEE d MMMM'),
          messages: [msg],
        });
      } else {
        groups[groups.length - 1].messages.push(msg);
      }
    });

    return groups;
  };

  const messageGroups = groupMessagesByDate(messages);

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] max-h-[700px]">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-white/10">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="shrink-0"
        >
          <ArrowRight className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h2 className="text-lg font-bold">چت گروهی</h2>
          <p className="text-sm text-muted-foreground">{pensionName}</p>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea ref={scrollRef} className="flex-1 py-4">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <Send className="w-12 h-12 mb-4 opacity-30" />
            <p>هنوز پیامی ارسال نشده</p>
            <p className="text-sm">اولین پیام رو بفرست!</p>
          </div>
        ) : (
          <div className="space-y-6 px-1">
            <AnimatePresence>
              {messageGroups.map((group, groupIdx) => (
                <div key={groupIdx} className="space-y-3">
                  {/* Date separator */}
                  <div className="flex items-center justify-center">
                    <div className="px-3 py-1 rounded-full bg-white/5 text-xs text-muted-foreground">
                      {group.date}
                    </div>
                  </div>

                  {/* Messages */}
                  {group.messages.map((msg, idx) => {
                    const isMe = msg.user_id === user?.id;
                    const showAvatar =
                      idx === 0 ||
                      group.messages[idx - 1].user_id !== msg.user_id;

                    return (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className={cn(
                          'flex gap-2',
                          isMe ? 'flex-row-reverse' : 'flex-row'
                        )}
                      >
                        {/* Avatar */}
                        <div className="w-8 shrink-0">
                          {showAvatar && !isMe && (
                            <Avatar className="w-8 h-8">
                              <AvatarImage
                                src={getAvatarSrc(msg.profile?.avatar_url || null)}
                              />
                              <AvatarFallback className="bg-primary/20 text-primary text-xs">
                                {msg.profile?.display_name?.[0] || '؟'}
                              </AvatarFallback>
                            </Avatar>
                          )}
                        </div>

                        {/* Message bubble */}
                        <div
                          className={cn(
                            'group relative max-w-[75%] rounded-2xl px-4 py-2',
                            isMe
                              ? 'bg-primary text-primary-foreground rounded-br-md'
                              : 'bg-white/10 rounded-bl-md'
                          )}
                        >
                          {/* Sender name */}
                          {showAvatar && !isMe && (
                            <p className="text-xs font-medium text-primary mb-1">
                              {msg.profile?.display_name || 'کاربر'}
                            </p>
                          )}

                          {/* Message text */}
                          <p className="text-sm whitespace-pre-wrap break-words">
                            {msg.message}
                          </p>

                          {/* Time */}
                          <p
                            className={cn(
                              'text-[10px] mt-1',
                              isMe
                                ? 'text-primary-foreground/70'
                                : 'text-muted-foreground'
                            )}
                          >
                            {format(new Date(msg.created_at), 'HH:mm')}
                          </p>

                          {/* Delete button for own messages */}
                          {isMe && (
                            <button
                              onClick={() => handleDelete(msg.id)}
                              className="absolute -left-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-full hover:bg-destructive/20"
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </button>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      <div className="pt-4 border-t border-white/10">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="پیام خود را بنویسید..."
            className="flex-1 bg-white/5 border-white/10"
            disabled={sending}
          />
          <Button
            onClick={handleSend}
            disabled={!newMessage.trim() || sending}
            className="shrink-0 gap-2"
          >
            <Send className="w-4 h-4" />
            ارسال
          </Button>
        </div>
      </div>
    </div>
  );
};
