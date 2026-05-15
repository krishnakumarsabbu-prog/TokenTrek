import { TrendingUp, Users } from 'lucide-react';

const teams = [
  { name: 'Platform Team',  members: 12, cost: 54235, change: 24.6, requests: 45231, tokens: '3.2M' },
  { name: 'Backend Team',   members: 10, cost: 42876, change: 18.7, requests: 38965, tokens: '2.8M' },
  { name: 'Frontend Team',  members:  9, cost: 28945, change: 20.1, requests: 26754, tokens: '1.9M' },
  { name: 'DevOps Team',    members:  7, cost: 26134, change: 15.3, requests: 22134, tokens: '1.6M' },
  { name: 'QA Automation',  members:  6, cost: 18055, change: 19.8, requests: 15678, tokens: '1.1M' },
];

export default function Teams() {
  return (
    <div className="p-6 animate-fade-in">
      <div className="mb-5">
        <h1 className="text-[17px] font-bold text-gray-900">Teams</h1>
        <p className="text-xs text-gray-500 mt-0.5">AI usage and cost breakdown by team</p>
      </div>
      <div className="grid grid-cols-3 gap-4 mb-5">
        {teams.slice(0, 3).map((t, i) => (
          <div key={i} className="bg-white border border-gray-100 rounded-lg p-4 hover:shadow-sm transition-shadow cursor-pointer">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: '#e8f4fd' }}>
                <Users size={16} style={{ color: '#0078d4' }} />
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-800">{t.name}</div>
                <div className="text-[10px] text-gray-400">{t.members} members</div>
              </div>
            </div>
            <div className="flex justify-between">
              <div>
                <div className="text-[10px] text-gray-400">Cost</div>
                <div className="text-base font-bold text-gray-800">${t.cost.toLocaleString()}</div>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-gray-400">Change</div>
                <div className="text-xs text-emerald-600 font-semibold flex items-center gap-0.5 justify-end">
                  <TrendingUp size={11} /> +{t.change}%
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="bg-white border border-gray-100 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              {['Team','Members','Total Cost','Requests','Tokens','Change'].map((h, i) => (
                <th key={h} className={`px-4 py-2.5 text-[10px] font-semibold text-gray-500 uppercase tracking-wide ${i === 0 ? 'text-left' : 'text-right'}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {teams.map((t, i) => (
              <tr key={i} className="border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer">
                <td className="px-4 py-3 text-sm font-medium text-gray-800">{t.name}</td>
                <td className="px-4 py-3 text-xs text-gray-500 text-right">{t.members}</td>
                <td className="px-4 py-3 text-xs font-bold text-gray-800 text-right">${t.cost.toLocaleString()}</td>
                <td className="px-4 py-3 text-xs text-gray-500 text-right">{t.requests.toLocaleString()}</td>
                <td className="px-4 py-3 text-xs text-gray-500 text-right">{t.tokens}</td>
                <td className="px-4 py-3 text-right">
                  <span className="text-[10px] text-emerald-600 font-semibold flex items-center justify-end gap-0.5">
                    <TrendingUp size={9} /> +{t.change}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
