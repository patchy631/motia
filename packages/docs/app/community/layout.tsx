import type { ReactNode } from 'react';
import { HomeLayout } from 'fumadocs-ui/layouts/home';
import { baseOptions } from '@/app/layout.config';

export default function Layout({ children }: { children: ReactNode }) {
  return <HomeLayout {...baseOptions} className='dark:bg-linear-to-t dark:from-zinc-900 dark:to-zinc-1000 bg-linear-to-b from-gray-200 to-gray-300'>{children}</HomeLayout>;
}
