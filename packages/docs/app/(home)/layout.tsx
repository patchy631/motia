import type { ReactNode } from 'react';
import { HomeLayout } from 'fumadocs-ui/layouts/home';
import { baseOptions } from '@/app/layout.config';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <HomeLayout 
        {...baseOptions} 
        className={`flex-1 pb-4 lg:pt-32 sm:pt-20 bg-linear-to-b from-[#0E002D] to-[#2F0093]`}
      >
        {children}
        <footer className="text-center py-4 text-sm text-gray-600 dark:text-gray-400">
          © {new Date().getFullYear()} All rights reserved.
        </footer>
      </HomeLayout>
    </div>
  );
}
