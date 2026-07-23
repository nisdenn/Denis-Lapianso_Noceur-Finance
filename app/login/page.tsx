import { loginAction } from '@/app/actions/auth';
import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import Link from 'next/link';

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string, message?: string }> }) {
  // Check if already logged in
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    redirect('/');
  }

  const errorParams = await searchParams;

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6" style={{ backgroundImage: "url('https://picsum.photos/seed/noceur/1920/1080')", backgroundSize: 'cover', backgroundPosition: 'center' }}>
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"></div>
      <div className="relative z-10 w-full max-w-md bg-white/80 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-white/40">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-slate-800">Noceur Finance</h1>
          <p className="text-sm text-slate-500 mt-1">Sign in to your account</p>
        </div>

        {errorParams?.error && (
          <div className="mb-6 p-4 bg-rose-50 text-rose-600 rounded-xl text-sm font-medium border border-rose-100 text-center">
            {errorParams.error}
          </div>
        )}
        
        {errorParams?.message && (
          <div className="mb-6 p-4 bg-indigo-50 text-indigo-600 rounded-xl text-sm font-medium border border-indigo-100 text-center">
            {errorParams.message}
          </div>
        )}

        <form action={loginAction} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Username</label>
            <input 
              name="username" 
              type="text" 
              required
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Password</label>
            <input 
              name="password" 
              type="password" 
              required
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
          
          <button type="submit" className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl hover:bg-slate-800 transition-colors shadow-lg mt-4">
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
}
