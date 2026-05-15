import { useState, useRef, useCallback, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { Bell, Shield, Cpu, Users, Upload, Download, RefreshCw, Sparkles, CheckCircle, XCircle, Clock, ChevronDown, ChevronUp, FileSpreadsheet, AlertTriangle, Trash2, Database } from 'lucide-react';
import {
  importData, resetDatabase, generateDemo,
  fetchImportHistory, fetchSchema, getTemplateUrl,
  type ImportRecord, type SchemaInfo, type ImportResult,
} from '../api/data';

const CONFIG_SECTIONS = [
  { icon: Users,  label: 'General',      items: ['Organization name', 'Timezone', 'Currency', 'Date format'] },
  { icon: Bell,   label: 'Notifications', items: ['Email alerts', 'Slack integration', 'Cost threshold alerts', 'Weekly digest'] },
  { icon: Shield, label: 'Security',     items: ['API key management', 'SSO configuration', 'Audit logs', '2FA settings'] },
  { icon: Cpu,    label: 'Integrations', items: ['GitHub Copilot', 'Cursor', 'Claude API', 'Custom webhooks'] },
];

const SHEET_NAMES = ['daily_stats', 'developers', 'teams', 'prompts', 'model_costs'];

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

function StatusBadge({ status }: { status: 'success' | 'error' }) {
  return status === 'success' ? (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
      <CheckCircle size={11} /> Success
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700 bg-red-50 px-2 py-0.5 rounded-full">
      <XCircle size={11} /> Error
    </span>
  );
}

function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-sm font-semibold text-gray-800">{title}</h2>
      <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>
    </div>
  );
}

export default function Settings() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<ImportResult | null>(null);
  const [history, setHistory] = useState<ImportRecord[]>([]);
  const [schema, setSchema] = useState<SchemaInfo>({});
  const [expandedRecord, setExpandedRecord] = useState<number | null>(null);
  const [resetting, setResetting] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [actionMsg, setActionMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [schemaOpen, setSchemaOpen] = useState(false);

  useEffect(() => {
    fetchImportHistory().then(setHistory).catch(() => {});
    fetchSchema().then(setSchema).catch(() => {});
  }, []);

  const refreshHistory = () => fetchImportHistory().then(setHistory).catch(() => {});

  const showMsg = (text: string, ok: boolean) => {
    setActionMsg({ text, ok });
    setTimeout(() => setActionMsg(null), 4000);
  };

  const parseExcel = useCallback(async (file: File): Promise<Record<string, Record<string, unknown>[]>> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target!.result as ArrayBuffer);
          const wb = XLSX.read(data, { type: 'array' });
          const sheets: Record<string, Record<string, unknown>[]> = {};
          wb.SheetNames.forEach(name => {
            const ws = wb.Sheets[name];
            sheets[name] = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '' });
          });
          resolve(sheets);
        } catch (err) { reject(err); }
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  }, []);

  const parseCSV = useCallback((file: File): Promise<Record<string, Record<string, unknown>[]>> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target!.result as string;
          const wb = XLSX.read(text, { type: 'string' });
          const ws = wb.Sheets[wb.SheetNames[0]];
          const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '' });
          const sheetName = file.name.replace(/\.csv$/i, '').toLowerCase().replace(/[^a-z_]/g, '_');
          resolve({ [sheetName]: rows });
        } catch (err) { reject(err); }
      };
      reader.onerror = reject;
      reader.readAsText(file);
    });
  }, []);

  const handleFile = useCallback(async (file: File) => {
    const name = file.name.toLowerCase();
    const isCSV = name.endsWith('.csv');
    const isExcel = name.endsWith('.xlsx') || name.endsWith('.xls');
    if (!isCSV && !isExcel) {
      showMsg('Unsupported format. Use .xlsx, .xls, or .csv', false);
      return;
    }
    setUploading(true);
    setUploadResult(null);
    try {
      const sheets = isCSV ? await parseCSV(file) : await parseExcel(file);
      const result = await importData(file.name, sheets);
      setUploadResult(result);
      showMsg(result.success ? `Imported ${result.rows} rows successfully` : `Import completed with ${result.errors.length} error(s)`, result.success);
      refreshHistory();
    } catch {
      showMsg('Failed to parse or upload file', false);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, [parseCSV, parseExcel]);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleReset = async () => {
    if (!confirm('This will clear all in-memory data. Continue?')) return;
    setResetting(true);
    try {
      await resetDatabase();
      showMsg('Database reset successfully', true);
    } catch {
      showMsg('Reset failed', false);
    } finally { setResetting(false); }
  };

  const handleGenerateDemo = async () => {
    setGenerating(true);
    try {
      await generateDemo();
      showMsg('Demo data generated successfully', true);
    } catch {
      showMsg('Failed to generate demo data', false);
    } finally { setGenerating(false); }
  };

  const downloadTemplate = (sheet: string) => {
    const a = document.createElement('a');
    a.href = getTemplateUrl(sheet);
    a.download = `${sheet}_template.csv`;
    a.click();
  };

  const toggleRecord = (id: number) => setExpandedRecord(v => v === id ? null : id);

  return (
    <div className="p-6 animate-fade-in space-y-6">
      <div className="mb-1">
        <h1 className="text-[17px] font-bold text-gray-900">Settings</h1>
        <p className="text-xs text-gray-500 mt-0.5">Configure your TokenTrek workspace and manage data</p>
      </div>

      {actionMsg && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 text-sm font-medium px-4 py-2.5 rounded-lg shadow-lg ${actionMsg.ok ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}>
          {actionMsg.ok ? <CheckCircle size={15} /> : <XCircle size={15} />}
          {actionMsg.text}
        </div>
      )}

      {/* Upload + Quick Actions */}
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 bg-white border border-gray-100 rounded-xl p-5">
          <SectionHeader title="Upload Excel / CSV" subtitle="Import .xlsx, .xls, or .csv files — each sheet name maps to a data table" />
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`relative border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all select-none
              ${dragging ? 'border-blue-400 bg-blue-50' : 'border-gray-200 bg-gray-50 hover:border-blue-300 hover:bg-blue-50/40'}`}
          >
            <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={onFileChange} />
            {uploading ? (
              <div className="flex flex-col items-center gap-2">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs text-gray-500">Processing file…</span>
              </div>
            ) : (
              <>
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-3">
                  <Upload size={20} style={{ color: '#0078d4' }} />
                </div>
                <p className="text-sm font-medium text-gray-700">Drop file here or <span style={{ color: '#0078d4' }}>browse</span></p>
                <p className="text-xs text-gray-400 mt-1">XLSX · XLS · CSV — max 10 MB</p>
              </>
            )}
          </div>

          {uploadResult && (
            <div className={`mt-3 rounded-lg p-3 text-xs ${uploadResult.success ? 'bg-emerald-50 border border-emerald-100' : 'bg-red-50 border border-red-100'}`}>
              {uploadResult.success ? (
                <p className="text-emerald-700 font-medium flex items-center gap-1.5">
                  <CheckCircle size={13} /> {uploadResult.rows} rows imported successfully
                </p>
              ) : (
                <div>
                  <p className="text-red-700 font-medium flex items-center gap-1.5 mb-1.5">
                    <AlertTriangle size={13} /> {uploadResult.errors.length} error(s) — {uploadResult.rows} rows imported
                  </p>
                  <ul className="space-y-0.5 pl-4 list-disc text-red-600">
                    {uploadResult.errors.slice(0, 8).map((e, i) => <li key={i}>{e}</li>)}
                    {uploadResult.errors.length > 8 && <li>…and {uploadResult.errors.length - 8} more</li>}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="bg-white border border-gray-100 rounded-xl p-5 flex flex-col gap-3">
          <SectionHeader title="Quick Actions" subtitle="Manage in-memory data" />

          <button
            onClick={handleGenerateDemo}
            disabled={generating}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50/40 transition-all text-left group disabled:opacity-60"
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-blue-50 group-hover:bg-blue-100 flex-shrink-0">
              {generating
                ? <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                : <Sparkles size={14} style={{ color: '#0078d4' }} />}
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-800">Generate Demo Data</p>
              <p className="text-[11px] text-gray-400">Re-seed with sample data</p>
            </div>
          </button>

          <button
            onClick={handleReset}
            disabled={resetting}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-lg border border-gray-200 hover:border-red-300 hover:bg-red-50/40 transition-all text-left group disabled:opacity-60"
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-red-50 group-hover:bg-red-100 flex-shrink-0">
              {resetting
                ? <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                : <Trash2 size={14} className="text-red-500" />}
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-800">Reset Database</p>
              <p className="text-[11px] text-gray-400">Clear all in-memory data</p>
            </div>
          </button>

          <div className="mt-auto pt-2 border-t border-gray-50">
            <p className="text-[11px] text-gray-400 flex items-center gap-1.5">
              <Database size={10} /> In-memory — resets on server restart
            </p>
          </div>
        </div>
      </div>

      {/* Templates + Schema */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white border border-gray-100 rounded-xl p-5">
          <SectionHeader title="Download Sample Templates" subtitle="CSV templates for each supported data sheet" />
          <div className="space-y-0">
            {SHEET_NAMES.map(sheet => (
              <div key={sheet} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
                <div className="flex items-center gap-2 min-w-0">
                  <FileSpreadsheet size={13} className="text-gray-400 flex-shrink-0" />
                  <span className="text-xs font-medium text-gray-700">{sheet}</span>
                  {schema[sheet] && (
                    <span className="text-[10px] text-gray-400 truncate">
                      ({schema[sheet].required.join(', ')})
                    </span>
                  )}
                </div>
                <button
                  onClick={() => downloadTemplate(sheet)}
                  className="flex items-center gap-1 text-xs font-medium flex-shrink-0 ml-2 hover:underline"
                  style={{ color: '#0078d4' }}
                >
                  <Download size={12} /> CSV
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-gray-800">Schema Validation</h2>
              <p className="text-xs text-gray-400 mt-0.5">Required and optional columns per sheet</p>
            </div>
            <button
              onClick={() => setSchemaOpen(v => !v)}
              className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1"
            >
              {schemaOpen ? <><ChevronUp size={12} /> Collapse</> : <><ChevronDown size={12} /> Expand all</>}
            </button>
          </div>
          <div className="space-y-2">
            {Object.entries(schema).map(([sheet, info]) => {
              const key = sheet.charCodeAt(0) * 100 + sheet.charCodeAt(1);
              const open = schemaOpen || expandedRecord === key;
              return (
                <div key={sheet} className="border border-gray-100 rounded-lg overflow-hidden">
                  <button
                    className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
                    onClick={() => toggleRecord(key)}
                  >
                    <span className="text-xs font-semibold text-gray-700">{sheet}</span>
                    {open ? <ChevronUp size={12} className="text-gray-400" /> : <ChevronDown size={12} className="text-gray-400" />}
                  </button>
                  {open && (
                    <div className="px-3 py-2 space-y-1.5">
                      <div className="flex flex-wrap gap-1">
                        {info.required.map(col => (
                          <span key={col} className="text-[11px] font-medium bg-red-50 text-red-600 border border-red-100 px-1.5 py-0.5 rounded">
                            {col} *
                          </span>
                        ))}
                        {info.optional.map(col => (
                          <span key={col} className="text-[11px] text-gray-500 bg-gray-50 border border-gray-100 px-1.5 py-0.5 rounded">
                            {col}
                          </span>
                        ))}
                      </div>
                      <p className="text-[10px] text-gray-400">* required</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Import History */}
      <div className="bg-white border border-gray-100 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-gray-800">Import History</h2>
            <p className="text-xs text-gray-400 mt-0.5">Recent file imports and their outcomes</p>
          </div>
          <button
            onClick={refreshHistory}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors"
          >
            <RefreshCw size={12} /> Refresh
          </button>
        </div>

        {history.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <Clock size={28} className="mx-auto mb-2 opacity-40" />
            <p className="text-xs">No imports yet. Upload a file to get started.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {history.map(record => (
              <div key={record.id} className="border border-gray-100 rounded-lg overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <FileSpreadsheet size={14} className="text-gray-400 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-gray-800 truncate">{record.filename}</p>
                      <p className="text-[11px] text-gray-400">{formatDate(record.imported_at)} · {record.rows} rows</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <StatusBadge status={record.status} />
                    {record.errors.length > 0 && (
                      <button
                        onClick={() => toggleRecord(record.id)}
                        className="text-[11px] text-gray-400 hover:text-gray-600 flex items-center gap-0.5"
                      >
                        {record.errors.length} error{record.errors.length !== 1 ? 's' : ''}
                        {expandedRecord === record.id ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                      </button>
                    )}
                  </div>
                </div>
                {expandedRecord === record.id && record.errors.length > 0 && (
                  <div className="px-4 pb-3 bg-red-50/50 border-t border-red-100">
                    <ul className="pt-2 space-y-0.5 text-[11px] text-red-600 list-disc pl-4">
                      {record.errors.map((e, i) => <li key={i}>{e}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Workspace Config */}
      <div>
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-gray-800">Workspace Configuration</h2>
          <p className="text-xs text-gray-400 mt-0.5">Notifications, security, and integrations</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {CONFIG_SECTIONS.map(({ icon: Icon, label, items }, i) => (
            <div key={i} className="bg-white border border-gray-100 rounded-xl p-5">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#e8f4fd' }}>
                  <Icon size={15} style={{ color: '#0078d4' }} />
                </div>
                <span className="text-sm font-semibold text-gray-800">{label}</span>
              </div>
              <div className="space-y-0">
                {items.map((item, j) => (
                  <div key={j} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
                    <span className="text-xs text-gray-600">{item}</span>
                    <button className="text-xs font-medium hover:underline" style={{ color: '#0078d4' }}>Configure</button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
