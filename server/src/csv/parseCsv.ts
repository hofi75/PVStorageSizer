import { parse } from 'csv-parse/sync';
import { inferMapping } from './inferMapping.js';
import type { ColumnMapping } from '../simulation/types.js';

export interface ParsedCsv {
  delimiter: string;
  rows: string[][];
  suggestedHeader: boolean;
  columnCount: number;
  suggestedMapping: ColumnMapping;
}

const CANDIDATE_DELIMITERS = [';', ',', '\t'];

function detectDelimiter(sample: string): string {
  const firstLines = sample.split(/\r?\n/).slice(0, 5).filter(Boolean);
  let best = CANDIDATE_DELIMITERS[0];
  let bestCount = -1;
  for (const d of CANDIDATE_DELIMITERS) {
    const count = firstLines.reduce((sum, line) => sum + line.split(d).length - 1, 0);
    if (count > bestCount) {
      bestCount = count;
      best = d;
    }
  }
  return best;
}

function looksLikeHeader(row: string[]): boolean {
  // A header row usually has at least one cell that isn't parseable as a number or date-like token.
  return row.some((cell) => {
    const c = cell.trim();
    if (!c) return false;
    const isNumeric = /^-?[\d.,\s]+$/.test(c);
    const isDateLike = /\d{1,4}[.\-/]\d{1,2}[.\-/]\d{1,4}/.test(c) || /\d{1,2}:\d{2}/.test(c);
    return !isNumeric && !isDateLike;
  });
}

export function parseCsvBuffer(buffer: Buffer): ParsedCsv {
  const text = buffer.toString('utf8').replace(/^﻿/, '');
  const delimiter = detectDelimiter(text);

  const rows: string[][] = parse(text, {
    delimiter,
    relax_column_count: true,
    skip_empty_lines: true,
    trim: true,
  });

  const columnCount = rows.reduce((max, r) => Math.max(max, r.length), 0);
  const suggestedHeader = rows.length > 0 && looksLikeHeader(rows[0]);
  const suggestedMapping = inferMapping(rows, suggestedHeader, columnCount);

  return { delimiter, rows, suggestedHeader, columnCount, suggestedMapping };
}
