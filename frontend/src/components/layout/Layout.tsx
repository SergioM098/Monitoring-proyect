import type { ReactNode } from 'react';
import { Sidebar } from './Header';

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen page-bg">
      <Sidebar />
      <main className="ml-56 min-h-screen px-6 py-6">
        <div className="max-w-[1400px] mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
