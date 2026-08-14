import React, { useState, useEffect } from 'react';
import { UserConfig, LocationData, EmergencyState } from '../types';
import { AudioEvidenceRecorder } from './AudioEvidenceRecorder';
import { RefreshCw, Lock, AlertCircle, Radio, WifiOff, Globe, Server, Laptop } from 'lucide-react';
import { triggerHaptic, HAPTIC_PATTERNS } from '../utils/haptics';
import { soundEngine } from '../utils/sound';

interface LockdownViewProps {
  userConfig: UserConfig;
  currentLocation: LocationData | null;
  emergencyState: EmergencyState;
  onCancelEmergency: (pin: string) => boolean;
  onReturnToWeather: () => void;
}

export const LockdownView: React.FC<LockdownViewProps> = ({
  userConfig,
  currentLocation,
  emergencyState,
  onCancelEmergency,
  onReturnToWeather,
}) => {
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [secretTapCount, setSecretTapCount] = useState(0);
  const [showSecretUnlock, setShowSecretUnlock] = useState(false);
  const [safePinInput, setSafePinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [rayId, setRayId] = useState('8b29f0c741e938a1');
  const [fakeTimestamp, setFakeTimestamp] = useState('');

  useEffect(() => {
    // Generate authentic Ray ID and UTC timestamp
    const randomHex = Math.random().toString(16).substring(2, 10) + Math.random().toString(16).substring(2, 10);
    setRayId(randomHex);
    setFakeTimestamp(new Date().toUTCString());
  }, []);

  // Fake Retry Button
  const handleFakeRetry = () => {
    setIsRetrying(true);
    triggerHaptic(HAPTIC_PATTERNS.tap);
    setTimeout(() => {
      setIsRetrying(false);
      setRetryCount((prev) => prev + 1);
    }, 1800);
  };

  // Secret Escape: 5 Taps on Error Code
  const handleSecretTap = () => {
    const next = secretTapCount + 1;
    setSecretTapCount(next);
    triggerHaptic(HAPTIC_PATTERNS.holdTick);

    if (next >= 4) {
      setShowSecretUnlock(true);
      setSecretTapCount(0);
    }
  };

  const handleSecretUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    const success = onCancelEmergency(safePinInput);
    if (success) {
      setShowSecretUnlock(false);
      soundEngine.playStandDownTone();
      onReturnToWeather();
    } else {
      setPinError('Invalid Safe PIN');
      triggerHaptic([50, 50, 50]);
    }
  };

  return (
    <div id="error-ui" className="min-h-screen bg-slate-100 text-slate-800 flex flex-col justify-between font-sans selection:bg-slate-300">
      
      {/* Background Silent Security Engine (Non-visible to attacker) */}
      <div className="hidden">
        <AudioEvidenceRecorder isEmergencyActive={true} />
      </div>

      {/* Cloudflare / Nginx Realistic Error Header */}
      <div className="w-full border-b border-slate-300 bg-white py-4 px-6 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700 text-base">Atmosphere Edge Gateway</span>
            <span className="text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded font-mono">v4.18.2</span>
          </div>
          <div className="text-xs text-slate-400 font-mono">
            Ray ID: <span className="text-slate-600 font-semibold">{rayId}</span>
          </div>
        </div>
      </div>

      {/* Main Error Content Container */}
      <main className="max-w-3xl mx-auto w-full px-6 py-10 flex-1 flex flex-col justify-center">
        
        {/* Error Code & Secret 4-Tap Escape */}
        <div className="space-y-4 text-center sm:text-left">
          <div
            onClick={handleSecretTap}
            className="inline-block cursor-pointer select-none"
            title="Gateway Status Code"
          >
            <h1 className="text-5xl sm:text-6xl font-black text-rose-600 tracking-tight flex items-center gap-3">
              503
              <span className="text-xl sm:text-2xl font-normal text-slate-600">
                Service Temporarily Unavailable
              </span>
            </h1>
          </div>

          <p className="text-base text-slate-600 leading-relaxed">
            The target upstream radar and meteorological API cluster is currently unresponsive. The origin server did not respond to the edge gateway probe.
          </p>
        </div>

        {/* Realistic 3-Tier Network Diagnostic Diagram */}
        <div className="my-8 bg-white border border-slate-300 rounded-xl p-6 shadow-sm">
          <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center items-center">
            
            {/* Tier 1: You / Browser */}
            <div className="flex flex-col items-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-600">
                <Laptop className="w-6 h-6" />
              </div>
              <div className="text-xs font-semibold text-slate-700">You (Browser)</div>
              <div className="text-[11px] text-emerald-600 font-medium">Working</div>
            </div>

            {/* Tier 2: Cloud Gateway */}
            <div className="flex flex-col items-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-600">
                <Globe className="w-6 h-6" />
              </div>
              <div className="text-xs font-semibold text-slate-700">Cape Town Edge</div>
              <div className="text-[11px] text-emerald-600 font-medium">Working</div>
            </div>

            {/* Tier 3: Origin Host (Error) */}
            <div className="flex flex-col items-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-rose-100 border border-rose-400 flex items-center justify-center text-rose-600 animate-pulse">
                <Server className="w-6 h-6" />
              </div>
              <div className="text-xs font-semibold text-slate-700">Host Radar API</div>
              <div className="text-[11px] text-rose-600 font-bold">Error 503</div>
            </div>

          </div>
        </div>

        {/* Technical Diagnostics Box */}
        <div className="bg-slate-900 text-slate-300 rounded-xl p-4 text-xs font-mono space-y-2 shadow-inner">
          <div className="text-slate-400 border-b border-slate-800 pb-1">
            Diagnostic Information (HTTP Status 503 / Origin Timeout):
          </div>
          <div>• URI: /api/v2/atmosphere/za-synoptic-radar.json</div>
          <div>• Edge Gateway: JNB-04-CPT-01 (South Africa Tier 3 Node)</div>
          <div>• Timestamp: {fakeTimestamp}</div>
          <div>• Client IP: 102.132.84.19 (Allocated)</div>
          <div>• Connection Socket: Closed by remote origin host (ERR_CONNECTION_TIMED_OUT)</div>
        </div>

        {/* Action Button: Fake Retry */}
        <div className="mt-6 flex flex-col sm:flex-row items-center gap-3">
          <button
            type="button"
            id="fake-retry-btn"
            onClick={handleFakeRetry}
            disabled={isRetrying}
            className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isRetrying ? 'animate-spin' : ''}`} />
            {isRetrying ? 'Checking Origin Server...' : 'Retry Connection'}
          </button>

          {retryCount > 0 && (
            <span className="text-xs text-rose-600 font-medium">
              Retry attempt {retryCount} failed: Upstream host still unreachable.
            </span>
          )}
        </div>

      </main>

      {/* Secret Safe PIN Unlock Dialog (Triggered by tapping 503 four times) */}
      {showSecretUnlock && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 text-slate-100 border border-slate-800 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                <Lock className="w-5 h-5" />
                <span>Deactivate Stealth Duress</span>
              </div>
              <button
                type="button"
                onClick={() => setShowSecretUnlock(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Silent SOS tracking is currently running in the background. Enter your Safe PIN to deactivate and return.
            </p>

            <form onSubmit={handleSecretUnlock} className="space-y-4">
              <input
                type="password"
                maxLength={6}
                placeholder="Enter Safe PIN"
                value={safePinInput}
                onChange={(e) => {
                  setSafePinInput(e.target.value.replace(/\D/g, ''));
                  setPinError('');
                }}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl text-center text-xl font-mono tracking-widest text-emerald-300 outline-none"
                autoFocus
              />
              {pinError && <p className="text-xs text-rose-400 text-center">{pinError}</p>}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowSecretUnlock(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white cursor-pointer"
                >
                  Unlock & Stand Down
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="w-full border-t border-slate-300 bg-slate-200 py-3 px-6 text-center text-xs text-slate-500">
        <span>Cloudflare Inc. • Performance & Security CDN • Ray ID: {rayId}</span>
      </footer>

    </div>
  );
};
