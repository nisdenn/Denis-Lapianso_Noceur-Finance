const xlsx = require('xlsx');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
// We need service_role or just use Auth API to create the user, then service_role to bypass RLS for migration
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseKey; 
const supabase = createClient(supabaseUrl, serviceRole);

// Parse Excel Date
function parseExcelDate(excelDate) {
  if (!excelDate) return null;
  if (typeof excelDate === 'number') {
    return new Date(Math.round((excelDate - 25569) * 86400 * 1000)).toISOString().split('T')[0];
  }
  return excelDate.toString();
}

async function run() {
  console.log("Creating/Logging in Admin user...");
  // Try to sign up admin
  let userId;
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: 'denis.lapianso.finance@gmail.com',
    password: 'admin123',
    email_confirm: true,
  });
  
  if (authError && authError.message.includes('already registered')) {
     const { data: usersData } = await supabase.auth.admin.listUsers();
     userId = usersData.users.find(u => u.email === 'admin@gmail.com')?.id;
  } else {
     userId = authData.user?.id;
  }

  if (!userId) {
      console.error("Could not get user ID for migration.", authError);
      return;
  }

  console.log("Admin User ID:", userId);

  try {
    const workbook = xlsx.readFile('PENCATATAN KEUANGAN DENIS LAPIANSO.xlsx');
    
    // Fetch Categories (auto-created by DB trigger)
    const { data: categories } = await supabase.from('categories').select('*').eq('user_id', userId);
    const getCategoryId = (name) => {
        const cat = categories.find(c => c.name.toLowerCase() === name.toLowerCase());
        return cat ? cat.id : categories[0]?.id; // fallback
    };

    // 1. Wallets (name)
    const walletsMap = {};
    const walletsSheet = workbook.Sheets['Wallets'];
    if (walletsSheet) {
      const walletsData = xlsx.utils.sheet_to_json(walletsSheet);
      for (const w of walletsData) {
        if (!w.WalletName) continue;
        console.log(`Inserting Wallet: ${w.WalletName}`);
        const { data: nw } = await supabase.from('wallets').insert([{ 
          user_id: userId, 
          name: w.WalletName
        }]).select().single();
        if (nw) walletsMap[nw.name] = nw.id;
      }
    }

    // 2. Transactions
    const txSheet = workbook.Sheets['Data'];
    if (txSheet) {
      const txData = xlsx.utils.sheet_to_json(txSheet);
      const toInsert = [];
      for (const t of txData) {
        if (!t.Date || !t.Amount) continue;
        toInsert.push({
          user_id: userId,
          date: parseExcelDate(t.Date),
          description: t.Description || '',
          category_id: getCategoryId(t.Category || 'Transaction'),
          from_wallet_id: walletsMap[t.FromWallet] || null,
          to_wallet_id: walletsMap[t.ToWallet] || null,
          amount: Number(t.Amount)
        });
      }
      
      if (toInsert.length > 0) {
        console.log(`Inserting ${toInsert.length} Transactions...`);
        const { error: txErr } = await supabase.from('transactions').insert(toInsert);
        if (txErr) console.error("Error inserting transactions:", txErr);
      }
    }

    // 3. Budgets (Name, TargetAmount, WalletName)
    const budgetSheet = workbook.Sheets['Budgets'];
    if (budgetSheet) {
      const budgetData = xlsx.utils.sheet_to_json(budgetSheet);
      for (const b of budgetData) {
        if (!b.Name) continue;
        console.log(`Inserting Budget: ${b.Name}`);
        await supabase.from('budgets').insert([{
          user_id: userId,
          name: b.Name,
          target_amount: Number(b.TargetAmount || 0),
          wallet_id: walletsMap[b.WalletName] || null
        }]);
      }
    }

    // 4. Goals (Name, TargetAmount, CurrentAmount)
    const goalsSheet = workbook.Sheets['Goals'];
    if (goalsSheet) {
      const goalsData = xlsx.utils.sheet_to_json(goalsSheet);
      for (const g of goalsData) {
        if (!g.Name) continue;
        console.log(`Inserting Goal: ${g.Name}`);
        await supabase.from('goals').insert([{
          user_id: userId,
          name: g.Name,
          target_amount: Number(g.TargetAmount || 0),
          current_amount: Number(g.CurrentAmount || 0)
        }]);
      }
    }
    
    // 5. Settings (Key, Value)
    const settingsSheet = workbook.Sheets['Settings'];
    if (settingsSheet) {
        const settingsData = xlsx.utils.sheet_to_json(settingsSheet);
        for(const s of settingsData) {
            if(!s.Key) continue;
            console.log(`Inserting Setting: ${s.Key}`);
            await supabase.from('settings').upsert([{
                user_id: userId,
                key: s.Key,
                value: s.Value || ''
            }], { onConflict: 'user_id,key' })
        }
    }
    
    console.log("Data migration complete!");
  } catch (err) {
    console.error("Migration failed:", err);
  }
}

run();
