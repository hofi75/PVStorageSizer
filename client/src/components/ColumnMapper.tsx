import type { ColumnMapping, ParsedCsv } from '../types';
import { DATE_ONLY_FORMATS, DATETIME_FORMATS } from '../types';
import { useTranslation, type TranslationKey } from '../i18n/context';

interface Props {
  idPrefix: string;
  parsed: ParsedCsv;
  mapping: ColumnMapping;
  onChange: (mapping: ColumnMapping) => void;
  /** Shows a second filter value picker for grid-backfeed rows (only meaningful for a
   *  grid-meter file that may mix usage and backfeed readings via a "type" column). */
  showGridBackfeedFilter?: boolean;
}

function columnLabel(
  parsed: ParsedCsv,
  mapping: ColumnMapping,
  index: number,
  t: (key: TranslationKey, params?: Record<string, string | number>) => string,
): string {
  const header = mapping.hasHeader ? parsed.rows[0]?.[index] : undefined;
  return header ? `${index + 1}. ${header}` : t('columnMapper.columnFallback', { index: index + 1 });
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

export function ColumnMapper({ idPrefix, parsed, mapping, onChange, showGridBackfeedFilter }: Props) {
  const { t } = useTranslation();
  const columnCount = parsed.columnCount;
  const previewRows = (mapping.hasHeader ? parsed.rows.slice(1) : parsed.rows).slice(0, 6);
  const columns = Array.from({ length: columnCount }, (_, i) => i);
  const id = (name: string) => `${idPrefix}-${name}`;
  const label = (i: number) => columnLabel(parsed, mapping, i, t);

  const set = <K extends keyof ColumnMapping>(key: K, value: ColumnMapping[K]) =>
    onChange({ ...mapping, [key]: value });

  return (
    <div className="column-mapper">
      <div className="csv-preview">
        <table>
          <thead>
            <tr>
              {columns.map((i) => (
                <th key={i}>{label(i)}</th>
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
        {t('columnMapper.hasHeader')}
      </label>

      <div className="field-row">
        <span className="field-label">{t('columnMapper.timestampFormatLabel')}</span>
        <div className="radio-group">
          <label>
            <input
              type="radio"
              checked={mapping.timestampMode === 'single'}
              onChange={() => set('timestampMode', 'single')}
            />
            {t('columnMapper.timestampSingle')}
          </label>
          <label>
            <input
              type="radio"
              checked={mapping.timestampMode === 'split'}
              onChange={() => set('timestampMode', 'split')}
            />
            {t('columnMapper.timestampSplit')}
          </label>
        </div>
      </div>

      {mapping.timestampMode === 'single' ? (
        <div className="field-row">
          <label className="field-label" htmlFor={id('timestampCol')}>
            {t('columnMapper.timestampCol')}
          </label>
          <select
            id={id('timestampCol')}
            value={mapping.timestampCol}
            onChange={(e) => set('timestampCol', Number(e.target.value))}
          >
            {columns.map((i) => (
              <option key={i} value={i}>
                {label(i)}
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
            {t('columnMapper.dateCol')}
          </label>
          <select id={id('dateCol')} value={mapping.dateCol} onChange={(e) => set('dateCol', Number(e.target.value))}>
            {columns.map((i) => (
              <option key={i} value={i}>
                {label(i)}
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
            {t('columnMapper.timeCol')}
          </label>
          <select id={id('timeCol')} value={mapping.timeCol} onChange={(e) => set('timeCol', Number(e.target.value))}>
            {columns.map((i) => (
              <option key={i} value={i}>
                {label(i)}
              </option>
            ))}
          </select>
          <span className="hint">{t('columnMapper.timeHint')}</span>
        </div>
      )}

      <div className="field-row">
        <span className="field-label">{t('columnMapper.alignmentLabel')}</span>
        <div className="radio-group">
          <label>
            <input
              type="radio"
              checked={mapping.timestampAlignment === 'end'}
              onChange={() => set('timestampAlignment', 'end')}
            />
            {t('columnMapper.alignmentEnd')}
          </label>
          <label>
            <input
              type="radio"
              checked={mapping.timestampAlignment === 'start'}
              onChange={() => set('timestampAlignment', 'start')}
            />
            {t('columnMapper.alignmentStart')}
          </label>
        </div>
      </div>

      <div className="field-row">
        <label className="field-label" htmlFor={id('valueCol')}>
          {t('columnMapper.valueCol')}
        </label>
        <select id={id('valueCol')} value={mapping.valueCol} onChange={(e) => set('valueCol', Number(e.target.value))}>
          {columns.map((i) => (
            <option key={i} value={i}>
              {label(i)}
            </option>
          ))}
        </select>
        <select
          id={id('valueUnit')}
          value={mapping.valueUnit}
          onChange={(e) => set('valueUnit', e.target.value as ColumnMapping['valueUnit'])}
        >
          <option value="kWh">{t('columnMapper.unitKWh')}</option>
          <option value="kW">{t('columnMapper.unitKW')}</option>
          <option value="W">{t('columnMapper.unitW')}</option>
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
              onChange({ ...mapping, filterCol: col, filterValue: values[0] ?? '', gridBackfeedValue: null });
            } else {
              onChange({ ...mapping, filterCol: null, filterValue: '', gridBackfeedValue: null });
            }
          }}
        />
        {t('columnMapper.filterToggle')}
      </label>

      {mapping.filterCol !== null && (
        <div className="field-row">
          <label className="field-label" htmlFor={id('filterCol')}>
            {t('columnMapper.filterColLabel')}
          </label>
          <select
            id={id('filterCol')}
            value={mapping.filterCol}
            onChange={(e) => {
              const col = Number(e.target.value);
              const values = distinctValues(parsed, mapping, col);
              onChange({ ...mapping, filterCol: col, filterValue: values[0] ?? '', gridBackfeedValue: null });
            }}
          >
            {columns.map((i) => (
              <option key={i} value={i}>
                {label(i)}
              </option>
            ))}
          </select>
          <label className="field-label" htmlFor={id('filterValue')}>
            {t(showGridBackfeedFilter ? 'columnMapper.filterValueLabelGridUsage' : 'columnMapper.filterValueLabel')}
          </label>
          <select
            id={id('filterValue')}
            value={mapping.filterValue}
            onChange={(e) => {
              const filterValue = e.target.value;
              // Prevent picking the same value for both grid usage and grid backfeed.
              const backfeedClash = mapping.gridBackfeedValue === filterValue;
              onChange({ ...mapping, filterValue, gridBackfeedValue: backfeedClash ? null : mapping.gridBackfeedValue });
            }}
          >
            {distinctValues(parsed, mapping, mapping.filterCol).map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </div>
      )}

      {mapping.filterCol !== null && showGridBackfeedFilter && (
        <div className="field-row">
          <label className="field-label" htmlFor={id('gridBackfeedValue')}>
            {t('columnMapper.gridBackfeedValueLabel')}
          </label>
          <select
            id={id('gridBackfeedValue')}
            value={mapping.gridBackfeedValue ?? ''}
            onChange={(e) => set('gridBackfeedValue', e.target.value || null)}
          >
            <option value="">{t('columnMapper.gridBackfeedNoneOption')}</option>
            {distinctValues(parsed, mapping, mapping.filterCol)
              .filter((v) => v !== mapping.filterValue)
              .map((v) => (
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
        {t('columnMapper.missingToggle')}
      </label>

      {mapping.missingStatusCol !== null && (
        <div className="field-row">
          <label className="field-label" htmlFor={id('missingStatusCol')}>
            {t('columnMapper.missingColLabel')}
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
                {label(i)}
              </option>
            ))}
          </select>
          <label className="field-label" htmlFor={id('missingStatusValue')}>
            {t('columnMapper.missingValueLabel')}
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
