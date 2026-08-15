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
  const unit = instance.progress_unit;
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [progressAfter, setProgressAfter] = useState<string>('');
  const [minutes, setMinutes] = useState<string>('');
  const [thoughts, setThoughts] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const before = instance.current_progress;
  const afterNum = parseFloat(progressAfter);
  const amount = !isNaN(afterNum) ? afterNum - before : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isNaN(afterNum)) {
      setError(unit === 'page' ? 'Enter the page you reached.' : 'Enter the percentage you reached.');
      return;
    }
    if (afterNum < before) {
      setError(`That's behind your current progress (${before}${unit === 'percent' ? '%' : ''}). Enter a manual correction below if this is intentional.`);
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

      const finished = unit === 'percent' ? afterNum >= 100 : instance.work?.page_count ? afterNum >= instance.work.page_count : false;

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

        <div className="grid grid-cols-2 gap-4 items-end">
          <div>
            <label className="catalog-tab text-inkfaint block mb-1">
              Current: {before}{unit === 'percent' ? '%' : ''}
            </label>
            <label className="catalog-tab text-inkfaint block mb-1">
              Reached ({unit === 'page' ? 'page' : '%'})
            </label>
            <input
              type="number"
              step={unit === 'percent' ? '0.1' : '1'}
              value={progressAfter}
              onChange={(e) => setProgressAfter(e.target.value)}
              className="w-full border border-line bg-card rounded-sm px-3 py-2 text-sm"
              required
            />
          </div>
          <div className="text-sm text-inkfaint pb-2">
            {amount !== null && !isNaN(amount) && (
              <span className="stamp text-moss">
                {amount >= 0 ? `+${amount}` : amount} {unit === 'page' ? 'pages' : '%'}
              </span>
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
