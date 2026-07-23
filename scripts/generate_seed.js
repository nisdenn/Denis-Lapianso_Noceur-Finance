const xlsx = require('xlsx');
const fs = require('fs');

// Parse Excel Date
function parseExcelDate(excelDate) {
  if (!excelDate) return null;
  if (typeof excelDate === 'number') {
    return new Date(Math.round((excelDate - 25569) * 86400 * 1000)).toISOString().split('T')[0];
  }
  return excelDate.toString();
}

function escapeSql(str) {
    if (!str) return '';
    return str.replace(/'/g, "''");
}

async function run() {
  const adminId = 'd8615b3c-6cc4-46b7-8da7-172152865ff1'; // we will generate a stable UUID for admin
  let sql = `
-- 1. Create Admin User in auth.users directly (Bypass API)
INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, confirmation_token, recovery_token, email_change_token_new, email_change)
VALUES (
    '${adminId}',
    '00000000-0000-0000-0000-000000000000',
    'admin@gmail.com',
    crypt('admin123', gen_salt('bf')),
    now(),
    '{"provider": "email", "providers": ["email"]}',
    '{}',
    now(),
    now(),
    'authenticated',
    '', '', '', ''
) ON CONFLICT (id) DO NOTHING;

-- 2. Clear old data for this user
DELETE FROM public.transactions WHERE user_id = '${adminId}';
DELETE FROM public.budgets WHERE user_id = '${adminId}';
DELETE FROM public.goals WHERE user_id = '${adminId}';
DELETE FROM public.wallets WHERE user_id = '${adminId}';
DELETE FROM public.categories WHERE user_id = '${adminId}';
DELETE FROM public.settings WHERE user_id = '${adminId}';

-- Note: profiles and default categories were created by trigger handle_new_user() when auth.users was inserted!
`;

  try {
    const workbook = xlsx.readFile('PENCATATAN KEUANGAN DENIS LAPIANSO.xlsx');
    
    // We don't have UUIDs until insertion, so we'll generate UUIDs statically in the script!
    const generateUUID = () => require('crypto').randomUUID();

    const walletsMap = {}; // name -> uuid
    const categoriesMap = {}; // name -> uuid

    // We will delete the default categories from trigger and insert our own to be safe, or just insert new ones and get ID
    // Since it's SQL, we can't easily fetch IDs. We will generate IDs!
    const defaultCategories = [
        { name: 'Food', type: 'Expense' },
        { name: 'Transport', type: 'Expense' },
        { name: 'Shopping', type: 'Expense' },
        { name: 'Salary', type: 'Income' },
        { name: 'Transfer In', type: 'Transfer' },
        { name: 'Transfer Out', type: 'Transfer' },
        { name: 'Transaction', type: 'Transaction' }
    ];
    for (const c of defaultCategories) {
        const id = generateUUID();
        categoriesMap[c.name.toLowerCase()] = id;
        sql += `INSERT INTO public.categories (id, user_id, name, type) VALUES ('${id}', '${adminId}', '${c.name}', '${c.type}') ON CONFLICT (user_id, name, type) DO NOTHING;\n`;
    }

    // Wallets
    const walletsSheet = workbook.Sheets['Wallets'];
    if (walletsSheet) {
      const walletsData = xlsx.utils.sheet_to_json(walletsSheet);
      for (const w of walletsData) {
        if (!w.WalletName) continue;
        const id = generateUUID();
        walletsMap[w.WalletName] = id;
        sql += `INSERT INTO public.wallets (id, user_id, name) VALUES ('${id}', '${adminId}', '${escapeSql(w.WalletName)}');\n`;
      }
    }

    // Transactions
    const txSheet = workbook.Sheets['Data'];
    if (txSheet) {
      const txData = xlsx.utils.sheet_to_json(txSheet);
      for (const t of txData) {
        if (!t.Date || !t.Amount) continue;
        const catName = (t.Category || 'Transaction').toLowerCase();
        let catId = categoriesMap[catName];
        if (!catId) {
            catId = generateUUID();
            categoriesMap[catName] = catId;
            sql += `INSERT INTO public.categories (id, user_id, name, type) VALUES ('${catId}', '${adminId}', '${escapeSql(t.Category)}', 'Expense');\n`;
        }

        const fromId = walletsMap[t.FromWallet] ? `'${walletsMap[t.FromWallet]}'` : 'NULL';
        const toId = walletsMap[t.ToWallet] ? `'${walletsMap[t.ToWallet]}'` : 'NULL';
        
        sql += `INSERT INTO public.transactions (id, user_id, date, description, category_id, from_wallet_id, to_wallet_id, amount) VALUES ('${generateUUID()}', '${adminId}', '${parseExcelDate(t.Date)}', '${escapeSql(t.Description)}', '${catId}', ${fromId}, ${toId}, ${t.Amount});\n`;
      }
    }

    // Budgets
    const budgetSheet = workbook.Sheets['Budgets'];
    if (budgetSheet) {
      const budgetData = xlsx.utils.sheet_to_json(budgetSheet);
      for (const b of budgetData) {
        if (!b.Name) continue;
        const walletId = walletsMap[b.WalletName] ? `'${walletsMap[b.WalletName]}'` : 'NULL';
        sql += `INSERT INTO public.budgets (id, user_id, name, target_amount, wallet_id) VALUES ('${generateUUID()}', '${adminId}', '${escapeSql(b.Name)}', ${b.TargetAmount || 0}, ${walletId});\n`;
      }
    }

    // Goals
    const goalsSheet = workbook.Sheets['Goals'];
    if (goalsSheet) {
      const goalsData = xlsx.utils.sheet_to_json(goalsSheet);
      for (const g of goalsData) {
        if (!g.Name) continue;
        sql += `INSERT INTO public.goals (id, user_id, name, target_amount, current_amount) VALUES ('${generateUUID()}', '${adminId}', '${escapeSql(g.Name)}', ${g.TargetAmount || 0}, ${g.CurrentAmount || 0});\n`;
      }
    }
    
    // Settings
    const settingsSheet = workbook.Sheets['Settings'];
    if (settingsSheet) {
        const settingsData = xlsx.utils.sheet_to_json(settingsSheet);
        for(const s of settingsData) {
            if(!s.Key) continue;
            sql += `INSERT INTO public.settings (id, user_id, key, value) VALUES ('${generateUUID()}', '${adminId}', '${escapeSql(s.Key)}', '${escapeSql(s.Value)}') ON CONFLICT (user_id, key) DO UPDATE SET value = EXCLUDED.value;\n`;
        }
    }

    fs.writeFileSync('seed.sql', sql);
    console.log("SQL Seed generated: seed.sql");
  } catch (err) {
    console.error("Migration failed:", err);
  }
}

run();
