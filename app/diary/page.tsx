'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface DiaryEntry {
  id: string;
  date: string;
  progress_before: number;
  progress_after: number;
  amount_read: number;
  time_spent_minutes: number | null;
  thoughts: string | null;
  reading_instance: {
    id: string;
    progress_unit: 'page' | 'percent';
    work: {
      id: string;
      title: string;
      author: string | null;
      type: string;
      cover_url: string | null;
    } | null;
  } | null;
}

function dayKey(iso: string) {
  return new Date(iso).toISOString().slice(0, 10);
}

function formatDay(key: string) {
  return new Date(key + 'T00:00:00').toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function DiaryPage() {
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'timeline' | 'calendar'>('timeline');
  const [monthCursor, setMonthCursor] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('reading_entries')
      .select('*, reading_instance:reading_instances(id, progress_unit, work:works(id, title, author, type, cover_url))')
      .order('date', { ascending: false });
    if (!error && data) setEntries(data as unknown as DiaryEntry[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const grouped = useMemo(() => {
    const map = new Map<string, DiaryEntry[]>();
    for (const e of entries) {
      const key = dayKey(e.date);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(e);
    }
    return map;
  }, [entries]);

  const dayKeys = useMemo(() => Array.from(grouped.keys()).sort((a, b) => b.localeCompare(a)), [grouped]);
  const visibleDayKeys = selectedDay ? dayKeys.filter((d) => d === selectedDay) : dayKeys;

  // Build a simple month grid for the calendar view.
  const monthGrid = useMemo(() => {
    const year = monthCursor.getFullYear();
    const month = monthCursor.getMonth();
    const firstDay = new Date(year, month, 1);
    const startOffset = firstDay.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: (string | null)[] = [];
    for (let i = 0; i < startOffset; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push(`${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
    }
    return cells;
  }, [monthCursor]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-display italic text-3xl">Diary</h2>
          <p className="text-inkfaint text-sm mt-1">Your reading, day by day.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { setView('timeline'); setSelectedDay(null); }}
            className={`catalog-tab px-3 py-1.5 rounded-sm border ${view === 'timeline' ? 'bg-moss text-card border-moss' : 'border-line text-inkfaint'}`}
          >
            Timeline
          </button>
          <button
            onClick={() => setView('calendar')}
            className={`catalog-tab px-3 py-1.5 rounded-sm border ${view === 'calendar' ? 'bg-moss text-card border-moss' : 'border-line text-inkfaint'}`}
          >
            Calendar
          </button>
        </div>
      </div>

      {view === 'calendar' && (
        <div className="catalog-card p-4">
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => setMonthCursor(new Date(monthCursor.getFullYear(), monthCursor.getMonth() - 1, 1))}
              className="catalog-tab text-inkfaint hover:text-ink"
            >
              ← Prev
            </button>
            <span className="font-display italic text-lg">
              {monthCursor.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
            </span>
            <button
              onClick={() => setMonthCursor(new Date(monthCursor.getFullYear(), monthCursor.getMonth() + 1, 1))}
              className="catalog-tab text-inkfaint hover:text-ink"
            >
              Next →
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
              <div key={i} className="catalog-tab text-inkfaint py-1">{d}</div>
            ))}
            {monthGrid.map((key, i) => (
              <button
                key={i}
                disabled={!key}
                onClick={() => key && setSelectedDay(key === selectedDay ? null : key)}
                className={`aspect-square rounded-sm text-sm relative ${
                  !key ? '' : key === selectedDay ? 'bg-spine text-card' : grouped.has(key) ? 'bg-brass/20 hover:bg-brass/30' : 'hover:bg-line/30'
                }`}
              >
                {key && key.slice(-2).replace(/^0/, '')}
                {key && grouped.has(key) && key !== selectedDay && (
                  <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-brass" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-inkfaint italic">Turning pages…</p>
      ) : visibleDayKeys.length === 0 ? (
        <p className="text-inkfaint italic text-center py-12">
          {selectedDay ? 'Nothing logged that day.' : 'No reading sessions logged yet.'}
        </p>
      ) : (
        <div className="space-y-8">
          {visibleDayKeys.map((key) => (
            <div key={key}>
              <h3 className="catalog-tab text-spine mb-3">{formatDay(key)}</h3>
              <div className="space-y-3">
                {grouped.get(key)!.map((e) => {
                  const w = e.reading_instance?.work;
                  const unit = e.reading_instance?.progress_unit;
                  return (
                    <div key={e.id} className="catalog-card p-4 flex gap-3">
                      {w?.cover_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={w.cover_url} alt="" className="w-12 h-16 object-cover rounded-sm flex-shrink-0" />
                      ) : (
                        <div className="w-12 h-16 bg-line/40 rounded-sm flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-display italic text-base leading-tight">{w?.title}</div>
                        <div className="text-xs font-mono text-inkfaint mt-1">
                          {unit === 'page'
                            ? `pages ${e.progress_before}–${e.progress_after}`
                            : `${e.progress_before}%–${e.progress_after}%`}
                          {' · '}
                          {Math.abs(e.amount_read)} {unit === 'page' ? 'pages' : '%'} read
                          {e.time_spent_minutes ? ` · ${e.time_spent_minutes} min` : ''}
                        </div>
                        {e.thoughts && (
                          <p className="text-sm mt-2 whitespace-pre-wrap">{e.thoughts}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
