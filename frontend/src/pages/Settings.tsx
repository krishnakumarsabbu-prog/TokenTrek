import { Bell, Shield, Cpu, Users } from 'lucide-react';

const sections = [
  { icon: Users,  label: 'General',      items: ['Organization name', 'Timezone', 'Currency', 'Date format'] },
  { icon: Bell,   label: 'Notifications', items: ['Email alerts', 'Slack integration', 'Cost threshold alerts', 'Weekly digest'] },
  { icon: Shield, label: 'Security',     items: ['API key management', 'SSO configuration', 'Audit logs', '2FA settings'] },
  { icon: Cpu,    label: 'Integrations', items: ['GitHub Copilot', 'Cursor', 'Claude API', 'Custom webhooks'] },
];

export default function Settings() {
  return (
    <div className="p-6 animate-fade-in">
      <div className="mb-5">
        <h1 className="text-[17px] font-bold text-gray-900">Settings</h1>
        <p className="text-xs text-gray-500 mt-0.5">Configure your TokenTrek workspace</p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {sections.map(({ icon: Icon, label, items }, i) => (
          <div key={i} className="bg-white border border-gray-100 rounded-lg p-5">
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
                  <button className="text-xs text-blue-500 hover:underline font-medium">Configure</button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
