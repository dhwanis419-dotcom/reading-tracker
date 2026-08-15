'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import ConfirmDialog from '@/components/ConfirmDialog';
import type { ReadingEntry } from '@/lib/types';

export default function EditEntryModal({
  entry,
  unit,
  onClose,
  onSaved,
  onDeleted,
}: {
  entry: ReadingEntry;
  unit: 'page' | 'percent';
  onClose: () => void;
  onSaved: () => void;
  onDeleted: () => void;
}) {
  const [date, setDate] = useState(new Date(entry.date).toISOString().slice(0, 10));
  const [before, setBefore] = useState(String(entry.progress_before));
  const [after, setAfter] = useState(String(entry.progress_after));
  const [minutes, setMinutes] = useState(entry.time_spent_minutes != null ? String(entry.time_spent_minutes) : '');
  const [thoughts, setThoughts] = useState(entry.thoughts || '');
  const [saving, setSaving] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const b = parseFloat(before);
      const a = parseFloat(after);
      const { error: err } = await supabase
        .from('reading_entries')
        .update({
          date: new Date(date).toISOString(),
          progress_before: b,
          progress_after: a,
          amount_read: a - b,
          time_spent_minutes: minutes.trim() ? parseInt(minutes) : null,
          thoughts: thoughts.trim() || null,
        })
        .eq('id', entry.id);
      if (err) throw err;
      onSaved();
      onClose();
    } catch (e: any) {
      setError(e.message || 'Could not save this correction.');
    } finally {
      setSaving(false);
    }
  }

  async function del() {
    await supabase.from('reading_entries').delete().eq('id', entry.id);
    onDeleted();
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-ink/40 flex items-center justify-center p-4 z-40">
      <div className="catalog-card p-6 w-full max-w-md space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-display italic text-xl text-spine">Correct this session</h3>
          <button onClick={onClose} className="catalog-tab text-inkfaint hover:text-ink">Close</button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="catalog-tab text-inkfaint block mb-1">Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full border border-line bg-card rounded-sm px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="catalog-tab text-inkfaint block mb-1">Minutes</label>
            <input type="number" value={minutes} onChange={(e) => setMinutes(e.target.value)} className="w-full border border-line bg-card rounded-sm px-3 py-2 text-sm" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="catalog-tab text-inkfaint block mb-1">From ({unit === 'page' ? 'page' : '%'})</label>
            <input type="number" value={before} onChange={(e) => setBefore(e.target.value)} className="w-full border border-line bg-card rounded-sm px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="catalog-tab text-inkfaint block mb-1">To ({unit === 'page' ? 'page' : '%'})</label>
            <input type="number" value={after} onChange={(e) => setAfter(e.target.value)} className="w-full border border-line bg-card rounded-sm px-3 py-2 text-sm" />
          </div>
        </div>

        <div>
          <label className="catalog-tab text-inkfaint block mb-1">Thoughts</label>
          <textarea value={thoughts} onChange={(e) => setThoughts(e.target.value)} rows={4} className="w-full border border-line bg-card rounded-sm px-3 py-2 text-sm" />
        </div>

        {error && <p className="text-sm text-spine">{error}</p>}

        <div className="flex gap-2">
          <button onClick={save} disabled={saving} className="catalog-tab bg-spine text-card px-4 py-2 rounded-sm hover:bg-spinedark disabled:opacity-50 flex-1">
            {saving ? 'Saving…' : 'Save correction'}
          </button>
          <button onClick={() => setConfirmingDelete(true)} className="catalog-tab border border-line px-4 py-2 rounded-sm text-spine hover:bg-line/30">
            Delete
          </button>
        </div>
      </div>

      {confirmingDelete && (
        <ConfirmDialog
          title="Delete this reading session?"
          message="This removes a piece of your reading history permanently — the date, progress, and any thoughts you wrote for this session."
          confirmLabel="Delete session"
          onConfirm={del}
          onCancel={() => setConfirmingDelete(false)}
        />
      )}
    </div>
  );
}
