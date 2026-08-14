import React from 'react';
import { LocationData, UserConfig } from '../types';
import { MapPin, Navigation, Radio, ExternalLink, ShieldCheck, Compass, AlertCircle } from 'lucide-react';
import { triggerHaptic, HAPTIC_PATTERNS } from '../utils/haptics';

interface GeofencingMapProps {
  location: LocationData | null;
  userConfig: UserConfig;
  onRefreshLocation: () => void;
}

export const GeofencingMap: React.FC<GeofencingMapProps> = ({
  location,
  userConfig,
  onRefreshLocation,
}) => {
  const hasGps = location && location.latitude !== null && location.longitude !== null;
  const lat = location?.latitude ?? -33.9249;
  const lng = location?.longitude ?? 18.4241;
  const accuracy = location?.accuracy ? Math.round(location.accuracy) : 15;

  const mapsUrl = hasGps
    ? `https://maps.google.com/?q=${lat},${lng}`
    : `https://maps.google.com/?q=${encodeURIComponent(userConfig.primaryAddress)}`;

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-300">
          <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
          <span>Tactical Geolocation & Geofence</span>
        </div>
        <button
          type="button"
          id="btn-refresh-gps"
          onClick={() => {
            triggerHaptic(HAPTIC_PATTERNS.tap);
            onRefreshLocation();
          }}
          className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 hover:underline cursor-pointer"
        >
          <Navigation className="w-3.5 h-3.5" />
          Re-acquire GPS
        </button>
      </div>

      {/* Radar Map Graphic */}
      <div className="relative h-36 bg-slate-950 rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center">
        {/* Concentric radar rings */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-20 h-20 rounded-full border border-emerald-500/20 animate-ping duration-1000" />
          <div className="w-28 h-28 rounded-full border border-emerald-500/20 absolute" />
          <div className="w-44 h-44 rounded-full border border-emerald-500/10 absolute" />
          <div className="w-full h-px bg-emerald-500/15 absolute" />
          <div className="h-full w-px bg-emerald-500/15 absolute" />
        </div>

        {/* Center Target Pin */}
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-8 h-8 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-emerald-300 shadow-lg shadow-emerald-500/30">
            <MapPin className="w-4 h-4" />
          </div>
          <span className="text-[11px] font-mono bg-slate-900/90 text-emerald-300 px-2 py-0.5 rounded-md mt-1 border border-emerald-500/30">
            {hasGps ? `GPS ±${accuracy}m` : 'Fallback Address Mode'}
          </span>
        </div>

        {/* Floating Coordinates & Dispatch Sector Badge */}
        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[11px] bg-slate-900/80 backdrop-blur-sm px-2.5 py-1.5 rounded-lg border border-slate-800">
          <span className="font-mono text-slate-300">
            {hasGps ? `${lat.toFixed(5)}, ${lng.toFixed(5)}` : 'Using Cached Physical Fallback'}
          </span>
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-medium"
          >
            Google Maps <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* Geofence & Dispatch Sector Details */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
        <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-0.5">
          <div className="text-[11px] text-slate-400 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Active Dispatch Sector
          </div>
          <div className="font-medium text-slate-200 truncate">
            {userConfig.sapsSector}
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-0.5">
          <div className="text-[11px] text-slate-400 flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-amber-400" />
            Physical Fallback Address
          </div>
          <div className="font-medium text-slate-200 truncate" title={userConfig.primaryAddress}>
            {userConfig.primaryAddress}
          </div>
        </div>
      </div>
    </div>
  );
};
