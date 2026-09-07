import type { RowParseDiagnostics } from './simulation/resample.js';

export type Lang = 'en' | 'hu' | 'de';

export function resolveLang(raw: unknown): Lang {
  return raw === 'hu' || raw === 'de' ? raw : 'en';
}

const MONTH_LOCALE: Record<Lang, string> = { en: 'en-GB', hu: 'hu-HU', de: 'de-DE' };

/** Locale-appropriate short "Month Year" label (e.g. "2026. jan." / "Jan 2026" / "Jan. 2026"). */
export function monthLabel(lang: Lang, timestampMs: number): string {
  return new Intl.DateTimeFormat(MONTH_LOCALE[lang], { year: 'numeric', month: 'short' }).format(
    new Date(timestampMs),
  );
}

export type DatasetKind = 'consumption' | 'production' | 'gridExport';

const DATASET_LABEL: Record<Lang, Record<DatasetKind, string>> = {
  en: { consumption: 'consumption', production: 'production', gridExport: 'grid-exported energy' },
  hu: { consumption: 'fogyasztási', production: 'termelési', gridExport: 'hálózatba visszatáplált energia' },
  de: { consumption: 'Verbrauchs', production: 'Erzeugungs', gridExport: 'Netzeinspeisungs' },
};

export function noFileUploaded(lang: Lang): string {
  return { en: 'No file was received.', hu: 'Nem érkezett fájl.', de: 'Es wurde keine Datei empfangen.' }[lang];
}

export function emptyOrUnreadableCsv(lang: Lang): string {
  return {
    en: 'The CSV file is empty or could not be read.',
    hu: 'A CSV fájl üres, vagy nem sikerült beolvasni.',
    de: 'Die CSV-Datei ist leer oder konnte nicht gelesen werden.',
  }[lang];
}

export function csvParseFailed(lang: Lang, message: string): string {
  return {
    en: `Failed to parse the CSV: ${message}`,
    hu: `A CSV feldolgozása sikertelen: ${message}`,
    de: `Die CSV konnte nicht verarbeitet werden: ${message}`,
  }[lang];
}

export function incompleteSimulateRequest(lang: Lang): string {
  return {
    en: 'Incomplete request: consumption data, production data, or parameters are missing.',
    hu: 'Hiányos kérés: fogyasztási adat, termelési adat vagy paraméterek hiányoznak.',
    de: 'Unvollständige Anfrage: Verbrauchsdaten, Erzeugungsdaten oder Parameter fehlen.',
  }[lang];
}

export function noOverlapError(lang: Lang): string {
  return {
    en: "The two files' time ranges don't overlap - there's no common period to run the simulation on.",
    hu: 'A két fájl időtartománya nem fedi egymást – nincs közös időszak, amire a szimulációt el lehetne végezni.',
    de:
      'Die Zeiträume der beiden Dateien überschneiden sich nicht - es gibt keinen gemeinsamen Zeitraum für die ' +
      'Simulation.',
  }[lang];
}

export function noValidIntervalsError(lang: Lang): string {
  return {
    en: 'Could not extract valid data from the consumption or production file.',
    hu: 'A fogyasztási vagy a termelési fájlból nem sikerült érvényes adatot kinyerni.',
    de: 'Aus der Verbrauchs- oder Erzeugungsdatei konnten keine gültigen Daten extrahiert werden.',
  }[lang];
}

/** Picks the grammatically correct form for a count - only en/de inflect for singular vs plural. */
function agree(n: number, singular: string, plural: string): string {
  return n === 1 ? singular : plural;
}

function rowReasonLabel(lang: Lang, reason: 'timestamp' | 'value'): string {
  const labels: Record<Lang, Record<'timestamp' | 'value', string>> = {
    en: { timestamp: 'timestamp', value: 'value' },
    hu: { timestamp: 'időbélyeg', value: 'érték' },
    de: { timestamp: 'Zeitstempel', value: 'Wert' },
  };
  return labels[lang][reason];
}

export function formatSampleRows(lang: Lang, d: RowParseDiagnostics): string {
  if (d.sampleFailedRows.length === 0) return '';
  const lines = d.sampleFailedRows.map((s) => {
    const reason = rowReasonLabel(lang, s.reason);
    const row = s.row.join(';');
    if (lang === 'hu') return `  - ${s.line}. sor (${reason} hiba): ${row}`;
    if (lang === 'de') return `  - Zeile ${s.line} (Fehler bei ${reason}): ${row}`;
    return `  - line ${s.line} (${reason} error): ${row}`;
  });
  const header = {
    en: 'Example failed rows:',
    hu: 'Példa sikertelen sorokra:',
    de: 'Beispiele für fehlgeschlagene Zeilen:',
  }[lang];
  return `\n${header}\n${lines.join('\n')}`;
}

export function describeEmptyResult(lang: Lang, kind: DatasetKind, d: RowParseDiagnostics): string {
  const label = DATASET_LABEL[lang][kind];
  const parts: string[] = [];

  if (lang === 'hu') {
    if (d.filteredOut > 0) parts.push(`${d.filteredOut} sor a szűrő miatt lett kizárva`);
    if (d.timestampParseFailed > 0) {
      parts.push(`${d.timestampParseFailed} sornál nem sikerült az időbélyeget feldolgozni (rossz oszlop vagy dátumformátum?)`);
    }
    if (d.valueParseFailed > 0) parts.push(`${d.valueParseFailed} sornál nem sikerült az értéket számként beolvasni (rossz oszlop?)`);
    const detail =
      parts.length > 0
        ? ` Részletek: ${d.totalDataRows} adatsorból ${parts.join(', ')}.`
        : ` (${d.totalDataRows} adatsor volt, de egy sem illett a hozzárendelésre.)`;
    return (
      `A ${label} CSV oszlop-hozzárendelésével nem sikerült érvényes adatot kinyerni. Ellenőrizd az oszlopokat ` +
      `és a dátumformátumot.${detail}${formatSampleRows(lang, d)}`
    );
  }

  if (lang === 'de') {
    if (d.filteredOut > 0) {
      const zeile = agree(d.filteredOut, 'Zeile wurde', 'Zeilen wurden');
      parts.push(`${d.filteredOut} ${zeile} durch den Filter ausgeschlossen`);
    }
    if (d.timestampParseFailed > 0) {
      const zeile = agree(d.timestampParseFailed, 'Zeile', 'Zeilen');
      parts.push(`bei ${d.timestampParseFailed} ${zeile} konnte der Zeitstempel nicht verarbeitet werden (falsche Spalte oder falsches Datumsformat?)`);
    }
    if (d.valueParseFailed > 0) {
      const zeile = agree(d.valueParseFailed, 'Zeile', 'Zeilen');
      parts.push(`bei ${d.valueParseFailed} ${zeile} konnte der Wert nicht als Zahl gelesen werden (falsche Spalte?)`);
    }
    const datenzeile = agree(d.totalDataRows, 'Datenzeile', 'Datenzeilen');
    const detail =
      parts.length > 0
        ? ` Details: von ${d.totalDataRows} ${datenzeile} ${parts.join(', ')}.`
        : ` (Es gab ${d.totalDataRows} ${datenzeile}, aber keine passte zur Zuordnung.)`;
    return (
      `Mit der Spaltenzuordnung der ${label}-CSV konnten keine gültigen Daten extrahiert werden. Überprüfe die ` +
      `Spalten und das Datumsformat.${detail}${formatSampleRows(lang, d)}`
    );
  }

  if (d.filteredOut > 0) {
    const row = agree(d.filteredOut, 'row was', 'rows were');
    parts.push(`${d.filteredOut} ${row} excluded by the filter`);
  }
  if (d.timestampParseFailed > 0) {
    const row = agree(d.timestampParseFailed, 'row', 'rows');
    parts.push(`${d.timestampParseFailed} ${row} failed to parse the timestamp (wrong column or date format?)`);
  }
  if (d.valueParseFailed > 0) {
    const row = agree(d.valueParseFailed, 'row', 'rows');
    parts.push(`${d.valueParseFailed} ${row} failed to parse the value as a number (wrong column?)`);
  }
  const dataRow = agree(d.totalDataRows, 'data row', 'data rows');
  const detail =
    parts.length > 0
      ? ` Details: of ${d.totalDataRows} ${dataRow}, ${parts.join(', ')}.`
      : ` (there ${agree(d.totalDataRows, 'was', 'were')} ${d.totalDataRows} ${dataRow}, but none matched the mapping.)`;
  return (
    `Could not extract valid data from the ${label} CSV with the current column mapping. Check the columns ` +
    `and the date format.${detail}${formatSampleRows(lang, d)}`
  );
}

export function describePartialFailures(lang: Lang, kind: DatasetKind, d: RowParseDiagnostics): string | null {
  const label = DATASET_LABEL[lang][kind];
  const messages: string[] = [];

  if (d.timestampParseFailed > 0 || d.valueParseFailed > 0) {
    if (lang === 'hu') {
      const parts: string[] = [];
      if (d.timestampParseFailed > 0) parts.push(`${d.timestampParseFailed} sornál az időbélyeg`);
      if (d.valueParseFailed > 0) parts.push(`${d.valueParseFailed} sornál az érték`);
      messages.push(
        `A ${label} CSV-ben ${parts.join(', ')} feldolgozása nem sikerült, ezek a sorok kimaradtak a ` +
          `számításból.${formatSampleRows(lang, d)}`,
      );
    } else if (lang === 'de') {
      const parts: string[] = [];
      if (d.timestampParseFailed > 0) {
        parts.push(`bei ${d.timestampParseFailed} ${agree(d.timestampParseFailed, 'Zeile', 'Zeilen')} der Zeitstempel`);
      }
      if (d.valueParseFailed > 0) {
        parts.push(`bei ${d.valueParseFailed} ${agree(d.valueParseFailed, 'Zeile', 'Zeilen')} der Wert`);
      }
      messages.push(
        `In der ${label}-CSV konnte ${parts.join(' und ')} nicht verarbeitet werden, diese Zeilen wurden aus ` +
          `der Berechnung ausgeschlossen.${formatSampleRows(lang, d)}`,
      );
    } else {
      const parts: string[] = [];
      if (d.timestampParseFailed > 0) {
        parts.push(`the timestamp in ${d.timestampParseFailed} ${agree(d.timestampParseFailed, 'row', 'rows')}`);
      }
      if (d.valueParseFailed > 0) {
        parts.push(`the value in ${d.valueParseFailed} ${agree(d.valueParseFailed, 'row', 'rows')}`);
      }
      messages.push(
        `Failed to parse ${parts.join(' and ')} in the ${label} CSV; those rows were excluded from the ` +
          `calculation.${formatSampleRows(lang, d)}`,
      );
    }
  }

  if (d.missingSubstituted > 0 || d.missingUnresolved > 0) {
    if (lang === 'hu') {
      let msg =
        `A ${label} CSV-ben ${d.missingSubstituted} sornál jelzett a státusz oszlop hiányzó adatot - ezeknél ` +
        `egy korábbi nap azonos időpontbeli értékét használtuk.`;
      if (d.missingUnresolved > 0) {
        msg += ` ${d.missingUnresolved} esetben nem volt található korábbi (nem hiányzó) érték, ott az eredeti (valószínűleg érvénytelen) érték maradt.`;
      }
      messages.push(msg);
    } else if (lang === 'de') {
      const zeile = agree(d.missingSubstituted, 'Zeile', 'Zeilen');
      let msg =
        `In der ${label}-CSV hat die Statusspalte bei ${d.missingSubstituted} ${zeile} fehlende Daten markiert ` +
        `- dafür wurde der Wert derselben Tageszeit von einem früheren Tag verwendet.`;
      if (d.missingUnresolved > 0) {
        msg += ` In ${d.missingUnresolved} Fällen war kein früherer (nicht fehlender) Wert auffindbar; dort blieb der ursprüngliche (wahrscheinlich ungültige) Wert erhalten.`;
      }
      messages.push(msg);
    } else {
      const row = agree(d.missingSubstituted, 'row', 'rows');
      let msg =
        `In the ${label} CSV, the status column flagged ${d.missingSubstituted} ${row} as missing data - the ` +
        `same time-of-day value from an earlier day was used for those.`;
      if (d.missingUnresolved > 0) {
        msg += ` In ${d.missingUnresolved} cases no earlier (non-missing) value could be found, so the original (likely invalid) value was kept.`;
      }
      messages.push(msg);
    }
  }

  return messages.length > 0 ? messages.join('\n') : null;
}
