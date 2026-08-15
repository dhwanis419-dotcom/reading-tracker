'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import ConfirmDialog from '@/components/ConfirmDialog';
import type { Work } from '@/lib/types';

type Kind = 'tags' | 'collections';

export default function OrganizePage() {
  const [works, setWorks] = useState<Work[]>([]);
  const [loading, setLoading] = useState(true);
  const [renaming, setRenaming] = useState<{ kind: Kind; name: string } | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [deleting, setDeleting] = useState<{ kind: Kind; name: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('works').select('*');
    setWorks((data as unknown as Work[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function tally(kind: Kind) {
    const map = new Map<string, number>();
    for (const w of works) {
      for (const v of w[kind] || []) {
        map.set(v, (map.get(v) || 0) + 1);
      }
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }

  const tags = useMemo(() => tally('tags'), [works]);
  const collections = useMemo(() => tally('collections'), [works]);

  async function rename(kind: Kind, oldName: string, newName: string) {
    const trimmed = newName.trim();
    if (!trimmed || trimmed === oldName) {
      setRenaming(null);
      return;
    }
    const affected = works.filter((w) => (w[kind] || []).includes(oldName));
    for (const w of affected) {
      const updated = Array.from(new Set((w[kind] || []).map((v) => (v === oldName ? trimmed : v))));
      await supabase.from('works').update({ [kind]: updated }).eq('id', w.id);
    }
    setRenaming(null);
    load();
  }

  async function remove(kind: Kind, name: string) {
    const affected = works.filter((w) => (w[kind] || []).includes(name));
    for (const w of affected) {
      const updated = (w[kind] || []).filter((v) => v !== name);
      await supabase.from('works').update({ [kind]: updated }).eq('id', w.id);
    }
    setDeleting(null);
    load();
  }

  function Section({ kind, label, items }: { kind: Kind; label: string; items: [string, number][] }) {
    return (
      <div className="catalog-card p-4">
        <h3 className="catalog-tab text-spine mb-3">{label} ({items.length})</h3>
        {items.length === 0 ? (
          <p className="text-sm text-inkfaint italic">
            None yet — {kind === 'tags' ? 'tags' : 'collections'} appear here once you assign them to a work.
          </p>
        ) : (
          <div className="space-y-2">
            {items.map(([name, count]) => (
              <div key={name} className="flex items-center justify-between text-sm border-b border-line/60 pb-2 last:border-0">
                {renaming?.kind === kind && renaming.name === name ? (
                  <input
                    autoFocus
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && rename(kind, name, renameValue)}
                    className="border border-line bg-card rounded-sm px-2 py-1 text-sm flex-1 mr-2"
                  />
                ) : (
                  <span>{name} <span className="text-inkfaint font-mono text-xs">×{count}</span></span>
                )}
                <div className="flex gap-2 flex-shrink-0">
                  {renaming?.kind === kind && renaming.name === name ? (
                    <>
                      <button onClick={() => rename(kind, name, renameValue)} className="catalog-tab text-moss hover:underline">Save</button>
                      <button onClick={() => setRenaming(null)} className="catalog-tab text-inkfaint hover:underline">Cancel</button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => { setRenaming({ kind, name }); setRenameValue(name); }} className="catalog-tab text-inkfaint hover:text-ink">Rename</button>
                      <button onClick={() => setDeleting({ kind, name })} className="catalog-tab text-inkfaint hover:text-spine">Delete</button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display italic text-3xl">Collections &amp; Tags</h2>
        <p className="text-inkfaint text-sm mt-1">
          Renaming or deleting here applies across every work that uses it. New tags and collections are created
          simply by typing them when adding or editing a work.
        </p>
      </div>

      {loading ? (
        <p className="text-inkfaint italic">Gathering the labels…</p>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          <Section kind="collections" label="Collections" items={collections} />
          <Section kind="tags" label="Tags" items={tags} />
        </div>
      )}

      {deleting && (
        <ConfirmDialog
          title={`Delete "${deleting.name}"?`}
          message={`This removes "${deleting.name}" from every work that has it. The works themselves are not affected.`}
          confirmLabel="Delete"
          onConfirm={() => remove(deleting.kind, deleting.name)}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  );
}
