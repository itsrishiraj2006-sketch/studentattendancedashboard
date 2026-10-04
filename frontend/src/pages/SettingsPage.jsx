import React, { useState, useEffect } from 'react';
import { useConfig } from '../context/ConfigContext';
import { useToast } from '../context/ToastContext';
import { Settings, Save, Sliders, ShieldCheck } from 'lucide-react';

export default function SettingsPage() {
  const { thresholds, updateThresholds } = useConfig();
  const { addToast } = useToast();

  const [highThreshold, setHighThreshold] = useState(75);
  const [lowThreshold, setLowThreshold] = useState(60);
  const [lateWeight, setLateWeight] = useState(0.5);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (thresholds) {
      setHighThreshold(thresholds.high ?? 75);
      setLowThreshold(thresholds.low ?? 60);
      setLateWeight(thresholds.late_weight ?? 0.5);
    }
  }, [thresholds]);

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    if (parseFloat(highThreshold) <= parseFloat(lowThreshold)) {
      addToast('High attendance threshold must be greater than low attendance threshold.', 'error');
      return;
    }

    setSaving(true);
    try {
      await updateThresholds({
        high_threshold: parseFloat(highThreshold),
        low_threshold: parseFloat(lowThreshold),
        late_weight: parseFloat(lateWeight)
      });
      addToast('Attendance threshold settings updated successfully!', 'success');
    } catch (err) {
      addToast('Failed to save settings.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto text-white">
      <div>
        <h2 className="text-2xl font-extrabold text-white tracking-tight">
          Admin Threshold Settings
        </h2>
        <p className="text-xs text-slate-400">
          Configure attendance status thresholds and calculation weights. Changes update across the entire system.
        </p>
      </div>

      <form onSubmit={handleSaveSettings} className="bg-[#191B21] rounded-3xl p-6 sm:p-8 border border-[#262933] shadow-lg space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-[#262933]">
          <div className="p-2 bg-[#9B6CFF]/15 text-[#9B6CFF] rounded-2xl">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-white">
              Status Classification Cutoffs
            </h3>
            <p className="text-xs text-slate-400">
              Set cutoff percentages for High, Average, and Low attendance statuses
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          <div>
            <label className="block text-xs font-bold text-slate-200">
              High Attendance Threshold (%)
            </label>
            <p className="text-[11px] text-slate-400">Attendance &gt;= this % gets HIGH status (Default 75%)</p>
          </div>
          <div className="md:col-span-2">
            <input
              type="number"
              min="1"
              max="100"
              step="0.5"
              value={highThreshold}
              onChange={e => setHighThreshold(e.target.value)}
              className="w-full sm:w-48 px-4 py-2.5 rounded-xl border border-[#262933] bg-[#111216] text-sm font-bold text-white focus:border-[#FF7A30]"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center pt-4 border-t border-[#262933]">
          <div>
            <label className="block text-xs font-bold text-slate-200">
              Low Attendance Threshold (%)
            </label>
            <p className="text-[11px] text-slate-400">Attendance &lt; this % triggers LOW status alert (Default 60%)</p>
          </div>
          <div className="md:col-span-2">
            <input
              type="number"
              min="1"
              max="100"
              step="0.5"
              value={lowThreshold}
              onChange={e => setLowThreshold(e.target.value)}
              className="w-full sm:w-48 px-4 py-2.5 rounded-xl border border-[#262933] bg-[#111216] text-sm font-bold text-white focus:border-[#FF7A30]"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center pt-4 border-t border-[#262933]">
          <div>
            <label className="block text-xs font-bold text-slate-200">
              Late Attendance Weight
            </label>
            <p className="text-[11px] text-slate-400">Weight multiplier assigned to LATE status (0.0 to 1.0)</p>
          </div>
          <div className="md:col-span-2">
            <input
              type="number"
              min="0"
              max="1"
              step="0.1"
              value={lateWeight}
              onChange={e => setLateWeight(e.target.value)}
              className="w-full sm:w-48 px-4 py-2.5 rounded-xl border border-[#262933] bg-[#111216] text-sm font-bold text-white focus:border-[#FF7A30]"
              required
            />
          </div>
        </div>

        <div className="p-4 bg-[#111216] rounded-2xl border border-[#262933] space-y-2 text-xs">
          <div className="font-bold text-white flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-[#35D07F]" />
            Active Classification Logic Rules:
          </div>
          <div className="text-slate-300">
            • <strong className="text-[#35D07F]">HIGH Attendance</strong>: Attendance &gt;= {highThreshold}%
          </div>
          <div className="text-slate-300">
            • <strong className="text-[#FFC857]">AVERAGE Attendance</strong>: Attendance between {lowThreshold}% and {(highThreshold - 0.01).toFixed(2)}%
          </div>
          <div className="text-slate-300">
            • <strong className="text-[#FF5577]">LOW Attendance</strong>: Attendance &lt; {lowThreshold}%
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 bg-[#FF7A30] hover:bg-[#FF7A30]/90 text-white font-extrabold text-xs rounded-xl shadow-glow-orange transition flex items-center gap-2"
          >
            {saving ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>Save Threshold Settings</span>
          </button>
        </div>
      </form>
    </div>
  );
}
