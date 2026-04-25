-- Daily prizes (admin-managed, 7 day cycle)
CREATE TABLE public.daily_prizes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  day_number int NOT NULL UNIQUE CHECK (day_number BETWEEN 1 AND 7),
  name text NOT NULL,
  description text,
  points int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.daily_prizes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view prizes"
ON public.daily_prizes FOR SELECT
USING (true);

CREATE POLICY "Admins can insert prizes"
ON public.daily_prizes FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update prizes"
ON public.daily_prizes FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete prizes"
ON public.daily_prizes FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_daily_prizes_updated_at
BEFORE UPDATE ON public.daily_prizes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed default 7 prizes
INSERT INTO public.daily_prizes (day_number, name, description, points) VALUES
(1, 'Welcome Boost', 'Day 1 streak reward', 10),
(2, 'Keep Going!', 'Day 2 streak reward', 15),
(3, 'On a Roll', 'Day 3 streak reward', 25),
(4, 'Halfway There', 'Day 4 streak reward', 40),
(5, 'High Five', 'Day 5 streak reward', 60),
(6, 'Almost a Week', 'Day 6 streak reward', 85),
(7, 'Weekly Champion', 'Day 7 jackpot reward', 150);

-- Daily check-ins log
CREATE TABLE public.daily_checkins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  checkin_date date NOT NULL,
  day_number int NOT NULL CHECK (day_number BETWEEN 1 AND 7),
  prize_name text,
  points_awarded int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, checkin_date)
);

ALTER TABLE public.daily_checkins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own checkins"
ON public.daily_checkins FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all checkins"
ON public.daily_checkins FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- No INSERT/UPDATE/DELETE policies: only the edge function (service role) writes.

CREATE INDEX idx_daily_checkins_user_date ON public.daily_checkins (user_id, checkin_date DESC);

-- Streak tracking on profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS current_streak_day int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_checkin_date date,
  ADD COLUMN IF NOT EXISTS monthly_strikes_used int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS strikes_month text,
  ADD COLUMN IF NOT EXISTS total_points int NOT NULL DEFAULT 0;