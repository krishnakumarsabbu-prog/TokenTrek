import { useCallback, useRef, useState } from 'react';
import { Upload, X, CircleCheck as CheckCircle, CircleAlert as AlertCircle, ChevronDown, ChevronUp, FileSpreadsheet, Eye, EyeOff } from 'lucide-react';
import * as XLSX from 'xlsx';

const ACCEPTED_COLUMNS = new Set([
  'record_id','platform','source_file','user_id','user_name','email','team','department','project',
  'repository','branch','timestamp','session_id','request_id','tool_name','tool_version',
  'prompt_category','prompt_subcategory','prompt_text','prompt_hash','response_text','model_name',
  'model_provider','input_tokens','output_tokens','total_tokens','cached_tokens','cost_usd',
  'latency_ms','status','success_flag','accepted_flag','rejected_flag','retry_count',
  'code_lines_generated','code_lines_accepted','code_lines_rejected','language','framework',
  'file_type','task_type','task_subtype','security_flag','contains_pii','contains_secret',
  'sentiment_score','quality_score','feedback_rating','device_type','os','region','workspace','custom_tags',
]);

interface ParsedFile {
  id: string;
  name: string;
  size: number;
  status: 'pending' | 'parsing' | 'validating' | 'done' | 'error';
  progress: number;
  headers: string[];
  validHeaders: string[];
  unknownHeaders: string[];
  rows: Record<string, unknown>[];
  rowCount: number;
  errorMsg?: string;
  previewOpen: boolean;
  showAllCols: boolean;
}

function formatBytes(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / (1024 * 1024)).toFixed(1)} MB`;
}

function parseFile(file: File): Promise<{ headers: string[]; rows: Record<string, unknown>[] }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const wb = XLSX.read(data, { type: 'binary', raw: false });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '' });
        const headers = json.length > 0 ? Object.keys(json[0]) : [];
        resolve({ headers, rows: json });
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('File read error'));
    reader.readAsBinaryString(file);
  });
}

export default function UploadParser() {
  const [files, setFiles] = useState<ParsedFile[]>([]);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [imported, setImported] = useState<Record<string, unknown>[]>([]);
  const [importDone, setImportDone] = useState(false);

  const processFile = useCallback(async (raw: File) => {
    const id = `${raw.name}-${Date.now()}`;

    setFiles(prev => [...prev, {
      id, name: raw.name, size: raw.size,
      status: 'parsing', progress: 10,
      headers: [], validHeaders: [], unknownHeaders: [],
      rows: [], rowCount: 0, previewOpen: false, showAllCols: false,
    }]);

    const tick = (progress: number, status: ParsedFile['status']) =>
      setFiles(prev => prev.map(f => f.id === id ? { ...f, progress, status } : f));

    try {
      await new Promise(r => setTimeout(r, 200));
      tick(40, 'parsing');

      const { headers, rows } = await parseFile(raw);

      tick(70, 'validating');
      await new Promise(r => setTimeout(r, 150));

      const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, '_');
      const validHeaders = headers.filter(h => ACCEPTED_COLUMNS.has(norm(h)));
      const unknownHeaders = headers.filter(h => !ACCEPTED_COLUMNS.has(norm(h)));

      tick(100, 'done');
      setFiles(prev => prev.map(f =>
        f.id === id ? {
          ...f, status: 'done', progress: 100,
          headers, validHeaders, unknownHeaders,
          rows, rowCount: rows.length,
        } : f
      ));
    } catch (err) {
      setFiles(prev => prev.map(f =>
        f.id === id ? { ...f, status: 'error', progress: 100, errorMsg: String(err) } : f
      ));
    }
  }, []);

  const addFiles = useCallback((rawFiles: FileList | File[]) => {
    Array.from(rawFiles).forEach(f => {
      const ext = f.name.split('.').pop()?.toLowerCase();
      if (!['csv', 'xlsx', 'xls'].includes(ext ?? '')) return;
      processFile(f);
    });
  }, [processFile]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    addFiles(e.dataTransfer.files);
  }, [addFiles]);

  const removeFile = (id: string) => setFiles(prev => prev.filter(f => f.id !== id));

  const togglePreview = (id: string) =>
    setFiles(prev => prev.map(f => f.id === id ? { ...f, previewOpen: !f.previewOpen } : f));

  const toggleCols = (id: string) =>
    setFiles(prev => prev.map(f => f.id === id ? { ...f, showAllCols: !f.showAllCols } : f));

  const importAll = () => {
    const allRows: Record<string, unknown>[] = [];
    files.filter(f => f.status === 'done').forEach(f => {
      f.rows.forEach(row => {
        const clean: Record<string, unknown> = {};
        f.validHeaders.forEach(h => { clean[h.trim().toLowerCase().replace(/\s+/g, '_')] = row[h]; });
        allRows.push(clean);
      });
    });
    setImported(allRows);
    setImportDone(true);
  };

  const doneFiles = files.filter(f => f.status === 'done');
  const totalRows = doneFiles.reduce((s, f) => s + f.rowCount, 0);
  const totalCols = doneFiles.length > 0
    ? Math.max(...doneFiles.map(f => f.validHeaders.length))
    : 0;

  return (
    <div className="flex flex-col gap-6 p-6 animate-fade-in min-h-full" style={{ background: '#f8fafc' }}>
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold" style={{ color: '#0f172a' }}>Upload & Parse</h1>
        <p className="text-sm mt-1" style={{ color: '#64748b' }}>
          Import CSV or Excel files. Headers are validated against the TokenTrek schema.
        </p>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className="rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-3 cursor-pointer transition-all duration-200 select-none"
        style={{
          minHeight: 180,
          borderColor: dragging ? '#0078d4' : '#cbd5e1',
          background: dragging ? '#eff6ff' : '#fff',
        }}
      >
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center"
          style={{ background: dragging ? '#dbeafe' : '#f1f5f9' }}
        >
          <Upload size={22} style={{ color: dragging ? '#0078d4' : '#64748b' }} />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium" style={{ color: '#0f172a' }}>
            {dragging ? 'Drop files here' : 'Drag & drop files, or click to browse'}
          </p>
          <p className="text-xs mt-1" style={{ color: '#94a3b8' }}>
            Supports .csv, .xlsx, .xls — multiple files allowed
          </p>
        </div>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".csv,.xlsx,.xls"
          className="hidden"
          onChange={e => e.target.files && addFiles(e.target.files)}
        />
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="flex flex-col gap-3">
          {files.map(f => (
            <div
              key={f.id}
              className="rounded-xl border overflow-hidden"
              style={{ background: '#fff', borderColor: '#e2e8f0' }}
            >
              {/* File header row */}
              <div className="flex items-center gap-3 px-4 py-3">
                <FileSpreadsheet size={18} style={{ color: '#0078d4', flexShrink: 0 }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium truncate" style={{ color: '#0f172a' }}>{f.name}</span>
                    <span className="text-xs" style={{ color: '#94a3b8' }}>{formatBytes(f.size)}</span>
                  </div>

                  {/* Progress bar */}
                  {f.status !== 'done' && f.status !== 'error' && (
                    <div className="mt-1.5 h-1.5 rounded-full overflow-hidden" style={{ background: '#e2e8f0' }}>
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{ width: `${f.progress}%`, background: '#0078d4' }}
                      />
                    </div>
                  )}

                  {f.status === 'done' && (
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs" style={{ color: '#64748b' }}>
                        {f.rowCount.toLocaleString()} rows &middot; {f.validHeaders.length} valid cols
                        {f.unknownHeaders.length > 0 && (
                          <span style={{ color: '#f59e0b' }}> &middot; {f.unknownHeaders.length} unknown</span>
                        )}
                      </span>
                    </div>
                  )}

                  {f.status === 'error' && (
                    <p className="text-xs mt-0.5" style={{ color: '#ef4444' }}>{f.errorMsg}</p>
                  )}
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {f.status === 'done' && (
                    <>
                      <CheckCircle size={15} style={{ color: '#22c55e' }} />
                      <button
                        onClick={() => togglePreview(f.id)}
                        className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors"
                        style={{ background: '#f1f5f9', color: '#475569' }}
                      >
                        {f.previewOpen ? <EyeOff size={12} /> : <Eye size={12} />}
                        {f.previewOpen ? 'Hide' : 'Preview'}
                      </button>
                    </>
                  )}
                  {f.status === 'error' && <AlertCircle size={15} style={{ color: '#ef4444' }} />}
                  <button
                    onClick={() => removeFile(f.id)}
                    className="p-1 rounded hover:bg-red-50 transition-colors"
                  >
                    <X size={14} style={{ color: '#94a3b8' }} />
                  </button>
                </div>
              </div>

              {/* Schema validation chips */}
              {f.status === 'done' && (
                <div className="px-4 pb-3 border-t" style={{ borderColor: '#f1f5f9' }}>
                  <div className="flex items-center justify-between mt-2 mb-1.5">
                    <span className="text-xs font-medium" style={{ color: '#64748b' }}>
                      Detected columns ({f.headers.length})
                    </span>
                    {f.headers.length > 8 && (
                      <button
                        onClick={() => toggleCols(f.id)}
                        className="flex items-center gap-0.5 text-xs"
                        style={{ color: '#0078d4' }}
                      >
                        {f.showAllCols ? <><ChevronUp size={12} /> Show less</> : <><ChevronDown size={12} /> Show all</>}
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {(f.showAllCols ? f.headers : f.headers.slice(0, 8)).map(h => {
                      const norm = h.trim().toLowerCase().replace(/\s+/g, '_');
                      const valid = ACCEPTED_COLUMNS.has(norm);
                      return (
                        <span
                          key={h}
                          className="text-xs px-2 py-0.5 rounded-full font-medium"
                          style={{
                            background: valid ? '#dcfce7' : '#fef3c7',
                            color: valid ? '#15803d' : '#92400e',
                          }}
                        >
                          {h}
                        </span>
                      );
                    })}
                    {!f.showAllCols && f.headers.length > 8 && (
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#f1f5f9', color: '#64748b' }}>
                        +{f.headers.length - 8} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Preview table */}
              {f.status === 'done' && f.previewOpen && (
                <div className="border-t overflow-x-auto" style={{ borderColor: '#e2e8f0', maxHeight: 280 }}>
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr style={{ background: '#f8fafc' }}>
                        <th
                          className="px-3 py-2 text-left font-medium sticky left-0"
                          style={{ color: '#475569', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', minWidth: 40 }}
                        >
                          #
                        </th>
                        {f.validHeaders.map(h => (
                          <th
                            key={h}
                            className="px-3 py-2 text-left font-medium whitespace-nowrap"
                            style={{ color: '#475569', borderBottom: '1px solid #e2e8f0', minWidth: 100 }}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {f.rows.slice(0, 10).map((row, i) => (
                        <tr
                          key={i}
                          style={{ borderBottom: '1px solid #f1f5f9' }}
                          className="hover:bg-slate-50 transition-colors"
                        >
                          <td className="px-3 py-1.5 sticky left-0 bg-white" style={{ color: '#94a3b8' }}>
                            {i + 1}
                          </td>
                          {f.validHeaders.map(h => (
                            <td
                              key={h}
                              className="px-3 py-1.5 whitespace-nowrap max-w-[200px] truncate"
                              style={{ color: '#334155' }}
                              title={String(row[h] ?? '')}
                            >
                              {String(row[h] ?? '')}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {f.rowCount > 10 && (
                    <div className="px-4 py-2 text-center text-xs" style={{ color: '#94a3b8', borderTop: '1px solid #f1f5f9' }}>
                      Showing 10 of {f.rowCount.toLocaleString()} rows
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Import button + summary */}
      {doneFiles.length > 0 && !importDone && (
        <div
          className="rounded-xl border p-4 flex items-center justify-between"
          style={{ background: '#fff', borderColor: '#e2e8f0' }}
        >
          <div>
            <p className="text-sm font-medium" style={{ color: '#0f172a' }}>
              {doneFiles.length} file{doneFiles.length > 1 ? 's' : ''} ready to import
            </p>
            <p className="text-xs mt-0.5" style={{ color: '#64748b' }}>
              {totalRows.toLocaleString()} rows &middot; up to {totalCols} valid columns per row
            </p>
          </div>
          <button
            onClick={importAll}
            className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-all duration-150 hover:opacity-90 active:scale-95"
            style={{ background: '#0078d4' }}
          >
            Import to Memory
          </button>
        </div>
      )}

      {/* Success summary */}
      {importDone && (
        <div
          className="rounded-xl border p-5 animate-fade-in"
          style={{ background: '#f0fdf4', borderColor: '#bbf7d0' }}
        >
          <div className="flex items-start gap-3">
            <CheckCircle size={20} style={{ color: '#16a34a', flexShrink: 0, marginTop: 1 }} />
            <div className="flex-1">
              <p className="text-sm font-semibold" style={{ color: '#15803d' }}>Import successful</p>
              <p className="text-sm mt-0.5" style={{ color: '#166534' }}>
                {imported.length.toLocaleString()} rows loaded into memory across {doneFiles.length} file{doneFiles.length > 1 ? 's' : ''}.
              </p>
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { label: 'Total rows', value: imported.length.toLocaleString() },
                  { label: 'Files imported', value: doneFiles.length },
                  { label: 'Valid columns', value: totalCols },
                  {
                    label: 'Unknown columns',
                    value: doneFiles.reduce((s, f) => s + f.unknownHeaders.length, 0),
                  },
                ].map(({ label, value }) => (
                  <div
                    key={label}
                    className="rounded-lg p-3"
                    style={{ background: '#dcfce7' }}
                  >
                    <p className="text-xs font-medium" style={{ color: '#166534' }}>{label}</p>
                    <p className="text-lg font-bold mt-0.5" style={{ color: '#15803d' }}>{value}</p>
                  </div>
                ))}
              </div>
              <button
                onClick={() => { setImportDone(false); setFiles([]); setImported([]); }}
                className="mt-3 text-xs font-medium underline"
                style={{ color: '#16a34a' }}
              >
                Upload more files
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {files.length === 0 && (
        <div className="text-center py-6">
          <p className="text-xs" style={{ color: '#94a3b8' }}>
            Accepted columns: {Array.from(ACCEPTED_COLUMNS).join(', ')}
          </p>
        </div>
      )}
    </div>
  );
}
