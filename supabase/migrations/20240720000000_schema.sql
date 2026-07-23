

-- Enums
CREATE TYPE public.transaction_type AS ENUM ('Income', 'Expense', 'Transfer');
CREATE TYPE public.user_role AS ENUM ('user', 'admin');
CREATE TYPE public.reminder_frequency AS ENUM ('daily', 'weekly', 'monthly');

-- Common Triggers for updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 1. Profiles
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text NOT NULL UNIQUE CHECK (
    length(username) >= 3 AND 
    length(username) <= 30 AND 
    username ~ '^[a-zA-Z0-9_]+$' AND
    username NOT IN ('admin', 'root', 'postgres', 'superuser', 'system')
  ),
  role public.user_role DEFAULT 'user',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_by uuid REFERENCES auth.users(id)
);
CREATE TRIGGER set_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 2. Wallets
CREATE TABLE public.wallets (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_by uuid REFERENCES auth.users(id),
  deleted_at timestamp with time zone,
  deleted_by uuid REFERENCES auth.users(id)
);
CREATE TRIGGER set_wallets_updated_at BEFORE UPDATE ON public.wallets FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();
CREATE UNIQUE INDEX idx_wallets_user_name_unique ON public.wallets(user_id, name) WHERE deleted_at IS NULL;
CREATE INDEX idx_wallets_user ON public.wallets(user_id);
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own wallets" ON public.wallets FOR ALL USING (auth.uid() = user_id);

-- 3. Categories
CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  type public.transaction_type NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_by uuid REFERENCES auth.users(id),
  deleted_at timestamp with time zone,
  deleted_by uuid REFERENCES auth.users(id)
);
CREATE TRIGGER set_categories_updated_at BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();
CREATE UNIQUE INDEX idx_categories_user_name_type_unique ON public.categories(user_id, name, type) WHERE deleted_at IS NULL;
CREATE INDEX idx_categories_user ON public.categories(user_id);
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own categories" ON public.categories FOR ALL USING (auth.uid() = user_id);

-- 4. Goals (Moved up for FK references)
CREATE TABLE public.goals (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  target_amount numeric(18,2) NOT NULL CHECK (target_amount >= 0),
  current_amount numeric(18,2) DEFAULT 0 CHECK (current_amount >= 0),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_by uuid REFERENCES auth.users(id)
);
CREATE TRIGGER set_goals_updated_at BEFORE UPDATE ON public.goals FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own goals" ON public.goals FOR ALL USING (auth.uid() = user_id);

-- 5. Transactions
CREATE TABLE public.transactions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date date NOT NULL,
  description text NOT NULL,
  amount numeric(18,2) NOT NULL CHECK (amount >= 0),
  type public.transaction_type NOT NULL,
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  from_wallet_id uuid REFERENCES public.wallets(id) ON DELETE RESTRICT,
  to_wallet_id uuid REFERENCES public.wallets(id) ON DELETE RESTRICT,
  goal_id uuid REFERENCES public.goals(id) ON DELETE SET NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_by uuid REFERENCES auth.users(id),
  deleted_at timestamp with time zone,
  deleted_by uuid REFERENCES auth.users(id),
  CONSTRAINT chk_transaction_type_logic CHECK (
    (type = 'Income' AND from_wallet_id IS NULL AND to_wallet_id IS NOT NULL) OR
    (type = 'Expense' AND from_wallet_id IS NOT NULL AND to_wallet_id IS NULL) OR
    (type = 'Transfer' AND from_wallet_id IS NOT NULL AND to_wallet_id IS NOT NULL AND from_wallet_id != to_wallet_id)
  )
);
CREATE TRIGGER set_transactions_updated_at BEFORE UPDATE ON public.transactions FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();
CREATE INDEX idx_transactions_user_date ON public.transactions(user_id, date);
CREATE INDEX idx_transactions_category ON public.transactions(category_id);
CREATE INDEX idx_transactions_wallet_from ON public.transactions(from_wallet_id);
CREATE INDEX idx_transactions_wallet_to ON public.transactions(to_wallet_id);
CREATE INDEX idx_transactions_goal ON public.transactions(goal_id);
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own transactions" ON public.transactions FOR ALL USING (auth.uid() = user_id);

-- 6. Budgets
CREATE TABLE public.budgets (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  target_amount numeric(18,2) NOT NULL CHECK (target_amount >= 0),
  wallet_id uuid REFERENCES public.wallets(id) ON DELETE RESTRICT,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_by uuid REFERENCES auth.users(id)
);
CREATE TRIGGER set_budgets_updated_at BEFORE UPDATE ON public.budgets FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own budgets" ON public.budgets FOR ALL USING (auth.uid() = user_id);

-- 7. User Preferences
CREATE TABLE public.user_preferences (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  preferences jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE TRIGGER set_user_preferences_updated_at BEFORE UPDATE ON public.user_preferences FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own preferences" ON public.user_preferences FOR ALL USING (auth.uid() = user_id);

-- 8. Wallet Balances View (Ledger)
CREATE VIEW public.wallet_balances WITH (security_invoker = true) AS
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

-- 9. Streaks
CREATE TABLE public.user_streaks (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  current_streak integer DEFAULT 0,
  longest_streak integer DEFAULT 0,
  last_activity_date date,
  total_transactions integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE TRIGGER set_user_streaks_updated_at BEFORE UPDATE ON public.user_streaks FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();
ALTER TABLE public.user_streaks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own streaks" ON public.user_streaks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users update own streaks" ON public.user_streaks FOR UPDATE USING (auth.uid() = user_id);
GRANT SELECT, UPDATE ON public.user_streaks TO authenticated;
GRANT SELECT, UPDATE ON public.user_streaks TO service_role;

-- 10. Reminders
CREATE TABLE public.reminders (
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
CREATE TRIGGER set_reminders_updated_at BEFORE UPDATE ON public.reminders FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own reminders" ON public.reminders FOR ALL USING (auth.uid() = user_id);
GRANT ALL ON public.reminders TO authenticated;
GRANT ALL ON public.reminders TO service_role;


-- TRIGGERS & FUNCTIONS --

-- Trigger to create profile, preferences, streaks, and default categories on new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, role)
  VALUES (new.id, split_part(new.email, '@', 1), 'user');
  
  INSERT INTO public.user_preferences (user_id, preferences)
  VALUES (new.id, '{"theme": "system", "currency": "IDR"}');
  
  INSERT INTO public.user_streaks (user_id)
  VALUES (new.id);

  -- Insert default categories
  INSERT INTO public.categories (user_id, name, type) VALUES
  (new.id, 'Food', 'Expense'),
  (new.id, 'Transport', 'Expense'),
  (new.id, 'Shopping', 'Expense'),
  (new.id, 'Salary', 'Income'),
  (new.id, 'Transfer', 'Transfer');
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- Trigger to check transaction ownership and soft deletes
CREATE OR REPLACE FUNCTION public.check_transaction_integrity()
RETURNS TRIGGER AS $$
BEGIN
  -- Check category ownership and soft delete
  IF NEW.category_id IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM public.categories WHERE id = NEW.category_id AND user_id = NEW.user_id AND deleted_at IS NULL) THEN
      RAISE EXCEPTION 'Category does not belong to the user or is deleted';
    END IF;
  END IF;

  -- Check from_wallet ownership and soft delete
  IF NEW.from_wallet_id IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM public.wallets WHERE id = NEW.from_wallet_id AND user_id = NEW.user_id AND deleted_at IS NULL) THEN
      RAISE EXCEPTION 'From Wallet does not belong to the user or is deleted';
    END IF;
  END IF;

  -- Check to_wallet ownership and soft delete
  IF NEW.to_wallet_id IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM public.wallets WHERE id = NEW.to_wallet_id AND user_id = NEW.user_id AND deleted_at IS NULL) THEN
      RAISE EXCEPTION 'To Wallet does not belong to the user or is deleted';
    END IF;
  END IF;
  
  -- Check goal ownership
  IF NEW.goal_id IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM public.goals WHERE id = NEW.goal_id AND user_id = NEW.user_id) THEN
      RAISE EXCEPTION 'Goal does not belong to the user';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ensure_transaction_integrity
  BEFORE INSERT OR UPDATE ON public.transactions
  FOR EACH ROW EXECUTE PROCEDURE public.check_transaction_integrity();


-- Trigger to update goals amount when a transaction targets a goal
CREATE OR REPLACE FUNCTION public.update_goal_amount()
RETURNS TRIGGER AS $$
BEGIN
  -- If this is a new transaction linked to a goal
  IF TG_OP = 'INSERT' AND NEW.deleted_at IS NULL AND NEW.goal_id IS NOT NULL THEN
    UPDATE public.goals SET current_amount = current_amount + NEW.amount WHERE id = NEW.goal_id;
  END IF;

  -- If updating transaction (e.g., amount change or soft delete)
  IF TG_OP = 'UPDATE' THEN
    -- If it was linked to a goal and now soft deleted
    IF OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL AND NEW.goal_id IS NOT NULL THEN
      UPDATE public.goals SET current_amount = current_amount - NEW.amount WHERE id = NEW.goal_id;
    END IF;
    -- If amount changed without soft deleting
    IF OLD.deleted_at IS NULL AND NEW.deleted_at IS NULL AND OLD.goal_id = NEW.goal_id AND OLD.amount != NEW.amount AND NEW.goal_id IS NOT NULL THEN
      UPDATE public.goals SET current_amount = current_amount - OLD.amount + NEW.amount WHERE id = NEW.goal_id;
    END IF;
    -- If goal changed
    IF OLD.deleted_at IS NULL AND NEW.deleted_at IS NULL AND OLD.goal_id IS DISTINCT FROM NEW.goal_id THEN
      IF OLD.goal_id IS NOT NULL THEN
        UPDATE public.goals SET current_amount = current_amount - OLD.amount WHERE id = OLD.goal_id;
      END IF;
      IF NEW.goal_id IS NOT NULL THEN
        UPDATE public.goals SET current_amount = current_amount + NEW.amount WHERE id = NEW.goal_id;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER handle_goal_transactions
  AFTER INSERT OR UPDATE ON public.transactions
  FOR EACH ROW EXECUTE PROCEDURE public.update_goal_amount();


-- Trigger to update streaks on new transaction
CREATE OR REPLACE FUNCTION public.update_user_streak()
RETURNS TRIGGER AS $$
DECLARE
  streak_record public.user_streaks%ROWTYPE;
  current_date_tz date;
BEGIN
  -- Only care about new valid transactions
  IF TG_OP = 'INSERT' AND NEW.deleted_at IS NULL THEN
    -- Get current date (UTC for simplicity)
    current_date_tz := CURRENT_DATE;
    
    SELECT * INTO streak_record FROM public.user_streaks WHERE user_id = NEW.user_id FOR UPDATE;
    
    IF NOT FOUND THEN
      RETURN NEW;
    END IF;

    -- Update total transactions
    UPDATE public.user_streaks SET total_transactions = total_transactions + 1 WHERE user_id = NEW.user_id;

    -- If no activity yet or last activity was before yesterday (streak broken)
    IF streak_record.last_activity_date IS NULL OR streak_record.last_activity_date < (current_date_tz - INTERVAL '1 day')::date THEN
      UPDATE public.user_streaks 
      SET current_streak = 1, last_activity_date = current_date_tz
      WHERE user_id = NEW.user_id;
      
    -- If last activity was exactly yesterday (streak continues)
    ELSIF streak_record.last_activity_date = (current_date_tz - INTERVAL '1 day')::date THEN
      UPDATE public.user_streaks 
      SET current_streak = current_streak + 1, last_activity_date = current_date_tz
      WHERE user_id = NEW.user_id;
    END IF;

    -- Update longest streak if needed
    UPDATE public.user_streaks 
    SET longest_streak = GREATEST(longest_streak, (SELECT current_streak FROM public.user_streaks WHERE user_id = NEW.user_id))
    WHERE user_id = NEW.user_id;
    
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_transaction_streak_update
  AFTER INSERT ON public.transactions
  FOR EACH ROW EXECUTE PROCEDURE public.update_user_streak();

GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL PRIVILEGES ON ALL ROUTINES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;

