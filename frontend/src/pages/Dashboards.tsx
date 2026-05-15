import { BarChart3, Plus } from 'lucide-react';

const items = ['Executive Overview', 'Engineering Metrics', 'Cost Analysis', 'Security Posture', 'Team Productivity', 'Model Usage'];

export default function Dashboards() {
  return (
    <div className="p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[17px] font-bold text-gray-900">Dashboards</h1>
          <p className="text-xs text-gray-500 mt-0.5">Custom dashboards for your team</p>
        </div>
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold text-white" style={{ background: '#0078d4' }}>
          <Plus size={13} /> New Dashboard
        </button>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {items.map((name, i) => (
          <div key={i} className="bg-white border border-gray-100 rounded-lg p-5 hover:shadow-sm transition-shadow cursor-pointer">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-3" style={{ background: '#e8f4fd' }}>
              <BarChart3 size={18} style={{ color: '#0078d4' }} />
            </div>
            <h3 className="text-sm font-semibold text-gray-800 mb-1">{name}</h3>
            <p className="text-xs text-gray-400">Last updated 2 hours ago</p>
          </div>
        ))}
      </div>
    </div>
  );
}
