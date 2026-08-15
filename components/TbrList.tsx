'use client';

import { useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import ConfirmDialog from '@/components/ConfirmDialog';
import type { TbrEntry, WorkType } from '@/lib/types';

type SortKey = 'date_added_desc' | 'date_added_asc' | 'author_az' | 'author_za' | 'title_az' | 'title_za' | 'pages_asc' | 'pages_desc' | 'priority' | 'genre' | 'type';

const PRIORITY_RANK: Record<string, number> = { high: 0, medium: 1, low: 2 };

export default function TbrList({ entries, onChanged }: { entries: TbrEntry[]; onChanged: () => void }) {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<WorkType | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [genreFilter, setGenreFilter] = useState<string>('all');
  const [collectionFilter, setCollectionFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [minPages, setMinPages] = useState('');
  const [maxPages, setMaxPages] = useState('');
  const [sort, setSort] = useState<SortKey>('date_added_desc');
  const [startingId, setStartingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<TbrEntry | null>(null);

  const activeEntries = useMemo(() => entries.filter((e) => e.active), [entries]);

  const allGenres = useMemo(() => {
    const s = new Set<string>();
    activeEntries.forEach((e) => e.work?.genres.forEach((g) => s.add(g)));
    return Array.from(s).sort();
  }, [activeEntries]);

  const allCollections = useMemo(() => {
    const s = new Set<string>();
    activeEntries.forEach((e) => e.work?.collections.forEach((c) => s.add(c)));
    return Array.from(s).sort();
  }, [activeEntries]);

  const filtered = useMemo(() => {
    let list = activeEntries;

    if (typeFilter !== 'all') list = list.filter((e) => e.work?.type === typeFilter);
    if (priorityFilter !== 'all') list = list.filter((e) => e.priority === priorityFilter);
    if (genreFilter !== 'all') list = list.filter((e) => e.work?.genres.includes(genreFilter));
    if (collectionFilter !== 'all') list = list.filter((e) => e.work?.collections.includes(collectionFilter));

    if (dateFrom) list = list.filter((e) => new Date(e.date_added) >= new Date(dateFrom));
    if (dateTo) list = list.filter((e) => new Date(e.date_added) <= new Date(dateTo + 'T23:59:59'));

    if (minPages.trim()) list = list.filter((e) => (e.work?.page_count ?? -1) >= parseInt(minPages));
    if (maxPages.trim()) list = list.filter((e) => (e.work?.page_count ?? Infinity) <= parseInt(maxPages));

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((e) => {
        const w = e.work;
        if (!w) return false;
        return (
          w.title?.toLowerCase().includes(q) ||
          w.author?.toLowerCase().includes(q) ||
          w.article_site?.toLowerCase().includes(q) ||
          w.tags?.some((t) => t.toLowerCase().includes(q)) ||
          w.collections?.some((c) => c.toLowerCase().includes(q))
        );
      });
    }

    list = [...list].sort((a, b) => {
      const wa = a.work, wb = b.work;
      switch (sort) {
        case 'date_added_asc':
          return new Date(a.date_added).getTime() - new Date(b.date_added).getTime();
        case 'date_added_desc':
          return new Date(b.date_added).getTime() - new Date(a.date_added).getTime();
        case 'author_az':
          return (wa?.author || '').localeCompare(wb?.author || '');
        case 'author_za':
          return (wb?.author || '').localeCompare(wa?.author || '');
        case 'title_az':
          return (wa?.title || '').localeCompare(wb?.title || '');
        case 'title_za':
          return (wb?.title || '').localeCompare(wa?.title || '');
        case 'pages_asc':
          return (wa?.page_count || 0) - (wb?.page_count || 0);
        case 'pages_desc':
          return (wb?.page_count || 0) - (wa?.page_count || 0);
        case 'priority':
          return (PRIORITY_RANK[a.priority || ''] ?? 9) - (PRIORITY_RANK[b.priority || ''] ?? 9);
        case 'genre':
          return (wa?.genres[0] || '').localeCompare(wb?.genres[0] || '');
        case 'type':
          return (wa?.type || '').localeCompare(wb?.type || '');
        default:
          return 0;
      }
    });

    return list;
  }, [activeEntries, search, typeFilter, priorityFilter, genreFilter, collectionFilter, dateFrom, dateTo, minPages, maxPages, sort]);

  const filtersActive = typeFilter !== 'all' || priorityFilter !== 'all' || genreFilter !== 'all' ||
    collectionFilter !== 'all' || dateFrom || dateTo || minPages || maxPages || search;

  function clearFilters() {
    setSearch('');
    setTypeFilter('all');
    setPriorityFilter('all');
    setGenreFilter('all');
    setCollectionFilter('all');
    setDateFrom('');
    setDateTo('');
    setMinPages('');
    setMaxPages('');
  }

  async function startReading(entry: TbrEntry) {
    if (!entry.work) return;
    setStartingId(entry.id);
    try {
      const { error: instError } = await supabase.from('reading_instances').insert({
        work_id: entry.work_id,
        status: 'currently_reading',
        progress_unit: entry.work.type === 'book' ? 'page' : 'percent',
        current_progress: 0,
      });
      if (instError) throw instError;

      const { error: tbrError } = await supabase
        .from('tbr_entries')
        .update({ active: false })
        .eq('id', entry.id);
      if (tbrError) throw tbrError;

      onChanged();
    } finally {
      setStartingId(null);
    }
  }

  async function removeFromTbr(entry: TbrEntry) {
    // Only removes the TBR entry itself — the underlying Work is untouched,
    // so it stays intact if it exists in reading history or elsewhere.
    await supabase.from('tbr_entries').delete().eq('id', entry.id);
    setDeleting(null);
    onChanged();
  }

  return (
    <div className="space-y-5">
      <div className="catalog-card p-4 space-y-3">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[180px]">
            <label className="catalog-tab text-inkfaint block mb-1">Search</label>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Title, author, tag, collection…"
              className="w-full border border-line bg-card rounded-sm px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="catalog-tab text-inkfaint block mb-1">Type</label>
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as any)} className="border border-line bg-card rounded-sm px-2 py-2 text-sm">
              <option value="all">All</option>
              <option value="book">Book</option>
              <option value="short_story">Short Story</option>
              <option value="article">Article</option>
            </select>
          </div>
          <div>
            <label className="catalog-tab text-inkfaint block mb-1">Priority</label>
            <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} className="border border-line bg-card rounded-sm px-2 py-2 text-sm">
              <option value="all">All</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
          <div>
            <label className="catalog-tab text-inkfaint block mb-1">Genre</label>
            <select value={genreFilter} onChange={(e) => setGenreFilter(e.target.value)} className="border border-line bg-card rounded-sm px-2 py-2 text-sm">
              <option value="all">All</option>
              {allGenres.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div>
            <label className="catalog-tab text-inkfaint block mb-1">Collection</label>
            <select value={collectionFilter} onChange={(e) => setCollectionFilter(e.target.value)} className="border border-line bg-card rounded-sm px-2 py-2 text-sm">
              <option value="all">All</option>
              {allCollections.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="catalog-tab text-inkfaint block mb-1">Sort by</label>
            <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} className="border border-line bg-card rounded-sm px-2 py-2 text-sm">
              <option value="date_added_desc">Date added (newest)</option>
              <option value="date_added_asc">Date added (oldest)</option>
              <option value="author_az">Author A–Z</option>
              <option value="author_za">Author Z–A</option>
              <option value="title_az">Title A–Z</option>
              <option value="title_za">Title Z–A</option>
              <option value="pages_asc">Pages (fewest)</option>
              <option value="pages_desc">Pages (most)</option>
              <option value="priority">Priority</option>
              <option value="genre">Genre</option>
              <option value="type">Type</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 items-end pt-2 border-t border-line">
          <div>
            <label className="catalog-tab text-inkfaint block mb-1">Added from</label>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="border border-line bg-card rounded-sm px-2 py-2 text-sm" />
          </div>
          <div>
            <label className="catalog-tab text-inkfaint block mb-1">Added to</label>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="border border-line bg-card rounded-sm px-2 py-2 text-sm" />
          </div>
          <div>
            <label className="catalog-tab text-inkfaint block mb-1">Min pages</label>
            <input type="number" value={minPages} onChange={(e) => setMinPages(e.target.value)} className="w-24 border border-line bg-card rounded-sm px-2 py-2 text-sm" />
          </div>
          <div>
            <label className="catalog-tab text-inkfaint block mb-1">Max pages</label>
            <input type="number" value={maxPages} onChange={(e) => setMaxPages(e.target.value)} className="w-24 border border-line bg-card rounded-sm px-2 py-2 text-sm" />
          </div>
          {filtersActive ? (
            <button onClick={clearFilters} className="catalog-tab text-inkfaint hover:text-spine pb-2">
              Clear all filters
            </button>
          ) : null}
        </div>
      </div>

      <p className="catalog-tab text-inkfaint">{filtered.length} of {activeEntries.length} entries</p>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((entry) => {
          const w = entry.work;
          if (!w) return null;
          return (
            <div key={entry.id} className="catalog-card p-4 flex gap-3">
              {w.cover_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={w.cover_url} alt="" className="w-16 h-24 object-cover rounded-sm flex-shrink-0" />
              ) : (
                <div className="w-16 h-24 bg-line/40 rounded-sm flex-shrink-0 flex items-center justify-center">
                  <span className="catalog-tab text-inkfaint text-[9px] text-center px-1">
                    {w.type === 'article' ? 'Article' : w.type === 'short_story' ? 'Story' : 'No cover'}
                  </span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="font-display italic text-lg leading-tight truncate">{w.title}</div>
                  <button
                    onClick={() => setDeleting(entry)}
                    className="text-inkfaint hover:text-spine text-xs flex-shrink-0"
                    title="Remove from TBR"
                  >
                    ✕
                  </button>
                </div>
                {w.author && <div className="text-sm text-inkfaint truncate">{w.author}</div>}
                {w.article_site && <div className="text-xs text-inkfaint font-mono mt-0.5">{w.article_site}</div>}
                <div className="flex flex-wrap gap-1 mt-2">
                  {entry.priority && <span className="stamp text-spine">{entry.priority}</span>}
                  {w.page_count && <span className="text-xs font-mono text-inkfaint">{w.page_count}pp</span>}
                </div>
                <button
                  onClick={() => startReading(entry)}
                  disabled={startingId === entry.id}
                  className="catalog-tab mt-3 bg-moss text-card px-3 py-1.5 rounded-sm hover:bg-mosslight disabled:opacity-50"
                >
                  {startingId === entry.id ? 'Starting…' : 'Start Reading'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <p className="text-inkfaint italic text-center py-12">Nothing here yet — add something above.</p>
      )}

      {deleting && (
        <ConfirmDialog
          title="Remove from TBR?"
          message={`This removes "${deleting.work?.title}" from your to-be-read shelf. If you've read it before or read it elsewhere, that history isn't affected.`}
          confirmLabel="Remove"
          onConfirm={() => removeFromTbr(deleting)}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  );
}
