
-- 1. Create Admin User in auth.users directly (Bypass API)
INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, confirmation_token, recovery_token, email_change_token_new, email_change)
VALUES (
    'd8615b3c-6cc4-46b7-8da7-172152865ff1',
    '00000000-0000-0000-0000-000000000000',
    'testadmin@gmail.com',
    '$2b$10$eCP0vgb71iaRsBpqeo8KLO1/JpwlzADFb7aZKaqEgwJKKQaoGwZre',
    now(),
    '{"provider": "email", "providers": ["email"]}',
    '{}',
    now(),
    now(),
    'authenticated',
    '', '', '', ''
) ON CONFLICT (id) DO NOTHING;

-- 2. Clear old data for this user
DELETE FROM public.transactions WHERE user_id = 'd8615b3c-6cc4-46b7-8da7-172152865ff1';
DELETE FROM public.budgets WHERE user_id = 'd8615b3c-6cc4-46b7-8da7-172152865ff1';
DELETE FROM public.goals WHERE user_id = 'd8615b3c-6cc4-46b7-8da7-172152865ff1';
DELETE FROM public.wallets WHERE user_id = 'd8615b3c-6cc4-46b7-8da7-172152865ff1';
DELETE FROM public.categories WHERE user_id = 'd8615b3c-6cc4-46b7-8da7-172152865ff1';

-- Note: profiles and default categories were created by trigger handle_new_user() when auth.users was inserted!
INSERT INTO public.categories (id, user_id, name, type) VALUES ('277cf975-f1ff-43f6-8f30-6ba278637732', 'd8615b3c-6cc4-46b7-8da7-172152865ff1', 'Food', 'Expense');
INSERT INTO public.categories (id, user_id, name, type) VALUES ('482357db-8216-4f0e-97fe-7d781fd94fb6', 'd8615b3c-6cc4-46b7-8da7-172152865ff1', 'Transport', 'Expense');
INSERT INTO public.categories (id, user_id, name, type) VALUES ('56dd7a26-7423-4c71-8b3b-1f055c107d03', 'd8615b3c-6cc4-46b7-8da7-172152865ff1', 'Shopping', 'Expense');
INSERT INTO public.categories (id, user_id, name, type) VALUES ('1e3380b1-9593-4c3a-a3df-eb2149f3236f', 'd8615b3c-6cc4-46b7-8da7-172152865ff1', 'Salary', 'Income');
INSERT INTO public.categories (id, user_id, name, type) VALUES ('592ee302-5fe0-4f78-b383-41f9ca5d567f', 'd8615b3c-6cc4-46b7-8da7-172152865ff1', 'Transfer In', 'Transfer');
INSERT INTO public.categories (id, user_id, name, type) VALUES ('71551b1c-fc46-440b-aba5-7b111071925c', 'd8615b3c-6cc4-46b7-8da7-172152865ff1', 'Transfer Out', 'Transfer');
INSERT INTO public.categories (id, user_id, name, type) VALUES ('4df9e6f3-d942-4f2f-80b4-9d2dee69aa8d', 'd8615b3c-6cc4-46b7-8da7-172152865ff1', 'Transaction', 'Expense');
INSERT INTO public.wallets (id, user_id, name) VALUES ('73e47440-ab28-4c1f-a362-94ef7e5f9a1b', 'd8615b3c-6cc4-46b7-8da7-172152865ff1', 'Jago');
INSERT INTO public.wallets (id, user_id, name) VALUES ('383567b7-7c05-47c1-a423-cc46204d07d7', 'd8615b3c-6cc4-46b7-8da7-172152865ff1', 'Cash');
INSERT INTO public.wallets (id, user_id, name) VALUES ('f4783055-b4aa-490a-ae22-37f920973279', 'd8615b3c-6cc4-46b7-8da7-172152865ff1', 'myBCA');
INSERT INTO public.wallets (id, user_id, name) VALUES ('00ee2e63-fc1f-466d-80c5-45157c3186c7', 'd8615b3c-6cc4-46b7-8da7-172152865ff1', 'SeaBank');
INSERT INTO public.categories (id, user_id, name, type) VALUES ('c3efafde-9323-450c-8de9-aedee9b2ceec', 'd8615b3c-6cc4-46b7-8da7-172152865ff1', 'Income', 'Expense');
INSERT INTO public.categories (id, user_id, name, type) VALUES ('d30429d0-f056-49f2-b4bd-48c0e1d73653', 'd8615b3c-6cc4-46b7-8da7-172152865ff1', 'Expense', 'Expense');
INSERT INTO public.budgets (id, user_id, name, target_amount, wallet_id) VALUES ('5d9b8592-5b9b-4270-b59f-143cd4447aa7', 'd8615b3c-6cc4-46b7-8da7-172152865ff1', 'Savings', 5000000, '00ee2e63-fc1f-466d-80c5-45157c3186c7');
INSERT INTO public.budgets (id, user_id, name, target_amount, wallet_id) VALUES ('9c177bcd-fbce-4606-9661-c9b258b57fd6', 'd8615b3c-6cc4-46b7-8da7-172152865ff1', 'Allowances', 1500000, '73e47440-ab28-4c1f-a362-94ef7e5f9a1b');
INSERT INTO public.budgets (id, user_id, name, target_amount, wallet_id) VALUES ('2a57d977-40c8-452d-89d6-f008df1f190e', 'd8615b3c-6cc4-46b7-8da7-172152865ff1', 'Cash Buffer', 2000000, 'f4783055-b4aa-490a-ae22-37f920973279');

