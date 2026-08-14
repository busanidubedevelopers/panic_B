import React, { useState, useEffect, useRef } from 'react';
import { Shield, Clock, AlertTriangle, Lock, Play, Pause, RotateCcw, Footprints, CheckCircle2 } from 'lucide-react';
import { triggerHaptic, HAPTIC_PATTERNS } from '../utils/haptics';
import { soundEngine } from '../utils/sound';
import { SafetyTimer } from '../types';

interface SafetyEscortTimerProps {
  safetyTimer: SafetyTimer;
  accessPin: string;
  onStartTimer: (minutes: number, label: string) => void;
  onCancelTimer: (pin: string) => boolean;
  onTimerExpired: () => void;
}

export const SafetyEscortTimer: React.FC<SafetyEscortTimerProps> = ({
  safetyTimer,
  accessPin,
  onStartTimer,
  onCancelTimer,
  onTimerExpired,
}) => {
  const [selectedPreset, setSelectedPreset] = useState<number>(5);
  const [customLabel, setCustomLabel] = useState<string>('Walking to Car / Station');
  const [showPinModal, setShowPinModal] = useState<boolean>(false);
  const [pinInput, setPinInput] = useState<string>('');
  const [pinError, setPinError] = useState<string>('');

  const PRESETS = [
    { mins: 2, label: 'Sprint / Elevator', desc: 'Quick 2 min transit' },
    { mins: 5, label: 'Walking to Car', desc: 'Parking / Campus path' },
    { mins: 15, label: 'Commute / Night Walk', desc: 'Station or Uber ride' },
    { mins: 30, label: 'Long Transit / Run', desc: 'Jogging or taxi ride' },
  ];

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleStart = () => {
    triggerHaptic(HAPTIC_PATTERNS.tap);
    soundEngine.playArmedChirp();
    onStartTimer(selectedPreset, customLabel);
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onCancelTimer(pinInput)) {
      setShowPinModal(false);
      setPinInput('');
      setPinError('');
      soundEngine.playStandDownTone();
    } else {
      setPinError('Incorrect Safe PIN. Timer continues running.');
      triggerHaptic([80, 80, 80]);
    }
  };

  const totalSeconds = safetyTimer.durationMinutes * 60;
  const progressPercent = totalSeconds > 0 ? (safetyTimer.remainingSeconds / totalSeconds) * 100 : 0;
  const isWarning = safetyTimer.isActive && safetyTimer.remainingSeconds <= 30 && safetyTimer.remainingSeconds > 0;

  return (
    <div id="safety-escort-timer-card" className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-300">
          <Footprints className="w-4 h-4 text-emerald-400" />
          <span>"Walk With Me" Safety Escort Timer</span>
        </div>
        {safetyTimer.isActive ? (
          <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-bold flex items-center gap-1.5 ${
            isWarning
              ? 'bg-rose-500/20 text-rose-300 border border-rose-500 animate-bounce'
              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 animate-pulse'
          }`}>
            <span className={`w-2 h-2 rounded-full ${isWarning ? 'bg-rose-500' : 'bg-emerald-400'}`} />
            {isWarning ? 'EXPIRING SOON' : 'ESCORT ARMED'}
          </span>
        ) : (
          <span className="text-[11px] text-slate-500 font-mono">DEAD MAN'S SWITCH</span>
        )}
      </div>

      {!safetyTimer.isActive ? (
        <div className="space-y-3">
          <p className="text-xs text-slate-400 leading-relaxed">
            Set an automated countdown before walking through an isolated area. If you don't cancel with your Safe PIN before time runs out, emergency panic triggers automatically.
          </p>

          {/* Preset Buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {PRESETS.map((preset) => (
              <button
                key={preset.mins}
                type="button"
                onClick={() => {
                  setSelectedPreset(preset.mins);
                  setCustomLabel(preset.label);
                  triggerHaptic(HAPTIC_PATTERNS.tap);
                }}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  selectedPreset === preset.mins
                    ? 'bg-emerald-950/70 border-emerald-500/80 text-emerald-200 ring-1 ring-emerald-500/40'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="text-sm font-bold text-white font-mono">{preset.mins} min</div>
                <div className="text-[10px] text-slate-300 truncate mt-0.5">{preset.label}</div>
              </button>
            ))}
          </div>

          <button
            type="button"
            id="btn-start-safety-escort"
            onClick={handleStart}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40 transition-all cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            Arm Safety Escort Countdown ({selectedPreset} Min)
          </button>
        </div>
      ) : (
        /* Active Countdown View */
        <div className={`p-4 rounded-xl border transition-all ${
          isWarning ? 'bg-rose-950/70 border-rose-500/80 ring-2 ring-rose-500' : 'bg-slate-950 border-slate-800'
        } space-y-3`}>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-400 font-medium">Active Safe Passage:</div>
              <div className="text-sm font-semibold text-white truncate">{safetyTimer.label}</div>
            </div>
            <div className="text-right">
              <div className={`text-2xl sm:text-3xl font-black font-mono tracking-wider ${
                isWarning ? 'text-rose-400 animate-pulse' : 'text-emerald-400'
              }`}>
                {formatTime(safetyTimer.remainingSeconds)}
              </div>
              <div className="text-[10px] text-slate-400">Time Until Auto-SOS</div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full transition-all duration-1000 ${
                isWarning ? 'bg-rose-500 animate-pulse' : 'bg-gradient-to-r from-teal-500 to-emerald-400'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="text-[11px] text-slate-400 flex items-center gap-1">
              <Shield className="w-3 h-3 text-emerald-400" />
              <span>Safe PIN required to stand down</span>
            </div>

            <button
              type="button"
              id="btn-disarm-escort-timer"
              onClick={() => setShowPinModal(true)}
              className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow transition-colors cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5" />
              I'm Safe (Enter PIN)
            </button>
          </div>
        </div>
      )}

      {/* Disarm PIN Dialog */}
      {showPinModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 max-w-xs w-full space-y-3 shadow-2xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                Confirm Safe Arrival
              </span>
              <button
                type="button"
                onClick={() => {
                  setShowPinModal(false);
                  setPinInput('');
                  setPinError('');
                }}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Enter your Safe PIN to cancel the countdown and disarm the safety escort.
            </p>

            <form onSubmit={handlePinSubmit} className="space-y-3">
              <input
                type="password"
                maxLength={6}
                placeholder="Safe PIN"
                value={pinInput}
                onChange={(e) => {
                  setPinInput(e.target.value.replace(/\D/g, ''));
                  setPinError('');
                }}
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl text-center text-lg font-mono tracking-widest text-emerald-300 outline-none"
                autoFocus
              />
              {pinError && <p className="text-[11px] text-rose-400 text-center">{pinError}</p>}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowPinModal(false);
                    setPinInput('');
                  }}
                  className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-300"
                >
                  Resume
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white"
                >
                  Confirm Arrival
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
