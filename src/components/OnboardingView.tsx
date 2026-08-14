import React, { useState } from 'react';
import { UserConfig, LocationData } from '../types';
import { Shield, Lock, AlertTriangle, User, Phone, MapPin, CheckCircle2, Eye, EyeOff, Sparkles, Navigation } from 'lucide-react';
import { triggerHaptic, HAPTIC_PATTERNS } from '../utils/haptics';
import { soundEngine } from '../utils/sound';

interface OnboardingViewProps {
  onComplete: (config: UserConfig) => void;
  currentLocation: LocationData | null;
  onRefreshLocation: () => void;
}

const PRESETS = [
  {
    name: 'University Student (Cape Town)',
    fullName: 'Nandi Khumalo',
    phoneNumber: '+27 82 459 1024',
    primaryAddress: 'Baxter Hall Residence, Main Road, Rondebosch, Cape Town, 7700',
    iceContactName: 'Thabo Khumalo (Brother)',
    iceContactPhone: '+27 83 912 4433',
    accessPin: '1234',
    duressPin: '9999',
    sapsSector: 'SAPS Rondebosch (021 685 7345) / SAPS 10111',
    campusSecurityPhone: '+27 21 650 2222',
  },
  {
    name: 'Nightshift Healthcare (Johannesburg)',
    fullName: 'Sipho Dlamini',
    phoneNumber: '+27 71 883 9102',
    primaryAddress: 'Charlotte Maxeke Academic Hospital, Parktown, Johannesburg, 2193',
    iceContactName: 'Dr. Lerato Molefe',
    iceContactPhone: '+27 82 555 9012',
    accessPin: '2468',
    duressPin: '1111',
    sapsSector: 'SAPS Hillbrow (011 488 6511) / SAPS 10111',
    campusSecurityPhone: '+27 11 488 4911',
  },
  {
    name: 'Durban Commuter (CBD / Morningside)',
    fullName: 'Ayesha Patel',
    phoneNumber: '+27 84 321 9901',
    primaryAddress: 'Florida Road, Morningside, Durban, 4001',
    iceContactName: 'Fatima Patel (Mother)',
    iceContactPhone: '+27 82 770 1234',
    accessPin: '4321',
    duressPin: '8888',
    sapsSector: 'SAPS Durban Central (031 325 4000) / SAPS 10111',
    campusSecurityPhone: '+27 31 311 1111',
  },
];

export const OnboardingView: React.FC<OnboardingViewProps> = ({
  onComplete,
  currentLocation,
  onRefreshLocation,
}) => {
  const [formData, setFormData] = useState<UserConfig>({
    fullName: '',
    phoneNumber: '',
    primaryAddress: '',
    iceContactName: '',
    iceContactPhone: '',
    accessPin: '1234',
    duressPin: '9999',
    sapsSector: 'SAPS 10111 Flying Squad (National Dispatch)',
    campusSecurityPhone: '0800 428 428', // National GBV Command Centre & Campus
    enableAudioRecording: true,
    enableHaptics: true,
    enableSirens: true,
    isSetupComplete: false,
  });

  const [showAccessPin, setShowAccessPin] = useState(false);
  const [showDuressPin, setShowDuressPin] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLocating, setIsLocating] = useState(false);

  const applyPreset = (preset: typeof PRESETS[0]) => {
    triggerHaptic(HAPTIC_PATTERNS.tap);
    soundEngine.playBeep(660, 'sine', 0.08);
    setFormData((prev) => ({
      ...prev,
      fullName: preset.fullName,
      phoneNumber: preset.phoneNumber,
      primaryAddress: preset.primaryAddress,
      iceContactName: preset.iceContactName,
      iceContactPhone: preset.iceContactPhone,
      accessPin: preset.accessPin,
      duressPin: preset.duressPin,
      sapsSector: preset.sapsSector,
      campusSecurityPhone: preset.campusSecurityPhone,
    }));
    setErrors({});
  };

  const handleUseCurrentGPS = () => {
    setIsLocating(true);
    triggerHaptic(HAPTIC_PATTERNS.tap);
    onRefreshLocation();
    setTimeout(() => {
      setIsLocating(false);
      if (currentLocation?.latitude && currentLocation?.longitude) {
        setFormData((prev) => ({
          ...prev,
          primaryAddress: `GPS: ${currentLocation.latitude?.toFixed(5)}, ${currentLocation.longitude?.toFixed(5)} (${currentLocation.addressName || 'Current Verified Location'})`,
        }));
      }
    }, 1200);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!formData.phoneNumber.trim()) newErrors.phoneNumber = 'Phone number is required';
    if (!formData.primaryAddress.trim()) newErrors.primaryAddress = 'Physical address / fallback location is required';
    if (!formData.iceContactName.trim()) newErrors.iceContactName = 'ICE contact name is required';
    if (!formData.iceContactPhone.trim()) newErrors.iceContactPhone = 'ICE contact phone number is required';

    if (!formData.accessPin || formData.accessPin.length < 4) {
      newErrors.accessPin = 'Access PIN must be at least 4 digits';
    }
    if (!formData.duressPin || formData.duressPin.length < 4) {
      newErrors.duressPin = 'Duress PIN must be at least 4 digits';
    }
    if (formData.accessPin === formData.duressPin) {
      newErrors.duressPin = 'Duress PIN MUST be different from Access PIN';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      triggerHaptic([50, 100, 50]);
      soundEngine.playBeep(300, 'sawtooth', 0.2, 0.1);
      return;
    }

    triggerHaptic(HAPTIC_PATTERNS.armed);
    soundEngine.playArmedChirp();
    onComplete({ ...formData, isSetupComplete: true });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 sm:p-6">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2 border-b border-slate-800 pb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mb-2">
            <Shield className="w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Stealth Safety Protocol Setup
          </h1>
          <p className="text-sm sm:text-base text-slate-400 max-w-lg mx-auto">
            Disguised personal safety & emergency dispatch system configured for South African police response (SAPS 10111) and ICE SMS broadcasts.
          </p>
        </div>

        {/* Quick Setup Presets */}
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Quick Fill Demo Presets
            </span>
            <span className="text-xs text-slate-500">Click to autofill test details</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {PRESETS.map((p, idx) => (
              <button
                key={idx}
                type="button"
                id={`preset-btn-${idx}`}
                onClick={() => applyPreset(p)}
                className="text-left px-3 py-2 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 hover:border-emerald-500/50 transition-all text-xs group"
              >
                <div className="font-semibold text-slate-200 group-hover:text-emerald-300 transition-colors">
                  {p.name.split(' (')[0]}
                </div>
                <div className="text-slate-400 text-[11px] truncate">
                  PINs: {p.accessPin} / {p.duressPin}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Setup Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* User Profile Section */}
          <div className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <User className="w-4 h-4 text-emerald-400" />
              1. Your Identity & Primary Location
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Full Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  id="input-full-name"
                  placeholder="e.g. Nandi Khumalo"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className={`w-full px-3.5 py-2.5 bg-slate-950 border ${
                    errors.fullName ? 'border-rose-500' : 'border-slate-800'
                  } rounded-lg text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500`}
                />
                {errors.fullName && <p className="text-xs text-rose-400 mt-1">{errors.fullName}</p>}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Your Phone Number <span className="text-rose-400">*</span>
                </label>
                <input
                  type="tel"
                  id="input-phone-number"
                  placeholder="e.g. +27 82 123 4567"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  className={`w-full px-3.5 py-2.5 bg-slate-950 border ${
                    errors.phoneNumber ? 'border-rose-500' : 'border-slate-800'
                  } rounded-lg text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500`}
                />
                {errors.phoneNumber && <p className="text-xs text-rose-400 mt-1">{errors.phoneNumber}</p>}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-slate-300 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                  Primary Physical Address (Fallback if GPS unavailable) <span className="text-rose-400">*</span>
                </label>
                <button
                  type="button"
                  id="btn-use-gps"
                  onClick={handleUseCurrentGPS}
                  className="text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 hover:underline"
                >
                  <Navigation className={`w-3 h-3 ${isLocating ? 'animate-spin' : ''}`} />
                  {isLocating ? 'Locating...' : 'Use Current GPS'}
                </button>
              </div>
              <input
                type="text"
                id="input-primary-address"
                placeholder="e.g. 142 Long Street, Cape Town CBD, 8001"
                value={formData.primaryAddress}
                onChange={(e) => setFormData({ ...formData, primaryAddress: e.target.value })}
                className={`w-full px-3.5 py-2.5 bg-slate-950 border ${
                  errors.primaryAddress ? 'border-rose-500' : 'border-slate-800'
                } rounded-lg text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500`}
              />
              {errors.primaryAddress && <p className="text-xs text-rose-400 mt-1">{errors.primaryAddress}</p>}
            </div>
          </div>

          {/* ICE Emergency Contact */}
          <div className="space-y-4 pt-2 border-t border-slate-800">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Phone className="w-4 h-4 text-emerald-400" />
              2. Emergency (ICE) Contact
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  ICE Contact Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  id="input-ice-name"
                  placeholder="e.g. Thabo Khumalo (Brother)"
                  value={formData.iceContactName}
                  onChange={(e) => setFormData({ ...formData, iceContactName: e.target.value })}
                  className={`w-full px-3.5 py-2.5 bg-slate-950 border ${
                    errors.iceContactName ? 'border-rose-500' : 'border-slate-800'
                  } rounded-lg text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500`}
                />
                {errors.iceContactName && <p className="text-xs text-rose-400 mt-1">{errors.iceContactName}</p>}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  ICE Phone Number <span className="text-rose-400">*</span>
                </label>
                <input
                  type="tel"
                  id="input-ice-phone"
                  placeholder="e.g. +27 83 912 4433"
                  value={formData.iceContactPhone}
                  onChange={(e) => setFormData({ ...formData, iceContactPhone: e.target.value })}
                  className={`w-full px-3.5 py-2.5 bg-slate-950 border ${
                    errors.iceContactPhone ? 'border-rose-500' : 'border-slate-800'
                  } rounded-lg text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500`}
                />
                {errors.iceContactPhone && <p className="text-xs text-rose-400 mt-1">{errors.iceContactPhone}</p>}
              </div>
            </div>
          </div>

          {/* Security PIN Protocols (Safe PIN vs Duress PIN) */}
          <div className="space-y-4 pt-2 border-t border-slate-800">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Lock className="w-4 h-4 text-emerald-400" />
                3. Security PIN Trigger Setup
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Enter these PINs into the Weather App search bar to unlock or trigger stealth lockdown.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Access Safe PIN */}
              <div className="bg-slate-950/80 p-4 rounded-xl border border-emerald-900/40 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-emerald-400 font-semibold text-xs">
                    <CheckCircle2 className="w-4 h-4" />
                    Safe Access PIN
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAccessPin(!showAccessPin)}
                    className="text-slate-400 hover:text-slate-200"
                  >
                    {showAccessPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-400">
                  Unlocks your full Emergency SOS Dashboard without raising alarms.
                </p>
                <input
                  type={showAccessPin ? 'text' : 'password'}
                  id="input-access-pin"
                  maxLength={6}
                  value={formData.accessPin}
                  onChange={(e) => setFormData({ ...formData, accessPin: e.target.value.replace(/\D/g, '') })}
                  className={`w-full px-3 py-2 bg-slate-900 border ${
                    errors.accessPin ? 'border-rose-500' : 'border-slate-800'
                  } rounded-lg text-sm text-emerald-300 font-mono tracking-widest text-center focus:outline-none focus:border-emerald-500`}
                />
                {errors.accessPin && <p className="text-xs text-rose-400">{errors.accessPin}</p>}
              </div>

              {/* Duress Forced PIN */}
              <div className="bg-slate-950/80 p-4 rounded-xl border border-rose-900/40 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-rose-400 font-semibold text-xs">
                    <AlertTriangle className="w-4 h-4" />
                    Duress (Forced) PIN
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowDuressPin(!showDuressPin)}
                    className="text-slate-400 hover:text-slate-200"
                  >
                    {showDuressPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-400">
                  If forced to unlock by an attacker, enter this. Shows a fake 503 crash while silently dispatching SOS.
                </p>
                <input
                  type={showDuressPin ? 'text' : 'password'}
                  id="input-duress-pin"
                  maxLength={6}
                  value={formData.duressPin}
                  onChange={(e) => setFormData({ ...formData, duressPin: e.target.value.replace(/\D/g, '') })}
                  className={`w-full px-3 py-2 bg-slate-900 border ${
                    errors.duressPin ? 'border-rose-500' : 'border-slate-800'
                  } rounded-lg text-sm text-rose-300 font-mono tracking-widest text-center focus:outline-none focus:border-rose-500`}
                />
                {errors.duressPin && <p className="text-xs text-rose-400">{errors.duressPin}</p>}
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <button
              type="submit"
              id="btn-save-setup"
              className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold shadow-lg shadow-emerald-900/30 transition-all flex items-center justify-center gap-2 text-sm sm:text-base cursor-pointer"
            >
              <Shield className="w-5 h-5" />
              Activate Camouflage Weather App
            </button>
            <p className="text-center text-xs text-slate-500 mt-2">
              All PINs and encrypted profiles are stored locally in secure sandboxed browser storage.
            </p>
          </div>

        </form>
      </div>
    </div>
  );
};
