'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { ReadingInstance } from '@/lib/types';

export default function LogReadingModal({
  instance,
  onClose,
  onLogged,
}: {
  instance: ReadingInstance;
  onClose: () => void;
  onLogged: () => void;
}) {
  const unit = instance.progress_unit; // the unit the instance is actually stored in
  const pageCount = instance.work?.page_count ?? null;

  // Books with a known page count can be logged either way; anything else
  // (short stories/articles logged by percent, or a book with no page
  // count on file) only offers the one input that makes sense.
  const canToggle = unit === 'page' && pageCount != null && pageCount > 0;
  const [inputMode, setInputMode] = useState<'page' | 'percent'>('page');

  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [rawInput, setRawInput] = useState<string>('');
  const [minutes, setMinutes] = useState<string>('');
  const [thoughts, setThoughts] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const before = instance.current_progress; // always stored in the instance's native unit
  const rawNum = parseFloat(rawInput);

  // Convert whatever the person typed into the instance's native unit
  // (pages for books, percent for everything else) so storage stays
  // consistent regardless of how it was entered.
  let afterNum: number | null = null;
  if (!isNaN(rawNum)) {
    if (unit === 'page' && inputMode === 'percent' && pageCount) {
      afterNum = Math.round((rawNum / 100) * pageCount);
    } else {
      afterNum = rawNum;
    }
  }

  const amount = afterNum !== null ? afterNum - before : null;
  const beforeAsPercent = unit === 'page' && pageCount ? Math.round((before / pageCount) * 100) : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (afterNum === null) {
      setError('Enter how far you got.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const { error: entryError } = await supabase.from('reading_entries').insert({
        reading_instance_id: instance.id,
        date: new Date(date).toISOString(),
        progress_before: before,
        progress_after: afterNum,
        amount_read: afterNum - before,
        time_spent_minutes: minutes ? parseInt(minutes) : null,
        thoughts: thoughts.trim() || null,
      });
      if (entryError) throw entryError;

      const finished = unit === 'percent' ? afterNum >= 100 : pageCount ? afterNum >= pageCount : false;

      const { error: updateError } = await supabase
        .from('reading_instances')
        .update({
          current_progress: afterNum,
          last_read_date: new Date(date).toISOString(),
          status: finished ? 'finished' : instance.status,
          finish_date: finished ? new Date(date).toISOString() : instance.finish_date,
        })
        .eq('id', instance.id);
      if (updateError) throw updateError;

      onLogged();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Could not save this session.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-ink/40 flex items-center justify-center p-4 z-30">
      <form onSubmit={handleSubmit} className="catalog-card p-6 w-full max-w-md space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-display italic text-xl text-spine">Log a session</h3>
          <button type="button" onClick={onClose} className="catalog-tab text-inkfaint hover:text-ink">Close</button>
        </div>
        <p className="text-sm text-inkfaint truncate">{instance.work?.title}</p>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="catalog-tab text-inkfaint block mb-1">Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full border border-line bg-card rounded-sm px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="catalog-tab text-inkfaint block mb-1">Minutes (optional)</label>
            <input type="number" min="0" value={minutes} onChange={(e) => setMinutes(e.target.value)} className="w-full border border-line bg-card rounded-sm px-3 py-2 text-sm" />
          </div>
        </div>

        {canToggle && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setInputMode('page')}
              className={`catalog-tab px-3 py-1.5 rounded-sm border ${inputMode === 'page' ? 'bg-moss text-card border-moss' : 'border-line text-inkfaint'}`}
            >
              Enter as page
            </button>
            <button
              type="button"
              onClick={() => setInputMode('percent')}
              className={`catalog-tab px-3 py-1.5 rounded-sm border ${inputMode === 'percent' ? 'bg-moss text-card border-moss' : 'border-line text-inkfaint'}`}
            >
              Enter as %
            </button>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 items-end">
          <div>
            <label className="catalog-tab text-inkfaint block mb-1">
              Currently at: {before}{unit === 'percent' ? '%' : ''}
              {beforeAsPercent !== null && ` (${beforeAsPercent}%)`}
            </label>
            <label className="catalog-tab text-inkfaint block mb-1">
              Reached ({unit === 'page' && inputMode === 'page' ? 'page' : '%'})
            </label>
            <input
              type="number"
              step={unit === 'percent' || inputMode === 'percent' ? '0.1' : '1'}
              value={rawInput}
              onChange={(e) => setRawInput(e.target.value)}
              className="w-full border border-line bg-card rounded-sm px-3 py-2 text-sm"
              required
            />
          </div>
          <div className="text-sm text-inkfaint pb-2">
            {amount !== null && (
              <span className="stamp text-moss">
                {amount >= 0 ? `+${amount}` : amount} {unit === 'page' ? 'pages' : '%'}
              </span>
            )}
            {unit === 'page' && inputMode === 'percent' && afterNum !== null && (
              <div className="text-xs mt-1">= page {afterNum}{pageCount ? ` / ${pageCount}` : ''}</div>
            )}
          </div>
        </div>

        <div>
          <label className="catalog-tab text-inkfaint block mb-1">Thoughts / notes</label>
          <textarea
            value={thoughts}
            onChange={(e) => setThoughts(e.target.value)}
            rows={4}
            className="w-full border border-line bg-card rounded-sm px-3 py-2 text-sm"
            placeholder="No word limit — write as much as you like."
          />
        </div>

        {error && <p className="text-sm text-spine">{error}</p>}

        <button
          type="submit"
          disabled={saving}
          className="catalog-tab bg-spine text-card px-5 py-2.5 rounded-sm hover:bg-spinedark disabled:opacity-50 w-full"
        >
          {saving ? 'Saving…' : 'Save session'}
        </button>
      </form>
    </div>
  );
}
