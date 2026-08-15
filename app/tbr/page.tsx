'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import AddItemForm from '@/components/AddItemForm';
import TbrList from '@/components/TbrList';
import type { TbrEntry } from '@/lib/types';

export default function TbrPage() {
  const [entries, setEntries] = useState<TbrEntry[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-display italic text-3xl">To Be Read</h2>
          <p className="text-inkfaint text-sm mt-1">Books, short stories, and articles waiting their turn.</p>
        </div>
        <AddItemForm onAdded={load} />
      </div>

      {loading ? (
        <p className="text-inkfaint italic">Loading the shelf…</p>
      ) : (
        <TbrList entries={entries} onChanged={load} />
      )}
    </div>
  );
}
