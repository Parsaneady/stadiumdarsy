CREATE TABLE public.bites (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, subject text NOT NULL, book text NOT NULL DEFAULT '', chapter text NOT NULL DEFAULT '', title text NOT NULL, page_from integer, page_to integer, grade_origin integer NOT NULL DEFAULT 12 CHECK (grade_origin IN (10,11,12)), kind text NOT NULL DEFAULT 'new' CHECK (kind IN ('new','review')), weight text NOT NULL DEFAULT 'normal' CHECK (weight IN ('light','normal','heavy')), mode text NOT NULL DEFAULT 'test' CHECK (mode IN ('test','descriptive','both')), subject_type text NOT NULL DEFAULT 'memorize' CHECK (subject_type IN ('memorize','compute')), target_minutes numeric NOT NULL DEFAULT 75 CHECK (target_minutes >= 0), target_tests integer NOT NULL DEFAULT 0 CHECK (target_tests >= 0), test_source text NOT NULL DEFAULT '', planned_date date, slot_time time, parent_bite_id uuid REFERENCES public.bites(id), phase text NOT NULL DEFAULT 'study' CHECK (phase IN ('study','test')), needs_review boolean NOT NULL DEFAULT false, manually_completed boolean NOT NULL DEFAULT false, legacy_ref text, updated_at timestamptz NOT NULL DEFAULT now(), created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(user_id,id), UNIQUE(user_id,legacy_ref)
);
GRANT SELECT,INSERT,UPDATE,DELETE ON public.bites TO authenticated;
GRANT ALL ON public.bites TO service_role;
ALTER TABLE public.bites ENABLE ROW LEVEL SECURITY;
CREATE POLICY bites_owner ON public.bites FOR ALL TO authenticated USING (auth.uid()=user_id) WITH CHECK(auth.uid()=user_id);
CREATE TABLE public.bite_progress (
 user_id uuid NOT NULL, bite_id uuid NOT NULL, status text NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started','studying','studied','tested','mastered')), minutes_done numeric NOT NULL DEFAULT 0, tests_done integer NOT NULL DEFAULT 0, tests_correct integer NOT NULL DEFAULT 0, tests_wrong integer NOT NULL DEFAULT 0, tests_blank integer NOT NULL DEFAULT 0, last_done_at timestamptz, next_review_at timestamptz, updated_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(user_id,bite_id), FOREIGN KEY(user_id,bite_id) REFERENCES public.bites(user_id,id)
);
GRANT SELECT,INSERT,UPDATE,DELETE ON public.bite_progress TO authenticated;
GRANT ALL ON public.bite_progress TO service_role;
ALTER TABLE public.bite_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY bite_progress_owner ON public.bite_progress FOR ALL TO authenticated USING(auth.uid()=user_id) WITH CHECK(auth.uid()=user_id);
CREATE TABLE public.bite_logs (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, bite_id uuid NOT NULL, date date NOT NULL, minutes numeric NOT NULL DEFAULT 0 CHECK(minutes >= 0), tests_done integer NOT NULL DEFAULT 0 CHECK(tests_done >= 0), correct integer NOT NULL DEFAULT 0 CHECK(correct >= 0), wrong integer NOT NULL DEFAULT 0 CHECK(wrong >= 0), blank integer NOT NULL DEFAULT 0 CHECK(blank >= 0), energy text NOT NULL DEFAULT 'normal' CHECK(energy IN ('full','normal','low')), distractions_note text NOT NULL DEFAULT '', distraction text NOT NULL DEFAULT 'none' CHECK(distraction IN ('none','some','a_lot')), source text NOT NULL DEFAULT 'manual' CHECK(source IN ('timer','manual')), deleted_at timestamptz, updated_at timestamptz NOT NULL DEFAULT now(), created_at timestamptz NOT NULL DEFAULT now(), FOREIGN KEY(user_id,bite_id) REFERENCES public.bites(user_id,id), CHECK(tests_done=correct+wrong+blank)
);
GRANT SELECT,INSERT,UPDATE,DELETE ON public.bite_logs TO authenticated;
GRANT ALL ON public.bite_logs TO service_role;
ALTER TABLE public.bite_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY bite_logs_owner ON public.bite_logs FOR ALL TO authenticated USING(auth.uid()=user_id) WITH CHECK(auth.uid()=user_id);
ALTER TABLE public.study_activities ADD COLUMN bite_id uuid REFERENCES public.bites(id);
ALTER TABLE public.daily_logs ADD COLUMN bite_summary jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.user_settings ADD COLUMN daily_backbone jsonb NOT NULL DEFAULT '{}'::jsonb;
CREATE FUNCTION public.bite_keep_newer() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$ BEGIN IF NEW.updated_at < OLD.updated_at THEN RETURN OLD; END IF; RETURN NEW; END; $$;
CREATE TRIGGER bites_lww BEFORE UPDATE ON public.bites FOR EACH ROW EXECUTE FUNCTION public.bite_keep_newer();
CREATE TRIGGER bite_logs_lww BEFORE UPDATE ON public.bite_logs FOR EACH ROW EXECUTE FUNCTION public.bite_keep_newer();
CREATE TRIGGER bite_progress_lww BEFORE UPDATE ON public.bite_progress FOR EACH ROW EXECUTE FUNCTION public.bite_keep_newer();
CREATE INDEX bite_logs_user_date ON public.bite_logs(user_id,date);
CREATE INDEX bites_user_date ON public.bites(user_id,planned_date);