import { useRef } from 'react';
import type { ColumnMapping, ParsedCsv } from '../types';
import { useTranslation } from '../i18n/context';
import { ColumnMapper } from './ColumnMapper';

interface Props {
  idPrefix: string;
  title: string;
  description: string;
  fileName: string | null;
  parsed: ParsedCsv | null;
  mapping: ColumnMapping | null;
  loading: boolean;
  error: string | null;
  onFileSelected: (file: File) => void;
  onMappingChange: (mapping: ColumnMapping) => void;
}

export function FileUploadCard({
  idPrefix,
  title,
  description,
  fileName,
  parsed,
  mapping,
  loading,
  error,
  onFileSelected,
  onMappingChange,
}: Props) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) onFileSelected(file);
  };

  return (
    <div className="upload-card">
      <h2>{title}</h2>
      <p className="muted">{description}</p>

      <div
        className="dropzone"
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          id={`${idPrefix}-file-input`}
          type="file"
          accept=".csv,text/csv"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onFileSelected(file);
          }}
        />
        {fileName ? (
          <span>
            📄 {fileName}
            {parsed && ` — ${t('upload.rowCount', { count: parsed.rows.length })}`}
          </span>
        ) : (
          <span>{t('upload.dropzoneHint')}</span>
        )}
      </div>

      {loading && <p className="status">{t('upload.processing')}</p>}
      {error && <p className="status error">{error}</p>}

      {parsed && mapping && (
        <ColumnMapper idPrefix={idPrefix} parsed={parsed} mapping={mapping} onChange={onMappingChange} />
      )}
    </div>
  );
}
