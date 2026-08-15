'use client';

import { useRouter } from 'next/navigation';
import type { Work } from '@/lib/types';

export default function DuplicateModal({
  candidates,
  onAddToTbr,
  onStartReading,
  onCreateNew,
  onCancel,
}: {
  candidates: Work[];
  onAddToTbr: (workId: string) => void;
  onStartReading: (workId: string) => void;
  onCreateNew: () => void;
  onCancel: () => void;
}) {
  const router = useRouter();

  return (
    <div className="fixed inset-0 bg-ink/40 flex items-center justify-center p-4 z-40">
      <div className="catalog-card p-6 w-full max-w-lg space-y-4">
        <div>
          <h3 className="font-display italic text-xl text-spine">This might already be in your library</h3>
          <p className="text-sm text-inkfaint mt-1">
            {candidates.length === 1 ? 'A similar title already exists:' : 'Similar titles already exist:'}
          </p>
        </div>

        <div className="space-y-3 max-h-64 overflow-y-auto">
          {candidates.map((w) => (
            <div key={w.id} className="border border-line rounded-sm p-3 flex gap-3">
              {w.cover_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={w.cover_url} alt="" className="w-10 h-14 object-cover rounded-sm flex-shrink-0" />
              ) : (
                <div className="w-10 h-14 bg-line/40 rounded-sm flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{w.title}</div>
                {w.author && <div className="text-sm text-inkfaint truncate">{w.author}</div>}
                <div className="flex flex-wrap gap-2 mt-2">
                  <button
                    onClick={() => router.push(`/work/${w.id}`)}
                    className="catalog-tab text-xs border border-line px-2 py-1 rounded-sm hover:bg-line/30"
                  >
                    Open existing
                  </button>
                  <button
                    onClick={() => onAddToTbr(w.id)}
                    className="catalog-tab text-xs border border-line px-2 py-1 rounded-sm hover:bg-line/30"
                  >
                    Add to TBR
                  </button>
                  <button
                    onClick={() => onStartReading(w.id)}
                    className="catalog-tab text-xs border border-line px-2 py-1 rounded-sm hover:bg-line/30"
                  >
                    Start new reading
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-2 pt-2 border-t border-line">
          <button
            onClick={onCreateNew}
            className="catalog-tab border border-line px-4 py-2 rounded-sm hover:bg-line/30 flex-1"
            title="Use this if it's a different edition or genuinely a different work"
          >
            Create separate edition / Continue anyway
          </button>
          <button onClick={onCancel} className="catalog-tab text-inkfaint px-4 py-2 hover:text-ink">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
