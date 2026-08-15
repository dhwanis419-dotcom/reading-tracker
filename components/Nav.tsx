'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const items = [
  { href: '/tbr', label: 'To Be Read' },
  { href: '/reading', label: 'Currently Reading' },
  { href: '/diary', label: 'Diary' },
  { href: '/library', label: 'Library' },
  { href: '/stats', label: 'Statistics' },
];

export default function Nav() {
  const pathname = usePathname();

  return (
    <header className="border-b border-line bg-card/60 backdrop-blur-sm sticky top-0 z-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-5 flex items-start justify-between">
        <Link href="/tbr" className="inline-block">
          <h1 className="font-display italic text-2xl text-spine tracking-tight">
            The Ledger
          </h1>
          <p className="catalog-tab text-inkfaint mt-0.5">a personal reading archive</p>
        </Link>
        <Link
          href="/search"
          className={`catalog-tab border rounded-sm px-3 py-1.5 ${
            pathname === '/search' ? 'bg-spine text-card border-spine' : 'border-line text-inkfaint hover:text-ink'
          }`}
        >
          Search
        </Link>
      </div>
      <nav className="max-w-5xl mx-auto px-2 sm:px-6 mt-4 flex gap-1 overflow-x-auto">
        {items.map((item) => {
          const active = pathname?.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`catalog-tab whitespace-nowrap px-4 py-2.5 rounded-t-sm border-t border-l border-r transition-colors ${
                active
                  ? 'bg-card border-line text-spine relative -mb-px'
                  : 'bg-transparent border-transparent text-inkfaint hover:text-ink'
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-b border-line" />
    </header>
  );
}
