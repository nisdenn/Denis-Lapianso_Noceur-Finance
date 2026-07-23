import { Sidebar } from './Sidebar';

export function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-white text-zinc-950 font-sans">
      <Sidebar />
      <main className="flex-1 p-6 md:p-10 max-w-6xl mx-auto w-full">
        {children}
      </main>
    </div>
  );
}
