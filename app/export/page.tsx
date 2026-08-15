'use client';

import { useRef, useState } from 'react';
import { exportAsJSON, exportAsCSV, importFromJSON, ImportResult } from '@/lib/exportImport';

export default function ExportPage() {
  const [busy, setBusy] = useState<'json' | 'csv' | 'import' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [confirmFile, setConfirmFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleExportJSON() {
    setBusy('json');
    setError(null);
    try {
      await exportAsJSON();
    } catch (e: any) {
      setError(e.message || 'Export failed.');
    } finally {
      setBusy(null);
    }
  }

  async function handleExportCSV() {
    setBusy('csv');
    setError(null);
    try {
      await exportAsCSV();
    } catch (e: any) {
      setError(e.message || 'Export failed.');
    } finally {
      setBusy(null);
    }
  }

  function handleFilePicked(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) setConfirmFile(file);
    e.target.value = '';
  }

  async function handleConfirmImport() {
    if (!confirmFile) return;
    setBusy('import');
    setError(null);
    setImportResult(null);
    try {
      const result = await importFromJSON(confirmFile);
      setImportResult(result);
      setConfirmFile(null);
    } catch (e: any) {
      setError(e.message || 'Import failed.');
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h2 className="font-display italic text-3xl">Export &amp; Import</h2>
        <p className="text-inkfaint text-sm mt-1">
          Your data, in formats you can actually use elsewhere — nothing here is locked in.
        </p>
      </div>

      <div className="catalog-card p-5 space-y-3">
        <h3 className="catalog-tab text-spine">Export</h3>
        <p className="text-sm text-inkfaint">
          Every work, TBR entry, reading instance, and session — everything you've entered.
        </p>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleExportJSON}
            disabled={busy !== null}
            className="catalog-tab bg-spine text-card px-4 py-2 rounded-sm hover:bg-spinedark disabled:opacity-50"
          >
            {busy === 'json' ? 'Preparing…' : 'Export as JSON'}
          </button>
          <button
            onClick={handleExportCSV}
            disabled={busy !== null}
            className="catalog-tab border border-line px-4 py-2 rounded-sm hover:bg-line/30 disabled:opacity-50"
          >
            {busy === 'csv' ? 'Preparing…' : 'Export as CSV (.zip)'}
          </button>
        </div>
        <p className="text-xs text-inkfaint">
          JSON keeps everything structured and is what you'd use to restore or move this data — it's also the
          format Import below understands. CSV unpacks into four spreadsheet-friendly files (works, TBR entries,
          reading instances, sessions) for opening in Excel, Google Sheets, or Numbers.
        </p>
      </div>

      <div className="catalog-card p-5 space-y-3">
        <h3 className="catalog-tab text-spine">Import</h3>
        <p className="text-sm text-inkfaint">
          Restore from a JSON file exported above — from this app or a backup taken earlier. Matching records are
          merged by their original ID, so importing the same file twice never creates duplicates.
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json"
          onChange={handleFilePicked}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={busy !== null}
          className="catalog-tab border border-line px-4 py-2 rounded-sm hover:bg-line/30 disabled:opacity-50"
        >
          Choose JSON file…
        </button>
      </div>

      {error && <p className="text-sm text-spine">{error}</p>}

      {importResult && (
        <div className="catalog-card p-5 border-brass">
          <h3 className="catalog-tab text-moss mb-2">Import complete</h3>
          <ul className="text-sm space-y-1">
            <li>{importResult.works} works</li>
            <li>{importResult.tbr_entries} TBR entries</li>
            <li>{importResult.reading_instances} reading instances</li>
            <li>{importResult.reading_entries} reading sessions</li>
          </ul>
        </div>
      )}

      {confirmFile && (
        <div className="fixed inset-0 bg-ink/40 flex items-center justify-center p-4 z-40">
          <div className="catalog-card p-6 w-full max-w-sm space-y-4">
            <h3 className="font-display italic text-xl text-spine">Import "{confirmFile.name}"?</h3>
            <p className="text-sm text-inkfaint">
              This merges the file's contents into your current data. Records with IDs matching what's already
              here will be overwritten with the file's version; everything else is added alongside what you have.
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleConfirmImport}
                disabled={busy !== null}
                className="catalog-tab bg-spine text-card px-4 py-2 rounded-sm hover:bg-spinedark disabled:opacity-50 flex-1"
              >
                {busy === 'import' ? 'Importing…' : 'Import'}
              </button>
              <button
                onClick={() => setConfirmFile(null)}
                className="catalog-tab border border-line px-4 py-2 rounded-sm hover:bg-line/30"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
