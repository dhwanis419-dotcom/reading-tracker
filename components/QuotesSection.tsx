'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import ConfirmDialog from '@/components/ConfirmDialog';
import type { Quote } from '@/lib/types';

export default function QuotesSection({ workId }: { workId: string }) {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [text, setText] = useState('');
  const [page, setPage] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<Quote | null>(null);

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from('quotes')
      .select('*')
      .eq('work_id', workId)
      .order('created_at', { ascending: true });
    setQuotes((data as unknown as Quote[]) || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workId]);

  async function save() {
    if (!text.trim()) return;
    setSaving(true);
    try {
      await supabase.from('quotes').insert({
        work_id: workId,
        quote_text: text.trim(),
        page_number: page.trim() ? parseInt(page) : null,
      });
      setText('');
      setPage('');
      setAdding(false);
      load();
    } finally {
      setSaving(false);
    }
  }

  async function del(q: Quote) {
    await supabase.from('quotes').delete().eq('id', q.id);
    setDeleting(null);
    load();
  }

  return (
    <div className="catalog-card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="catalog-tab text-spine">Quotes &amp; Highlights ({quotes.length})</h3>
        {!adding && (
          <button onClick={() => setAdding(true)} className="catalog-tab border border-line px-3 py-1.5 rounded-sm hover:bg-line/30">
            + Add
          </button>
        )}
      </div>

      {adding && (
        <div className="space-y-3 mb-4 border border-line rounded-sm p-3">
          <textarea
            autoFocus
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            placeholder="A line worth remembering…"
            className="w-full border border-line bg-card rounded-sm px-3 py-2 text-sm font-body italic"
          />
          <div className="flex items-center gap-3">
            <div>
              <label className="catalog-tab text-inkfaint block mb-1">Page (optional)</label>
              <input
                type="number"
                value={page}
                onChange={(e) => setPage(e.target.value)}
                className="w-24 border border-line bg-card rounded-sm px-2 py-1.5 text-sm"
              />
            </div>
            <div className="flex gap-2 pt-5">
              <button onClick={save} disabled={saving || !text.trim()} className="catalog-tab bg-spine text-card px-3 py-1.5 rounded-sm hover:bg-spinedark disabled:opacity-50">
                {saving ? 'Saving…' : 'Save'}
              </button>
              <button onClick={() => { setAdding(false); setText(''); setPage(''); }} className="catalog-tab text-inkfaint hover:text-ink px-2">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-inkfaint italic">Gathering your marginalia…</p>
      ) : quotes.length === 0 ? (
        <p className="text-sm text-inkfaint italic">No quotes saved yet.</p>
      ) : (
        <div className="space-y-3">
          {quotes.map((q) => (
            <div key={q.id} className="border-l-2 border-brass pl-3 py-0.5 group relative">
              <p className="font-display italic text-base leading-snug pr-6">"{q.quote_text}"</p>
              {q.page_number != null && (
                <p className="text-xs font-mono text-inkfaint mt-1">p. {q.page_number}</p>
              )}
              <button
                onClick={() => setDeleting(q)}
                className="absolute top-0 right-0 text-inkfaint hover:text-spine text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                title="Delete quote"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {deleting && (
        <ConfirmDialog
          title="Delete this quote?"
          message="This removes it permanently."
          confirmLabel="Delete"
          onConfirm={() => del(deleting)}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  );
}
