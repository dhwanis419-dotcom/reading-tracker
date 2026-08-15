'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import type { ReadingInstance, WorkType } from '@/lib/types';

type StatusTab = 'all' | 'finished' | 'dnf' | 'paused' | 'currently_reading';

export default function LibraryPage() {
  const [instances, setInstances] = useState<ReadingInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<StatusTab>('all');
  const [typeFilter, setTypeFilter] = useState<WorkType | 'all'>('all');
  const [fictionFilter, setFictionFilter] = useState<string>('all');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [minRating, setMinRating] = useState('');
  const [authorFilter, setAuthorFilter] = useState('');
  const [genreFilter, setGenreFilter] = useState('all');
  const [tagFilter, setTagFilter] = useState('all');
  const [collectionFilter, setCollectionFilter] = useState('all');
  const [finishedFrom, setFinishedFrom] = useState('');
  const [finishedTo, setFinishedTo] = useState('');
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('reading_instances')
      .select('*, work:works(*)')
      .order('finish_date', { ascending: false, nullsFirst: false });
    if (!error && data) setInstances(data as unknown as ReadingInstance[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const allGenres = useMemo(() => {
    const s = new Set<string>();
    instances.forEach((i) => i.work?.genres.forEach((g) => s.add(g)));
    return Array.from(s).sort();
  }, [instances]);

  const allTags = useMemo(() => {
    const s = new Set<string>();
    instances.forEach((i) => i.work?.tags.forEach((t) => s.add(t)));
    return Array.from(s).sort();
  }, [instances]);

  const allCollections = useMemo(() => {
    const s = new Set<string>();
    instances.forEach((i) => i.work?.collections.forEach((c) => s.add(c)));
    return Array.from(s).sort();
  }, [instances]);

  const filtered = useMemo(() => {
    let list = instances;
    if (tab !== 'all') list = list.filter((i) => i.status === tab);
    if (typeFilter !== 'all') list = list.filter((i) => i.work?.type === typeFilter);
    if (fictionFilter !== 'all') list = list.filter((i) => i.work?.fiction_status === fictionFilter);
    if (favoritesOnly) list = list.filter((i) => i.favorite);
    if (minRating.trim()) {
      const min = parseFloat(minRating);
      list = list.filter((i) => (i.rating ?? -1) >= min);
    }
    if (authorFilter.trim()) {
      const q = authorFilter.toLowerCase();
      list = list.filter((i) => i.work?.author?.toLowerCase().includes(q));
    }
    if (genreFilter !== 'all') list = list.filter((i) => i.work?.genres.includes(genreFilter));
    if (tagFilter !== 'all') list = list.filter((i) => i.work?.tags.includes(tagFilter));
    if (collectionFilter !== 'all') list = list.filter((i) => i.work?.collections.includes(collectionFilter));
    if (finishedFrom) list = list.filter((i) => i.finish_date && new Date(i.finish_date) >= new Date(finishedFrom));
    if (finishedTo) list = list.filter((i) => i.finish_date && new Date(i.finish_date) <= new Date(finishedTo + 'T23:59:59'));

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((i) => {
        const w = i.work;
        return (
          w?.title.toLowerCase().includes(q) ||
          w?.author?.toLowerCase().includes(q) ||
          w?.genres?.some((g) => g.toLowerCase().includes(q)) ||
          w?.tags?.some((t) => t.toLowerCase().includes(q))
        );
      });
    }

    // De-duplicate by work when viewing "All Works" so rereads don't show
    // twice — the work's detail page holds every instance regardless.
    if (tab === 'all') {
      const seen = new Set<string>();
      list = list.filter((i) => {
        if (seen.has(i.work_id)) return false;
        seen.add(i.work_id);
        return true;
      });
    }

    return list;
  }, [instances, tab, typeFilter, fictionFilter, favoritesOnly, minRating, authorFilter, genreFilter, tagFilter, collectionFilter, finishedFrom, finishedTo, search]);

  const filtersActive = typeFilter !== 'all' || fictionFilter !== 'all' || favoritesOnly || minRating ||
    authorFilter || genreFilter !== 'all' || tagFilter !== 'all' || collectionFilter !== 'all' ||
    finishedFrom || finishedTo || search;

  function clearFilters() {
    setTypeFilter('all');
    setFictionFilter('all');
    setFavoritesOnly(false);
    setMinRating('');
    setAuthorFilter('');
    setGenreFilter('all');
    setTagFilter('all');
    setCollectionFilter('all');
    setFinishedFrom('');
    setFinishedTo('');
    setSearch('');
  }

  const tabs: { key: StatusTab; label: string }[] = [
    { key: 'all', label: 'All Works' },
    { key: 'finished', label: 'Finished' },
    { key: 'currently_reading', label: 'Currently Reading' },
    { key: 'paused', label: 'Paused' },
    { key: 'dnf', label: 'DNF' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display italic text-3xl">Library</h2>
        <p className="text-inkfaint text-sm mt-1">Your long-term reading archive.</p>
      </div>

      <div className="flex gap-1 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`catalog-tab whitespace-nowrap px-4 py-2 rounded-sm border ${
              tab === t.key ? 'bg-spine text-card border-spine' : 'border-line text-inkfaint hover:text-ink'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="catalog-card p-4 space-y-3">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[180px]">
            <label className="catalog-tab text-inkfaint block mb-1">Search</label>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Title, author, genre, tag…"
              className="w-full border border-line bg-card rounded-sm px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="catalog-tab text-inkfaint block mb-1">Author</label>
            <input
              value={authorFilter}
              onChange={(e) => setAuthorFilter(e.target.value)}
              placeholder="Author name"
              className="w-40 border border-line bg-card rounded-sm px-3 py-2 text-sm"
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
            <label className="catalog-tab text-inkfaint block mb-1">Fiction</label>
            <select value={fictionFilter} onChange={(e) => setFictionFilter(e.target.value)} className="border border-line bg-card rounded-sm px-2 py-2 text-sm">
              <option value="all">All</option>
              <option value="fiction">Fiction</option>
              <option value="non_fiction">Non-fiction</option>
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
            <label className="catalog-tab text-inkfaint block mb-1">Tag</label>
            <select value={tagFilter} onChange={(e) => setTagFilter(e.target.value)} className="border border-line bg-card rounded-sm px-2 py-2 text-sm">
              <option value="all">All</option>
              {allTags.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="catalog-tab text-inkfaint block mb-1">Collection</label>
            <select value={collectionFilter} onChange={(e) => setCollectionFilter(e.target.value)} className="border border-line bg-card rounded-sm px-2 py-2 text-sm">
              <option value="all">All</option>
              {allCollections.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 items-end pt-2 border-t border-line">
          <div>
            <label className="catalog-tab text-inkfaint block mb-1">Min rating</label>
            <input
              type="number" min="0" max="10" step="0.5"
              value={minRating}
              onChange={(e) => setMinRating(e.target.value)}
              className="w-20 border border-line bg-card rounded-sm px-2 py-2 text-sm"
            />
          </div>
          <div>
            <label className="catalog-tab text-inkfaint block mb-1">Finished from</label>
            <input type="date" value={finishedFrom} onChange={(e) => setFinishedFrom(e.target.value)} className="border border-line bg-card rounded-sm px-2 py-2 text-sm" />
          </div>
          <div>
            <label className="catalog-tab text-inkfaint block mb-1">Finished to</label>
            <input type="date" value={finishedTo} onChange={(e) => setFinishedTo(e.target.value)} className="border border-line bg-card rounded-sm px-2 py-2 text-sm" />
          </div>
          <label className="catalog-tab flex items-center gap-2 pb-2 cursor-pointer">
            <input type="checkbox" checked={favoritesOnly} onChange={(e) => setFavoritesOnly(e.target.checked)} />
            Favorites only
          </label>
          {filtersActive && (
            <button onClick={clearFilters} className="catalog-tab text-inkfaint hover:text-spine pb-2">
              Clear all filters
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <p className="text-inkfaint italic">Pulling from the shelves…</p>
      ) : filtered.length === 0 ? (
        <p className="text-inkfaint italic text-center py-12">Nothing matches yet.</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((inst) => {
            const w = inst.work;
            if (!w) return null;
            return (
              <Link
                key={inst.id}
                href={`/work/${w.id}`}
                className="catalog-card p-4 flex gap-3 hover:shadow-lg transition-shadow"
              >
                {w.cover_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={w.cover_url} alt="" className="w-16 h-24 object-cover rounded-sm flex-shrink-0" />
                ) : (
                  <div className="w-16 h-24 bg-line/40 rounded-sm flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-display italic text-lg leading-tight truncate">{w.title}</div>
                  {w.author && <div className="text-sm text-inkfaint truncate">{w.author}</div>}
                  <div className="flex flex-wrap gap-1.5 mt-2 items-center">
                    <span className="stamp text-moss capitalize">{inst.status.replace('_', ' ')}</span>
                    {inst.favorite && <span className="text-brass text-sm">★ favorite</span>}
                    {inst.rating != null && (
                      <span className="text-xs font-mono text-inkfaint">{inst.rating}/10</span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
