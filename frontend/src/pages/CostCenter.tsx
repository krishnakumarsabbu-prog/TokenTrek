import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { AlertTriangle } from 'lucide-react';

const costTrend = [
  { date: 'May 12', github: 8200, cursor: 4600, claude: 3200, devin: 2100, tools: 1500 },
  { date: 'May 13', github: 7800, cursor: 4200, claude: 2900, devin: 1900, tools: 1400 },
  { date: 'May 14', github: 8900, cursor: 5100, claude: 3600, devin: 2400, tools: 1700 },
  { date: 'May 15', github: 9400, cursor: 5600, claude: 4000, devin: 2700, tools: 1900 },
  { date: 'May 16', github: 10200, cursor: 6100, claude: 4400, devin: 3000, tools: 2100 },
  { date: 'May 17', github: 11000, cursor: 6600, claude: 4800, devin: 3300, tools: 2300 },
  { date: 'May 18', github: 11800, cursor: 7100, claude: 5100, devin: 3600, tools: 2500 },
];

const alerts = [
  { team: 'Backend Team',   msg: 'Spending 38% above average this week',             severity: 'high'   },
  { team: 'Platform Team',  msg: 'GPT-4o usage up 24% — consider optimization',      severity: 'medium' },
  { team: 'DevOps Team',    msg: 'Estimated monthly overage: $1,234',                severity: 'low'    },
];

const summaryCards = [
  { label: 'This Week',      value: '$186,245', note: '+21.4%',         noteColor: 'text-emerald-600' },
  { label: 'Last Week',      value: '$153,500', note: 'baseline',       noteColor: 'text-gray-400'    },
  { label: 'Monthly Budget', value: '$750,000', note: '24.8% used',     noteColor: 'text-blue-600'    },
  { label: 'Projected Month',value: '$797,480', note: '+6.3% over',     noteColor: 'text-red-500'     },
];

export default function CostCenter() {
  return (
    <div className="p-6 animate-fade-in">
      <div className="mb-5">
        <h1 className="text-[17px] font-bold text-gray-900">Cost Center</h1>
        <p className="text-xs text-gray-500 mt-0.5">Track and optimize AI spending across platforms and teams</p>
      </div>
      <div className="grid grid-cols-4 gap-4 mb-5">
        {summaryCards.map((s, i) => (
          <div key={i} className="bg-white border border-gray-100 rounded-lg p-4">
            <div className="text-xs text-gray-400 mb-1">{s.label}</div>
            <div className="text-xl font-bold text-gray-900">{s.value}</div>
            <div className={`text-xs font-semibold mt-1 ${s.noteColor}`}>{s.note}</div>
          </div>
        ))}
      </div>
      <div className="bg-white border border-gray-100 rounded-lg p-4 mb-5">
        <h3 className="text-sm font-semibold text-gray-800 mb-3">Daily Cost by Platform</h3>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={costTrend} margin={{ left: -10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} />
            <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={v => `$${(v/1000).toFixed(0)}K`} />
            <Tooltip contentStyle={{ fontSize: 11, borderRadius: 6 }} formatter={(v: number) => `$${v.toLocaleString()}`} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Area type="monotone" dataKey="github" stackId="1" stroke="#0078d4" fill="#dbeafe"  name="GitHub Copilot" />
            <Area type="monotone" dataKey="cursor" stackId="1" stroke="#00b4d8" fill="#e0f7fa"  name="Cursor"         />
            <Area type="monotone" dataKey="claude" stackId="1" stroke="#e07b39" fill="#fff3e0"  name="Claude"         />
            <Area type="monotone" dataKey="devin"  stackId="1" stroke="#7c3aed" fill="#ede9fe"  name="Devin"          />
            <Area type="monotone" dataKey="tools"  stackId="1" stroke="#10b981" fill="#d1fae5"  name="Custom Tools"   />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="bg-white border border-gray-100 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-gray-800 mb-3">Cost Alerts</h3>
        <div className="space-y-2.5">
          {alerts.map((a, i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-lg" style={{ background: a.severity === 'high' ? '#fef2f2' : a.severity === 'medium' ? '#fefce8' : '#f0fdf4' }}>
              <AlertTriangle size={13} className={a.severity === 'high' ? 'text-red-500' : a.severity === 'medium' ? 'text-amber-500' : 'text-emerald-500'} />
              <div>
                <div className="text-xs font-semibold text-gray-800">{a.team}</div>
                <div className="text-xs text-gray-500">{a.msg}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
