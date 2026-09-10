import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { financeService } from '@/lib/services/finance.service';
import { buildExcelBuffer } from '@/lib/services/excel.service';
import type { ExportScope } from '@/lib/services/excel.service';

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {}
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const scope = (searchParams.get('scope') || 'this_month') as ExportScope;
  const validScopes: ExportScope[] = ['this_month', 'last_month', '3_months', 'all'];
  if (!validScopes.includes(scope)) {
    return NextResponse.json({ error: 'Invalid scope' }, { status: 400 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('name')
    .eq('id', user.id)
    .maybeSingle();

  const userName = profile?.name || user.email?.split('@')[0] || 'User';
  const transactions = await financeService.getTransactions(user.id);

  const buffer = buildExcelBuffer(transactions, scope, userName);

  const scopeLabels: Record<ExportScope, string> = {
    this_month: 'BulanIni',
    last_month: 'BulanLalu',
    '3_months': '3Bulan',
    all: 'Semua',
  };

  const now = new Date();
  const fileName = `NoceurFinance_${scopeLabels[scope]}_${now.getFullYear()}.xlsx`;

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${fileName}"`,
      'Content-Length': buffer.length.toString(),
    },
  });
}
