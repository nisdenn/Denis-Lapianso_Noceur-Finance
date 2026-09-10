-- ============================================================
-- WhatsApp Integration & Messaging Layer Migration
-- Supports multi-user messaging, account linking, intent logging,
-- and confirmation workflows (pending actions).
-- ============================================================

-- 1. WhatsApp Accounts
CREATE TABLE IF NOT EXISTS public.whatsapp_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  phone_number text NOT NULL UNIQUE,
  wa_user_id text,
  display_name text,
  status text NOT NULL DEFAULT 'verified' CHECK (status IN ('pending', 'verified', 'disconnected')),
  verification_code text,
  verification_expires_at timestamp with time zone,
  verified_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TRIGGER set_whatsapp_accounts_updated_at 
  BEFORE UPDATE ON public.whatsapp_accounts 
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

CREATE INDEX IF NOT EXISTS idx_whatsapp_accounts_user_id ON public.whatsapp_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_accounts_phone ON public.whatsapp_accounts(phone_number);
CREATE INDEX IF NOT EXISTS idx_whatsapp_accounts_code ON public.whatsapp_accounts(verification_code);

ALTER TABLE public.whatsapp_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own whatsapp accounts" ON public.whatsapp_accounts
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own whatsapp accounts" ON public.whatsapp_accounts
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own whatsapp accounts" ON public.whatsapp_accounts
  FOR DELETE USING (auth.uid() = user_id);

GRANT ALL ON public.whatsapp_accounts TO authenticated;
GRANT ALL ON public.whatsapp_accounts TO service_role;


-- 2. WhatsApp Conversations
CREATE TABLE IF NOT EXISTS public.whatsapp_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  whatsapp_account_id uuid REFERENCES public.whatsapp_accounts(id) ON DELETE CASCADE,
  last_message_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  state jsonb DEFAULT '{}'::jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TRIGGER set_whatsapp_conversations_updated_at 
  BEFORE UPDATE ON public.whatsapp_conversations 
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_account ON public.whatsapp_conversations(whatsapp_account_id);

ALTER TABLE public.whatsapp_conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own conversations" ON public.whatsapp_conversations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.whatsapp_accounts wa 
      WHERE wa.id = whatsapp_account_id AND wa.user_id = auth.uid()
    )
  );

GRANT ALL ON public.whatsapp_conversations TO authenticated;
GRANT ALL ON public.whatsapp_conversations TO service_role;


-- 3. WhatsApp Messages
CREATE TABLE IF NOT EXISTS public.whatsapp_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES public.whatsapp_conversations(id) ON DELETE CASCADE,
  direction text NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  message_type text NOT NULL DEFAULT 'text',
  message_id text,
  content text NOT NULL,
  intent text,
  status text DEFAULT 'received',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_conversation ON public.whatsapp_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_message_id ON public.whatsapp_messages(message_id);

ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own messages" ON public.whatsapp_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.whatsapp_conversations wc
      JOIN public.whatsapp_accounts wa ON wa.id = wc.whatsapp_account_id
      WHERE wc.id = conversation_id AND wa.user_id = auth.uid()
    )
  );

GRANT ALL ON public.whatsapp_messages TO authenticated;
GRANT ALL ON public.whatsapp_messages TO service_role;


-- 4. Pending Actions (Confirmation Workflow)
CREATE TABLE IF NOT EXISTS public.pending_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  channel text NOT NULL DEFAULT 'whatsapp',
  action_type text NOT NULL,
  payload jsonb NOT NULL,
  status text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'CONFIRMED', 'CANCELLED', 'EXPIRED')),
  expires_at timestamp with time zone NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TRIGGER set_pending_actions_updated_at 
  BEFORE UPDATE ON public.pending_actions 
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

CREATE INDEX IF NOT EXISTS idx_pending_actions_user_status ON public.pending_actions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_pending_actions_expires_at ON public.pending_actions(expires_at);

ALTER TABLE public.pending_actions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own pending actions" ON public.pending_actions
  FOR ALL USING (auth.uid() = user_id);

GRANT ALL ON public.pending_actions TO authenticated;
GRANT ALL ON public.pending_actions TO service_role;
