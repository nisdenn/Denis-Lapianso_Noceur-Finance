-- =========================================================================
-- SAFE MIGRATION SCRIPT (NO DATA LOSS)
-- Run this in your Supabase SQL Editor to safely upgrade your data to V6.
-- =========================================================================

-- 1. Create ENUMs (Safe approach)
DO $$ BEGIN
    CREATE TYPE public.transaction_type AS ENUM ('Income', 'Expense', 'Transfer');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.user_role AS ENUM ('user', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.reminder_frequency AS ENUM ('daily', 'weekly', 'monthly');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Ensure Soft Delete columns exist (V5/V6 features)
DO $$ 
BEGIN
  -- Wallets
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='wallets' AND column_name='deleted_at') THEN
    EXECUTE 'ALTER TABLE public.wallets ADD COLUMN deleted_at timestamp with time zone';
    EXECUTE 'ALTER TABLE public.wallets ADD COLUMN deleted_by uuid REFERENCES auth.users(id)';
  END IF;

  -- Categories
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='categories' AND column_name='deleted_at') THEN
    EXECUTE 'ALTER TABLE public.categories ADD COLUMN deleted_at timestamp with time zone';
    EXECUTE 'ALTER TABLE public.categories ADD COLUMN deleted_by uuid REFERENCES auth.users(id)';
  END IF;

  -- Transactions
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='transactions' AND column_name='deleted_at') THEN
    EXECUTE 'ALTER TABLE public.transactions ADD COLUMN deleted_at timestamp with time zone';
    EXECUTE 'ALTER TABLE public.transactions ADD COLUMN deleted_by uuid REFERENCES auth.users(id)';
  END IF;

  -- Goals
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='transactions' AND column_name='goal_id') THEN
    EXECUTE 'ALTER TABLE public.transactions ADD COLUMN goal_id uuid REFERENCES public.goals(id) ON DELETE SET NULL';
  END IF;
END $$;

-- 3. Create new tables for V6 (Streaks & Reminders)
CREATE TABLE IF NOT EXISTS public.user_streaks (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  current_streak integer DEFAULT 0,
  longest_streak integer DEFAULT 0,
  last_activity_date date,
  total_transactions integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.reminders (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  frequency public.reminder_frequency NOT NULL,
  time time without time zone NOT NULL,
  day_of_week integer CHECK (day_of_week BETWEEN 0 AND 6),
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ensure RLS on new tables
ALTER TABLE public.user_streaks ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
    CREATE POLICY "Users view own streaks" ON public.user_streaks FOR SELECT USING (auth.uid() = user_id);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
GRANT ALL ON public.user_streaks TO authenticated;
GRANT ALL ON public.user_streaks TO service_role;

ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
    CREATE POLICY "Users manage own reminders" ON public.reminders FOR ALL USING (auth.uid() = user_id);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
GRANT ALL ON public.reminders TO authenticated;
GRANT ALL ON public.reminders TO service_role;

-- 4. Backfill user_streaks for existing users so Activity Page works!
INSERT INTO public.user_streaks (user_id)
SELECT id FROM auth.users
ON CONFLICT (user_id) DO NOTHING;

-- 5. Fix Transactions Table `type` column
DO $$ 
BEGIN
  -- Check if type column exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='transactions' AND column_name='type') THEN
    EXECUTE 'ALTER TABLE public.transactions ADD COLUMN type public.transaction_type';
    -- Backfill data to prevent data corruption!
    EXECUTE 'UPDATE public.transactions SET type = ''Expense'' WHERE to_wallet_id IS NULL';
    EXECUTE 'UPDATE public.transactions SET type = ''Income'' WHERE from_wallet_id IS NULL';
    EXECUTE 'UPDATE public.transactions SET type = ''Transfer'' WHERE from_wallet_id IS NOT NULL AND to_wallet_id IS NOT NULL';
    EXECUTE 'ALTER TABLE public.transactions ALTER COLUMN type SET NOT NULL';
  END IF;
  
  -- Add Constraint but bypass existing invalid rows using NOT VALID
  EXECUTE 'ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS chk_transaction_type_logic';
  EXECUTE 'ALTER TABLE public.transactions ADD CONSTRAINT chk_transaction_type_logic CHECK (
    (type::text = ''Income'' AND from_wallet_id IS NULL AND to_wallet_id IS NOT NULL) OR
    (type::text = ''Expense'' AND from_wallet_id IS NOT NULL AND to_wallet_id IS NULL) OR
    (type::text = ''Transfer'' AND from_wallet_id IS NOT NULL AND to_wallet_id IS NOT NULL AND from_wallet_id != to_wallet_id)
  ) NOT VALID';
END $$;

-- 6. Recreate wallet_balances View (with Soft Deletes considered)
CREATE OR REPLACE VIEW public.wallet_balances WITH (security_invoker = true) AS
SELECT 
  w.id as wallet_id,
  w.user_id,
  w.name,
  COALESCE(
    (SELECT SUM(amount) FROM public.transactions WHERE to_wallet_id = w.id AND deleted_at IS NULL), 0
  ) - 
  COALESCE(
    (SELECT SUM(amount) FROM public.transactions WHERE from_wallet_id = w.id AND deleted_at IS NULL), 0
  ) as balance
FROM public.wallets w
WHERE w.deleted_at IS NULL;

-- 7. Add Streak Trigger
CREATE OR REPLACE FUNCTION public.update_user_streak()
RETURNS TRIGGER AS $FUNC$
DECLARE
  streak_record public.user_streaks%ROWTYPE;
  current_date_tz date;
BEGIN
  IF TG_OP = 'INSERT' AND NEW.deleted_at IS NULL THEN
    current_date_tz := CURRENT_DATE;
    SELECT * INTO streak_record FROM public.user_streaks WHERE user_id = NEW.user_id FOR UPDATE;
    IF NOT FOUND THEN RETURN NEW; END IF;
    UPDATE public.user_streaks SET total_transactions = total_transactions + 1 WHERE user_id = NEW.user_id;
    IF streak_record.last_activity_date IS NULL OR streak_record.last_activity_date < (current_date_tz - INTERVAL '1 day')::date THEN
      UPDATE public.user_streaks SET current_streak = 1, last_activity_date = current_date_tz WHERE user_id = NEW.user_id;
    ELSIF streak_record.last_activity_date = (current_date_tz - INTERVAL '1 day')::date THEN
      UPDATE public.user_streaks SET current_streak = current_streak + 1, last_activity_date = current_date_tz WHERE user_id = NEW.user_id;
    END IF;
    UPDATE public.user_streaks SET longest_streak = GREATEST(longest_streak, (SELECT current_streak FROM public.user_streaks WHERE user_id = NEW.user_id)) WHERE user_id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$FUNC$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_transaction_streak_update ON public.transactions;
CREATE TRIGGER on_transaction_streak_update
  AFTER INSERT ON public.transactions
  FOR EACH ROW EXECUTE PROCEDURE public.update_user_streak();
