'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import ReadingGoalCard from '@/components/ReadingGoalCard';
import type { ReadingInstance, ReadingEntry } from '@/lib/types';

interface EntryWithUnit extends ReadingEntry {
  reading_instance?: { progress_unit: 'page' | 'percent' };
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="catalog-card p-4">
      <div className="catalog-tab text-inkfaint">{label}</div>
      <div className="font-display italic text-3xl text-spine mt-1">{value}</div>
    </div>
  );
}

export default function StatsPage() {
  const [instances, setInstances] = useState<ReadingInstance[]>([]);
  const [entries, setEntries] = useState<EntryWithUnit[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: instData }, { data: entryData }] = await Promise.all([
      supabase.from('reading_instances').select('*, work:works(*)'),
      supabase.from('reading_entries').select('*, reading_instance:reading_instances(progress_unit)'),
    ]);
    setInstances((instData as unknown as ReadingInstance[]) || []);
    setEntries((entryData as unknown as EntryWithUnit[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const stats = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();

    const finished = instances.filter((i) => i.status === 'finished');
    const finishedBooks = finished.filter((i) => i.work?.type === 'book');

    const finishedThisYear = finishedBooks.filter(
      (i) => i.finish_date && new Date(i.finish_date).getFullYear() === year
    );
    const finishedThisMonth = finishedThisYear.filter(
      (i) => i.finish_date && new Date(i.finish_date).getMonth() === month
    );

    const pagesRead = entries
      .filter((e) => e.reading_instance?.progress_unit === 'page')
      .reduce((sum, e) => sum + Math.max(0, e.amount_read), 0);

    const readingDays = new Set(entries.map((e) => new Date(e.date).toISOString().slice(0, 10))).size;

    const fictionCount = finishedBooks.filter((i) => i.work?.fiction_status === 'fiction').length;
    const nonFictionCount = finishedBooks.filter((i) => i.work?.fiction_status === 'non_fiction').length;

    const genreTally = new Map<string, number>();
    for (const i of finished) {
      for (const g of i.work?.genres || []) {
        genreTally.set(g, (genreTally.get(g) || 0) + 1);
      }
    }
    const topGenres = Array.from(genreTally.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5);

    const ratings = finished.map((i) => i.rating).filter((r): r is number => r != null);
    const avgRating = ratings.length ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1) : '—';

    const favorites = instances.filter((i) => i.favorite);

    const currentlyReadingCount = instances.filter((i) => i.status === 'currently_reading').length;
    const dnfCount = instances.filter((i) => i.status === 'dnf').length;

    return {
      finishedThisYear: finishedThisYear.length,
      finishedThisMonth: finishedThisMonth.length,
      pagesRead,
      readingDays,
      sessionCount: entries.length,
      fictionCount,
      nonFictionCount,
      topGenres,
      avgRating,
      favorites,
      currentlyReadingCount,
      dnfCount,
    };
  }, [instances, entries]);

  if (loading) return <p className="text-inkfaint italic">Adding it all up…</p>;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display italic text-3xl">Statistics</h2>
        <p className="text-inkfaint text-sm mt-1">Calculated entirely from your reading history.</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <ReadingGoalCard booksFinishedThisYear={stats.finishedThisYear} />
        <Link
          href="/year-in-reading"
          className="catalog-card p-4 flex items-center justify-between hover:shadow-lg transition-shadow"
        >
          <div>
            <h3 className="catalog-tab text-spine mb-1">Your Year in Reading</h3>
            <p className="text-sm text-inkfaint">A look back at everything you've read this year.</p>
          </div>
          <span className="font-display italic text-2xl text-brass">→</span>
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        <StatCard label="Books finished this year" value={stats.finishedThisYear} />
        <StatCard label="Books finished this month" value={stats.finishedThisMonth} />
        <StatCard label="Pages read (all time)" value={stats.pagesRead} />
        <StatCard label="Reading days" value={stats.readingDays} />
        <StatCard label="Reading sessions" value={stats.sessionCount} />
        <StatCard label="Average rating" value={stats.avgRating} />
        <StatCard label="Currently reading" value={stats.currentlyReadingCount} />
        <StatCard label="Did not finish" value={stats.dnfCount} />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="catalog-card p-4">
          <h3 className="catalog-tab text-spine mb-3">Fiction vs. Non-fiction</h3>
          <div className="flex items-center gap-4">
            <div>
              <div className="font-display italic text-2xl">{stats.fictionCount}</div>
              <div className="text-xs text-inkfaint">Fiction</div>
            </div>
            <div>
              <div className="font-display italic text-2xl">{stats.nonFictionCount}</div>
              <div className="text-xs text-inkfaint">Non-fiction</div>
            </div>
          </div>
        </div>

        <div className="catalog-card p-4">
          <h3 className="catalog-tab text-spine mb-3">Most-read genres</h3>
          {stats.topGenres.length === 0 ? (
            <p className="text-sm text-inkfaint italic">Not enough finished works yet.</p>
          ) : (
            <ul className="space-y-1">
              {stats.topGenres.map(([g, count]) => (
                <li key={g} className="flex justify-between text-sm">
                  <span>{g}</span>
                  <span className="font-mono text-inkfaint">{count}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="catalog-card p-4">
        <h3 className="catalog-tab text-spine mb-3">Favorites ({stats.favorites.length})</h3>
        {stats.favorites.length === 0 ? (
          <p className="text-sm text-inkfaint italic">None marked yet.</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {stats.favorites.map((i) => (
              <Link key={i.id} href={`/work/${i.work_id}`} className="text-sm hover:text-spine truncate block">
                ★ {i.work?.title}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
