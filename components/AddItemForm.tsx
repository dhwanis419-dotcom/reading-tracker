'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { searchOpenLibrary, extractArticleMetadata, fetchPageCountByIsbn, OpenLibraryResult } from '@/lib/openlibrary';
import DuplicateModal from '@/components/DuplicateModal';
import type { WorkType, Priority, FictionStatus, Work } from '@/lib/types';

const GENRE_OPTIONS = [
  'Literary Fiction', 'Historical Fiction', 'Fantasy', 'Science Fiction', 'Mystery',
  'Thriller', 'Romance', 'Biography', 'Autobiography', 'Memoir', 'History',
  'Philosophy', 'Psychology', 'Politics', 'Economics', 'Science', 'Technology',
  'Essays', 'Poetry', 'Sociology', 'Religion', 'Culture', 'Criticism', 'Journalism', 'Other',
];

export default function AddItemForm({
  onAdded,
  destination = 'tbr',
}: {
  onAdded: () => void;
  /** 'tbr' adds to the To Be Read shelf. 'reading' starts it immediately, skipping TBR entirely. */
  destination?: 'tbr' | 'reading';
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<WorkType>('book');
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [url, setUrl] = useState('');
  const [priority, setPriority] = useState<Priority>(null);
  const [genres, setGenres] = useState<string[]>([]);
  const [fiction, setFiction] = useState<FictionStatus>(null);
  const [manualPageCount, setManualPageCount] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [collectionsInput, setCollectionsInput] = useState('');

  const [candidates, setCandidates] = useState<OpenLibraryResult[]>([]);
  const [chosen, setChosen] = useState<OpenLibraryResult | null>(null);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [dupCandidates, setDupCandidates] = useState<Work[] | null>(null);
  const [pendingPayload, setPendingPayload] = useState<any>(null);

  function reset() {
    setType('book');
    setTitle('');
    setAuthor('');
    setUrl('');
    setPriority(null);
    setGenres([]);
    setFiction(null);
    setManualPageCount('');
    setTagsInput('');
    setCollectionsInput('');
    setCandidates([]);
    setChosen(null);
    setError(null);
    setDupCandidates(null);
    setPendingPayload(null);
  }

  const [fetchingPages, setFetchingPages] = useState(false);

  async function selectCandidate(c: OpenLibraryResult) {
    setChosen(c);
    if (c.page_count != null) setManualPageCount(String(c.page_count));
    if (c.page_count == null && c.isbn) {
      setFetchingPages(true);
      const pages = await fetchPageCountByIsbn(c.isbn);
      if (pages != null) {
        const updated = { ...c, page_count: pages };
        setChosen(updated);
        setManualPageCount(String(pages));
        setCandidates((prev) => prev.map((cand) => (cand === c ? updated : cand)));
      }
      setFetchingPages(false);
    }
  }

  async function handleLookup() {
    if (!title.trim()) return;
    setSearching(true);
    setError(null);
    try {
      const results = await searchOpenLibrary(title.trim(), author.trim() || undefined);
      setCandidates(results);
      if (results.length === 0) {
        setError('No metadata found. You can still add this manually below.');
      }
    } finally {
      setSearching(false);
    }
  }

  function toggleGenre(g: string) {
    setGenres((prev) => (prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]));
  }

  async function finalizeNewWork(workId: string) {
    if (destination === 'reading') {
      const { data: w } = await supabase.from('works').select('type').eq('id', workId).single();
      await supabase.from('reading_instances').insert({
        work_id: workId,
        status: 'currently_reading',
        progress_unit: w?.type === 'book' ? 'page' : 'percent',
        current_progress: 0,
      });
      router.push('/reading');
    } else {
      await supabase.from('tbr_entries').insert({ work_id: workId, priority, active: true });
    }
  }

  async function createWork(payload: any) {
    const { data: newWork, error: workError } = await supabase.from('works').insert(payload).select('id').single();
    if (workError) throw workError;
    await finalizeNewWork(newWork.id);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const tags = tagsInput.split(',').map((t) => t.trim()).filter(Boolean);
      const collections = collectionsInput.split(',').map((c) => c.trim()).filter(Boolean);

      let workPayload: any = {
        type,
        title: title.trim(),
        author: author.trim() || null,
        genres,
        tags,
        collections,
      };

      if (type === 'book') {
        workPayload = {
          ...workPayload,
          title: chosen?.title || title.trim(),
          author: chosen?.author || author.trim() || null,
          cover_url: chosen?.cover_url || null,
          page_count: manualPageCount.trim() ? parseInt(manualPageCount) : (chosen?.page_count || null),
          isbn: chosen?.isbn || null,
          edition: chosen?.edition || null,
          publication_info: chosen?.publication_info || null,
          fiction_status: fiction,
        };
      }

      if (type === 'article') {
        if (!url.trim()) {
          setError('Please paste the article URL.');
          setSaving(false);
          return;
        }
        const meta = await extractArticleMetadata(url.trim());
        workPayload = {
          ...workPayload,
          title: meta.title || title.trim() || url.trim(),
          article_url: url.trim(),
          article_site: meta.site,
        };
      }

      const { data: existing } = await supabase
        .from('works')
        .select('*')
        .eq('type', type)
        .ilike('title', `%${workPayload.title}%`);

      if (existing && existing.length > 0) {
        setDupCandidates(existing as unknown as Work[]);
        setPendingPayload(workPayload);
        setSaving(false);
        return;
      }

      await createWork(workPayload);
      reset();
      setOpen(false);
      onAdded();
    } catch (err: any) {
      setError(err.message || 'Something went wrong saving this item.');
    } finally {
      setSaving(false);
    }
  }

  async function resolveAddToTbr(workId: string) {
    setSaving(true);
    try {
      await supabase.from('tbr_entries').insert({ work_id: workId, priority, active: true });
      reset();
      setOpen(false);
      onAdded();
    } finally {
      setSaving(false);
    }
  }

  async function resolveStartReading(workId: string) {
    setSaving(true);
    try {
      const { data: w } = await supabase.from('works').select('type').eq('id', workId).single();
      await supabase.from('reading_instances').insert({
        work_id: workId,
        status: 'currently_reading',
        progress_unit: w?.type === 'book' ? 'page' : 'percent',
        current_progress: 0,
      });
      reset();
      setOpen(false);
      onAdded();
    } finally {
      setSaving(false);
    }
  }

  async function resolveCreateNew() {
    if (!pendingPayload) return;
    setSaving(true);
    try {
      await createWork(pendingPayload);
      reset();
      setOpen(false);
      onAdded();
    } catch (err: any) {
      setError(err.message || 'Something went wrong saving this item.');
      setDupCandidates(null);
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="catalog-tab bg-spine text-card px-5 py-2.5 rounded-sm hover:bg-spinedark transition-colors"
      >
        {destination === 'reading' ? '+ Start Reading Directly' : '+ Add to TBR'}
      </button>
    );
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="catalog-card p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-display italic text-xl text-spine">
            {destination === 'reading' ? 'Start reading something new' : 'New catalog entry'}
          </h3>
          <button type="button" onClick={() => { reset(); setOpen(false); }} className="catalog-tab text-inkfaint hover:text-ink">
            Cancel
          </button>
        </div>

        <div className="flex gap-2">
          {(['book', 'short_story', 'article'] as WorkType[]).map((t) => (
            <button
              type="button"
              key={t}
              onClick={() => { setType(t); setCandidates([]); setChosen(null); }}
              className={`catalog-tab px-3 py-1.5 rounded-sm border ${
                type === t ? 'bg-moss text-card border-moss' : 'border-line text-inkfaint hover:text-ink'
              }`}
            >
              {t === 'book' ? 'Book' : t === 'short_story' ? 'Short Story' : 'Article'}
            </button>
          ))}
        </div>

        {type === 'article' ? (
          <div>
            <label className="catalog-tab text-inkfaint block mb-1">Article URL</label>
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
              className="w-full border border-line bg-card rounded-sm px-3 py-2 font-body"
              required
            />
            <p className="text-xs text-inkfaint mt-1">
              Title, site, and (when available) publish date will be extracted automatically. You can edit anything afterward.
            </p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="catalog-tab text-inkfaint block mb-1">Title</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full border border-line bg-card rounded-sm px-3 py-2 font-body"
                required
              />
            </div>
            <div>
              <label className="catalog-tab text-inkfaint block mb-1">Author</label>
              <input
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                className="w-full border border-line bg-card rounded-sm px-3 py-2 font-body"
              />
            </div>
          </div>
        )}

        {type === 'book' && (
          <div className="space-y-3">
            <button
              type="button"
              onClick={handleLookup}
              disabled={!title.trim() || searching}
              className="catalog-tab border border-line px-3 py-1.5 rounded-sm hover:bg-line/40 disabled:opacity-50"
            >
              {searching ? 'Searching Open Library…' : 'Fetch cover, pages, ISBN'}
            </button>

            {candidates.length > 0 && (
              <div className="grid sm:grid-cols-2 gap-3">
                {candidates.map((c, i) => (
                  <button
                    type="button"
                    key={i}
                    onClick={() => selectCandidate(c)}
                    className={`text-left border rounded-sm p-3 flex gap-3 ${
                      chosen === c ? 'border-brass bg-brass/10' : 'border-line hover:bg-line/20'
                    }`}
                  >
                    {c.cover_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={c.cover_url} alt="" className="w-12 h-16 object-cover rounded-sm" />
                    ) : (
                      <div className="w-12 h-16 bg-line/40 rounded-sm flex-shrink-0" />
                    )}
                    <div className="text-sm">
                      <div className="font-medium">{c.title}</div>
                      <div className="text-inkfaint">{c.author}</div>
                      {c.page_count ? (
                        <div className="text-inkfaint font-mono text-xs mt-1">{c.page_count} pp.</div>
                      ) : chosen === c && fetchingPages ? (
                        <div className="text-inkfaint font-mono text-xs mt-1">Looking up page count…</div>
                      ) : c.isbn ? null : (
                        <div className="text-inkfaint font-mono text-xs mt-1">Page count unavailable — enter manually below</div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="catalog-tab text-inkfaint block mb-1">Pages</label>
                <input
                  type="number"
                  min="1"
                  value={manualPageCount}
                  onChange={(e) => setManualPageCount(e.target.value)}
                  placeholder="e.g. 320"
                  className="w-full border border-line bg-card rounded-sm px-3 py-2 text-sm"
                />
                <p className="text-xs text-inkfaint mt-1">
                  Auto-filled when available — always editable, since this drives your reading progress bar.
                </p>
              </div>
              <div>
                <span className="catalog-tab text-inkfaint block mb-1">Fiction / Non-fiction</span>
                <div className="flex gap-2">
                  {(['fiction', 'non_fiction'] as const).map((f) => (
                    <button
                      type="button"
                      key={f}
                      onClick={() => setFiction(fiction === f ? null : f)}
                      className={`catalog-tab px-3 py-1.5 rounded-sm border ${
                        fiction === f ? 'bg-moss text-card border-moss' : 'border-line text-inkfaint'
                      }`}
                    >
                      {f === 'fiction' ? 'Fiction' : 'Non-fiction'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}


        <div>
          <span className="catalog-tab text-inkfaint block mb-1">Genres</span>
          <div className="flex flex-wrap gap-1.5">
            {GENRE_OPTIONS.map((g) => (
              <button
                type="button"
                key={g}
                onClick={() => toggleGenre(g)}
                className={`text-xs px-2 py-1 rounded-sm border ${
                  genres.includes(g) ? 'bg-brass/20 border-brass text-ink' : 'border-line text-inkfaint hover:text-ink'
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="catalog-tab text-inkfaint block mb-1">Tags (comma separated)</label>
            <input
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="Indian history, re-read"
              className="w-full border border-line bg-card rounded-sm px-3 py-2 font-body text-sm"
            />
          </div>
          <div>
            <label className="catalog-tab text-inkfaint block mb-1">Collections (comma separated)</label>
            <input
              value={collectionsInput}
              onChange={(e) => setCollectionsInput(e.target.value)}
              placeholder="2026 Reading List"
              className="w-full border border-line bg-card rounded-sm px-3 py-2 font-body text-sm"
            />
          </div>
        </div>

        {destination === 'tbr' && (
          <div>
            <span className="catalog-tab text-inkfaint block mb-1">Priority</span>
            <div className="flex gap-2">
              {(['high', 'medium', 'low'] as const).map((p) => (
                <button
                  type="button"
                  key={p}
                  onClick={() => setPriority(priority === p ? null : p)}
                  className={`catalog-tab px-3 py-1.5 rounded-sm border capitalize ${
                    priority === p ? 'bg-spine text-card border-spine' : 'border-line text-inkfaint'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        {error && <p className="text-sm text-spine">{error}</p>}

        <button
          type="submit"
          disabled={saving}
          className="catalog-tab bg-spine text-card px-5 py-2.5 rounded-sm hover:bg-spinedark disabled:opacity-50"
        >
          {saving ? 'Saving…' : destination === 'reading' ? 'Start Reading' : 'Add to TBR'}
        </button>
      </form>

      {dupCandidates && (
        <DuplicateModal
          candidates={dupCandidates}
          onAddToTbr={resolveAddToTbr}
          onStartReading={resolveStartReading}
          onCreateNew={resolveCreateNew}
          onCancel={() => { setDupCandidates(null); setPendingPayload(null); setSaving(false); }}
        />
      )}
    </>
  );
}
