-- Fix 1: Add CHECK constraints for exam_results validation
ALTER TABLE public.exam_results ADD CONSTRAINT valid_answers 
CHECK (correct_answers >= 0 AND wrong_answers >= 0 AND blank_answers >= 0 AND total_questions >= 0);

ALTER TABLE public.exam_results ADD CONSTRAINT correct_not_exceeds_total
CHECK (correct_answers + wrong_answers + blank_answers <= total_questions);

ALTER TABLE public.exam_results ADD CONSTRAINT valid_percentage
CHECK (percentage >= 0 AND percentage <= 100);

ALTER TABLE public.exam_results ADD CONSTRAINT valid_average_percentage
CHECK (average_percentage IS NULL OR (average_percentage >= 0 AND average_percentage <= 100));

-- Fix 2: Update update_pension_member_count with NULL validation
CREATE OR REPLACE FUNCTION public.update_pension_member_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Validate NEW.pension_id is not NULL
        IF NEW.pension_id IS NULL THEN
            RETURN NEW;
        END IF;
        UPDATE public.pensions 
        SET member_count = member_count + 1 
        WHERE id = NEW.pension_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        -- Validate OLD.pension_id is not NULL
        IF OLD.pension_id IS NULL THEN
            RETURN OLD;
        END IF;
        UPDATE public.pensions 
        SET member_count = member_count - 1 
        WHERE id = OLD.pension_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$function$;