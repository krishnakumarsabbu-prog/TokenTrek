import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as XLSX from 'xlsx';
import { Settings as SettingsIcon, Upload, Download, RefreshCw, Trash2, Database, CircleCheck as CheckCircle, Circle as XCircle, ChevronDown, ChevronUp, FileSpreadsheet, TriangleAlert as AlertTriangle, Sparkles, Bell, Shield, Users, Cpu } from 'lucide-react';
import { importData, resetDatabase, generateDemo, fetchImportHistory, fetchSchema, downloadTemplate } from '../api/data';
import { SectionCard, Badge, Tabs } from '../components/ui';

type Tab = 'data' | 'notifications' | 'security' | 'team' | 'models';

const NOTIFICATIONS_CONFIG = [
  { id: 'budget_alert', label: 'Budget Alerts', description: 'Notify when team exceeds budget threshold', enabled: true },
  { id: 'waste_detect', label: 'Waste Detection', description: 'Alert on high-severity AI waste events', enabled: true },
  { id: 'new_developer', label: 'New Developer Activity', description: 'Notify when a new developer starts using AI tools', enabled: false },
  { id: 'weekly_report', label: 'Weekly Summary', description: 'Receive weekly analytics digest every Monday', enabled: true },
  { id: 'security_alert', label: 'Security Alerts', description: 'Immediate notification on potential PII exposure', enabled: true },
  { id: 'model_change', label: 'Model Version Changes', description: 'Notify when AI model versions are updated', enabled: false },
];

const BUDGET_SETTINGS = [
  { team: 'Platform Team', budget: 60000, alert_pct: 85 },
  { team: 'Backend Team', budget: 50000, alert_pct: 90 },
  { team: 'Frontend Team', budget: 35000, alert_pct: 80 },
  { team: 'DevOps Team', budget: 30000, alert_pct: 85 },
  { team: 'QA Automation', budget: 22000, alert_pct: 90 },
];

export default function Settings() {
  const [tab, setTab] = useState<Tab>('data');
  const [dragOver, setDragOver] = useState(false);
  const [parseResult, setParseResult] = useState<any>(null);
  const [expandedErrors, setExpandedErrors] = useState<Set<number>>(new Set());
  const [notifications, setNotifications] = useState<Record<string, boolean>>(
    Object.fromEntries(NOTIFICATIONS_CONFIG.map(n => [n.id, n.enabled]))
  );
  const [budgets, setBudgets] = useState(BUDGET_SETTINGS);
  const fileRef = useRef<HTMLInputElement>(null);
  const qc = useQueryClient();

  const history = useQuery({ queryKey: ['import-history'], queryFn: fetchImportHistory });
  const schema = useQuery({ queryKey: ['schema'], queryFn: fetchSchema });

  const importMutation = useMutation({
    mutationFn: (payload: { filename: string; data: Record<string, any[]> }) => importData(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['import-history'] }),
  });

  const resetMutation = useMutation({
    mutationFn: resetDatabase,
    onSuccess: () => { qc.invalidateQueries(); setParseResult(null); },
  });

  const demoMutation = useMutation({
    mutationFn: generateDemo,
    onSuccess: () => qc.invalidateQueries(),
  });

  const handleFile = async (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array' });
        const parsed: Record<string, any[]> = {};
        wb.SheetNames.forEach(name => {
          parsed[name] = XLSX.utils.sheet_to_json(wb.Sheets[name]);
        });
        setParseResult({ filename: file.name, sheets: Object.keys(parsed), data: parsed, valid: true });
      } catch {
        setParseResult({ filename: file.name, valid: false, error: 'Failed to parse file' });
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleImport = async () => {
    if (!parseResult?.valid) return;
    await importMutation.mutateAsync({ filename: parseResult.filename, data: parseResult.data });
    setParseResult(null);
  };

  const toggleError = (id: number) => {
    setExpandedErrors(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  return (
    <div className="flex flex-col h-full min-h-0" style={{ background: '#f0f4f8' }}>
      <div className="flex-shrink-0 bg-white border-b px-6 py-4" style={{ borderColor: '#e5eaf0' }}>
        <h1 className="text-base font-semibold tracking-tight" style={{ color: '#0d1f30' }}>Settings</h1>
        <p className="text-xs mt-0.5" style={{ color: '#8ba3be' }}>Configure TokenTrek – data, notifications, security & integrations</p>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0" style={{ background: '#f0f4f8' }}>
        {/* Tab nav */}
        <div className="bg-white border-b px-6 flex-shrink-0" style={{ borderColor: '#e5eaf0' }}>
          <div className="flex">
            {[
              { id: 'data', label: 'Data Management', icon: <Database size={13} /> },
              { id: 'notifications', label: 'Notifications', icon: <Bell size={13} /> },
              { id: 'security', label: 'Security', icon: <Shield size={13} /> },
              { id: 'team', label: 'Team Budgets', icon: <Users size={13} /> },
              { id: 'models', label: 'AI Models', icon: <Cpu size={13} /> },
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id as Tab)}
                className="flex items-center gap-1.5 px-4 py-3 text-xs font-semibold border-b-2 transition-all"
                style={tab === t.id
                  ? { borderColor: '#0078d4', color: '#0078d4' }
                  : { borderColor: 'transparent', color: '#8ba3be' }
                }
              >
                {t.icon}{t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-5">
          {tab === 'data' && (
            <div className="space-y-6 max-w-4xl">
              {/* Upload */}
              <SectionCard title="Import Data">
                <div className="p-5 space-y-4">
                  <div
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    onClick={() => fileRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${dragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/30'}`}
                  >
                    <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-3">
                      <Upload size={24} className="text-blue-500" />
                    </div>
                    <p className="text-sm font-semibold text-gray-700 mb-1">Drop Excel or CSV file here</p>
                    <p className="text-xs text-gray-400">Supports .xlsx, .xls, .csv formats</p>
                    <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
                  </div>

                  {parseResult && (
                    <div className={`p-4 rounded-xl border ${parseResult.valid ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50'}`}>
                      <div className="flex items-start gap-2.5">
                        {parseResult.valid
                          ? <CheckCircle size={16} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                          : <XCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />}
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-gray-800">{parseResult.filename}</p>
                          {parseResult.valid ? (
                            <>
                              <p className="text-xs text-emerald-600 mt-0.5">{parseResult.sheets?.length} sheets found: {parseResult.sheets?.join(', ')}</p>
                              <button onClick={handleImport} disabled={importMutation.isPending}
                                className="mt-3 flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 text-white text-xs font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-60 transition-colors">
                                {importMutation.isPending ? <RefreshCw size={12} className="animate-spin" /> : <Upload size={12} />}
                                Import Data
                              </button>
                            </>
                          ) : (
                            <p className="text-xs text-red-600 mt-0.5">{parseResult.error}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </SectionCard>

              {/* Actions */}
              <SectionCard title="Data Actions">
                <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 border border-gray-100 rounded-xl hover:border-blue-200 transition-colors">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center mb-3">
                      <Sparkles size={18} className="text-emerald-600" />
                    </div>
                    <p className="text-sm font-semibold text-gray-800 mb-1">Generate Demo Data</p>
                    <p className="text-xs text-gray-400 mb-3">Populate with realistic sample data for testing</p>
                    <button onClick={() => demoMutation.mutate()} disabled={demoMutation.isPending}
                      className="w-full py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 rounded-lg hover:bg-emerald-100 disabled:opacity-60 transition-colors flex items-center justify-center gap-1.5">
                      {demoMutation.isPending ? <RefreshCw size={12} className="animate-spin" /> : <Sparkles size={12} />}
                      Generate
                    </button>
                  </div>
                  <div className="p-4 border border-gray-100 rounded-xl hover:border-blue-200 transition-colors">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center mb-3">
                      <Download size={18} className="text-blue-600" />
                    </div>
                    <p className="text-sm font-semibold text-gray-800 mb-1">Download Templates</p>
                    <p className="text-xs text-gray-400 mb-3">Get CSV templates for each data sheet</p>
                    <div className="space-y-1.5">
                      {['platforms', 'developers', 'daily_stats'].map(sheet => (
                        <button key={sheet} onClick={() => downloadTemplate(sheet)}
                          className="w-full py-1 text-xs font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors flex items-center justify-center gap-1.5">
                          <FileSpreadsheet size={11} /> {sheet}.csv
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="p-4 border border-red-100 rounded-xl hover:border-red-200 transition-colors bg-red-50/30">
                    <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center mb-3">
                      <Trash2 size={18} className="text-red-500" />
                    </div>
                    <p className="text-sm font-semibold text-gray-800 mb-1">Reset Database</p>
                    <p className="text-xs text-gray-400 mb-3">Clear all data from the in-memory store</p>
                    <button onClick={() => { if (confirm('Reset all data? This cannot be undone.')) resetMutation.mutate(); }}
                      disabled={resetMutation.isPending}
                      className="w-full py-1.5 text-xs font-medium text-red-700 bg-red-50 rounded-lg hover:bg-red-100 disabled:opacity-60 transition-colors flex items-center justify-center gap-1.5">
                      {resetMutation.isPending ? <RefreshCw size={12} className="animate-spin" /> : <Trash2 size={12} />}
                      Reset All Data
                    </button>
                  </div>
                </div>
              </SectionCard>

              {/* Import History */}
              <SectionCard title="Import History" action={
                <span className="text-xs text-gray-400">{history.data?.length || 0} imports</span>
              }>
                {history.isLoading ? (
                  <div className="p-4 space-y-3 animate-pulse">{[1, 2, 3].map(i => <div key={i} className="h-10 bg-gray-100 rounded" />)}</div>
                ) : !history.data?.length ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Database size={28} className="text-gray-300 mb-2" />
                    <p className="text-sm text-gray-500">No imports yet</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {history.data.map((record: any) => (
                      <div key={record.id} className="px-5 py-3.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            {record.status === 'success'
                              ? <CheckCircle size={15} className="text-emerald-500 flex-shrink-0" />
                              : <XCircle size={15} className="text-red-400 flex-shrink-0" />}
                            <div>
                              <p className="text-sm font-semibold text-gray-800">{record.filename}</p>
                              <p className="text-xs text-gray-400">{record.rows} rows · {new Date(record.imported_at).toLocaleString()}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={record.status === 'success' ? 'green' : 'red'}>{record.status}</Badge>
                            {record.errors?.length > 0 && (
                              <button onClick={() => toggleError(record.id)} className="text-xs text-red-500 flex items-center gap-0.5">
                                <AlertTriangle size={11} /> {record.errors.length} errors
                                {expandedErrors.has(record.id) ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                              </button>
                            )}
                          </div>
                        </div>
                        {expandedErrors.has(record.id) && (
                          <div className="mt-2 p-3 bg-red-50 rounded-lg">
                            {record.errors.map((err: string, i: number) => (
                              <p key={i} className="text-xs text-red-600 mb-0.5">· {err}</p>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </SectionCard>
            </div>
          )}

          {tab === 'notifications' && (
            <div className="max-w-2xl space-y-4">
              <SectionCard title="Notification Preferences">
                <div className="divide-y divide-gray-50">
                  {NOTIFICATIONS_CONFIG.map(item => (
                    <div key={item.id} className="flex items-center justify-between px-5 py-4">
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{item.label}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{item.description}</p>
                      </div>
                      <button
                        onClick={() => setNotifications(prev => ({ ...prev, [item.id]: !prev[item.id] }))}
                        className={`relative w-10 h-5.5 rounded-full transition-colors flex-shrink-0 ${notifications[item.id] ? 'bg-blue-600' : 'bg-gray-200'}`}
                        style={{ height: 22, width: 42 }}
                      >
                        <span className={`absolute top-0.5 left-0.5 w-4.5 h-4.5 bg-white rounded-full shadow transition-transform ${notifications[item.id] ? 'translate-x-5' : ''}`}
                          style={{ width: 18, height: 18, transform: notifications[item.id] ? 'translateX(20px)' : 'translateX(0)' }} />
                      </button>
                    </div>
                  ))}
                </div>
              </SectionCard>
              <button className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
                Save Preferences
              </button>
            </div>
          )}

          {tab === 'security' && (
            <div className="max-w-2xl space-y-4">
              <SectionCard title="Security Settings">
                <div className="p-5 space-y-4">
                  {[
                    { label: 'PII Detection', desc: 'Automatically detect and redact personal information in prompts', enabled: true },
                    { label: 'Audit Logging', desc: 'Log all AI API calls with user identity and timestamp', enabled: true },
                    { label: 'Data Retention Policy', desc: 'Auto-delete session data after 90 days', enabled: false },
                    { label: 'API Key Rotation Alerts', desc: 'Notify when API keys are older than 30 days', enabled: true },
                    { label: 'IP Allowlist', desc: 'Restrict dashboard access to specific IP ranges', enabled: false },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-3 border border-gray-100 rounded-xl">
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{item.label}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{item.desc}</p>
                      </div>
                      <div className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${item.enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                        {item.enabled ? 'Enabled' : 'Disabled'}
                      </div>
                    </div>
                  ))}
                </div>
              </SectionCard>
              <SectionCard title="API Keys">
                <div className="p-5 space-y-3">
                  {[
                    { name: 'OpenAI API Key', key: 'sk-...•••••••••••••', age: '12 days', status: 'active' },
                    { name: 'Anthropic API Key', key: 'ant-...•••••••••••••', age: '5 days', status: 'active' },
                    { name: 'GitHub Copilot Token', key: 'ghp-...•••••••••••••', age: '28 days', status: 'warning' },
                  ].map((key, i) => (
                    <div key={i} className="flex items-center justify-between p-3 border border-gray-100 rounded-xl">
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{key.name}</p>
                        <p className="text-xs font-mono text-gray-400 mt-0.5">{key.key}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">{key.age} old</span>
                        <Badge variant={key.status === 'active' ? 'green' : 'yellow'}>{key.status}</Badge>
                        <button className="text-xs text-blue-600 hover:underline">Rotate</button>
                      </div>
                    </div>
                  ))}
                </div>
              </SectionCard>
            </div>
          )}

          {tab === 'team' && (
            <div className="max-w-3xl space-y-4">
              <SectionCard title="Team Budget Configuration">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Team</th>
                        <th className="text-right px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Monthly Budget ($)</th>
                        <th className="text-right px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Alert Threshold (%)</th>
                        <th className="text-center px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {budgets.map((row, i) => (
                        <tr key={row.team}>
                          <td className="px-5 py-3.5 text-sm font-medium text-gray-800">{row.team}</td>
                          <td className="px-5 py-3.5 text-right">
                            <input type="number" value={row.budget}
                              onChange={e => setBudgets(prev => prev.map((b, j) => j === i ? { ...b, budget: Number(e.target.value) } : b))}
                              className="w-24 text-right px-2 py-1 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <input type="number" min={50} max={100} value={row.alert_pct}
                              onChange={e => setBudgets(prev => prev.map((b, j) => j === i ? { ...b, alert_pct: Number(e.target.value) } : b))}
                              className="w-20 text-right px-2 py-1 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                          </td>
                          <td className="px-5 py-3.5 text-center">
                            <button className="text-xs text-blue-600 hover:underline font-medium">Save</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </SectionCard>
            </div>
          )}

          {tab === 'models' && (
            <div className="max-w-3xl space-y-4">
              <SectionCard title="AI Model Configuration">
                <div className="divide-y divide-gray-50">
                  {[
                    { name: 'GPT-4o', provider: 'OpenAI', enabled: true, default_for: 'Complex tasks', cost_per_1k: '$0.005' },
                    { name: 'Claude 3.5 Sonnet', provider: 'Anthropic', enabled: true, default_for: 'Code review', cost_per_1k: '$0.003' },
                    { name: 'GPT-4 Turbo', provider: 'OpenAI', enabled: true, default_for: 'Analysis', cost_per_1k: '$0.004' },
                    { name: 'Claude 3 Haiku', provider: 'Anthropic', enabled: true, default_for: 'Simple tasks', cost_per_1k: '$0.00025' },
                    { name: 'Gemini 1.5 Pro', provider: 'Google', enabled: false, default_for: 'Long context', cost_per_1k: '$0.0025' },
                  ].map((model, i) => (
                    <div key={i} className="flex items-center justify-between px-5 py-4 hover:bg-gray-50/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold"
                          style={{ background: ['#0078d4', '#e07b39', '#00b4d8', '#f59e0b', '#10b981'][i] }}>
                          {model.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-800">{model.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-gray-400">{model.provider}</span>
                            <span className="text-xs text-gray-300">·</span>
                            <span className="text-xs text-gray-400">Default for: {model.default_for}</span>
                            <span className="text-xs text-gray-300">·</span>
                            <span className="text-xs font-mono text-gray-400">{model.cost_per_1k}/1K tokens</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant={model.enabled ? 'green' : 'gray'}>{model.enabled ? 'Active' : 'Inactive'}</Badge>
                        <button className="text-xs text-blue-600 hover:underline">Configure</button>
                      </div>
                    </div>
                  ))}
                </div>
              </SectionCard>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
