'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { ReadingGoal } from '@/lib/types';

export default function ReadingGoalCard({ booksFinishedThisYear }: { booksFinishedThisYear: number }) {
  const year = new Date().getFullYear();
  const [goal, setGoal] = useState<ReadingGoal | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [targetInput, setTargetInput] = useState('');
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const { data } = await supabase.from('reading_goals').select('*').eq('year', year).maybeSingle();
    setGoal((data as unknown as ReadingGoal) || null);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function save() {
    const target = parseInt(targetInput);
    if (!target || target <= 0) return;
    setSaving(true);
    try {
      await supabase.from('reading_goals').upsert({ year, target }, { onConflict: 'year' });
      setEditing(false);
      load();
    } finally {
      setSaving(false);
    }
  }

  if (loading) return null;

  const pct = goal ? Math.min(100, Math.round((booksFinishedThisYear / goal.target) * 100)) : 0;

  return (
    <div className="catalog-card p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="catalog-tab text-spine">{year} Reading Goal</h3>
        {goal && !editing && (
          <button onClick={() => { setEditing(true); setTargetInput(String(goal.target)); }} className="catalog-tab text-inkfaint hover:text-ink">
            Edit
          </button>
        )}
      </div>

      {!goal && !editing ? (
        <div className="flex items-center gap-3">
          <p className="text-sm text-inkfaint flex-1">No goal set for {year} yet.</p>
          <button
            onClick={() => { setEditing(true); setTargetInput(''); }}
            className="catalog-tab bg-spine text-card px-3 py-1.5 rounded-sm hover:bg-spinedark"
          >
            Set a goal
          </button>
        </div>
      ) : editing ? (
        <div className="flex items-center gap-2">
          <input
            type="number"
            min="1"
            autoFocus
            value={targetInput}
            onChange={(e) => setTargetInput(e.target.value)}
            placeholder="e.g. 40"
            className="w-24 border border-line bg-card rounded-sm px-3 py-2 text-sm"
          />
          <span className="text-sm text-inkfaint">books this year</span>
          <button onClick={save} disabled={saving} className="catalog-tab bg-spine text-card px-3 py-1.5 rounded-sm hover:bg-spinedark disabled:opacity-50">
            {saving ? 'Saving…' : 'Save'}
          </button>
          <button onClick={() => setEditing(false)} className="catalog-tab text-inkfaint hover:text-ink">Cancel</button>
        </div>
      ) : goal ? (
        <div>
          <div className="flex items-baseline justify-between mb-1.5">
            <span className="font-display italic text-2xl text-spine">{booksFinishedThisYear}</span>
            <span className="text-sm text-inkfaint">of {goal.target} books</span>
          </div>
          <div className="h-2 bg-line rounded-full overflow-hidden">
            <div className="h-full bg-brass transition-all" style={{ width: `${pct}%` }} />
          </div>
          <p className="text-xs text-inkfaint mt-1.5">
            {booksFinishedThisYear >= goal.target
              ? 'Goal reached — well done.'
              : `${goal.target - booksFinishedThisYear} to go · ${pct}%`}
          </p>
        </div>
      ) : null}
    </div>
  );
}
