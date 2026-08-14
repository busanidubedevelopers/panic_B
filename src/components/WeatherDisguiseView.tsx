import React, { useState, useEffect, useRef } from 'react';
import { UserConfig, WeatherCondition, LocationData, DeviceTelemetry, SafetyTimer } from '../types';
import { DEFAULT_WEATHER_CITIES, getFallbackWeather, fetchRealWeather } from '../utils/weatherData';
import {
  Search,
  Cloud,
  Sun,
  CloudRain,
  CloudLightning,
  Wind,
  Droplets,
  Eye,
  Thermometer,
  ShieldCheck,
  Info,
  KeyRound,
  RefreshCw,
  Compass,
  Sunrise,
  Sunset,
  VolumeX,
  Battery,
  BatteryCharging,
  Smartphone,
  Footprints,
  Sparkles,
} from 'lucide-react';
import { triggerHaptic, HAPTIC_PATTERNS } from '../utils/haptics';
import { soundEngine } from '../utils/sound';

interface WeatherDisguiseViewProps {
  userConfig: UserConfig;
  currentLocation: LocationData | null;
  telemetry?: DeviceTelemetry;
  safetyTimer?: SafetyTimer;
  onUnlockDashboard: () => void;
  onTriggerDuressLockdown: () => void;
  onTriggerStealthSOS: () => void;
  onTriggerWindSpeedPanic: () => void;
  onTriggerShakeSOS?: () => void;
  onLogout?: () => void;
  onOpenSettings: () => void;
  onOpenResponderPortal?: () => void;
}

export const WeatherDisguiseView: React.FC<WeatherDisguiseViewProps> = ({
  userConfig,
  currentLocation,
  telemetry,
  safetyTimer,
  onUnlockDashboard,
  onTriggerDuressLockdown,
  onTriggerStealthSOS,
  onTriggerWindSpeedPanic,
  onTriggerShakeSOS,
  onLogout,
  onOpenSettings,
  onOpenResponderPortal,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentWeather, setCurrentWeather] = useState<WeatherCondition>(
    DEFAULT_WEATHER_CITIES['cape town']
  );
  const [isSearching, setIsSearching] = useState(false);
  const [isLiveFetching, setIsLiveFetching] = useState(false);
  const [currentTime, setCurrentTime] = useState('');
  const [windSpeedTapPulse, setWindSpeedTapPulse] = useState(false);
  const [airQualityTapPulse, setAirQualityTapPulse] = useState(false);
  const [shakeSimPulse, setShakeSimPulse] = useState(false);

  // Stealth Header Hold gesture tracking
  const [headerHoldProgress, setHeaderHoldProgress] = useState(0);
  const [isHoldingHeader, setIsHoldingHeader] = useState(false);
  const holdTimerRef = useRef<number | null>(null);
  const holdStartRef = useRef<number>(0);

  // Discreet Pin Keypad Modal for alternative easy input
  const [showDiscreetKeypad, setShowDiscreetKeypad] = useState(false);
  const [keypadPin, setKeypadPin] = useState('');
  const [showDemoGuide, setShowDemoGuide] = useState(false);

  // Update live clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  // Fetch real Open-Meteo weather when location updates
  useEffect(() => {
    let isCancelled = false;
    if (currentLocation?.latitude && currentLocation?.longitude) {
      setIsLiveFetching(true);
      fetchRealWeather(
        currentLocation.latitude,
        currentLocation.longitude,
        currentLocation.isFallback ? 'Cape Town' : 'Live Station'
      ).then((data) => {
        if (!isCancelled) {
          setCurrentWeather(data);
          setIsLiveFetching(false);
        }
      }).catch(() => {
        if (!isCancelled) setIsLiveFetching(false);
      });
    }
    return () => {
      isCancelled = true;
    };
  }, [currentLocation?.latitude, currentLocation?.longitude, currentLocation?.isFallback]);

  // Check search bar inputs for PIN triggers
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);

    // Clean numerical PIN check
    const digitsOnly = val.trim();

    // Check Safe Access PIN match
    if (digitsOnly === userConfig.accessPin) {
      triggerHaptic(HAPTIC_PATTERNS.armed);
      soundEngine.playArmedChirp();
      setSearchQuery('');
      onUnlockDashboard();
      return;
    }

    // Check Duress PIN match
    if (digitsOnly === userConfig.duressPin) {
      triggerHaptic(HAPTIC_PATTERNS.stealthTrigger);
      setSearchQuery('');
      onTriggerDuressLockdown();
      return;
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    // Check PINs first
    const trimmed = searchQuery.trim();
    if (trimmed === userConfig.accessPin) {
      triggerHaptic(HAPTIC_PATTERNS.armed);
      soundEngine.playArmedChirp();
      setSearchQuery('');
      onUnlockDashboard();
      return;
    }
    if (trimmed === userConfig.duressPin) {
      triggerHaptic(HAPTIC_PATTERNS.stealthTrigger);
      setSearchQuery('');
      onTriggerDuressLockdown();
      return;
    }

    // Normal city search
    setIsSearching(true);
    triggerHaptic(HAPTIC_PATTERNS.tap);
    setTimeout(() => {
      const weather = getFallbackWeather(trimmed);
      setCurrentWeather(weather);
      setIsSearching(false);
    }, 300);
  };

  // Discreet Keypad Pin Entry
  const handleKeypadPress = (digit: string) => {
    triggerHaptic(HAPTIC_PATTERNS.tap);
    const newPin = keypadPin + digit;
    setKeypadPin(newPin);

    if (newPin.length >= 4) {
      if (newPin === userConfig.accessPin) {
        triggerHaptic(HAPTIC_PATTERNS.armed);
        soundEngine.playArmedChirp();
        setShowDiscreetKeypad(false);
        setKeypadPin('');
        onUnlockDashboard();
      } else if (newPin === userConfig.duressPin) {
        triggerHaptic(HAPTIC_PATTERNS.stealthTrigger);
        setShowDiscreetKeypad(false);
        setKeypadPin('');
        onTriggerDuressLockdown();
      } else if (newPin.length >= (userConfig.accessPin?.length || 4)) {
        triggerHaptic([30, 30, 30]);
        setTimeout(() => setKeypadPin(''), 300);
      }
    }
  };

  // Stealth Header Hold Gesture (3 Seconds)
  const startHeaderHold = () => {
    setIsHoldingHeader(true);
    holdStartRef.current = Date.now();

    holdTimerRef.current = window.setInterval(() => {
      const elapsed = Date.now() - holdStartRef.current;
      const progress = Math.min(100, (elapsed / 3000) * 100);
      setHeaderHoldProgress(progress);

      if (progress % 20 < 5) {
        triggerHaptic(HAPTIC_PATTERNS.holdTick);
      }

      if (elapsed >= 3000) {
        if (holdTimerRef.current) clearInterval(holdTimerRef.current);
        setIsHoldingHeader(false);
        setHeaderHoldProgress(0);
        triggerHaptic(HAPTIC_PATTERNS.stealthTrigger);
        onTriggerStealthSOS();
      }
    }, 50);
  };

  const cancelHeaderHold = () => {
    if (holdTimerRef.current) {
      clearInterval(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    setIsHoldingHeader(false);
    setHeaderHoldProgress(0);
  };

  // Direct Panic Trigger: Tap on Wind Speed Metric
  const handleWindSpeedTap = () => {
    setWindSpeedTapPulse(true);
    triggerHaptic(HAPTIC_PATTERNS.emergencyLoop);
    onTriggerWindSpeedPanic();
    setTimeout(() => {
      setWindSpeedTapPulse(false);
    }, 1200);
  };

  // Stealth Logout Trigger: Tap on Air Quality Metric
  const handleAirQualityTap = () => {
    setAirQualityTapPulse(true);
    triggerHaptic(HAPTIC_PATTERNS.tap);
    soundEngine.playBeep(480, 'sine', 0.09);
    setTimeout(() => {
      setAirQualityTapPulse(false);
      if (onLogout) {
        onLogout();
      }
    }, 300);
  };

  // Shake trigger simulator
  const handleSimulateShake = () => {
    setShakeSimPulse(true);
    triggerHaptic(HAPTIC_PATTERNS.emergencyLoop);
    if (onTriggerShakeSOS) {
      onTriggerShakeSOS();
    } else {
      onTriggerStealthSOS();
    }
    setTimeout(() => setShakeSimPulse(false), 1200);
  };

  const getWeatherIcon = (iconName: string, className = 'w-8 h-8') => {
    switch (iconName) {
      case 'sun':
        return <Sun className={`${className} text-amber-400`} />;
      case 'partly-cloudy':
        return <Cloud className={`${className} text-sky-200`} />;
      case 'cloud':
        return <Cloud className={`${className} text-slate-300`} />;
      case 'rain':
        return <CloudRain className={`${className} text-blue-400`} />;
      case 'storm':
        return <CloudLightning className={`${className} text-purple-400`} />;
      case 'wind':
        return <Wind className={`${className} text-teal-300`} />;
      default:
        return <Sun className={`${className} text-amber-400`} />;
    }
  };


  return (
    <div id="weather-ui" className="min-h-screen bg-gradient-to-b from-sky-900 via-slate-900 to-slate-950 text-white flex flex-col justify-between pb-10">
      
      {/* Top Camouflage App Bar with Stealth Zone */}
      <header className="relative px-4 pt-4 pb-2 z-20">
        
        {/* Stealth Hold Zone Header */}
        <div
          id="stealth-zone"
          onMouseDown={startHeaderHold}
          onMouseUp={cancelHeaderHold}
          onMouseLeave={cancelHeaderHold}
          onTouchStart={startHeaderHold}
          onTouchEnd={cancelHeaderHold}
          className="relative select-none cursor-pointer rounded-xl p-2 transition-colors active:bg-white/5 flex items-center justify-between"
          title="Hold for 3s to trigger silent SOS"
        >
          {/* Subtle Hold Progress Bar (Micro-Indicator) */}
          {isHoldingHeader && (
            <div
              className="absolute inset-0 bg-emerald-500/15 rounded-xl border border-emerald-500/30 transition-all pointer-events-none"
              style={{ width: `${headerHoldProgress}%` }}
            />
          )}

          <div className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${isLiveFetching ? 'bg-amber-400 animate-spin' : 'bg-emerald-400 animate-pulse'}`} />
            <div className="text-left">
              <div className="flex items-center gap-1.5">
                <span className="font-bold tracking-tight text-lg text-white">
                  {currentWeather.city}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-sky-200 font-medium flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5 text-amber-300" />
                  {isLiveFetching ? 'Fetching Live...' : 'Open-Meteo Live'}
                </span>
              </div>
              <p className="text-[11px] text-sky-200/70 font-light truncate max-w-[200px]">
                {currentWeather.province}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {telemetry && (
              <div className="hidden sm:flex items-center gap-1 text-xs text-sky-200/80 bg-white/5 px-2 py-1 rounded-lg border border-white/10">
                {telemetry.isCharging ? <BatteryCharging className="w-3.5 h-3.5 text-emerald-400" /> : <Battery className="w-3.5 h-3.5 text-sky-300" />}
                <span className="font-mono text-[11px]">{telemetry.batteryLevel ?? 92}%</span>
              </div>
            )}
            <span className="text-sm font-mono text-sky-100 font-medium">
              {currentTime}
            </span>
            <button
              type="button"
              id="btn-demo-guide-toggle"
              onClick={(e) => {
                e.stopPropagation();
                setShowDemoGuide(!showDemoGuide);
                triggerHaptic(HAPTIC_PATTERNS.tap);
              }}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-sky-200 hover:text-white transition-colors"
              title="Stealth PIN & Trigger Guide"
            >
              <Info className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Active Safety Escort Banner (if armed in background) */}
        {safetyTimer?.isActive && (
          <div className="mt-2.5 px-3.5 py-2 rounded-xl bg-emerald-950/80 border border-emerald-500/50 flex items-center justify-between text-xs backdrop-blur-md animate-pulse">
            <div className="flex items-center gap-2 text-emerald-200">
              <Footprints className="w-4 h-4 text-emerald-400" />
              <span className="font-medium">Safety Escort Armed: {safetyTimer.label}</span>
            </div>
            <span className="font-mono font-bold text-emerald-300">
              {Math.floor(safetyTimer.remainingSeconds / 60).toString().padStart(2, '0')}:
              {(safetyTimer.remainingSeconds % 60).toString().padStart(2, '0')}
            </span>
          </div>
        )}

        {/* Search Bar - Intercepts Access PIN & Duress PIN */}
        <form onSubmit={handleSearchSubmit} className="mt-3 relative">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-sky-300/70 absolute left-3.5 pointer-events-none" />
            <input
              type="text"
              id="weather-search-bar"
              placeholder="Search cities (or enter security PIN)..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full pl-10 pr-24 py-2.5 bg-white/10 hover:bg-white/15 focus:bg-slate-900/90 border border-white/15 focus:border-sky-400 rounded-xl text-sm text-white placeholder-sky-200/50 backdrop-blur-md outline-none transition-all"
            />
            <div className="absolute right-1.5 flex items-center gap-1">
              <button
                type="button"
                id="btn-open-discreet-keypad"
                onClick={() => setShowDiscreetKeypad(true)}
                className="px-2 py-1 rounded-md bg-white/10 hover:bg-white/20 text-xs text-sky-200 font-mono transition-colors"
                title="Enter PIN on Keypad"
              >
                PIN
              </button>
            </div>
          </div>
        </form>

        {/* Interactive Demo Testing Banner / Quick Trigger Hub */}
        {showDemoGuide && (
          <div className="mt-3 p-3.5 bg-slate-950/95 border border-sky-500/30 rounded-xl text-xs space-y-2.5 shadow-2xl backdrop-blur-lg animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center justify-between font-semibold text-sky-300">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Stealth Testing & Prototype Trigger Hub
              </span>
              <button
                onClick={() => setShowDemoGuide(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            
            <p className="text-slate-300 leading-relaxed">
              This app looks 100% like a genuine Weather App to protect you under surveillance. Test any prototype trigger below:
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-1">
              <button
                type="button"
                id="quick-safe-pin-btn"
                onClick={() => {
                  triggerHaptic(HAPTIC_PATTERNS.armed);
                  soundEngine.playArmedChirp();
                  onUnlockDashboard();
                }}
                className="p-2 rounded-lg bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/60 text-left transition-colors cursor-pointer"
              >
                <div className="font-bold flex items-center justify-between">
                  <span>Safe Access</span>
                  <span className="font-mono bg-emerald-900/80 px-1.5 py-0.5 rounded text-[10px]">{userConfig.accessPin}</span>
                </div>
                <div className="text-[11px] text-emerald-400/80 mt-0.5">SOS Command Hub</div>
              </button>

              <button
                type="button"
                id="quick-duress-pin-btn"
                onClick={() => {
                  triggerHaptic(HAPTIC_PATTERNS.stealthTrigger);
                  onTriggerDuressLockdown();
                }}
                className="p-2 rounded-lg bg-rose-950/80 border border-rose-500/40 text-rose-300 hover:bg-rose-900/60 text-left transition-colors cursor-pointer"
              >
                <div className="font-bold flex items-center justify-between">
                  <span>Duress PIN</span>
                  <span className="font-mono bg-rose-950 px-1.5 py-0.5 rounded text-[10px]">{userConfig.duressPin}</span>
                </div>
                <div className="text-[11px] text-rose-400/80 mt-0.5">Fake 503 + SOS</div>
              </button>

              <button
                type="button"
                id="quick-shake-panic-btn"
                onClick={handleSimulateShake}
                className="p-2 rounded-lg bg-indigo-950/80 border border-indigo-500/40 text-indigo-300 hover:bg-indigo-900/60 text-left transition-colors cursor-pointer"
              >
                <div className="font-bold flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Smartphone className="w-3 h-3 text-indigo-400" />
                    Shake Test
                  </span>
                  <span className="font-mono bg-indigo-900/80 px-1.5 py-0.5 rounded text-[10px]">Motion</span>
                </div>
                <div className="text-[11px] text-indigo-300/80 mt-0.5">Shake Phone SOS</div>
              </button>

              <button
                type="button"
                id="quick-stealth-hold-btn"
                onClick={() => {
                  triggerHaptic(HAPTIC_PATTERNS.stealthTrigger);
                  onTriggerStealthSOS();
                }}
                className="p-2 rounded-lg bg-amber-950/80 border border-amber-500/40 text-amber-300 hover:bg-amber-900/60 text-left transition-colors cursor-pointer"
              >
                <div className="font-bold flex items-center justify-between">
                  <span>Stealth Header</span>
                  <span className="font-mono bg-amber-900/80 px-1.5 py-0.5 rounded text-[10px]">Hold 3s</span>
                </div>
                <div className="text-[11px] text-amber-400/80 mt-0.5">Silent Alarm</div>
              </button>

              <button
                type="button"
                id="quick-windspeed-tap-btn"
                onClick={handleWindSpeedTap}
                className="p-2 rounded-lg bg-teal-950/80 border border-teal-500/40 text-teal-300 hover:bg-teal-900/60 text-left transition-colors cursor-pointer"
              >
                <div className="font-bold flex items-center justify-between">
                  <span>Wind Speed</span>
                  <span className="font-mono bg-teal-900/80 px-1.5 py-0.5 rounded text-[10px]">Panic</span>
                </div>
                <div className="text-[11px] text-teal-400/80 mt-0.5">Direct Panic Alarm</div>
              </button>

              <button
                type="button"
                id="quick-airquality-tap-btn"
                onClick={handleAirQualityTap}
                className="p-2 rounded-lg bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-900/60 text-left transition-colors cursor-pointer"
              >
                <div className="font-bold flex items-center justify-between">
                  <span>Air Quality</span>
                  <span className="font-mono bg-cyan-900/80 px-1.5 py-0.5 rounded text-[10px]">Exit</span>
                </div>
                <div className="text-[11px] text-cyan-400/80 mt-0.5">Stealth Logout</div>
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-800 text-[11px] text-slate-400">
              <span>ICE: {userConfig.iceContactName} ({userConfig.iceContactPhone})</span>
              <div className="flex items-center gap-3">
                {onOpenResponderPortal && (
                  <button
                    type="button"
                    onClick={onOpenResponderPortal}
                    className="text-sky-400 hover:underline font-medium cursor-pointer"
                  >
                    View Responder CAD Portal →
                  </button>
                )}
                <button
                  type="button"
                  onClick={onOpenSettings}
                  className="text-slate-300 hover:underline cursor-pointer"
                >
                  Edit PINs
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main Weather Visual & Live Metrics */}
      <main className="px-4 py-4 space-y-6 max-w-2xl mx-auto w-full flex-1">
        
        {/* Hero Current Temperature & Weather Icon */}
        <div className="text-center py-6 space-y-2">
          <div className="inline-flex items-center justify-center p-3 rounded-full bg-white/5 backdrop-blur-sm border border-white/10 mb-2">
            {getWeatherIcon(currentWeather.icon, 'w-16 h-16')}
          </div>
          <div className="flex items-start justify-center font-light tracking-tighter">
            <span className="text-7xl sm:text-8xl font-bold">{currentWeather.temp}</span>
            <span className="text-3xl sm:text-4xl text-sky-200 mt-2">°C</span>
          </div>
          <p className="text-lg sm:text-xl font-medium text-sky-100">
            {currentWeather.condition}
          </p>
          <p className="text-xs sm:text-sm text-sky-200/70">
            High: {currentWeather.high}°C • Low: {currentWeather.low}°C • Feels like {currentWeather.feelsLike}°C
          </p>
        </div>

        {/* Weather Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div
            id="wind-speed-metric-card"
            role="button"
            tabIndex={0}
            onClick={handleWindSpeedTap}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleWindSpeedTap();
              }
            }}
            title="Wind Speed metric - Tap to trigger panic"
            className={`p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 space-y-1 cursor-pointer select-none transition-all duration-200 active:scale-95 hover:bg-white/15 hover:border-teal-400/40 relative overflow-hidden group ${
              windSpeedTapPulse ? 'ring-2 ring-rose-500 bg-rose-950/40 scale-95 animate-pulse' : ''
            }`}
          >
            {windSpeedTapPulse && (
              <div className="absolute inset-0 bg-rose-500/20 pointer-events-none animate-ping" />
            )}
            <div className="flex items-center justify-between text-xs text-sky-200">
              <span className="flex items-center gap-1.5">
                <Wind className={`w-3.5 h-3.5 text-teal-300 transition-transform ${windSpeedTapPulse ? 'rotate-45 scale-125' : 'group-hover:rotate-12'}`} />
                Wind Speed
              </span>
              <span className="text-[9px] opacity-0 group-hover:opacity-80 transition-opacity text-teal-300 font-mono">
                Tap
              </span>
            </div>
            <div className="text-base font-semibold text-white group-hover:text-teal-200 transition-colors">
              {currentWeather.windSpeed} km/h
            </div>
            <div className="text-[10px] text-sky-300/60">Gusts up to {currentWeather.windSpeed + 8} km/h</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-sky-200">
              <Droplets className="w-3.5 h-3.5 text-blue-300" />
              Humidity
            </div>
            <div className="text-base font-semibold">{currentWeather.humidity}%</div>
            <div className="text-[10px] text-sky-300/60">Dew point: {Math.max(8, currentWeather.temp - 6)}°</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-sky-200">
              <Sun className="w-3.5 h-3.5 text-amber-300" />
              UV Index
            </div>
            <div className="text-base font-semibold">{currentWeather.uvIndex} (Very High)</div>
            <div className="text-[10px] text-sky-300/60">Sun protection required</div>
          </div>

          <div
            id="air-quality-metric-card"
            role="button"
            tabIndex={0}
            onClick={handleAirQualityTap}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleAirQualityTap();
              }
            }}
            title="Air Quality metric - Tap to log out"
            className={`p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 space-y-1 cursor-pointer select-none transition-all duration-200 active:scale-95 hover:bg-white/15 hover:border-cyan-400/40 relative overflow-hidden group ${
              airQualityTapPulse ? 'ring-2 ring-cyan-400 bg-cyan-950/50 scale-95 animate-pulse' : ''
            }`}
          >
            {airQualityTapPulse && (
              <div className="absolute inset-0 bg-cyan-400/20 pointer-events-none animate-ping" />
            )}
            <div className="flex items-center justify-between text-xs text-sky-200">
              <span className="flex items-center gap-1.5">
                <Eye className={`w-3.5 h-3.5 text-emerald-300 transition-transform ${airQualityTapPulse ? 'scale-125' : 'group-hover:scale-110'}`} />
                Air Quality
              </span>
              <span className="text-[9px] opacity-0 group-hover:opacity-80 transition-opacity text-cyan-300 font-mono">
                Logout
              </span>
            </div>
            <div className="text-base font-semibold truncate text-white group-hover:text-cyan-200 transition-colors">
              {currentWeather.airQuality.split(' ')[0]}
            </div>
            <div className="text-[10px] text-sky-300/60">{currentWeather.airQuality}</div>
          </div>
        </div>

        {/* Hourly Forecast Carousel */}
        <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-sky-200">
            <span>24-Hour Forecast</span>
            <span className="text-[11px] text-sky-300/80 lowercase">updated just now</span>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-thin">
            {currentWeather.hourly.map((h, i) => (
              <div
                key={i}
                className="flex-shrink-0 flex flex-col items-center justify-between py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors min-w-[64px]"
              >
                <span className="text-xs text-sky-200">{h.time}</span>
                <div className="my-1.5">
                  {getWeatherIcon(h.icon, 'w-6 h-6')}
                </div>
                <span className="text-sm font-semibold">{h.temp}°</span>
                {h.pop > 0 && (
                  <span className="text-[10px] text-blue-300 font-medium">{h.pop}%</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 7-Day Extended Forecast */}
        <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 space-y-2">
          <div className="text-xs font-semibold uppercase tracking-wider text-sky-200 mb-2">
            7-Day Forecast
          </div>

          <div className="divide-y divide-white/10">
            {currentWeather.daily.map((d, i) => (
              <div key={i} className="py-2.5 flex items-center justify-between text-sm">
                <span className="w-16 font-medium text-sky-100">{d.day}</span>
                <div className="flex items-center gap-2">
                  {getWeatherIcon(d.icon, 'w-5 h-5')}
                  <span className="text-xs text-sky-200/80 hidden sm:inline">{d.condition}</span>
                </div>
                <div className="flex items-center gap-3 text-right">
                  <span className="text-xs text-sky-300/70 font-mono">{d.low}°</span>
                  <div className="w-16 sm:w-24 h-1.5 rounded-full bg-white/10 overflow-hidden relative">
                    <div
                      className="h-full bg-gradient-to-r from-blue-400 to-amber-400 rounded-full"
                      style={{ width: `${Math.min(100, Math.max(30, (d.high - d.low) * 10))}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold font-mono w-6">{d.high}°</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </main>

      {/* Discreet Keypad Dialog */}
      {showDiscreetKeypad && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-xs w-full text-center space-y-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                Security Authorization
              </span>
              <button
                type="button"
                onClick={() => {
                  setShowDiscreetKeypad(false);
                  setKeypadPin('');
                }}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <div className="flex justify-center gap-3 my-2">
              {[0, 1, 2, 3].map((idx) => (
                <div
                  key={idx}
                  className={`w-3.5 h-3.5 rounded-full border ${
                    keypadPin.length > idx
                      ? 'bg-sky-400 border-sky-400'
                      : 'border-slate-700 bg-slate-950'
                  }`}
                />
              ))}
            </div>

            {/* Keypad Grid */}
            <div className="grid grid-cols-3 gap-3">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'].map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => {
                    if (k === 'C') {
                      setKeypadPin('');
                      triggerHaptic(HAPTIC_PATTERNS.tap);
                    } else if (k === '⌫') {
                      setKeypadPin((prev) => prev.slice(0, -1));
                      triggerHaptic(HAPTIC_PATTERNS.tap);
                    } else {
                      handleKeypadPress(k);
                    }
                  }}
                  className="h-12 rounded-2xl bg-slate-800 hover:bg-slate-700 active:bg-sky-600 font-mono text-lg font-semibold text-slate-100 transition-colors flex items-center justify-center"
                >
                  {k}
                </button>
              ))}
            </div>

            <p className="text-[11px] text-slate-500">
              Safe PIN: {userConfig.accessPin} | Duress PIN: {userConfig.duressPin}
            </p>
          </div>
        </div>
      )}

      {/* Bottom Footer Discreet Camouflage Status */}
      <footer className="text-center text-xs text-sky-200/50 px-4 mt-auto">
        <span>Atmosphere Engine v3.4 • South African Weather Service Radar Active</span>
      </footer>
    </div>
  );
};
