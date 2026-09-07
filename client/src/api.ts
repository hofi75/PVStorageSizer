import type { FileMappingInput, ParsedCsv, SimulationParams, SimulationResponse } from './types';

async function readError(res: Response): Promise<string> {
  try {
    const data = await res.json();
    if (typeof data.error === 'string') return data.error;
  } catch {
    // ignore
  }
  return `Váratlan hiba történt (${res.status}).`;
}

export async function parseCsvFile(file: File): Promise<ParsedCsv> {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch('/api/parse-csv', { method: 'POST', body: form });
  if (!res.ok) throw new Error(await readError(res));
  return res.json();
}

export async function simulate(
  consumption: FileMappingInput,
  production: FileMappingInput,
  params: SimulationParams,
  gridExport?: FileMappingInput | null,
): Promise<SimulationResponse> {
  const res = await fetch('/api/simulate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ consumption, production, gridExport: gridExport ?? undefined, params }),
  });
  if (!res.ok) throw new Error(await readError(res));
  return res.json();
}
