import React, { useState } from 'react';
import { UserConfig } from '../types';
import { Shield, Lock, User, Phone, MapPin, Check, X, Bell, Volume2, Sparkles } from 'lucide-react';
import { triggerHaptic, HAPTIC_PATTERNS } from '../utils/haptics';
import { soundEngine } from '../utils/sound';

interface SettingsModalProps {
  userConfig: UserConfig;
  onSave: (config: UserConfig) => void;
  onClose: () => void;
  onResetApp: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  userConfig,
  onSave,
  onClose,
  onResetApp,
}) => {
  const [formData, setFormData] = useState<UserConfig>({ ...userConfig });
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [pinError, setPinError] = useState('');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.accessPin === formData.duressPin) {
      setPinError('Duress PIN must be different from Safe PIN');
      triggerHaptic([50, 50, 50]);
      return;
    }
    if (formData.accessPin.length < 4 || formData.duressPin.length < 4) {
      setPinError('PINs must be at least 4 digits');
      triggerHaptic([50, 50, 50]);
      return;
    }

    triggerHaptic(HAPTIC_PATTERNS.tap);
    soundEngine.playArmedChirp();
    onSave(formData);
    setSaveSuccess(true);
    setTimeout(() => {
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto space-y-6 shadow-2xl text-slate-100 scrollbar-thin">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-white">Emergency Protocol Settings</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4 text-xs">
          
          {/* Identity & Address */}
          <div className="space-y-3">
            <div className="font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-emerald-400" />
              User Profile & Fallback Address
            </div>

            <div>
              <label className="block text-slate-300 mb-1">Full Name</label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:border-emerald-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-300 mb-1">Phone Number</label>
              <input
                type="tel"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:border-emerald-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-300 mb-1">Primary Physical Fallback Address</label>
              <input
                type="text"
                value={formData.primaryAddress}
                onChange={(e) => setFormData({ ...formData, primaryAddress: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:border-emerald-500 outline-none"
              />
            </div>
          </div>

          {/* ICE Contact */}
          <div className="space-y-3 pt-3 border-t border-slate-800">
            <div className="font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-emerald-400" />
              ICE Emergency Contact
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-slate-300 mb-1">Contact Name</label>
                <input
                  type="text"
                  value={formData.iceContactName}
                  onChange={(e) => setFormData({ ...formData, iceContactName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:border-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Contact Phone</label>
                <input
                  type="tel"
                  value={formData.iceContactPhone}
                  onChange={(e) => setFormData({ ...formData, iceContactPhone: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:border-emerald-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* PINs */}
          <div className="space-y-3 pt-3 border-t border-slate-800">
            <div className="font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              Security Trigger PINs
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-emerald-400 font-medium mb-1">Safe Access PIN</label>
                <input
                  type="text"
                  maxLength={6}
                  value={formData.accessPin}
                  onChange={(e) => setFormData({ ...formData, accessPin: e.target.value.replace(/\D/g, '') })}
                  className="w-full px-3 py-2 bg-slate-950 border border-emerald-900/60 rounded-lg text-emerald-300 font-mono text-center tracking-widest outline-none"
                />
              </div>

              <div>
                <label className="block text-rose-400 font-medium mb-1">Duress Lock PIN</label>
                <input
                  type="text"
                  maxLength={6}
                  value={formData.duressPin}
                  onChange={(e) => setFormData({ ...formData, duressPin: e.target.value.replace(/\D/g, '') })}
                  className="w-full px-3 py-2 bg-slate-950 border border-rose-900/60 rounded-lg text-rose-300 font-mono text-center tracking-widest outline-none"
                />
              </div>
            </div>
            {pinError && <p className="text-rose-400 text-xs">{pinError}</p>}
          </div>

          {/* SAPS Sector */}
          <div className="space-y-3 pt-3 border-t border-slate-800">
            <div>
              <label className="block text-slate-300 mb-1">SAPS / Campus Patrol Sector</label>
              <input
                type="text"
                value={formData.sapsSector}
                onChange={(e) => setFormData({ ...formData, sapsSector: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:border-emerald-500 outline-none"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 flex items-center justify-between border-t border-slate-800">
            <button
              type="button"
              onClick={onResetApp}
              className="text-xs text-rose-400 hover:text-rose-300 hover:underline"
            >
              Reset All / Re-run Onboarding
            </button>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-lg shadow-emerald-900/30 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                {saveSuccess ? 'Saved!' : 'Save Config'}
              </button>
            </div>
          </div>

        </form>
      </div>
    </div>
  );
};
