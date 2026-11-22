import { useState } from 'react';
import { Settings, Bell, Moon, Sun, Shield, Trash2, CheckCircle2 } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { useThemeStore } from '@/store/theme-store';

export default function SettingsPage() {
  const { theme, toggleTheme } = useThemeStore();
  const [aqiThreshold, setAqiThreshold] = useState(200);
  const [morningSummaryTime, setMorningSummaryTime] = useState('07:30');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <AppLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="pb-4 border-b border-border dark:border-forest/30">
          <div className="flex items-center gap-2 text-xs font-bold text-mint uppercase tracking-wider">
            <Settings className="w-3.5 h-3.5" />
            <span>Preferences & Privacy</span>
          </div>
          <h1 className="text-2xl font-extrabold font-display text-charcoal dark:text-white mt-1">
            Application Settings
          </h1>
        </div>

        {/* Notifications & Thresholds */}
        <div className="p-6 rounded-2xl border border-border dark:border-forest/40 bg-white dark:bg-charcoal shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-charcoal dark:text-white">
            <Bell className="w-4 h-4 text-mint" />
            <span>Air Quality Alert Thresholds</span>
          </div>

          <div className="space-y-4 pt-2">
            <div>
              <div className="flex justify-between items-center text-xs font-semibold text-slate mb-1">
                <span>Severe Smog Alert Threshold</span>
                <span className="text-mint font-bold">AQI {aqiThreshold} (CPCB)</span>
              </div>
              <input
                type="range"
                min="100"
                max="400"
                step="25"
                value={aqiThreshold}
                onChange={(e) => setAqiThreshold(Number(e.target.value))}
                className="w-full accent-mint"
              />
              <p className="text-[11px] text-slate mt-1">
                Trigger high-priority alerts when your local CAAQMS exceeds this CPCB index level.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate uppercase mb-1">
                Daily Morning Summary Time
              </label>
              <input
                type="time"
                value={morningSummaryTime}
                onChange={(e) => setMorningSummaryTime(e.target.value)}
                className="px-3 py-2 rounded-lg border border-border dark:border-forest/40 bg-white dark:bg-charcoal text-xs text-charcoal dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Appearance Theme */}
        <div className="p-6 rounded-2xl border border-border dark:border-forest/40 bg-white dark:bg-charcoal shadow-sm flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-charcoal dark:text-white">Interface Appearance</h3>
            <p className="text-xs text-slate mt-0.5">Toggle between calm light mist and deep charcoal forest dark theme.</p>
          </div>
          <Button variant="outline" size="sm" onClick={toggleTheme} className="gap-2">
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate" />}
            <span className="capitalize">{theme} Theme</span>
          </Button>
        </div>

        {/* Privacy & Account Deletion */}
        <div className="p-6 rounded-2xl border border-red-500/20 bg-red-500/5 dark:bg-red-500/10 shadow-sm flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-red-600 dark:text-red-400">Right to Erasure (DPDP Act)</h3>
            <p className="text-xs text-slate mt-0.5">
              Permanently wipe your profile, mobility trips, and personal data from our database.
            </p>
          </div>
          <Button variant="outline" size="sm" className="border-red-500/40 text-red-600 hover:bg-red-500/10 text-xs">
            Delete My Account
          </Button>
        </div>

        <Button onClick={handleSave} className="bg-mint hover:bg-mint/90 text-white font-semibold">
          {saved ? 'Settings Saved ✓' : 'Save Preferences'}
        </Button>
      </div>
    </AppLayout>
  );
}
