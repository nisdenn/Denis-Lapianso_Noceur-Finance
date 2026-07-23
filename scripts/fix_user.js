require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixUser() {
  const email = 'admin@noceur.finance';
  const password = 'admin123';

  console.log(`Resetting password for ${email}...`);

  const { data, error } = await supabase.auth.admin.updateUserById(
    'd8615b3c-6cc4-46b7-8da7-172152865ff1',
    { password: password, email: email, email_confirm: true }
  );

  if (error) {
    console.error('Failed to update user:', error);
  } else {
    console.log('User updated successfully:', data.user.id);
  }
}

fixUser();
