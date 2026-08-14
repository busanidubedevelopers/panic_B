import React, { useState, useRef, useEffect } from 'react';
import { UserConfig, LocationData, EmergencyState, DeviceTelemetry, SafetyTimer } from '../types';
import { GeofencingMap } from './GeofencingMap';
import { AudioEvidenceRecorder } from './AudioEvidenceRecorder';
import { SafetyEscortTimer } from './SafetyEscortTimer';
import {
  ShieldAlert,
  AlertTriangle,
  Radio,
  Phone,
  MessageSquare,
  Eye,
  Lock,
  RotateCcw,
  CheckCircle,
  Volume2,
  VolumeX,
  Clock,
  Sparkles,
  ArrowLeft,
  ChevronRight,
  ExternalLink,
  Shield,
  Siren,
  Battery,
  BatteryCharging,
  Smartphone,
  Share2,
} from 'lucide-react';
import { triggerHaptic, HAPTIC_PATTERNS } from '../utils/haptics';
import { soundEngine } from '../utils/sound';

interface SecurityDashboardViewProps {
  userConfig: UserConfig;
  currentLocation: LocationData | null;
  emergencyState: EmergencyState;
  telemetry: DeviceTelemetry;
  safetyTimer: SafetyTimer;
  onTriggerActiveSOS: (triggerType?: string) => void;
  onCancelEmergency: (pin: string) => boolean;
  onRefreshLocation: () => void;
  onReturnToDisguise: () => void;
  onOpenSettings: () => void;
  onOpenResponderPortal: () => void;
  onStartSafetyTimer: (minutes: number, label: string) => void;
  onCancelSafetyTimer: (pin: string) => boolean;
}

export const SecurityDashboardView: React.FC<SecurityDashboardViewProps> = ({
  userConfig,
  currentLocation,
  emergencyState,
  telemetry,
  safetyTimer,
  onTriggerActiveSOS,
  onCancelEmergency,
  onRefreshLocation,
  onReturnToDisguise,
  onOpenSettings,
  onOpenResponderPortal,
  onStartSafetyTimer,
  onCancelSafetyTimer,
}) => {
  // Main SOS Button Hold state
  const [sosHoldProgress, setSosHoldProgress] = useState(0);
  const [isHoldingSos, setIsHoldingSos] = useState(false);
  const holdIntervalRef = useRef<number | null>(null);
  const holdStartRef = useRef<number>(0);

  // Stand down cancel PIN dialog
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelPinInput, setCancelPinInput] = useState('');
  const [cancelError, setCancelError] = useState('');

  // Audio Siren toggle
  const [isSirenActive, setIsSirenActive] = useState(false);

  // SMS payload generation
  const buildSmsPayload = () => {
    const lat = currentLocation?.latitude;
    const lng = currentLocation?.longitude;
    const mapsLink = lat && lng ? `https://maps.google.com/?q=${lat},${lng}` : 'GPS Unavailable';
    const accuracy = currentLocation?.accuracy ? `(±${Math.round(currentLocation.accuracy)}m)` : '';
    const now = new Date().toLocaleTimeString();

    return `EMERGENCY SOS: ${userConfig.fullName} triggered emergency panic alarm at ${now}. Live GPS: ${mapsLink} ${accuracy}. Fallback Address: ${userConfig.primaryAddress}. SAPS 10111 alerted.`;
  };

  const smsUrl = `sms:${encodeURIComponent(userConfig.iceContactPhone)}?body=${encodeURIComponent(buildSmsPayload())}`;

  // Handle Main SOS Hold (2 Seconds)
  const startSosHold = () => {
    setIsHoldingSos(true);
    holdStartRef.current = Date.now();

    holdIntervalRef.current = window.setInterval(() => {
      const elapsed = Date.now() - holdStartRef.current;
      const progress = Math.min(100, (elapsed / 2000) * 100);
      setSosHoldProgress(progress);

      soundEngine.playHoldTick(progress / 100);

      if (progress % 20 < 5) {
        triggerHaptic(HAPTIC_PATTERNS.holdTick);
      }

      if (elapsed >= 2000) {
        if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
        setIsHoldingSos(false);
        setSosHoldProgress(0);
        triggerHaptic(HAPTIC_PATTERNS.armed);
        soundEngine.playArmedChirp();
        onTriggerActiveSOS('dashboard_hold');
      }
    }, 40);
  };

  const cancelSosHold = () => {
    if (holdIntervalRef.current) {
      clearInterval(holdIntervalRef.current);
      holdIntervalRef.current = null;
    }
    setIsHoldingSos(false);
    setSosHoldProgress(0);
  };

  const handleCancelSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const success = onCancelEmergency(cancelPinInput);
    if (success) {
      setShowCancelModal(false);
      setCancelPinInput('');
      setCancelError('');
      setIsSirenActive(false);
      soundEngine.stopSiren();
      soundEngine.playStandDownTone();
    } else {
      setCancelError('Incorrect Safe PIN. Emergency beacon remains active.');
      triggerHaptic([100, 100, 100]);
    }
  };

  const toggleSiren = () => {
    if (isSirenActive) {
      soundEngine.stopSiren();
      setIsSirenActive(false);
    } else {
      soundEngine.startSiren();
      setIsSirenActive(true);
    }
  };

  return (
    <div id="sos-ui" className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-4 sm:p-6 space-y-6">
      
      {/* Top Header & Disguise Quick Switch */}
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-white tracking-tight">
                Emergency Command Hub
              </h1>
              {emergencyState.isActive ? (
                <span className="px-2 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-400 text-xs font-mono font-bold animate-pulse">
                  ALARM ACTIVE
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-xs font-mono font-bold">
                  ARMED & STANDBY
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span>Dispatched to {userConfig.sapsSector}</span>
              <span>•</span>
              <span className="text-slate-300 flex items-center gap-1 font-mono">
                {telemetry.isCharging ? <BatteryCharging className="w-3.5 h-3.5 text-emerald-400" /> : <Battery className="w-3.5 h-3.5 text-slate-400" />}
                {telemetry.batteryLevel ?? 88}%
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            id="btn-open-responder-portal"
            onClick={onOpenResponderPortal}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-sky-500/40 text-xs text-sky-300 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Open Responder Live Tracking Portal"
          >
            <Share2 className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden sm:inline">Live Responder</span> CAD Portal
          </button>

          <button
            type="button"
            id="btn-return-disguise"
            onClick={onReturnToDisguise}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Switch back to Weather Camouflage"
          >
            <Eye className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden sm:inline">Camouflage</span> (Weather)
          </button>
        </div>
      </header>

      {/* Emergency Active Alert Banner */}
      {emergencyState.isActive && (
        <div className="p-4 rounded-2xl bg-rose-950/80 border-2 border-rose-500/80 space-y-3 shadow-2xl animate-pulse">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Siren className="w-6 h-6 text-rose-400 animate-bounce" />
              <div>
                <div className="font-bold text-rose-200 text-sm sm:text-base">
                  LIVE EMERGENCY DISPATCH PROTOCOL TRIGGERED
                </div>
                <div className="text-xs text-rose-300/80">
                  Trigger: {emergencyState.triggerType === 'windspeed_tap' ? 'WINDSPEED METRIC TAP' : emergencyState.triggerType === 'shake_motion' ? 'POCKET SHAKE SENSOR' : emergencyState.triggerType === 'dead_man_timer' ? 'SAFETY ESCORT TIMER EXPIRED' : emergencyState.triggerType?.replace(/_/g, ' ').toUpperCase()} • Lat/Long tracking active
                </div>
              </div>
            </div>

            <button
              type="button"
              id="btn-open-cancel-modal"
              onClick={() => setShowCancelModal(true)}
              className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs shadow-lg transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Lock className="w-3.5 h-3.5" />
              Cancel Alarm (PIN)
            </button>
          </div>

          <div className="flex flex-wrap gap-2 text-xs">
            <a
              href={smsUrl}
              className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-white flex items-center gap-1.5 transition-colors"
            >
              <MessageSquare className="w-3.5 h-3.5 text-amber-300" />
              Send ICE SMS Blast
            </a>

            <button
              type="button"
              onClick={toggleSiren}
              className={`px-3 py-1.5 rounded-lg border text-white flex items-center gap-1.5 transition-colors ${
                isSirenActive ? 'bg-amber-600 border-amber-400' : 'bg-slate-900 border-slate-700'
              }`}
            >
              {isSirenActive ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              {isSirenActive ? 'Mute Siren Sound' : 'Play Siren Tone'}
            </button>

            <a
              href="tel:10111"
              className="px-3 py-1.5 rounded-lg bg-blue-600/90 hover:bg-blue-500 border border-blue-400 text-white flex items-center gap-1.5 transition-colors"
            >
              <Phone className="w-3.5 h-3.5" />
              Call SAPS 10111
            </a>
          </div>
        </div>
      )}

      {/* Main Hold-to-Trigger SOS Action Button */}
      <div className="flex flex-col items-center justify-center py-6 text-center space-y-4">
        
        {/* Giant Hold Button */}
        <div className="relative flex items-center justify-center">
          {/* Circular SVG Progress Ring */}
          <svg className="w-48 h-48 sm:w-56 sm:h-56 transform -rotate-90 pointer-events-none">
            <circle
              cx="50%"
              cy="50%"
              r="44%"
              className="stroke-slate-800"
              strokeWidth="10"
              fill="transparent"
            />
            <circle
              cx="50%"
              cy="50%"
              r="44%"
              className="stroke-rose-500 transition-all duration-75"
              strokeWidth="10"
              strokeDasharray={2 * Math.PI * 90}
              strokeDashoffset={2 * Math.PI * 90 * (1 - sosHoldProgress / 100)}
              strokeLinecap="round"
              fill="transparent"
            />
          </svg>

          {/* Interactive Center Button */}
          <button
            type="button"
            id="main-sos-hold-btn"
            onMouseDown={startSosHold}
            onMouseUp={cancelSosHold}
            onMouseLeave={cancelSosHold}
            onTouchStart={startSosHold}
            onTouchEnd={cancelSosHold}
            className={`absolute w-36 h-36 sm:w-44 sm:h-44 rounded-full flex flex-col items-center justify-center font-bold text-white transition-all transform select-none cursor-pointer shadow-2xl ${
              isHoldingSos
                ? 'bg-rose-700 scale-95 shadow-rose-900/60 ring-4 ring-rose-400/50'
                : emergencyState.isActive
                ? 'bg-rose-600 ring-4 ring-rose-500/40 animate-pulse'
                : 'bg-gradient-to-tr from-rose-600 to-red-500 hover:from-rose-500 hover:to-red-400 shadow-rose-900/40 hover:scale-105'
            }`}
          >
            <ShieldAlert className="w-10 h-10 sm:w-12 sm:h-12 mb-1" />
            <span className="text-2xl sm:text-3xl tracking-wider font-extrabold">
              {isHoldingSos ? `${Math.round(sosHoldProgress)}%` : emergencyState.isActive ? 'ALARM ON' : 'HOLD SOS'}
            </span>
            <span className="text-[10px] sm:text-xs font-normal uppercase tracking-widest text-rose-200">
              {isHoldingSos ? 'HOLD 2 SECONDS' : 'HOLD 2 SECONDS'}
            </span>
          </button>
        </div>

        <p className="text-xs text-slate-400 max-w-sm">
          Press and hold for 2 full seconds to trigger emergency dispatch, live GPS tracking, and ICE broadcast.
        </p>
      </div>

      {/* "Walk With Me" Safety Escort Dead Man's Switch */}
      <SafetyEscortTimer
        safetyTimer={safetyTimer}
        accessPin={userConfig.accessPin}
        onStartTimer={onStartSafetyTimer}
        onCancelTimer={onCancelSafetyTimer}
        onTimerExpired={() => onTriggerActiveSOS('dead_man_timer')}
      />

      {/* Grid: Tactical Geofencing & Audio Evidence Recorder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <GeofencingMap
          location={currentLocation}
          userConfig={userConfig}
          onRefreshLocation={onRefreshLocation}
        />
        <AudioEvidenceRecorder
          isEmergencyActive={emergencyState.isActive}
          gpsCoords={{ latitude: currentLocation?.latitude ?? null, longitude: currentLocation?.longitude ?? null }}
        />
      </div>

      {/* Emergency Fast Dispatch Actions */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3">
        <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <Phone className="w-4 h-4 text-emerald-400" />
          Direct Dispatch & SMS Fallback Channels
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          
          {/* SMS Blast Trigger */}
          <a
            href={smsUrl}
            id="btn-sms-fallback-blast"
            onClick={() => triggerHaptic(HAPTIC_PATTERNS.tap)}
            className="p-3 rounded-xl bg-slate-950 hover:bg-slate-800/80 border border-slate-800 hover:border-amber-500/50 text-left transition-all flex flex-col justify-between group"
          >
            <div className="flex items-center justify-between text-xs text-amber-400 font-semibold mb-1">
              <span className="flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4" />
                ICE SMS Blast
              </span>
              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
            <div className="text-slate-200 text-xs font-medium truncate">
              {userConfig.iceContactName}
            </div>
            <div className="text-[11px] text-slate-400 truncate">
              {userConfig.iceContactPhone}
            </div>
          </a>

          {/* SAPS 10111 Flying Squad Call */}
          <a
            href="tel:10111"
            id="btn-call-saps-10111"
            onClick={() => triggerHaptic(HAPTIC_PATTERNS.tap)}
            className="p-3 rounded-xl bg-slate-950 hover:bg-slate-800/80 border border-slate-800 hover:border-blue-500/50 text-left transition-all flex flex-col justify-between group"
          >
            <div className="flex items-center justify-between text-xs text-blue-400 font-semibold mb-1">
              <span className="flex items-center gap-1.5">
                <Phone className="w-4 h-4" />
                SAPS 10111 Flying Squad
              </span>
              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
            <div className="text-slate-200 text-xs font-medium truncate">
              National Emergency Police
            </div>
            <div className="text-[11px] text-slate-400">
              Direct Emergency Line (Toll Free)
            </div>
          </a>

          {/* Campus Security / GBV Command Centre */}
          <a
            href={`tel:${userConfig.campusSecurityPhone || '0800428428'}`}
            id="btn-call-campus-patrol"
            onClick={() => triggerHaptic(HAPTIC_PATTERNS.tap)}
            className="p-3 rounded-xl bg-slate-950 hover:bg-slate-800/80 border border-slate-800 hover:border-emerald-500/50 text-left transition-all flex flex-col justify-between group"
          >
            <div className="flex items-center justify-between text-xs text-emerald-400 font-semibold mb-1">
              <span className="flex items-center gap-1.5">
                <Shield className="w-4 h-4" />
                Campus / Patrol Security
              </span>
              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
            <div className="text-slate-200 text-xs font-medium truncate">
              Armed Patrol & GBV Line
            </div>
            <div className="text-[11px] text-slate-400 truncate">
              {userConfig.campusSecurityPhone || '0800 428 428'}
            </div>
          </a>

        </div>
      </div>

      {/* Live Event & Dispatch Logs Timeline */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-400">
          <span className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-sky-400" />
            Live Security Audit & Beacon History
          </span>
          <span className="text-[11px] font-mono text-slate-500">
            {emergencyState.beaconLogs.length} Events Logged
          </span>
        </div>

        <div className="max-h-36 overflow-y-auto space-y-2 pr-1 divide-y divide-slate-800/60 scrollbar-thin">
          {emergencyState.beaconLogs.length === 0 ? (
            <div className="text-xs text-slate-500 text-center py-4">
              System armed in standby mode. No active emergency beacons triggered.
            </div>
          ) : (
            emergencyState.beaconLogs.map((log) => (
              <div key={log.id} className="pt-2 first:pt-0 flex items-start gap-2 text-xs">
                <span className="font-mono text-[11px] text-slate-500 shrink-0">
                  {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono uppercase shrink-0 ${
                    log.type === 'danger'
                      ? 'bg-rose-500/20 text-rose-400'
                      : log.type === 'alert'
                      ? 'bg-amber-500/20 text-amber-400'
                      : 'bg-emerald-500/20 text-emerald-400'
                  }`}
                >
                  {log.type}
                </span>
                <span className="text-slate-300 flex-1">{log.message}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Secure PIN Modal to Stand Down / Cancel Alarm */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
                <Lock className="w-5 h-5" />
                <span>Stand Down Verification</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowCancelModal(false);
                  setCancelPinInput('');
                  setCancelError('');
                }}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Enter your **Safe Access PIN** to deactivate the emergency alarm and confirm you are safe.
            </p>

            <form onSubmit={handleCancelSubmit} className="space-y-4">
              <div>
                <input
                  type="password"
                  id="input-cancel-pin"
                  maxLength={6}
                  placeholder="Enter Safe PIN"
                  value={cancelPinInput}
                  onChange={(e) => {
                    setCancelPinInput(e.target.value.replace(/\D/g, ''));
                    setCancelError('');
                  }}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl text-center text-xl font-mono tracking-widest text-emerald-300 outline-none"
                  autoFocus
                />
                {cancelError && <p className="text-xs text-rose-400 mt-1.5 text-center">{cancelError}</p>}
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowCancelModal(false);
                    setCancelPinInput('');
                    setCancelError('');
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-colors"
                >
                  Keep Active
                </button>

                <button
                  type="submit"
                  id="btn-confirm-cancel-alarm"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white transition-colors cursor-pointer"
                >
                  Confirm Stand Down
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
