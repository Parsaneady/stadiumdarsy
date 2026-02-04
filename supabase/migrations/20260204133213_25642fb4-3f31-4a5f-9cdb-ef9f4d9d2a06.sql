-- Create pension chat messages table
CREATE TABLE public.pension_chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pension_id UUID NOT NULL REFERENCES public.pensions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pension_chat_messages ENABLE ROW LEVEL SECURITY;

-- Policy: Members can view messages in their pension
CREATE POLICY "Members can view pension messages"
ON public.pension_chat_messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.pension_members
    WHERE pension_members.pension_id = pension_chat_messages.pension_id
    AND pension_members.user_id = auth.uid()
  )
);

-- Policy: Members can send messages to their pension
CREATE POLICY "Members can send messages"
ON public.pension_chat_messages
FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM public.pension_members
    WHERE pension_members.pension_id = pension_chat_messages.pension_id
    AND pension_members.user_id = auth.uid()
  )
);

-- Policy: Users can delete their own messages
CREATE POLICY "Users can delete own messages"
ON public.pension_chat_messages
FOR DELETE
USING (auth.uid() = user_id);

-- Enable realtime for chat messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.pension_chat_messages;

-- Create index for faster queries
CREATE INDEX idx_pension_chat_messages_pension_id ON public.pension_chat_messages(pension_id);
CREATE INDEX idx_pension_chat_messages_created_at ON public.pension_chat_messages(created_at DESC);