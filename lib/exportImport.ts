import Papa from 'papaparse';
import JSZip from 'jszip';
import { supabase } from '@/lib/supabase';

export interface FullExport {
  exported_at: string;
  version: 1;
  works: any[];
  tbr_entries: any[];
  reading_instances: any[];
  reading_entries: any[];
}

async function fetchAll() {
  const [works, tbr, instances, entries] = await Promise.all([
    supabase.from('works').select('*'),
    supabase.from('tbr_entries').select('*'),
    supabase.from('reading_instances').select('*'),
    supabase.from('reading_entries').select('*'),
  ]);
  return {
    works: works.data || [],
    tbr_entries: tbr.data || [],
    reading_instances: instances.data || [],
    reading_entries: entries.data || [],
  };
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function exportAsJSON() {
  const data = await fetchAll();
  const payload: FullExport = {
    exported_at: new Date().toISOString(),
    version: 1,
    ...data,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  downloadBlob(blob, `reading-tracker-export-${new Date().toISOString().slice(0, 10)}.json`);
}

// Arrays (genres, tags, collections) become semicolon-joined strings so
// they survive a round trip through a spreadsheet cell cleanly.
function flatten(row: Record<string, any>) {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(row)) {
    out[k] = Array.isArray(v) ? v.join('; ') : v;
  }
  return out;
}

export async function exportAsCSV() {
  const data = await fetchAll();
  const zip = new JSZip();

  const tables: [string, any[]][] = [
    ['works', data.works],
    ['tbr_entries', data.tbr_entries],
    ['reading_instances', data.reading_instances],
    ['reading_entries', data.reading_entries],
  ];

  for (const [name, rows] of tables) {
    const csv = Papa.unparse(rows.map(flatten));
    zip.file(`${name}.csv`, csv);
  }

  const blob = await zip.generateAsync({ type: 'blob' });
  downloadBlob(blob, `reading-tracker-export-${new Date().toISOString().slice(0, 10)}.zip`);
}

export interface ImportResult {
  works: number;
  tbr_entries: number;
  reading_instances: number;
  reading_entries: number;
}

/**
 * Imports a JSON file previously produced by exportAsJSON. Original IDs are
 * preserved and rows are upserted, so re-importing the same file (or a
 * backup taken elsewhere) never creates duplicates — it merges safely.
 * Insert order respects foreign keys: works, then tbr_entries and reading
 * instances, then reading_entries last.
 */
export async function importFromJSON(file: File): Promise<ImportResult> {
  const text = await file.text();
  const parsed = JSON.parse(text) as Partial<FullExport>;

  if (!parsed.works || !Array.isArray(parsed.works)) {
    throw new Error('This file doesn\'t look like a Reading Tracker export — no "works" array found.');
  }

  const counts: ImportResult = { works: 0, tbr_entries: 0, reading_instances: 0, reading_entries: 0 };

  if (parsed.works.length) {
    const { error } = await supabase.from('works').upsert(parsed.works, { onConflict: 'id' });
    if (error) throw new Error(`Importing works failed: ${error.message}`);
    counts.works = parsed.works.length;
  }

  if (parsed.tbr_entries?.length) {
    const { error } = await supabase.from('tbr_entries').upsert(parsed.tbr_entries, { onConflict: 'id' });
    if (error) throw new Error(`Importing TBR entries failed: ${error.message}`);
    counts.tbr_entries = parsed.tbr_entries.length;
  }

  if (parsed.reading_instances?.length) {
    const { error } = await supabase.from('reading_instances').upsert(parsed.reading_instances, { onConflict: 'id' });
    if (error) throw new Error(`Importing reading instances failed: ${error.message}`);
    counts.reading_instances = parsed.reading_instances.length;
  }

  if (parsed.reading_entries?.length) {
    const { error } = await supabase.from('reading_entries').upsert(parsed.reading_entries, { onConflict: 'id' });
    if (error) throw new Error(`Importing reading entries failed: ${error.message}`);
    counts.reading_entries = parsed.reading_entries.length;
  }

  return counts;
}
