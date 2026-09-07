import type { FileMappingInput, ParsedCsv, SimulationParams, SimulationResponse } from './types';
import type { Lang } from './i18n/context';
import { en } from './i18n/en';
import { hu } from './i18n/hu';
import { de } from './i18n/de';

const DICTS = { en, hu, de };

async function readError(res: Response, lang: Lang): Promise<string> {
  try {
    const data = await res.json();
    if (typeof data.error === 'string') return data.error;
  } catch {
    // ignore
  }
  return DICTS[lang]['errors.unexpectedStatus'].replace('{{status}}', String(res.status));
}

export async function parseCsvFile(file: File, lang: Lang): Promise<ParsedCsv> {
  const form = new FormData();
  form.append('file', file);
  form.append('lang', lang);
  const res = await fetch('/api/parse-csv', { method: 'POST', body: form });
  if (!res.ok) throw new Error(await readError(res, lang));
  return res.json();
}

export async function simulate(
  consumption: FileMappingInput,
  production: FileMappingInput,
  params: SimulationParams,
  gridExport: FileMappingInput | null | undefined,
  lang: Lang,
  forcedCapacityKWh?: number,
): Promise<SimulationResponse> {
  const res = await fetch('/api/simulate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      consumption,
      production,
      gridExport: gridExport ?? undefined,
      params,
      lang,
      forcedCapacityKWh,
    }),
  });
  if (!res.ok) throw new Error(await readError(res, lang));
  return res.json();
}
