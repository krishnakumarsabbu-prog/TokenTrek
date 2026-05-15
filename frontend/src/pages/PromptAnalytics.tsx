import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const prompts = [
  { prompt: 'Explain this code',       uses: 18245, success: 92, tokens: 1245, cost: '$2,345' },
  { prompt: 'Write unit tests',        uses: 15672, success: 89, tokens: 2134, cost: '$1,987' },
  { prompt: 'Refactor this code',      uses: 12398, success: 91, tokens: 1876, cost: '$1,654' },
  { prompt: 'Debug issue',             uses: 11245, success: 85, tokens: 1567, cost: '$1,234' },
  { prompt: 'Optimize performance',    uses:  9876, success: 88, tokens: 1345, cost: '$987'   },
  { prompt: 'Generate documentation',  uses:  8923, success: 94, tokens:  987, cost: '$834'   },
  { prompt: 'Code review',             uses:  7654, success: 87, tokens: 1432, cost: '$756'   },
];

export default function PromptAnalytics() {
  return (
    <div className="p-6 animate-fade-in">
      <div className="mb-5">
        <h1 className="text-[17px] font-bold text-gray-900">Prompt Analytics</h1>
        <p className="text-xs text-gray-500 mt-0.5">Detailed analysis of prompt usage, success rates, and token consumption</p>
      </div>
      <div className="grid grid-cols-2 gap-4 mb-5">
        <div className="bg-white border border-gray-100 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-800 mb-3">Top Prompts by Usage</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={prompts.slice(0,6).map(p => ({ name: p.prompt.substring(0,12), uses: p.uses }))} margin={{ left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#94a3b8' }} />
              <YAxis tick={{ fontSize: 9, fill: '#94a3b8' }} />
              <Tooltip contentStyle={{ fontSize: 11, borderRadius: 6 }} />
              <Bar dataKey="uses" fill="#0078d4" radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white border border-gray-100 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-800 mb-3">Success Rate Distribution</h3>
          <div className="space-y-2.5">
            {prompts.slice(0,6).map((p, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-xs text-gray-600 w-36 truncate">{p.prompt}</span>
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${p.success}%`, background: p.success >= 90 ? '#10b981' : p.success >= 85 ? '#0078d4' : '#f59e0b' }} />
                </div>
                <span className="text-xs font-bold text-gray-700 w-8 text-right">{p.success}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="bg-white border border-gray-100 rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center">
          <span className="text-sm font-semibold text-gray-800">All Prompts</span>
          <span className="text-xs text-gray-400">1,234 total</span>
        </div>
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              {['Prompt','Uses','Success Rate','Avg Tokens','Cost'].map((h, i) => (
                <th key={h} className={`px-4 py-2.5 text-[10px] font-semibold text-gray-500 uppercase tracking-wide ${i === 0 ? 'text-left' : 'text-right'}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {prompts.map((p, i) => (
              <tr key={i} className="border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer">
                <td className="px-4 py-2.5 text-sm font-medium text-gray-800">{p.prompt}</td>
                <td className="px-4 py-2.5 text-xs text-gray-500 text-right">{p.uses.toLocaleString()}</td>
                <td className="px-4 py-2.5 text-right">
                  <span className={`text-xs font-bold ${p.success >= 90 ? 'text-emerald-600' : p.success >= 85 ? 'text-blue-600' : 'text-amber-600'}`}>{p.success}%</span>
                </td>
                <td className="px-4 py-2.5 text-xs text-gray-500 text-right">{p.tokens.toLocaleString()}</td>
                <td className="px-4 py-2.5 text-xs font-bold text-gray-800 text-right">{p.cost}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
