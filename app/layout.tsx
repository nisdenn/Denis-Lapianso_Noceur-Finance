import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Noceur Finance',
  description: 'Personal Wealth Companion',
  icons: {
    icon: '/favicon.png',
    shortcut: '/favicon.png',
    apple: '/favicon.png',
  },
};

import { Toaster } from 'sonner';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased bg-[#F1F3F5] text-slate-900 font-sans min-h-screen" suppressHydrationWarning>
        {children}
        <Toaster position="bottom-center" />
      </body>
    </html>
  );
}
