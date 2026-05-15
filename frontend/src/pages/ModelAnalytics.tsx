import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

const models = [
  { name: 'GPT-4o',            cost: 58762, pct: 31.6, requests: 245000, tokens: '12.4B', color: '#0078d4' },
  { name: 'Claude 3.5 Sonnet', cost: 42138, pct: 22.6, requests: 189000, tokens:  '9.8B', color: '#e07b39' },
  { name: 'GPT-4 Turbo',       cost: 28945, pct: 15.6, requests: 134000, tokens:  '7.2B', color: '#00b4d8' },
  { name: 'Claude 3 Haiku',    cost: 18456, pct:  9.9, requests:  98000, tokens:  '4.1B', color: '#10b981' },
  { name: 'Gemini 1.5 Pro',    cost: 14235, pct:  7.7, requests:  67000, tokens:  '3.4B', color: '#f59e0b' },
  { name: 'GPT-3.5 Turbo',     cost:  9876, pct:  5.3, requests:  45000, tokens:  '2.1B', color: '#6366f1' },
];

export default function ModelAnalytics() {
  return (
    <div className="p-6 animate-fade-in">
      <div className="mb-5">
        <h1 className="text-[17px] font-bold text-gray-900">Model Analytics</h1>
        <p className="text-xs text-gray-500 mt-0.5">AI model usage, cost distribution, and performance metrics</p>
      </div>
      <div className="grid grid-cols-2 gap-4 mb-5">
        <div className="bg-white border border-gray-100 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-800 mb-3">Cost Distribution</h3>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width={150} height={150}>
              <PieChart>
                <Pie data={models} cx={70} cy={70} innerRadius={42} outerRadius={68} dataKey="cost" paddingAngle={2}>
                  {models.map((m, i) => <Cell key={i} fill={m.color} />)}
                </Pie>
                <Tooltip formatter={(v: number) => `$${v.toLocaleString()}`} contentStyle={{ fontSize: 11, borderRadius: 6 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-2">
              {models.map((m, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: m.color }} />
                  <span className="text-xs text-gray-600 flex-1 truncate">{m.name}</span>
                  <span className="text-xs font-bold text-gray-800">{m.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="bg-white border border-gray-100 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-800 mb-3">Request Volume</h3>
          <ResponsiveContainer width="100%" height={190}>
            <BarChart data={models} layout="vertical" margin={{ left: 20, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 9, fill: '#94a3b8' }} tickFormatter={v => `${(v/1000).toFixed(0)}K`} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 9, fill: '#64748b' }} width={110} />
              <Tooltip contentStyle={{ fontSize: 11, borderRadius: 6 }} formatter={(v: number) => [v.toLocaleString(), 'Requests']} />
              <Bar dataKey="requests" fill="#0078d4" radius={[0,3,3,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="bg-white border border-gray-100 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              {['Model','Requests','Tokens','Cost','Share'].map((h, i) => (
                <th key={h} className={`px-4 py-2.5 text-[10px] font-semibold text-gray-500 uppercase tracking-wide ${i === 0 ? 'text-left' : 'text-right'}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {models.map((m, i) => (
              <tr key={i} className="border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer">
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: m.color }} />
                    <span className="text-sm font-medium text-gray-800">{m.name}</span>
                  </div>
                </td>
                <td className="px-4 py-2.5 text-xs text-gray-500 text-right">{m.requests.toLocaleString()}</td>
                <td className="px-4 py-2.5 text-xs text-gray-500 text-right">{m.tokens}</td>
                <td className="px-4 py-2.5 text-xs font-bold text-gray-800 text-right">${m.cost.toLocaleString()}</td>
                <td className="px-4 py-2.5 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${m.pct * 2.8}%`, background: m.color }} />
                    </div>
                    <span className="text-xs font-bold text-gray-700">{m.pct}%</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
