'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import LogReadingModal from '@/components/LogReadingModal';
import FinishModal from '@/components/FinishModal';
import AddItemForm from '@/components/AddItemForm';
import type { ReadingInstance } from '@/lib/types';

export default function ReadingPage() {
  const router = useRouter();
  const [instances, setInstances] = useState<ReadingInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [logging, setLogging] = useState<ReadingInstance | null>(null);
  const [finishing, setFinishing] = useState<ReadingInstance | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('reading_instances')
      .select('*, work:works(*)')
      .in('status', ['currently_reading', 'paused'])
      .order('last_read_date', { ascending: false, nullsFirst: false });
    if (!error && data) setInstances(data as unknown as ReadingInstance[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function setStatus(instance: ReadingInstance, status: 'paused' | 'currently_reading' | 'dnf') {
    await supabase.from('reading_instances').update({ status }).eq('id', instance.id);
    load();
  }

  // After logging a session, check whether it pushed the instance to 100% /
  // finished. If so, offer the review flow instead of silently marking done.
  async function handleLogged(instanceId: string) {
    const { data } = await supabase
      .from('reading_instances')
      .select('*, work:works(*)')
      .eq('id', instanceId)
      .single();
    if (data && (data as any).status === 'finished') {
      setFinishing(data as unknown as ReadingInstance);
    }
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-display italic text-3xl">Currently Reading</h2>
          <p className="text-inkfaint text-sm mt-1">Everything active, at a glance.</p>
        </div>
        <AddItemForm destination="reading" onAdded={load} />
      </div>

      {loading ? (
        <p className="text-inkfaint italic">Checking your bookmarks…</p>
      ) : instances.length === 0 ? (
        <p className="text-inkfaint italic text-center py-12">
          Nothing in progress. Start something from your TBR shelf.
        </p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {instances.map((inst) => {
            const w = inst.work;
            const pct = w?.type === 'book' && w.page_count
              ? Math.min(100, Math.round((inst.current_progress / w.page_count) * 100))
              : inst.progress_unit === 'percent'
              ? Math.min(100, Math.round(inst.current_progress))
              : null;

            return (
              <div
                key={inst.id}
                onClick={() => router.push(`/work/${inst.work_id}`)}
                className="catalog-card p-4 flex gap-3 cursor-pointer hover:shadow-lg transition-shadow"
              >
                {w?.cover_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={w.cover_url} alt="" className="w-16 h-24 object-cover rounded-sm flex-shrink-0" />
                ) : (
                  <div className="w-16 h-24 bg-line/40 rounded-sm flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-display italic text-lg leading-tight truncate">{w?.title}</div>
                  {w?.author && <div className="text-sm text-inkfaint truncate">{w.author}</div>}
                  {w?.genres && w.genres.length > 0 && (
                    <div className="text-xs text-inkfaint truncate mt-0.5">{w.genres.slice(0, 2).join(', ')}</div>
                  )}

                  <div className="mt-2 h-1.5 bg-line rounded-full overflow-hidden">
                    <div className="h-full bg-brass" style={{ width: `${pct ?? 0}%` }} />
                  </div>
                  <div className="text-xs font-mono text-inkfaint mt-1">
                    {inst.progress_unit === 'page'
                      ? `page ${inst.current_progress}${w?.page_count ? ` / ${w.page_count}` : ''}`
                      : `${inst.current_progress}%`}
                    {inst.status === 'paused' && ' · paused'}
                  </div>
                  <div className="text-[11px] font-mono text-inkfaint mt-0.5">
                    Started {new Date(inst.start_date).toLocaleDateString()}
                    {inst.last_read_date && ` · Last read ${new Date(inst.last_read_date).toLocaleDateString()}`}
                  </div>

                  <div className="flex flex-wrap gap-2 mt-3">
                    <button
                      onClick={(e) => { e.stopPropagation(); setLogging(inst); }}
                      className="catalog-tab bg-spine text-card px-3 py-1.5 rounded-sm hover:bg-spinedark"
                    >
                      Log Reading
                    </button>
                    {inst.status === 'currently_reading' ? (
                      <button onClick={(e) => { e.stopPropagation(); setStatus(inst, 'paused'); }} className="catalog-tab border border-line px-3 py-1.5 rounded-sm hover:bg-line/30">
                        Pause
                      </button>
                    ) : (
                      <button onClick={(e) => { e.stopPropagation(); setStatus(inst, 'currently_reading'); }} className="catalog-tab border border-line px-3 py-1.5 rounded-sm hover:bg-line/30">
                        Resume
                      </button>
                    )}
                    <button onClick={(e) => { e.stopPropagation(); setFinishing(inst); }} className="catalog-tab border border-line px-3 py-1.5 rounded-sm hover:bg-line/30">
                      Finish
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); setStatus(inst, 'dnf'); }} className="catalog-tab border border-line px-3 py-1.5 rounded-sm text-inkfaint hover:bg-line/30">
                      DNF
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {logging && (
        <LogReadingModal
          instance={logging}
          onClose={() => setLogging(null)}
          onLogged={() => handleLogged(logging.id)}
        />
      )}

      {finishing && (
        <FinishModal instance={finishing} onClose={() => setFinishing(null)} onSaved={load} />
      )}
    </div>
  );
}
