import React, { useState, useEffect } from 'react';
import { Save, Bell, DollarSign, LogOut } from 'lucide-react';
import { logOut } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { useFirestore } from '../hooks/useFirestore';

export default function Settings() {
  const { displayName, setDisplayName } = useAuth();
  const { settings, budgets, saveSetting, saveBudget } = useFirestore();
  const [webhookUrl, setWebhookUrl] = useState('');
  const [weeklyBudget, setWeeklyBudget] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const webhookSetting = settings.find((s: any) => s.key === 'n8n_webhook_url');
    if (webhookSetting) setWebhookUrl(webhookSetting.value);

    const weekly = budgets.find((b: any) => b.type === 'weekly');
    if (weekly) setWeeklyBudget(weekly.amount.toString());
  }, [settings, budgets]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    await Promise.all([
      saveSetting('n8n_webhook_url', webhookUrl),
      saveBudget('weekly', parseFloat(weeklyBudget))
    ]);

    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleReset = async () => {
    if (window.confirm('Are you sure you want to reset your profile? This will clear your name and sign you out.')) {
      localStorage.removeItem('kwartrack_name');
      await logOut();
      window.location.reload();
    }
  };

  return (
    <div className="space-y-8 max-w-2xl">
      <h1 className="text-3xl font-semibold text-white mb-8">Settings</h1>

      <div className="bg-[#1A1C20] rounded-3xl border border-white/5 overflow-hidden">
        <div className="p-6 lg:p-8 border-b border-white/5 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-medium text-white">Profile</h2>
            <p className="text-sm text-zinc-400 mt-1">{displayName}</p>
          </div>
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-400 rounded-xl hover:bg-red-500/20 transition-colors text-sm font-medium"
          >
            <LogOut size={16} />
            Reset Profile
          </button>
        </div>
        
        <form onSubmit={handleSave} className="p-6 lg:p-8 space-y-8">
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-white mb-2">
              <DollarSign className="w-4 h-4 text-[#E5D3B3]" />
              Weekly Budget Limit
            </label>
            <p className="text-sm text-zinc-400 mb-4">
              You will receive an alert if your expenses exceed 85% of this amount in a single week.
            </p>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">₱</span>
              <input
                type="number"
                step="0.01"
                required
                value={weeklyBudget}
                onChange={(e) => setWeeklyBudget(e.target.value)}
                className="w-full pl-8 pr-4 py-3 bg-[#0D0D0F] border border-white/10 rounded-xl text-white focus:border-[#E5D3B3] focus:ring-1 focus:ring-[#E5D3B3] outline-none transition-all"
                placeholder="1000.00"
              />
            </div>
          </div>

          <hr className="border-white/5" />

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-white mb-2">
              <Bell className="w-4 h-4 text-[#E5D3B3]" />
              n8n Webhook URL (Automation)
            </label>
            <p className="text-sm text-zinc-400 mb-4">
              Enter your n8n Webhook URL to receive automated emails and notifications for budget alerts and savings reminders.
            </p>
            <input
              type="url"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              className="w-full px-4 py-3 bg-[#0D0D0F] border border-white/10 rounded-xl text-white focus:border-[#E5D3B3] focus:ring-1 focus:ring-[#E5D3B3] outline-none transition-all"
              placeholder="https://your-n8n-instance.com/webhook/..."
            />
            <div className="mt-6 bg-[#22252A] p-4 rounded-xl border border-white/5">
              <h4 className="text-sm font-medium text-white mb-3">Webhook Payload Format</h4>
              <pre className="text-xs text-zinc-400 overflow-x-auto">
{`{
  "event": "budget_alert" | "savings_reminder",
  "message": "...",
  "totalExpenses": 850,
  "weeklyBudget": 1000,
  "percentage": 85
}`}
              </pre>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-between">
            {saved ? (
              <span className="text-[#E5D3B3] font-medium flex items-center gap-2">
                <Save className="w-4 h-4" /> Settings saved!
              </span>
            ) : (
              <span />
            )}
            <button
              type="submit"
              className="bg-[#E5D3B3] text-[#1A1C20] px-6 py-3 rounded-xl font-medium hover:bg-[#d4c3a3] transition-colors flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save Settings
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
