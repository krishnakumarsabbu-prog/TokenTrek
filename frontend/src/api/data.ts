import api from './client';

export interface ImportResult {
  success: boolean;
  rows: number;
  errors: string[];
}

export interface ImportRecord {
  id: number;
  filename: string;
  rows: number;
  status: 'success' | 'error';
  errors: string[];
  imported_at: string;
}

export interface SchemaInfo {
  [sheet: string]: { required: string[]; optional: string[] };
}

export async function importData(payload: { filename: string; data: Record<string, any[]> }): Promise<ImportResult> {
  const { data } = await api.post('/data/import', { filename: payload.filename, sheets: payload.data });
  return data;
}

export function downloadTemplate(sheet: string): void {
  window.open(`/api/data/template/${sheet}`, '_blank');
}

export async function resetDatabase(): Promise<void> {
  await api.post('/data/reset');
}

export async function generateDemo(): Promise<void> {
  await api.post('/data/generate-demo');
}

export async function fetchImportHistory(): Promise<ImportRecord[]> {
  const { data } = await api.get('/data/import-history');
  return data;
}

export async function fetchSchema(): Promise<SchemaInfo> {
  const { data } = await api.get('/data/schema');
  return data;
}

export function getTemplateUrl(sheet: string): string {
  return `/api/data/template/${sheet}`;
}
