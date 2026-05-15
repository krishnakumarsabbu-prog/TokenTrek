import { TrendingUp, Search } from 'lucide-react';

const devs = [
  { name: 'Rohit Sharma',  ini: 'RS', team: 'Platform Team',  score: 92, trend: 8, requests: 18245, tokens: '1.2M', cost: '$2,456' },
  { name: 'Anita Patel',   ini: 'AP', team: 'Backend Team',   score: 89, trend: 5, requests: 15672, tokens: '980K',  cost: '$1,876' },
  { name: 'Sandeep Yadav', ini: 'SY', team: 'Frontend Team',  score: 87, trend: 3, requests: 12398, tokens: '856K',  cost: '$1,654' },
  { name: 'Priya Verma',   ini: 'PV', team: 'DevOps Team',    score: 86, trend: 6, requests: 11245, tokens: '720K',  cost: '$1,342' },
  { name: 'Karan Singh',   ini: 'KS', team: 'QA Automation',  score: 84, trend: 2, requests:  9876, tokens: '640K',  cost: '$1,123' },
  { name: 'Ravi Kumar',    ini: 'RK', team: 'Platform Team',  score: 82, trend: 4, requests:  8765, tokens: '580K',  cost: '$987'   },
  { name: 'Meena Joshi',   ini: 'MJ', team: 'Backend Team',   score: 80, trend: 1, requests:  7654, tokens: '480K',  cost: '$834'   },
];

const BG: Record<string, string> = { RS: '#0078d4', AP: '#10b981', SY: '#e07b39', PV: '#7c3aed', KS: '#ef4444', RK: '#0891b2', MJ: '#d97706' };

export default function Developers() {
  return (
    <div className="p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-[17px] font-bold text-gray-900">Developers</h1>
          <p className="text-xs text-gray-500 mt-0.5">AI usage and productivity metrics per developer</p>
        </div>
        <div className="flex items-center gap-2 border border-gray-200 rounded-md px-3 py-1.5 bg-white">
          <Search size={13} className="text-gray-400" />
          <input placeholder="Search developers..." className="text-xs outline-none w-44 placeholder-gray-400" />
        </div>
      </div>
      <div className="bg-white border border-gray-100 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              {['Developer','Team','AI Score','Requests','Tokens','Cost','Trend'].map((h, i) => (
                <th key={h} className={`px-4 py-2.5 text-[10px] font-semibold text-gray-500 uppercase tracking-wide ${i === 0 ? 'text-left' : 'text-right'}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {devs.map((d, i) => (
              <tr key={i} className="border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: BG[d.ini] || '#64748b' }}>{d.ini}</div>
                    <span className="text-sm font-medium text-gray-800">{d.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-xs text-gray-500 text-right">{d.team}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <div className="w-14 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${d.score}%` }} />
                    </div>
                    <span className="text-xs font-bold text-gray-800">{d.score}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-xs text-gray-600 text-right">{d.requests.toLocaleString()}</td>
                <td className="px-4 py-3 text-xs text-gray-600 text-right">{d.tokens}</td>
                <td className="px-4 py-3 text-xs font-bold text-gray-800 text-right">{d.cost}</td>
                <td className="px-4 py-3 text-right">
                  <span className="text-[10px] text-emerald-600 font-semibold flex items-center justify-end gap-0.5">
                    <TrendingUp size={9} /> +{d.trend}
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
