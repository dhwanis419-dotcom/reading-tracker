'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import EditWorkModal from '@/components/EditWorkModal';
import EditInstanceModal from '@/components/EditInstanceModal';
import EditEntryModal from '@/components/EditEntryModal';
import ConfirmDialog from '@/components/ConfirmDialog';
import type { Work, ReadingInstance, ReadingEntry } from '@/lib/types';

export default function WorkDetailPage() {
  const params = useParams();
  const router = useRouter();
  const workId = params.workId as string;

  const [work, setWork] = useState<Work | null>(null);
  const [instances, setInstances] = useState<ReadingInstance[]>([]);
  const [entriesByInstance, setEntriesByInstance] = useState<Record<string, ReadingEntry[]>>({});
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const [editingWork, setEditingWork] = useState(false);
  const [editingInstance, setEditingInstance] = useState<ReadingInstance | null>(null);
  const [editingEntry, setEditingEntry] = useState<{ entry: ReadingEntry; unit: 'page' | 'percent' } | null>(null);
  const [deletingInstance, setDeletingInstance] = useState<ReadingInstance | null>(null);
  const [deletingWork, setDeletingWork] = useState(false);
  const [startingReread, setStartingReread] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: workData } = await supabase.from('works').select('*').eq('id', workId).single();
    setWork(workData as unknown as Work);

    const { data: instData } = await supabase
      .from('reading_instances')
      .select('*')
      .eq('work_id', workId)
      .order('start_date', { ascending: false });
    setInstances((instData as unknown as ReadingInstance[]) || []);
    setLoading(false);
  }, [workId]);

  useEffect(() => {
    load();
  }, [load]);

  async function refreshEntries(instanceId: string) {
    const { data } = await supabase
      .from('reading_entries')
      .select('*')
      .eq('reading_instance_id', instanceId)
      .order('date', { ascending: true });
    setEntriesByInstance((prev) => ({ ...prev, [instanceId]: (data as unknown as ReadingEntry[]) || [] }));
  }

  async function toggleExpand(instanceId: string) {
    const next = new Set(expanded);
    if (next.has(instanceId)) {
      next.delete(instanceId);
    } else {
      next.add(instanceId);
      if (!entriesByInstance[instanceId]) await refreshEntries(instanceId);
    }
    setExpanded(next);
  }

  async function readAgain() {
    if (!work) return;
    setStartingReread(true);
    try {
      const { error } = await supabase.from('reading_instances').insert({
        work_id: work.id,
        status: 'currently_reading',
        progress_unit: work.type === 'book' ? 'page' : 'percent',
        current_progress: 0,
      });
      if (error) throw error;
      router.push('/reading');
    } finally {
      setStartingReread(false);
    }
  }

  async function deleteInstance(instance: ReadingInstance) {
    await supabase.from('reading_instances').delete().eq('id', instance.id);
    setDeletingInstance(null);
    load();
  }

  async function deleteWork() {
    await supabase.from('works').delete().eq('id', workId);
    router.push('/library');
  }

  if (loading) return <p className="text-inkfaint italic">Fetching the record…</p>;
  if (!work) return <p className="text-inkfaint italic">Couldn't find that work.</p>;

  const hasActiveInstance = instances.some((i) => i.status === 'currently_reading' || i.status === 'paused');

  return (
    <div className="space-y-6">
      <div className="catalog-card p-6 flex gap-5">
        {work.cover_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={work.cover_url} alt="" className="w-28 h-40 object-cover rounded-sm flex-shrink-0" />
        ) : (
          <div className="w-28 h-40 bg-line/40 rounded-sm flex-shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <h2 className="font-display italic text-3xl leading-tight">{work.title}</h2>
            <button onClick={() => setEditingWork(true)} className="catalog-tab border border-line px-3 py-1.5 rounded-sm hover:bg-line/30 flex-shrink-0">
              Edit details
            </button>
          </div>
          {work.author && <p className="text-inkfaint mt-1">{work.author}</p>}
          <div className="flex flex-wrap gap-2 mt-3">
            <span className="stamp text-moss capitalize">{work.type.replace('_', ' ')}</span>
            {work.fiction_status && <span className="stamp text-spine capitalize">{work.fiction_status.replace('_', ' ')}</span>}
            {work.page_count && <span className="text-xs font-mono text-inkfaint self-center">{work.page_count}pp</span>}
            {work.isbn && <span className="text-xs font-mono text-inkfaint self-center">ISBN {work.isbn}</span>}
            {work.article_site && (
              work.article_url ? (
                <a href={work.article_url} target="_blank" rel="noopener noreferrer" className="text-xs font-mono text-spine underline self-center">
                  {work.article_site} ↗
                </a>
              ) : (
                <span className="text-xs font-mono text-inkfaint self-center">{work.article_site}</span>
              )
            )}
          </div>
          {work.genres.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {work.genres.map((g) => (
                <span key={g} className="text-xs px-2 py-0.5 rounded-sm border border-line text-inkfaint">{g}</span>
              ))}
            </div>
          )}
          {work.collections.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {work.collections.map((c) => (
                <span key={c} className="text-xs px-2 py-0.5 rounded-sm bg-brass/10 border border-brass/40 text-inkfaint">📚 {c}</span>
              ))}
            </div>
          )}
          <button
            onClick={readAgain}
            disabled={startingReread || hasActiveInstance}
            className="catalog-tab mt-4 bg-moss text-card px-4 py-2 rounded-sm hover:bg-mosslight disabled:opacity-40"
            title={hasActiveInstance ? 'Already in progress' : undefined}
          >
            {startingReread ? 'Starting…' : instances.length > 0 ? 'Read Again' : 'Start Reading'}
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="catalog-tab text-spine">Reading history ({instances.length} {instances.length === 1 ? 'time' : 'times'})</h3>

        {instances.length === 0 && <p className="text-inkfaint italic">Not started yet.</p>}

        {instances.map((inst, idx) => {
          const isExpanded = expanded.has(inst.id);
          const label = instances.length > 1 ? `Reading ${instances.length - idx}` : 'Reading';
          return (
            <div key={inst.id} className="catalog-card p-4">
              <div className="flex items-start justify-between flex-wrap gap-3">
                <div>
                  <div className="catalog-tab text-inkfaint">{label}</div>
                  <div className="text-sm mt-1">
                    Started {new Date(inst.start_date).toLocaleDateString()}
                    {inst.finish_date && ` · Finished ${new Date(inst.finish_date).toLocaleDateString()}`}
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2 items-center">
                    <span className="stamp text-moss capitalize">{inst.status.replace('_', ' ')}</span>
                    {inst.favorite && <span className="text-brass text-sm">★ favorite</span>}
                    {inst.rating != null && <span className="text-xs font-mono text-inkfaint">{inst.rating}/10</span>}
                  </div>
                  {inst.final_review && (
                    <p className="text-sm mt-3 whitespace-pre-wrap max-w-2xl">{inst.final_review}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setEditingInstance(inst)} className="catalog-tab border border-line px-3 py-1.5 rounded-sm hover:bg-line/30">
                    Edit
                  </button>
                  <button onClick={() => toggleExpand(inst.id)} className="catalog-tab border border-line px-3 py-1.5 rounded-sm hover:bg-line/30">
                    {isExpanded ? 'Hide sessions' : 'Show sessions'}
                  </button>
                  <button onClick={() => setDeletingInstance(inst)} className="catalog-tab border border-line px-3 py-1.5 rounded-sm text-spine hover:bg-line/30">
                    Delete
                  </button>
                </div>
              </div>

              {isExpanded && (
                <div className="mt-4 pt-4 border-t border-line space-y-2">
                  {(entriesByInstance[inst.id] || []).length === 0 ? (
                    <p className="text-sm text-inkfaint italic">No sessions logged.</p>
                  ) : (
                    entriesByInstance[inst.id].map((e) => (
                      <button
                        key={e.id}
                        onClick={() => setEditingEntry({ entry: e, unit: inst.progress_unit })}
                        className="text-sm flex flex-wrap gap-x-3 gap-y-1 items-baseline w-full text-left hover:bg-line/20 rounded-sm px-1.5 py-1 -mx-1.5"
                      >
                        <span className="font-mono text-xs text-inkfaint">{new Date(e.date).toLocaleDateString()}</span>
                        <span className="font-mono text-xs">
                          {inst.progress_unit === 'page' ? `pp. ${e.progress_before}–${e.progress_after}` : `${e.progress_before}%–${e.progress_after}%`}
                        </span>
                        {e.time_spent_minutes && <span className="font-mono text-xs text-inkfaint">{e.time_spent_minutes} min</span>}
                        {e.thoughts && <span className="text-inkfaint truncate">— {e.thoughts}</span>}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="pt-6 border-t border-line">
        <button onClick={() => setDeletingWork(true)} className="catalog-tab text-inkfaint hover:text-spine">
          Delete this work permanently
        </button>
      </div>

      {editingWork && <EditWorkModal work={work} onClose={() => setEditingWork(false)} onSaved={load} />}

      {editingInstance && (
        <EditInstanceModal instance={editingInstance} onClose={() => setEditingInstance(null)} onSaved={load} />
      )}

      {editingEntry && (
        <EditEntryModal
          entry={editingEntry.entry}
          unit={editingEntry.unit}
          onClose={() => setEditingEntry(null)}
          onSaved={() => refreshEntries(editingEntry.entry.reading_instance_id)}
          onDeleted={() => refreshEntries(editingEntry.entry.reading_instance_id)}
        />
      )}

      {deletingInstance && (
        <ConfirmDialog
          title="Delete this reading?"
          message="This permanently removes this reading instance — its dates, progress, rating, review, and every session logged under it. The Work itself and any other readings of it are unaffected."
          confirmLabel="Delete this reading"
          onConfirm={() => deleteInstance(deletingInstance)}
          onCancel={() => setDeletingInstance(null)}
        />
      )}

      {deletingWork && (
        <ConfirmDialog
          title="Delete this work permanently?"
          message="This removes the Work and everything attached to it — every reading instance, every session, every rating and review, gone for good. This cannot be undone."
          confirmLabel="Delete permanently"
          requireTypedText={work.title}
          onConfirm={deleteWork}
          onCancel={() => setDeletingWork(false)}
        />
      )}
    </div>
  );
}
