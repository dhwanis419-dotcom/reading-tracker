'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { ReadingInstance } from '@/lib/types';

export default function FinishModal({
  instance,
  onClose,
  onSaved,
}: {
  instance: ReadingInstance;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [rating, setRating] = useState<string>(instance.rating != null ? String(instance.rating) : '');
  const [review, setReview] = useState(instance.final_review || '');
  const [favorite, setFavorite] = useState(instance.favorite);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      await supabase
        .from('reading_instances')
        .update({
          status: 'finished',
          finish_date: instance.finish_date || new Date().toISOString(),
          rating: rating.trim() ? parseFloat(rating) : null,
          final_review: review.trim() || null,
          favorite,
        })
        .eq('id', instance.id);
      onSaved();
      onClose();
    } finally {
      setSaving(false);
    }
  }

  async function skipForNow() {
    // Still mark as finished — the review can be added later from the Library.
    setSaving(true);
    try {
      await supabase
        .from('reading_instances')
        .update({
          status: 'finished',
          finish_date: instance.finish_date || new Date().toISOString(),
        })
        .eq('id', instance.id);
      onSaved();
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-ink/40 flex items-center justify-center p-4 z-30">
      <div className="catalog-card p-6 w-full max-w-md space-y-4">
        <div>
          <h3 className="font-display italic text-xl text-spine">You finished it</h3>
          <p className="text-sm text-inkfaint truncate">{instance.work?.title}</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex-1">
            <label className="catalog-tab text-inkfaint block mb-1">Rating (out of 10)</label>
            <input
              type="number"
              min="0"
              max="10"
              step="0.5"
              value={rating}
              onChange={(e) => setRating(e.target.value)}
              placeholder="e.g. 8.5"
              className="w-full border border-line bg-card rounded-sm px-3 py-2 text-sm"
            />
          </div>
          <label className="flex items-center gap-2 pt-5 catalog-tab cursor-pointer">
            <input type="checkbox" checked={favorite} onChange={(e) => setFavorite(e.target.checked)} />
            Favorite
          </label>
        </div>

        <div>
          <label className="catalog-tab text-inkfaint block mb-1">Final review</label>
          <textarea
            value={review}
            onChange={(e) => setReview(e.target.value)}
            rows={5}
            placeholder="No word limit — write as much as you like. You can leave this for later too."
            className="w-full border border-line bg-card rounded-sm px-3 py-2 text-sm"
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={save}
            disabled={saving}
            className="catalog-tab bg-spine text-card px-4 py-2 rounded-sm hover:bg-spinedark disabled:opacity-50 flex-1"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
          <button
            onClick={skipForNow}
            disabled={saving}
            className="catalog-tab border border-line px-4 py-2 rounded-sm hover:bg-line/30"
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
}
