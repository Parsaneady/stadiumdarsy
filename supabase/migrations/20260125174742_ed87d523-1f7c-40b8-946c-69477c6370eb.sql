-- Create test books table for tracking test book answer sheets
CREATE TABLE public.test_books (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  total_questions INTEGER NOT NULL DEFAULT 100,
  answers JSONB DEFAULT '{}',
  correct_answers JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.test_books ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own test books" 
ON public.test_books 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own test books" 
ON public.test_books 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own test books" 
ON public.test_books 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own test books" 
ON public.test_books 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_test_books_updated_at
BEFORE UPDATE ON public.test_books
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();