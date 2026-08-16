'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import type { ReadingInstance } from '@/lib/types';

export default function YearInReadingPage() {
  const [instances, setInstances] = useState<ReadingInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(() => new Date().getFullYear());

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('reading_instances')
      .select('*, work:works(*)')
      .eq('status', 'finished');
    setInstances((data as unknown as ReadingInstance[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const books = useMemo(() => {
    return instances.filter(
      (i) =>
        i.work?.type === 'book' &&
        i.finish_date &&
        new Date(i.finish_date).getFullYear() === year
    );
  }, [instances, year]);

  const stats = useMemo(() => {
    const withPages = books.filter((b) => b.work?.page_count);
    const totalPages = withPages.reduce((sum, b) => sum + (b.work?.page_count || 0), 0);

    const favorite = books.find((b) => b.favorite) ||
      [...books].sort((a, b) => (b.rating || 0) - (a.rating || 0))[0];

    const longest = withPages.length
      ? [...withPages].sort((a, b) => (b.work!.page_count! - a.work!.page_count!))[0]
      : null;
    const shortest = withPages.length
      ? [...withPages].sort((a, b) => (a.work!.page_count! - b.work!.page_count!))[0]
      : null;

    const genreTally = new Map<string, number>();
    for (const b of books) {
      for (const g of b.work?.genres || []) genreTally.set(g, (genreTally.get(g) || 0) + 1);
    }
    const topGenre = Array.from(genreTally.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

    const ratings = books.map((b) => b.rating).filter((r): r is number => r != null);
    const avgRating = ratings.length ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1) : null;

    return { totalPages, favorite, longest, shortest, topGenre, avgRating };
  }, [books]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/stats" className="catalog-tab text-inkfaint hover:text-ink">← Back to Statistics</Link>
      </div>

      <div className="bg-ink text-card rounded-sm shadow-card overflow-hidden">
        <div className="p-8 sm:p-12 text-center border-b border-card/10">
          <div className="flex items-center justify-center gap-4 mb-2">
            <button onClick={() => setYear((y) => y - 1)} className="catalog-tab text-card/50 hover:text-card text-lg">←</button>
            <p className="catalog-tab text-brasslight">Your Year in Reading</p>
            <button onClick={() => setYear((y) => y + 1)} className="catalog-tab text-card/50 hover:text-card text-lg">→</button>
          </div>
          <h2 className="font-display italic text-5xl sm:text-6xl mt-2">{year}</h2>

          {loading ? (
            <p className="text-card/50 italic mt-8">Turning back the pages…</p>
          ) : books.length === 0 ? (
            <p className="text-card/60 italic mt-8">No books finished in {year} yet.</p>
          ) : (
            <div className="mt-8">
              <div className="font-display italic text-7xl sm:text-8xl text-brasslight">{books.length}</div>
              <p className="catalog-tab text-card/60 mt-2">{books.length === 1 ? 'book finished' : 'books finished'}</p>
            </div>
          )}
        </div>

        {!loading && books.length > 0 && (
          <>
            <div className="p-6 sm:p-8 flex flex-wrap justify-center gap-3 border-b border-card/10">
              {books.map((b) => (
                <Link
                  key={b.id}
                  href={`/work/${b.work_id}`}
                  title={b.work?.title}
                  className="group"
                >
                  {b.work?.cover_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={b.work.cover_url}
                      alt={b.work.title}
                      className="w-16 h-24 sm:w-20 sm:h-28 object-cover rounded-sm shadow-card group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="w-16 h-24 sm:w-20 sm:h-28 bg-card/10 rounded-sm flex items-center justify-center p-1.5">
                      <span className="text-[9px] text-card/60 text-center leading-tight">{b.work?.title}</span>
                    </div>
                  )}
                </Link>
              ))}
            </div>

            <div className="p-6 sm:p-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-6 text-center">
              <div>
                <div className="font-display italic text-2xl text-brasslight">{stats.totalPages || '—'}</div>
                <p className="catalog-tab text-card/50 mt-1">Pages read</p>
              </div>
              <div>
                <div className="font-display italic text-2xl text-brasslight">{stats.avgRating || '—'}</div>
                <p className="catalog-tab text-card/50 mt-1">Average rating</p>
              </div>
              <div>
                <div className="font-display italic text-lg text-brasslight truncate px-2">{stats.topGenre || '—'}</div>
                <p className="catalog-tab text-card/50 mt-1">Most-read genre</p>
              </div>
              <div>
                <div className="font-display italic text-lg text-brasslight truncate px-2">
                  {stats.favorite?.work?.title || '—'}
                </div>
                <p className="catalog-tab text-card/50 mt-1">Favorite</p>
              </div>
            </div>

            {(stats.longest || stats.shortest) && (
              <div className="px-6 sm:px-8 pb-8 grid sm:grid-cols-2 gap-6 text-center">
                {stats.longest && (
                  <div>
                    <div className="font-display italic text-base text-brasslight truncate">{stats.longest.work?.title}</div>
                    <p className="catalog-tab text-card/50 mt-1">Longest · {stats.longest.work?.page_count} pp</p>
                  </div>
                )}
                {stats.shortest && (
                  <div>
                    <div className="font-display italic text-base text-brasslight truncate">{stats.shortest.work?.title}</div>
                    <p className="catalog-tab text-card/50 mt-1">Shortest · {stats.shortest.work?.page_count} pp</p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
