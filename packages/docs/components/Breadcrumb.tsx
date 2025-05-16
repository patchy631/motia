'use client';
import { cn } from 'fumadocs-ui/components/api';
import Link from 'next/link';
 
export function Breadcrumb({ items }: { items: { name: string, url: string }[] }) {

  if (!items || items.length === 0) return null;

 
  return (
    <div className={cn('grid gap-4 w-full', items.length % 3  === 0 ? `grid-cols-3` : `grid-cols-2`)}>
      {items.map((item, i) => (
        <div key={i}>
          {item.url ? (
            <Link
              href={item.url}
              className="truncate no-underline"
            >
              <div className='transition-colors flex flex-col items-center justify-center border rounded-md p-8 border-zinc-850 dark:border-zinc-150 bg-linear-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-900 hover:from-zinc-200 hover:to-zinc-300 dark:hover:from-zinc-900 dark:hover:to-zinc-800 hover:text-zinc-1000 dark:hover:text-white'>
                {item.name}
              </div>
            </Link>
          ) : (
            <div className='transition-colors flex flex-col items-center justify-center border rounded-md p-8 border-zinc-850 dark:border-zinc-150 bg-linear-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-900 hover:from-zinc-200 hover:to-zinc-300 dark:hover:from-zinc-900 dark:hover:to-zinc-800 hover:text-zinc-1000 dark:hover:text-white'>
              <span className="truncate">{item.name}</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}