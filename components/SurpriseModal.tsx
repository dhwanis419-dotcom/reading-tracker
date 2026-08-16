'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import type { TbrEntry } from '@/lib/types';

export default function SurpriseModal({
  entries,
  onClose,
  onChanged,
}: {
  /** The full, unfiltered set of active TBR entries — this always draws from all of it. */
  entries: TbrEntry[];
  onClose: () => void;
  onChanged: () => void;
}) {
  const router = useRouter();
  const [pick, setPick] = useState<TbrEntry>(() => entries[Math.floor(Math.random() * entries.length)]);
  const [starting, setStarting] = useState(false);

  function reroll() {
    if (entries.length <= 1) return;
    let next = pick;
    while (next.id === pick.id) {
      next = entries[Math.floor(Math.random() * entries.length)];
    }
    setPick(next);
  }

  async function startReading() {
    if (!pick.work) return;
    setStarting(true);
    try {
      await supabase.from('reading_instances').insert({
        work_id: pick.work_id,
        status: 'currently_reading',
        progress_unit: pick.work.type === 'book' ? 'page' : 'percent',
        current_progress: 0,
      });
      await supabase.from('tbr_entries').update({ active: false }).eq('id', pick.id);
      onChanged();
      router.push('/reading');
    } finally {
      setStarting(false);
    }
  }

  const w = pick.work;

  return (
    <div className="fixed inset-0 bg-ink/40 flex items-center justify-center p-4 z-40">
      <div className="catalog-card p-6 w-full max-w-sm text-center space-y-4">
        <p className="catalog-tab text-brass">Pulled from the shelf</p>

        {w?.cover_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={w.cover_url} alt="" className="w-28 h-40 object-cover rounded-sm mx-auto shadow-card" />
        ) : (
          <div className="w-28 h-40 bg-line/40 rounded-sm mx-auto" />
        )}

        <div>
          <h3 className="font-display italic text-2xl leading-tight">{w?.title}</h3>
          {w?.author && <p className="text-inkfaint mt-1">{w.author}</p>}
          {w?.page_count && <p className="text-xs font-mono text-inkfaint mt-1">{w.page_count} pp</p>}
        </div>

        <div className="flex gap-2 pt-2">
          <button
            onClick={startReading}
            disabled={starting}
            className="catalog-tab bg-spine text-card px-4 py-2 rounded-sm hover:bg-spinedark disabled:opacity-50 flex-1"
          >
            {starting ? 'Starting…' : 'Start Reading'}
          </button>
          <button
            onClick={reroll}
            disabled={entries.length <= 1}
            className="catalog-tab border border-line px-4 py-2 rounded-sm hover:bg-line/30 disabled:opacity-40"
          >
            Reroll
          </button>
        </div>
        <button onClick={onClose} className="catalog-tab text-inkfaint hover:text-ink block mx-auto">
          Not now
        </button>
      </div>
    </div>
  );
}
