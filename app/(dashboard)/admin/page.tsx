import { createAdminClient } from '@/utils/supabase/admin';
import AdminAddUserForm from '@/components/AdminAddUserForm';
import { AlertCircle } from 'lucide-react';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

export const revalidate = 0;

export default async function AdminPage() {
  let users: any[] = [];
  let errorMsg = '';
  
  try {
    const supabaseServer = createClient();
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser();
    if (authError || !user) {
        redirect('/login?error=Unauthorized');
    }

    const { data: profile } = await supabaseServer.from('profiles').select('role').eq('id', user.id).single();
    const isAdmin = profile?.role === 'admin';
    if (!isAdmin) {
        redirect('/login?error=Unauthorized');
    }

    const adminAuthClient = createAdminClient();
    const { data: usersData, error } = await adminAuthClient.auth.admin.listUsers();
    
    if (error) {
      errorMsg = error.message;
    } else {
      users = (usersData.users || []).map(userItem => ({
        id: userItem.id,
        username: userItem.email?.split('@')[0] || userItem.email,
        role: userItem.user_metadata?.role || 'user'
      }));
    }
  } catch (err: any) {
    errorMsg = err.message || 'Failed to fetch users';
  }

  return (
    <div className="flex flex-col gap-6 w-full h-full p-6">
      <div className="bg-white/60 backdrop-blur-md border border-white/40 p-6 rounded-3xl shadow-sm">
        <h1 className="text-xl font-bold tracking-tight text-slate-800">Admin Dashboard</h1>
        <p className="text-xs text-slate-500 mt-1">Manage users and their access.</p>
      </div>
      
      {errorMsg ? (
        <div className="bg-rose-50 border border-rose-200 p-6 rounded-3xl flex items-start gap-4">
          <AlertCircle className="w-6 h-6 text-rose-500 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-rose-700">Database Access Error</h3>
            <p className="text-sm text-rose-600 mt-1">{errorMsg}</p>
            {errorMsg.includes('Missing Supabase Service Role Key') && (
              <p className="text-xs text-rose-500 mt-2 font-medium">Please add SUPABASE_SERVICE_ROLE_KEY to your .env.local file to enable this feature.</p>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
          <div className="bg-white/80 backdrop-blur-xl border border-white/60 p-6 rounded-3xl shadow-sm overflow-y-auto">
            <h2 className="font-bold text-slate-800 mb-4">All Users</h2>
            <div className="space-y-3">
              {users.map(userItem => (
                <div key={userItem.id} className="bg-slate-50 border border-slate-100 p-4 rounded-xl flex flex-col gap-1">
                  <div className="flex justify-between items-center">
                    <p className="font-bold text-slate-800">{userItem.username}</p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${userItem.role === 'admin' ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-200 text-slate-600'}`}>
                      {userItem.role.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1 break-all">
                    Supabase Managed Auth
                  </p>
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-white/80 backdrop-blur-xl border border-white/60 p-6 rounded-3xl shadow-sm h-fit">
            <h2 className="font-bold text-slate-800 mb-4">Create New User</h2>
            <AdminAddUserForm />
          </div>
        </div>
      )}
    </div>
  );
}
