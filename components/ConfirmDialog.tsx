'use client';

import { useState } from 'react';

export default function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Delete',
  requireTypedText,
  onConfirm,
  onCancel,
}: {
  title: string;
  message: string;
  confirmLabel?: string;
  /** If set, the user must type this exact text before the confirm button enables. */
  requireTypedText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const [typed, setTyped] = useState('');
  const disabled = requireTypedText ? typed !== requireTypedText : false;

  return (
    <div className="fixed inset-0 bg-ink/40 flex items-center justify-center p-4 z-50">
      <div className="catalog-card p-6 w-full max-w-sm space-y-4">
        <h3 className="font-display italic text-xl text-spine">{title}</h3>
        <p className="text-sm text-inkfaint whitespace-pre-wrap">{message}</p>

        {requireTypedText && (
          <div>
            <label className="catalog-tab text-inkfaint block mb-1">
              Type "{requireTypedText}" to confirm
            </label>
            <input
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              className="w-full border border-line bg-card rounded-sm px-3 py-2 text-sm"
              autoFocus
            />
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={onConfirm}
            disabled={disabled}
            className="catalog-tab bg-spine text-card px-4 py-2 rounded-sm hover:bg-spinedark disabled:opacity-40 flex-1"
          >
            {confirmLabel}
          </button>
          <button onClick={onCancel} className="catalog-tab border border-line px-4 py-2 rounded-sm hover:bg-line/30">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
