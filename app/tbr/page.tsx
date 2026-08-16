'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import AddItemForm from '@/components/AddItemForm';
import TbrList from '@/components/TbrList';
import SurpriseModal from '@/components/SurpriseModal';
import type { TbrEntry } from '@/lib/types';

export default function TbrPage() {
  const [entries, setEntries] = useState<TbrEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [surprising, setSurprising] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('tbr_entries')
      .select('*, work:works(*)')
      .order('date_added', { ascending: false });
    if (!error && data) setEntries(data as unknown as TbrEntry[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const activeEntries = entries.filter((e) => e.active && e.work);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-display italic text-3xl">To Be Read</h2>
          <p className="text-inkfaint text-sm mt-1">Books, short stories, and articles waiting their turn.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setSurprising(true)}
            disabled={activeEntries.length === 0}
            className="catalog-tab border border-brass text-spine px-4 py-2.5 rounded-sm hover:bg-brass/10 disabled:opacity-40"
          >
            🎲 Surprise Me
          </button>
          <AddItemForm onAdded={load} />
        </div>
      </div>

      {loading ? (
        <p className="text-inkfaint italic">Loading the shelf…</p>
      ) : (
        <TbrList entries={entries} onChanged={load} />
      )}

      {surprising && activeEntries.length > 0 && (
        <SurpriseModal entries={activeEntries} onClose={() => setSurprising(false)} onChanged={load} />
      )}
    </div>
  );
}
