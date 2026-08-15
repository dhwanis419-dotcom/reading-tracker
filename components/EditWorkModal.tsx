'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Work, FictionStatus } from '@/lib/types';

const GENRE_OPTIONS = [
  'Literary Fiction', 'Historical Fiction', 'Fantasy', 'Science Fiction', 'Mystery',
  'Thriller', 'Romance', 'Biography', 'Autobiography', 'Memoir', 'History',
  'Philosophy', 'Psychology', 'Politics', 'Economics', 'Science', 'Technology',
  'Essays', 'Poetry', 'Sociology', 'Religion', 'Culture', 'Criticism', 'Journalism', 'Other',
];

export default function EditWorkModal({
  work,
  onClose,
  onSaved,
}: {
  work: Work;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState(work.title);
  const [author, setAuthor] = useState(work.author || '');
  const [coverUrl, setCoverUrl] = useState(work.cover_url || '');
  const [pageCount, setPageCount] = useState(work.page_count != null ? String(work.page_count) : '');
  const [isbn, setIsbn] = useState(work.isbn || '');
  const [edition, setEdition] = useState(work.edition || '');
  const [pubInfo, setPubInfo] = useState(work.publication_info || '');
  const [fiction, setFiction] = useState<FictionStatus>(work.fiction_status);
  const [genres, setGenres] = useState<string[]>(work.genres || []);
  const [tagsInput, setTagsInput] = useState((work.tags || []).join(', '));
  const [collectionsInput, setCollectionsInput] = useState((work.collections || []).join(', '));
  const [articleUrl, setArticleUrl] = useState(work.article_url || '');
  const [articleSite, setArticleSite] = useState(work.article_site || '');
  const [generalNotes, setGeneralNotes] = useState(work.general_notes || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleGenre(g: string) {
    setGenres((prev) => (prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]));
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const { error: err } = await supabase
        .from('works')
        .update({
          title: title.trim(),
          author: author.trim() || null,
          cover_url: coverUrl.trim() || null,
          page_count: pageCount.trim() ? parseInt(pageCount) : null,
          isbn: isbn.trim() || null,
          edition: edition.trim() || null,
          publication_info: pubInfo.trim() || null,
          fiction_status: fiction,
          genres,
          tags: tagsInput.split(',').map((t) => t.trim()).filter(Boolean),
          collections: collectionsInput.split(',').map((c) => c.trim()).filter(Boolean),
          article_url: articleUrl.trim() || null,
          article_site: articleSite.trim() || null,
          general_notes: generalNotes.trim() || null,
        })
        .eq('id', work.id);
      if (err) throw err;
      onSaved();
      onClose();
    } catch (e: any) {
      setError(e.message || 'Could not save these changes.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-ink/40 flex items-center justify-center p-4 z-40 overflow-y-auto">
      <div className="catalog-card p-6 w-full max-w-lg space-y-4 my-8">
        <div className="flex items-center justify-between">
          <h3 className="font-display italic text-xl text-spine">Edit details</h3>
          <button onClick={onClose} className="catalog-tab text-inkfaint hover:text-ink">Close</button>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="catalog-tab text-inkfaint block mb-1">Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full border border-line bg-card rounded-sm px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="catalog-tab text-inkfaint block mb-1">Author</label>
            <input value={author} onChange={(e) => setAuthor(e.target.value)} className="w-full border border-line bg-card rounded-sm px-3 py-2 text-sm" />
          </div>
        </div>

        <div>
          <label className="catalog-tab text-inkfaint block mb-1">Cover image URL</label>
          <input value={coverUrl} onChange={(e) => setCoverUrl(e.target.value)} className="w-full border border-line bg-card rounded-sm px-3 py-2 text-sm" placeholder="https://..." />
        </div>

        {work.type === 'book' && (
          <>
            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <label className="catalog-tab text-inkfaint block mb-1">Pages</label>
                <input type="number" value={pageCount} onChange={(e) => setPageCount(e.target.value)} className="w-full border border-line bg-card rounded-sm px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="catalog-tab text-inkfaint block mb-1">ISBN</label>
                <input value={isbn} onChange={(e) => setIsbn(e.target.value)} className="w-full border border-line bg-card rounded-sm px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="catalog-tab text-inkfaint block mb-1">Edition</label>
                <input value={edition} onChange={(e) => setEdition(e.target.value)} className="w-full border border-line bg-card rounded-sm px-3 py-2 text-sm" />
              </div>
            </div>
            <div>
              <label className="catalog-tab text-inkfaint block mb-1">Publication info</label>
              <input value={pubInfo} onChange={(e) => setPubInfo(e.target.value)} className="w-full border border-line bg-card rounded-sm px-3 py-2 text-sm" />
            </div>
            <div>
              <span className="catalog-tab text-inkfaint block mb-1">Fiction / Non-fiction</span>
              <div className="flex gap-2">
                {(['fiction', 'non_fiction'] as const).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFiction(fiction === f ? null : f)}
                    className={`catalog-tab px-3 py-1.5 rounded-sm border ${fiction === f ? 'bg-moss text-card border-moss' : 'border-line text-inkfaint'}`}
                  >
                    {f === 'fiction' ? 'Fiction' : 'Non-fiction'}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {work.type === 'article' && (
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="catalog-tab text-inkfaint block mb-1">Article URL</label>
              <input value={articleUrl} onChange={(e) => setArticleUrl(e.target.value)} className="w-full border border-line bg-card rounded-sm px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="catalog-tab text-inkfaint block mb-1">Site</label>
              <input value={articleSite} onChange={(e) => setArticleSite(e.target.value)} className="w-full border border-line bg-card rounded-sm px-3 py-2 text-sm" />
            </div>
          </div>
        )}

        <div>
          <span className="catalog-tab text-inkfaint block mb-1">Genres</span>
          <div className="flex flex-wrap gap-1.5">
            {GENRE_OPTIONS.map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => toggleGenre(g)}
                className={`text-xs px-2 py-1 rounded-sm border ${genres.includes(g) ? 'bg-brass/20 border-brass text-ink' : 'border-line text-inkfaint hover:text-ink'}`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="catalog-tab text-inkfaint block mb-1">Tags (comma separated)</label>
            <input value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} className="w-full border border-line bg-card rounded-sm px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="catalog-tab text-inkfaint block mb-1">Collections (comma separated)</label>
            <input value={collectionsInput} onChange={(e) => setCollectionsInput(e.target.value)} className="w-full border border-line bg-card rounded-sm px-3 py-2 text-sm" placeholder="2026 Reading List, Classics" />
          </div>
        </div>

        <div>
          <label className="catalog-tab text-inkfaint block mb-1">General notes</label>
          <textarea
            value={generalNotes}
            onChange={(e) => setGeneralNotes(e.target.value)}
            rows={3}
            placeholder="Notes about this work that aren't tied to a specific reading session — background, context, why it's on your list, etc."
            className="w-full border border-line bg-card rounded-sm px-3 py-2 text-sm"
          />
        </div>

        {error && <p className="text-sm text-spine">{error}</p>}

        <button
          onClick={save}
          disabled={saving || !title.trim()}
          className="catalog-tab bg-spine text-card px-5 py-2.5 rounded-sm hover:bg-spinedark disabled:opacity-50 w-full"
        >
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </div>
  );
}
