'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { ReadingInstance, ReadingStatus } from '@/lib/types';

function toDateInput(iso: string | null) {
  return iso ? new Date(iso).toISOString().slice(0, 10) : '';
}

export default function EditInstanceModal({
  instance,
  onClose,
  onSaved,
}: {
  instance: ReadingInstance;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [status, setStatus] = useState<ReadingStatus>(instance.status);
  const [startDate, setStartDate] = useState(toDateInput(instance.start_date));
  const [finishDate, setFinishDate] = useState(toDateInput(instance.finish_date));
  const [progress, setProgress] = useState(String(instance.current_progress));
  const [rating, setRating] = useState(instance.rating != null ? String(instance.rating) : '');
  const [favorite, setFavorite] = useState(instance.favorite);
  const [review, setReview] = useState(instance.final_review || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const { error: err } = await supabase
        .from('reading_instances')
        .update({
          status,
          start_date: startDate ? new Date(startDate).toISOString() : instance.start_date,
          finish_date: finishDate ? new Date(finishDate).toISOString() : null,
          current_progress: progress.trim() ? parseFloat(progress) : 0,
          rating: rating.trim() ? parseFloat(rating) : null,
          favorite,
          final_review: review.trim() || null,
        })
        .eq('id', instance.id);
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
      <div className="catalog-card p-6 w-full max-w-md space-y-4 my-8">
        <div className="flex items-center justify-between">
          <h3 className="font-display italic text-xl text-spine">Edit this reading</h3>
          <button onClick={onClose} className="catalog-tab text-inkfaint hover:text-ink">Close</button>
        </div>
        <p className="text-sm text-inkfaint truncate">{instance.work?.title}</p>

        <div>
          <span className="catalog-tab text-inkfaint block mb-1">Status</span>
          <div className="flex flex-wrap gap-2">
            {(['currently_reading', 'paused', 'finished', 'dnf'] as ReadingStatus[]).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatus(s)}
                className={`catalog-tab px-3 py-1.5 rounded-sm border capitalize ${status === s ? 'bg-moss text-card border-moss' : 'border-line text-inkfaint'}`}
              >
                {s.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="catalog-tab text-inkfaint block mb-1">Start date</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full border border-line bg-card rounded-sm px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="catalog-tab text-inkfaint block mb-1">Finish date</label>
            <input type="date" value={finishDate} onChange={(e) => setFinishDate(e.target.value)} className="w-full border border-line bg-card rounded-sm px-3 py-2 text-sm" />
          </div>
        </div>

        <div>
          <label className="catalog-tab text-inkfaint block mb-1">
            Current progress ({instance.progress_unit === 'page' ? 'page' : '%'})
          </label>
          <input type="number" value={progress} onChange={(e) => setProgress(e.target.value)} className="w-full border border-line bg-card rounded-sm px-3 py-2 text-sm" />
        </div>

        <div className="flex items-center gap-4">
          <div className="flex-1">
            <label className="catalog-tab text-inkfaint block mb-1">Rating (out of 10)</label>
            <input type="number" min="0" max="10" step="0.5" value={rating} onChange={(e) => setRating(e.target.value)} className="w-full border border-line bg-card rounded-sm px-3 py-2 text-sm" />
          </div>
          <label className="flex items-center gap-2 pt-5 catalog-tab cursor-pointer">
            <input type="checkbox" checked={favorite} onChange={(e) => setFavorite(e.target.checked)} />
            Favorite
          </label>
        </div>

        <div>
          <label className="catalog-tab text-inkfaint block mb-1">Final review</label>
          <textarea value={review} onChange={(e) => setReview(e.target.value)} rows={4} className="w-full border border-line bg-card rounded-sm px-3 py-2 text-sm" />
        </div>

        {error && <p className="text-sm text-spine">{error}</p>}

        <button
          onClick={save}
          disabled={saving}
          className="catalog-tab bg-spine text-card px-5 py-2.5 rounded-sm hover:bg-spinedark disabled:opacity-50 w-full"
        >
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </div>
  );
}
