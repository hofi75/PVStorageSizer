import type { ColumnMapping, ParsedCsv } from '../types';
import { DATE_ONLY_FORMATS, DATETIME_FORMATS } from '../types';

interface Props {
  idPrefix: string;
  parsed: ParsedCsv;
  mapping: ColumnMapping;
  onChange: (mapping: ColumnMapping) => void;
}

function columnLabel(parsed: ParsedCsv, mapping: ColumnMapping, index: number): string {
  const header = mapping.hasHeader ? parsed.rows[0]?.[index] : undefined;
  return header ? `${index + 1}. ${header}` : `${index + 1}. oszlop`;
}

export function distinctValues(parsed: ParsedCsv, mapping: ColumnMapping, col: number): string[] {
  const dataRows = mapping.hasHeader ? parsed.rows.slice(1) : parsed.rows;
  const seen = new Set<string>();
  for (const row of dataRows) {
    const v = row[col]?.trim();
    if (v) seen.add(v);
  }
  return Array.from(seen).sort();
}

export function ColumnMapper({ idPrefix, parsed, mapping, onChange }: Props) {
  const columnCount = parsed.columnCount;
  const previewRows = (mapping.hasHeader ? parsed.rows.slice(1) : parsed.rows).slice(0, 6);
  const columns = Array.from({ length: columnCount }, (_, i) => i);
  const id = (name: string) => `${idPrefix}-${name}`;

  const set = <K extends keyof ColumnMapping>(key: K, value: ColumnMapping[K]) =>
    onChange({ ...mapping, [key]: value });

  return (
    <div className="column-mapper">
      <div className="csv-preview">
        <table>
          <thead>
            <tr>
              {columns.map((i) => (
                <th key={i}>{columnLabel(parsed, mapping, i)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {previewRows.map((row, ri) => (
              <tr key={ri}>
                {columns.map((i) => (
                  <td key={i}>{row[i] ?? ''}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <label className="checkbox-row">
        <input
          type="checkbox"
          checked={mapping.hasHeader}
          onChange={(e) => set('hasHeader', e.target.checked)}
        />
        Az első sor fejléc (nem adat)
      </label>

      <div className="field-row">
        <span className="field-label">Időbélyeg formátuma a fájlban</span>
        <div className="radio-group">
          <label>
            <input
              type="radio"
              checked={mapping.timestampMode === 'single'}
              onChange={() => set('timestampMode', 'single')}
            />
            Egy oszlopban (dátum + idő együtt)
          </label>
          <label>
            <input
              type="radio"
              checked={mapping.timestampMode === 'split'}
              onChange={() => set('timestampMode', 'split')}
            />
            Külön dátum és idő oszlopban
          </label>
        </div>
      </div>

      {mapping.timestampMode === 'single' ? (
        <div className="field-row">
          <label className="field-label" htmlFor={id('timestampCol')}>
            Időbélyeg oszlop
          </label>
          <select
            id={id('timestampCol')}
            value={mapping.timestampCol}
            onChange={(e) => set('timestampCol', Number(e.target.value))}
          >
            {columns.map((i) => (
              <option key={i} value={i}>
                {columnLabel(parsed, mapping, i)}
              </option>
            ))}
          </select>
          <select id={id('dateFormat')} value={mapping.dateFormat} onChange={(e) => set('dateFormat', e.target.value)}>
            {DATETIME_FORMATS.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <div className="field-row">
          <label className="field-label" htmlFor={id('dateCol')}>
            Dátum oszlop
          </label>
          <select id={id('dateCol')} value={mapping.dateCol} onChange={(e) => set('dateCol', Number(e.target.value))}>
            {columns.map((i) => (
              <option key={i} value={i}>
                {columnLabel(parsed, mapping, i)}
              </option>
            ))}
          </select>
          <select
            id={id('dateFormatSplit')}
            value={mapping.dateFormat}
            onChange={(e) => set('dateFormat', e.target.value)}
          >
            {DATE_ONLY_FORMATS.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
          <label className="field-label" htmlFor={id('timeCol')}>
            Idő oszlop
          </label>
          <select id={id('timeCol')} value={mapping.timeCol} onChange={(e) => set('timeCol', Number(e.target.value))}>
            {columns.map((i) => (
              <option key={i} value={i}>
                {columnLabel(parsed, mapping, i)}
              </option>
            ))}
          </select>
          <span className="hint">formátum: ÓÓ:PP vagy ÓÓ:PP:MM</span>
        </div>
      )}

      <div className="field-row">
        <span className="field-label">Az időbélyeg az intervallum...</span>
        <div className="radio-group">
          <label>
            <input
              type="radio"
              checked={mapping.timestampAlignment === 'end'}
              onChange={() => set('timestampAlignment', 'end')}
            />
            végét jelöli (pl. "00:15" = 00:00–00:15 közötti adat)
          </label>
          <label>
            <input
              type="radio"
              checked={mapping.timestampAlignment === 'start'}
              onChange={() => set('timestampAlignment', 'start')}
            />
            kezdetét jelöli
          </label>
        </div>
      </div>

      <div className="field-row">
        <label className="field-label" htmlFor={id('valueCol')}>
          Érték oszlop
        </label>
        <select id={id('valueCol')} value={mapping.valueCol} onChange={(e) => set('valueCol', Number(e.target.value))}>
          {columns.map((i) => (
            <option key={i} value={i}>
              {columnLabel(parsed, mapping, i)}
            </option>
          ))}
        </select>
        <select
          id={id('valueUnit')}
          value={mapping.valueUnit}
          onChange={(e) => set('valueUnit', e.target.value as ColumnMapping['valueUnit'])}
        >
          <option value="kWh">kWh (energia / intervallum)</option>
          <option value="kW">kW (átlagteljesítmény)</option>
          <option value="W">W (átlagteljesítmény)</option>
        </select>
      </div>

      <label className="checkbox-row">
        <input
          type="checkbox"
          checked={mapping.filterCol !== null}
          onChange={(e) => {
            if (e.target.checked) {
              const col = columns.find((i) => i !== mapping.valueCol) ?? 0;
              const values = distinctValues(parsed, mapping, col);
              onChange({ ...mapping, filterCol: col, filterValue: values[0] ?? '' });
            } else {
              onChange({ ...mapping, filterCol: null, filterValue: '' });
            }
          }}
        />
        Csak bizonyos sorok felhasználása (pl. ha a fájl fogyasztási és termelési
        adatokat is tartalmaz egy "típus" oszloppal)
      </label>

      {mapping.filterCol !== null && (
        <div className="field-row">
          <label className="field-label" htmlFor={id('filterCol')}>
            Szűrés oszlopa
          </label>
          <select
            id={id('filterCol')}
            value={mapping.filterCol}
            onChange={(e) => {
              const col = Number(e.target.value);
              const values = distinctValues(parsed, mapping, col);
              set('filterCol', col);
              onChange({ ...mapping, filterCol: col, filterValue: values[0] ?? '' });
            }}
          >
            {columns.map((i) => (
              <option key={i} value={i}>
                {columnLabel(parsed, mapping, i)}
              </option>
            ))}
          </select>
          <label className="field-label" htmlFor={id('filterValue')}>
            Elvárt érték
          </label>
          <select
            id={id('filterValue')}
            value={mapping.filterValue}
            onChange={(e) => set('filterValue', e.target.value)}
          >
            {distinctValues(parsed, mapping, mapping.filterCol).map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </div>
      )}

      <label className="checkbox-row">
        <input
          type="checkbox"
          checked={mapping.missingStatusCol !== null}
          onChange={(e) => {
            if (e.target.checked) {
              const col = columns.find((i) => i !== mapping.valueCol) ?? 0;
              const values = distinctValues(parsed, mapping, col);
              onChange({ ...mapping, missingStatusCol: col, missingStatusValue: values[0] ?? '' });
            } else {
              onChange({ ...mapping, missingStatusCol: null, missingStatusValue: '' });
            }
          }}
        />
        Van egy "státusz" oszlop, ami jelzi a hiányzó/érvénytelen adatot (pl. "Nincs") - ezeknél egy korábbi
        nap azonos időpontbeli értékét használjuk
      </label>

      {mapping.missingStatusCol !== null && (
        <div className="field-row">
          <label className="field-label" htmlFor={id('missingStatusCol')}>
            Státusz oszlopa
          </label>
          <select
            id={id('missingStatusCol')}
            value={mapping.missingStatusCol}
            onChange={(e) => {
              const col = Number(e.target.value);
              const values = distinctValues(parsed, mapping, col);
              onChange({ ...mapping, missingStatusCol: col, missingStatusValue: values[0] ?? '' });
            }}
          >
            {columns.map((i) => (
              <option key={i} value={i}>
                {columnLabel(parsed, mapping, i)}
              </option>
            ))}
          </select>
          <label className="field-label" htmlFor={id('missingStatusValue')}>
            Hiányzó adatot jelző érték
          </label>
          <select
            id={id('missingStatusValue')}
            value={mapping.missingStatusValue}
            onChange={(e) => set('missingStatusValue', e.target.value)}
          >
            {distinctValues(parsed, mapping, mapping.missingStatusCol).map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
