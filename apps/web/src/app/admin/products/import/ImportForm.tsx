'use client';

import { useState } from 'react';
import { Button } from '@ru/ui';

interface ImportResult {
  created: number;
  updated: number;
  errors: { row: number; message: string }[];
}

type State =
  | { kind: 'idle' }
  | { kind: 'submitting' }
  | { kind: 'success'; result: ImportResult }
  | { kind: 'error'; message: string };

export function ImportForm() {
  const [state, setState] = useState<State>({ kind: 'idle' });

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const file = fd.get('file');
    if (!(file instanceof File) || file.size === 0) {
      setState({ kind: 'error', message: 'Choose an .xlsx file' });
      return;
    }
    setState({ kind: 'submitting' });
    try {
      const res = await fetch('/api/web/admin/products/import', { method: 'POST', body: fd });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || 'Import failed');
      }
      const result = (await res.json()) as ImportResult;
      setState({ kind: 'success', result });
    } catch (err) {
      setState({ kind: 'error', message: (err as Error).message });
    }
  }

  if (state.kind === 'success') {
    const r = state.result;
    return (
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-emerald-700">Import complete</h3>
        <p className="text-sm text-steel-700">
          Created <strong>{r.created}</strong> · updated <strong>{r.updated}</strong> · errors{' '}
          <strong>{r.errors.length}</strong>
        </p>
        {r.errors.length > 0 ? (
          <ul className="max-h-72 overflow-auto rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-800">
            {r.errors.map((e, i) => (
              <li key={i}>Row {e.row}: {e.message}</li>
            ))}
          </ul>
        ) : null}
        <button onClick={() => setState({ kind: 'idle' })} className="text-sm font-semibold text-brand-700 underline">
          Import another
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <label className="block text-sm">
        <span className="mb-1 block font-medium text-steel-800">.xlsx file</span>
        <input
          name="file"
          type="file"
          accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          required
          className="block w-full text-sm"
        />
      </label>
      {state.kind === 'error' ? <p className="text-sm text-red-600">{state.message}</p> : null}
      <Button type="submit" disabled={state.kind === 'submitting'}>
        {state.kind === 'submitting' ? 'Uploading…' : 'Upload'}
      </Button>
    </form>
  );
}
