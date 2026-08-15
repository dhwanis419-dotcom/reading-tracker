'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import type { Work, ReadingInstance } from '@/lib/types';

interface EntryHit {
  id: string;
  date: string;
  thoughts: string | null;
  work_id: string;
  work_title: string;
}

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [works, setWorks] = useState<Work[]>([]);
  const [instances, setInstances] = useState<ReadingInstance[]>([]);
  const [entries, setEntries] = useState<EntryHit[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: worksData }, { data: instData }, { data: entryData }] = await Promise.all([
      supabase.from('works').select('*'),
      supabase.from('reading_instances').select('*, work:works(*)'),
      supabase.from('reading_entries').select('id, date, thoughts, reading_instance:reading_instances(work_id, work:works(title))'),
    ]);
    setWorks((worksData as unknown as Work[]) || []);
    setInstances((instData as unknown as ReadingInstance[]) || []);
    setEntries(
      ((entryData as any[]) || []).map((e) => ({
        id: e.id,
        date: e.date,
        thoughts: e.thoughts,
        work_id: e.reading_instance?.work_id,
        work_title: e.reading_instance?.work?.title || 'Untitled',
      }))
    );
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const q = query.trim().toLowerCase();

  const workHits = useMemo(() => {
    if (!q) return [];
    return works.filter((w) =>
      w.title?.toLowerCase().includes(q) ||
      w.author?.toLowerCase().includes(q) ||
      w.article_site?.toLowerCase().includes(q) ||
      w.genres?.some((g) => g.toLowerCase().includes(q)) ||
      w.tags?.some((t) => t.toLowerCase().includes(q)) ||
      w.collections?.some((c) => c.toLowerCase().includes(q))
    );
  }, [works, q]);

  const reviewHits = useMemo(() => {
    if (!q) return [];
    return instances.filter((i) => i.final_review?.toLowerCase().includes(q));
  }, [instances, q]);

  const noteHits = useMemo(() => {
    if (!q) return [];
    return entries.filter((e) => e.thoughts?.toLowerCase().includes(q));
  }, [entries, q]);

  const totalHits = workHits.length + reviewHits.length + noteHits.length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display italic text-3xl">Search</h2>
        <p className="text-inkfaint text-sm mt-1">
          Titles, authors, genres, tags, collections, sites, reviews, and your own notes — all at once.
        </p>
      </div>

      <input
        autoFocus
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search everything…"
        className="w-full border border-line bg-card rounded-sm px-4 py-3 text-lg font-body"
      />

      {loading ? (
        <p className="text-inkfaint italic">Indexing the shelves…</p>
      ) : !q ? (
        <p className="text-inkfaint italic text-center py-12">Start typing to search your whole archive.</p>
      ) : totalHits === 0 ? (
        <p className="text-inkfaint italic text-center py-12">No matches for "{query}".</p>
      ) : (
        <div className="space-y-8">
          {workHits.length > 0 && (
            <div>
              <h3 className="catalog-tab text-spine mb-3">Works ({workHits.length})</h3>
              <div className="grid sm:grid-cols-2 gap-3">
                {workHits.map((w) => (
                  <Link key={w.id} href={`/work/${w.id}`} className="catalog-card p-3 flex gap-3 hover:shadow-lg transition-shadow">
                    {w.cover_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={w.cover_url} alt="" className="w-10 h-14 object-cover rounded-sm flex-shrink-0" />
                    ) : (
                      <div className="w-10 h-14 bg-line/40 rounded-sm flex-shrink-0" />
                    )}
                    <div className="min-w-0">
                      <div className="font-display italic truncate">{w.title}</div>
                      {w.author && <div className="text-xs text-inkfaint truncate">{w.author}</div>}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {reviewHits.length > 0 && (
            <div>
              <h3 className="catalog-tab text-spine mb-3">Reviews ({reviewHits.length})</h3>
              <div className="space-y-3">
                {reviewHits.map((i) => (
                  <Link key={i.id} href={`/work/${i.work_id}`} className="catalog-card p-4 block hover:shadow-lg transition-shadow">
                    <div className="font-display italic">{i.work?.title}</div>
                    <p className="text-sm text-inkfaint mt-1 line-clamp-2">{i.final_review}</p>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {noteHits.length > 0 && (
            <div>
              <h3 className="catalog-tab text-spine mb-3">Session notes ({noteHits.length})</h3>
              <div className="space-y-3">
                {noteHits.map((e) => (
                  <Link key={e.id} href={`/work/${e.work_id}`} className="catalog-card p-4 block hover:shadow-lg transition-shadow">
                    <div className="flex items-baseline gap-2">
                      <span className="font-display italic">{e.work_title}</span>
                      <span className="text-xs font-mono text-inkfaint">{new Date(e.date).toLocaleDateString()}</span>
                    </div>
                    <p className="text-sm text-inkfaint mt-1 line-clamp-2">{e.thoughts}</p>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
