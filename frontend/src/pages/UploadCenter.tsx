import { useState, useRef } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import * as XLSX from 'xlsx';
import { Upload, FileSpreadsheet, CircleCheck as CheckCircle, Circle as XCircle, Eye, EyeOff, ChevronDown, ChevronUp, Download, Trash2, CircleAlert as AlertCircle } from 'lucide-react';
import { importData, fetchImportHistory, fetchSchema, downloadTemplate } from '../api/data';
import { SectionCard, Badge } from '../components/ui';

const ACCEPTED_COLUMNS = new Set([
  'platform_id','platform_name','color','icon','team_id','team_name','developer_id',
  'developer_name','avatar','date','requests','tokens','cost','prompt_text','uses',
  'success_rate','avg_tokens','score','trend','period','change_pct','model_name',
  'pct','action','created_at',
]);

const SHEET_DESCRIPTIONS: Record<string, string> = {
  platforms: 'AI platforms (GitHub Copilot, Cursor, Claude, etc.)',
  teams: 'Engineering teams and departments',
  developers: 'Developer profiles and team assignments',
  daily_stats: 'Daily usage statistics per platform',
  prompts: 'Prompt templates and performance data',
  developer_scores: 'AI productivity scores per developer',
  team_costs: 'Monthly cost breakdown by team',
  model_costs: 'Cost distribution across AI models',
};

interface ParsedSheet {
  name: string;
  rows: number;
  columns: string[];
  unknownCols: string[];
  preview: any[];
  valid: boolean;
}

export default function UploadCenter() {
  const [dragOver, setDragOver] = useState(false);
  const [filename, setFilename] = useState('');
  const [sheets, setSheets] = useState<ParsedSheet[]>([]);
  const [expandedSheet, setExpandedSheet] = useState<string | null>(null);
  const [previewVisible, setPreviewVisible] = useState<Record<string, boolean>>({});
  const [expandedErrors, setExpandedErrors] = useState<Set<number>>(new Set());
  const fileRef = useRef<HTMLInputElement>(null);
  const qc = useQueryClient();

  const history = useQuery({ queryKey: ['import-history'], queryFn: fetchImportHistory });
  const schema = useQuery({ queryKey: ['schema'], queryFn: fetchSchema });

  const importMut = useMutation({
    mutationFn: (payload: { filename: string; data: Record<string, any[]> }) => importData(payload),
    onSuccess: () => { qc.invalidateQueries(); setSheets([]); setFilename(''); },
  });

  const parseFile = (file: File) => {
    setFilename(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target!.result as ArrayBuffer);
      const wb = XLSX.read(data, { type: 'array' });
      const parsed: ParsedSheet[] = wb.SheetNames.map(name => {
        const rows = XLSX.utils.sheet_to_json<any>(wb.Sheets[name]);
        const columns = rows.length ? Object.keys(rows[0]) : [];
        const unknownCols = columns.filter(c => !ACCEPTED_COLUMNS.has(c));
        return { name, rows: rows.length, columns, unknownCols, preview: rows.slice(0, 3), valid: unknownCols.length === 0 };
      });
      setSheets(parsed);
    };
    reader.readAsArrayBuffer(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) parseFile(file);
  };

  const allValid = sheets.length > 0 && sheets.every(s => s.valid);

  const handleImport = async () => {
    const sheetData: Record<string, any[]> = {};
    if (!fileRef.current?.files?.[0]) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      const data = new Uint8Array(e.target!.result as ArrayBuffer);
      const wb = XLSX.read(data, { type: 'array' });
      wb.SheetNames.forEach(name => { sheetData[name] = XLSX.utils.sheet_to_json(wb.Sheets[name]); });
      await importMut.mutateAsync({ filename, data: sheetData });
    };
    reader.readAsArrayBuffer(fileRef.current.files[0]);
  };

  return (
    <div className="flex flex-col h-full min-h-0" style={{ background: '#f0f4f8' }}>
      <div className="flex-shrink-0 bg-white border-b px-6 py-4" style={{ borderColor: '#e5eaf0' }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-base font-semibold tracking-tight" style={{ color: '#0d1f30' }}>Upload Center</h1>
            <p className="text-xs mt-0.5" style={{ color: '#8ba3be' }}>Import Excel/CSV data files with validation & preview</p>
          </div>
          <div className="flex items-center gap-2">
            {(['platforms', 'developers', 'daily_stats'] as const).map(sheet => (
              <button key={sheet} onClick={() => downloadTemplate(sheet)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <Download size={11} /> {sheet}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 min-h-0">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Upload panel */}
          <div className="xl:col-span-2 space-y-4">
            {/* Drop zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all ${
                dragOver ? 'border-blue-400 bg-blue-50 scale-[1.01]' : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/20'
              }`}
            >
              <div className={`w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center transition-colors ${dragOver ? 'bg-blue-100' : 'bg-gray-100'}`}>
                <Upload size={28} className={dragOver ? 'text-blue-500' : 'text-gray-400'} />
              </div>
              <p className="text-base font-semibold text-gray-700 mb-1">
                {dragOver ? 'Release to upload' : 'Drop your file here'}
              </p>
              <p className="text-sm text-gray-400">or click to browse — .xlsx, .xls, .csv</p>
              <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden"
                onChange={e => e.target.files?.[0] && parseFile(e.target.files[0])} />
            </div>

            {/* Sheet validation results */}
            {sheets.length > 0 && (
              <SectionCard title={`Parsed: ${filename}`} action={
                <div className="flex items-center gap-2">
                  <Badge variant={allValid ? 'green' : 'red'}>{allValid ? 'All Valid' : 'Has Errors'}</Badge>
                  <button onClick={handleImport} disabled={!allValid || importMut.isPending}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
                    {importMut.isPending ? 'Importing…' : 'Import All'}
                  </button>
                </div>
              }>
                <div className="divide-y divide-gray-50">
                  {sheets.map((sheet) => (
                    <div key={sheet.name}>
                      <div className="flex items-center gap-3 px-5 py-3.5 cursor-pointer hover:bg-gray-50/50 transition-colors"
                        onClick={() => setExpandedSheet(expandedSheet === sheet.name ? null : sheet.name)}>
                        {sheet.valid
                          ? <CheckCircle size={16} className="text-emerald-500 flex-shrink-0" />
                          : <XCircle size={16} className="text-red-400 flex-shrink-0" />}
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-gray-800">{sheet.name}</span>
                            <span className="text-xs text-gray-400">{sheet.rows} rows · {sheet.columns.length} cols</span>
                          </div>
                          {sheet.unknownCols.length > 0 && (
                            <p className="text-xs text-red-500 mt-0.5">Unknown columns: {sheet.unknownCols.join(', ')}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => { e.stopPropagation(); setPreviewVisible(prev => ({ ...prev, [sheet.name]: !prev[sheet.name] })); }}
                            className="p-1 text-gray-400 hover:text-gray-600 transition-colors">
                            {previewVisible[sheet.name] ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                          {expandedSheet === sheet.name ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
                        </div>
                      </div>
                      {(expandedSheet === sheet.name || previewVisible[sheet.name]) && (
                        <div className="px-5 pb-4 bg-gray-50/50">
                          <div className="overflow-x-auto rounded-lg border border-gray-200">
                            <table className="text-xs w-full">
                              <thead>
                                <tr className="border-b border-gray-200 bg-gray-100">
                                  {sheet.columns.map(col => (
                                    <th key={col} className={`text-left px-3 py-2 font-semibold ${sheet.unknownCols.includes(col) ? 'text-red-500' : 'text-gray-500'}`}>{col}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {sheet.preview.map((row, i) => (
                                  <tr key={i} className="border-b border-gray-100 last:border-0">
                                    {sheet.columns.map(col => (
                                      <td key={col} className="px-3 py-2 text-gray-700 max-w-[120px] truncate">{String(row[col] ?? '')}</td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                          {sheet.rows > 3 && <p className="text-xs text-gray-400 mt-1.5">Showing 3 of {sheet.rows} rows</p>}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </SectionCard>
            )}

            {/* Import history */}
            <SectionCard title="Import History" action={
              <span className="text-xs text-gray-400">{history.data?.length || 0} total</span>
            }>
              {history.isLoading ? (
                <div className="p-4 space-y-2 animate-pulse">{[1, 2].map(i => <div key={i} className="h-10 bg-gray-100 rounded" />)}</div>
              ) : !history.data?.length ? (
                <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                  <Upload size={24} className="mb-2 opacity-50" />
                  <p className="text-xs">No imports yet</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {history.data.map((rec: any) => (
                    <div key={rec.id} className="px-5 py-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          {rec.status === 'success'
                            ? <CheckCircle size={14} className="text-emerald-500" />
                            : <XCircle size={14} className="text-red-400" />}
                          <div>
                            <p className="text-xs font-semibold text-gray-800">{rec.filename}</p>
                            <p className="text-xs text-gray-400">{rec.rows} rows · {new Date(rec.imported_at).toLocaleString()}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={rec.status === 'success' ? 'green' : 'red'}>{rec.status}</Badge>
                          {rec.errors?.length > 0 && (
                            <button onClick={() => setExpandedErrors(prev => { const n = new Set(prev); n.has(rec.id) ? n.delete(rec.id) : n.add(rec.id); return n; })}
                              className="text-xs text-red-500 flex items-center gap-0.5">
                              <AlertCircle size={11} /> {rec.errors.length}
                              {expandedErrors.has(rec.id) ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                            </button>
                          )}
                        </div>
                      </div>
                      {expandedErrors.has(rec.id) && (
                        <div className="mt-2 p-2.5 bg-red-50 rounded-lg">
                          {rec.errors.map((e: string, i: number) => <p key={i} className="text-xs text-red-600">· {e}</p>)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>
          </div>

          {/* Schema reference */}
          <div className="space-y-4">
            <SectionCard title="Supported Sheets">
              <div className="divide-y divide-gray-50">
                {Object.entries(SHEET_DESCRIPTIONS).map(([sheet, desc]) => (
                  <div key={sheet} className="px-5 py-3 hover:bg-gray-50/50 transition-colors">
                    <div className="flex items-center gap-2 mb-0.5">
                      <FileSpreadsheet size={13} className="text-blue-400 flex-shrink-0" />
                      <span className="text-xs font-semibold text-gray-700">{sheet}</span>
                    </div>
                    <p className="text-xs text-gray-400">{desc}</p>
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard title="Accepted Column Names">
              {schema.isLoading ? <div className="p-4 animate-pulse space-y-2">{[1, 2, 3].map(i => <div key={i} className="h-5 bg-gray-100 rounded" />)}</div> : (
                <div className="p-4">
                  <div className="flex flex-wrap gap-1.5">
                    {Array.from(ACCEPTED_COLUMNS).map(col => (
                      <span key={col} className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md font-mono">{col}</span>
                    ))}
                  </div>
                </div>
              )}
            </SectionCard>
          </div>
        </div>
      </div>
    </div>
  );
}
