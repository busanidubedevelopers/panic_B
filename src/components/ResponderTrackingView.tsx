import React, { useState, useEffect } from 'react';
import { UserConfig, LocationData, EmergencyState, DeviceTelemetry } from '../types';
import {
  ShieldAlert,
  Radio,
  Phone,
  MessageSquare,
  MapPin,
  Battery,
  BatteryCharging,
  Wifi,
  Volume2,
  Clock,
  CheckCircle2,
  Car,
  Navigation,
  Copy,
  ExternalLink,
  ArrowLeft,
  Share2,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import { triggerHaptic, HAPTIC_PATTERNS } from '../utils/haptics';

interface ResponderTrackingViewProps {
  userConfig: UserConfig;
  currentLocation: LocationData | null;
  emergencyState: EmergencyState;
  telemetry: DeviceTelemetry;
  onClose: () => void;
}

export const ResponderTrackingView: React.FC<ResponderTrackingViewProps> = ({
  userConfig,
  currentLocation,
  emergencyState,
  telemetry,
  onClose,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [dispatchStatus, setDispatchStatus] = useState<'pending' | 'dispatched' | 'en_route' | 'on_scene'>('dispatched');
  const [etaMinutes, setEtaMinutes] = useState<number>(4);
  const [caseNumber] = useState<string>(`SAPS-${Math.floor(100000 + Math.random() * 900000)}`);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatElapsed = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const trackingUrl = typeof window !== 'undefined'
    ? `${window.location.origin}?track=${caseNumber}&lat=${currentLocation?.latitude ?? -33.9249}&lng=${currentLocation?.longitude ?? 18.4241}`
    : `https://emergency.safetynet.za/track/${caseNumber}`;

  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(trackingUrl);
      setCopiedLink(true);
      triggerHaptic(HAPTIC_PATTERNS.tap);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const lat = currentLocation?.latitude ?? -33.9249;
  const lng = currentLocation?.longitude ?? 18.4241;
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

  return (
    <div id="responder-portal-view" className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 space-y-5">
      
      {/* Top Navigation Bar */}
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 transition-colors"
            title="Back to Command Hub"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
              <h1 className="text-base sm:text-lg font-bold text-white font-mono tracking-tight">
                RESPONDER CAD PORTAL • {caseNumber}
              </h1>
            </div>
            <p className="text-xs text-slate-400">
              Live Satellite Telemetry & ICE Responder Interface
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopyLink}
            className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs text-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {copiedLink ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5 text-sky-400" />}
            <span>{copiedLink ? 'Link Copied' : 'Share Live Tracker'}</span>
          </button>

          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white flex items-center gap-1.5 transition-colors"
          >
            <Navigation className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Open in</span> Maps
          </a>
        </div>
      </header>

      {/* Responder Status Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-950/90 via-slate-900 to-slate-900 border border-rose-500/50 shadow-2xl flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-md bg-rose-500 text-white font-mono font-bold text-[11px] animate-pulse">
              CODE RED DURESS
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Signal Active: <strong className="text-white font-bold">{formatElapsed(elapsedSeconds)}</strong>
            </span>
          </div>
          <div className="text-base font-bold text-white">
            Victim: {userConfig.fullName}
          </div>
          <div className="text-xs text-slate-300 flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            <span className="truncate">{currentLocation?.addressName || userConfig.primaryAddress}</span>
          </div>
        </div>

        {/* Device Telemetry Badges */}
        <div className="flex items-center gap-2 bg-slate-950/80 px-3 py-2 rounded-xl border border-slate-800 text-xs font-mono">
          <div className="flex items-center gap-1 text-slate-300">
            {telemetry.isCharging ? <BatteryCharging className="w-4 h-4 text-emerald-400" /> : <Battery className="w-4 h-4 text-amber-400" />}
            <span>{telemetry.batteryLevel ?? 85}%</span>
          </div>
          <span className="text-slate-600">|</span>
          <div className="flex items-center gap-1 text-emerald-400">
            <Wifi className="w-4 h-4" />
            <span>4G LTE Active</span>
          </div>
          <span className="text-slate-600">|</span>
          <div className="text-sky-400">
            ±{Math.round(currentLocation?.accuracy ?? 8)}m GPS
          </div>
        </div>
      </div>

      {/* Main Grid: Live Radar View + Dispatch Tracking */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* Live Radar Coordinate Stream (2 Cols) */}
        <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-4">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-300">
            <span className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
              Live Tactical GPS Beacon Map
            </span>
            <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/50">
              {lat.toFixed(5)}, {lng.toFixed(5)}
            </span>
          </div>

          {/* Interactive Radar Canvas Simulation */}
          <div className="relative h-64 sm:h-72 rounded-xl bg-slate-950 border border-slate-800 overflow-hidden flex items-center justify-center">
            {/* Grid Lines */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:24px_24px] opacity-40" />

            {/* Concentric Radar Rings */}
            <div className="absolute w-56 h-56 rounded-full border border-emerald-500/20 pointer-events-none" />
            <div className="absolute w-40 h-40 rounded-full border border-emerald-500/30 pointer-events-none" />
            <div className="absolute w-24 h-24 rounded-full border border-emerald-500/40 pointer-events-none animate-ping" />

            {/* Sweep Line */}
            <div className="absolute w-28 h-28 border-r-2 border-emerald-500/50 origin-bottom-left rotate-45 pointer-events-none" />

            {/* Target Pulse Dot */}
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-6 h-6 rounded-full bg-rose-500/30 flex items-center justify-center animate-ping">
                <div className="w-3.5 h-3.5 rounded-full bg-rose-500 ring-4 ring-white shadow-lg" />
              </div>
              <div className="mt-2 bg-slate-900/90 border border-rose-500/80 px-2.5 py-1 rounded-lg text-[11px] font-mono text-rose-300 shadow-xl flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                {userConfig.fullName} (Target Active)
              </div>
            </div>

            {/* Nearest SAPS Station Icon */}
            <div className="absolute top-4 right-4 bg-slate-900/90 border border-blue-500/60 p-2 rounded-xl text-[11px] text-blue-300 font-mono flex items-center gap-1.5 shadow-lg">
              <Car className="w-3.5 h-3.5 text-blue-400" />
              <span>SAPS Flying Squad (ETA ~{etaMinutes} min)</span>
            </div>

            <div className="absolute bottom-3 left-3 bg-slate-900/90 border border-slate-800 px-2.5 py-1 rounded-lg text-[10px] text-slate-400 font-mono">
              Sector: {userConfig.sapsSector}
            </div>
          </div>

          {/* Unit Dispatch Stepper */}
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
            <div className="text-xs font-semibold text-slate-300 flex items-center justify-between">
              <span>Armed Patrol Dispatch Status</span>
              <span className="font-mono text-emerald-400 text-[11px] uppercase">
                {dispatchStatus.replace('_', ' ')}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setDispatchStatus('dispatched');
                  setEtaMinutes(4);
                }}
                className={`p-2 rounded-lg text-xs font-medium border text-center transition-all cursor-pointer ${
                  dispatchStatus === 'dispatched'
                    ? 'bg-blue-950 border-blue-500 text-blue-200'
                    : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                1. Dispatched
              </button>

              <button
                type="button"
                onClick={() => {
                  setDispatchStatus('en_route');
                  setEtaMinutes(2);
                }}
                className={`p-2 rounded-lg text-xs font-medium border text-center transition-all cursor-pointer ${
                  dispatchStatus === 'en_route'
                    ? 'bg-amber-950 border-amber-500 text-amber-200'
                    : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                2. En Route
              </button>

              <button
                type="button"
                onClick={() => {
                  setDispatchStatus('on_scene');
                  setEtaMinutes(0);
                }}
                className={`p-2 rounded-lg text-xs font-medium border text-center transition-all cursor-pointer ${
                  dispatchStatus === 'on_scene'
                    ? 'bg-emerald-950 border-emerald-500 text-emerald-200'
                    : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                3. On Scene
              </button>
            </div>
          </div>
        </div>

        {/* Right Sidebar: Victim Profile & Contact Channels */}
        <div className="space-y-4">
          
          {/* Victim Profile Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Victim Emergency Profile
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between border-b border-slate-800 pb-1.5">
                <span className="text-slate-400">Full Name</span>
                <span className="font-semibold text-white">{userConfig.fullName}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-1.5">
                <span className="text-slate-400">Phone</span>
                <span className="font-mono text-slate-200">{userConfig.phoneNumber}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-1.5">
                <span className="text-slate-400">ICE Next of Kin</span>
                <span className="text-amber-300 font-semibold">{userConfig.iceContactName}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-1.5">
                <span className="text-slate-400">ICE Phone</span>
                <span className="font-mono text-amber-200">{userConfig.iceContactPhone}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-1">Registered Address</span>
                <span className="text-slate-300 font-medium leading-relaxed block bg-slate-950 p-2 rounded-lg border border-slate-800/80">
                  {userConfig.primaryAddress}
                </span>
              </div>
            </div>

            {/* Direct Responder Action Buttons */}
            <div className="space-y-2 pt-1">
              <a
                href={`tel:${userConfig.iceContactPhone}`}
                className="w-full py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow transition-colors"
              >
                <Phone className="w-3.5 h-3.5" />
                Call ICE Contact ({userConfig.iceContactName.split(' ')[0]})
              </a>

              <a
                href={`tel:${userConfig.phoneNumber}`}
                className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center justify-center gap-2 border border-slate-700 transition-colors"
              >
                <Phone className="w-3.5 h-3.5 text-emerald-400" />
                Call Victim's Device
              </a>
            </div>
          </div>

          {/* Audio Evidence Stream Listen-In */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-2.5">
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-400">
              <span className="flex items-center gap-1.5 text-rose-400">
                <Volume2 className="w-4 h-4" />
                Live Audio Intercept
              </span>
              <span className="text-[10px] font-mono text-slate-500">256-bit AES</span>
            </div>

            <p className="text-[11px] text-slate-400">
              Direct microphone buffer stream active from device microphone during alarm.
            </p>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                <span className="text-xs font-mono text-slate-200">BUFFER_STREAM_LIVE.webm</span>
              </div>
              <span className="text-[11px] text-emerald-400 font-mono">ENCRYPTED</span>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
