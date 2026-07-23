ALTER TABLE public.reminders ADD COLUMN is_system_default BOOLEAN DEFAULT false;
ALTER TABLE public.reminders ADD COLUMN last_completed_at TIMESTAMP WITH TIME ZONE;

-- Update handle_new_user to also insert default reminders
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
  
  -- Insert default reminders
  INSERT INTO public.reminders (user_id, title, frequency, time, is_system_default) VALUES
  (new.id, 'Daily Finance Logging', 'daily', '20:00:00', true);

  INSERT INTO public.reminders (user_id, title, frequency, time, day_of_week, is_system_default) VALUES
  (new.id, 'Weekly Review', 'weekly', '20:00:00', 0, true);
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
