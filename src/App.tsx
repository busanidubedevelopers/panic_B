/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { UserConfig, LocationData, EmergencyState, ActiveView, BeaconLog } from './types';
import { OnboardingView } from './components/OnboardingView';
import { WeatherDisguiseView } from './components/WeatherDisguiseView';
import { SecurityDashboardView } from './components/SecurityDashboardView';
import { LockdownView } from './components/LockdownView';
import { SettingsModal } from './components/SettingsModal';
import { triggerHaptic, HAPTIC_PATTERNS } from './utils/haptics';
import { soundEngine } from './utils/sound';

const STORAGE_KEY = 'stealth_panic_app_config_v1';

const DEFAULT_CONFIG: UserConfig = {
  fullName: 'Nandi Khumalo',
  phoneNumber: '+27 82 459 1024',
  primaryAddress: 'Baxter Hall Residence, Main Road, Rondebosch, Cape Town, 7700',
  iceContactName: 'Thabo Khumalo (Brother)',
  iceContactPhone: '+27 83 912 4433',
  accessPin: '1234',
  duressPin: '9999',
  sapsSector: 'SAPS Rondebosch (021 685 7345) / SAPS 10111 Flying Squad',
  campusSecurityPhone: '+27 21 650 2222',
  enableAudioRecording: true,
  enableHaptics: true,
  enableSirens: true,
  isSetupComplete: false,
};

export default function App() {
  // 1. User Configuration State
  const [userConfig, setUserConfig] = useState<UserConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // Ignore
    }
    return DEFAULT_CONFIG;
  });

  // 2. Active View State
  const [activeView, setActiveView] = useState<ActiveView>(() => {
    return userConfig.isSetupComplete ? 'weather' : 'onboarding';
  });

  // 3. Location & GPS Telemetry State
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const geoWatchIdRef = useRef<number | null>(null);

  // 4. Emergency State
  const [emergencyState, setEmergencyState] = useState<EmergencyState>({
    isActive: false,
    triggerType: null,
    startedAt: null,
    audioRecordingSeconds: 0,
    isAudioRecording: false,
    audioBlobUrl: null,
    smsDispatched: false,
    sapsNotified: false,
    iceNotified: false,
    isSilent: false,
    beaconLogs: [],
  });

  // 5. Settings Modal State
  const [showSettings, setShowSettings] = useState(false);

  // Save config to storage whenever it updates
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(userConfig));
    } catch {
      // Ignore
    }
  }, [userConfig]);

  // Append Beacon Log entry helper
  const addBeaconLog = useCallback(
    (message: string, type: BeaconLog['type'] = 'info', data?: Record<string, unknown>) => {
      const newLog: BeaconLog = {
        id: Math.random().toString(36).substring(2, 9),
        timestamp: Date.now(),
        message,
        type,
        data,
      };
      setEmergencyState((prev) => ({
        ...prev,
        beaconLogs: [newLog, ...prev.beaconLogs].slice(0, 50),
      }));
    },
    []
  );

  // Geolocation watch & acquisition
  const refreshLocation = useCallback(() => {
    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc: LocationData = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            timestamp: pos.timestamp,
            isFallback: false,
            addressName: 'Live Verified GPS Coordinates',
            geofenceZone: userConfig.sapsSector || 'SAPS 10111 Flying Squad',
            nearestStation: 'SAPS Local Precinct (Active)',
          };
          setCurrentLocation(loc);
          addBeaconLog(
            `GPS acquired: ${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)} (±${Math.round(pos.coords.accuracy)}m)`,
            'gps'
          );
        },
        (err) => {
          console.warn('Geolocation error:', err.message);
          // Fallback to Cape Town default coordinates
          const fallbackLoc: LocationData = {
            latitude: -33.9249,
            longitude: 18.4241,
            accuracy: 50,
            timestamp: Date.now(),
            isFallback: true,
            addressName: userConfig.primaryAddress || 'Cape Town Central CBD',
            geofenceZone: userConfig.sapsSector || 'SAPS 10111',
            nearestStation: 'SAPS Central (Fallback)',
          };
          setCurrentLocation(fallbackLoc);
          addBeaconLog('GPS signal weak; switched to saved primary fallback address', 'alert');
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    }
  }, [userConfig.primaryAddress, userConfig.sapsSector, addBeaconLog]);

  // Start continuous watch on mount
  useEffect(() => {
    refreshLocation();
    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      geoWatchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          setCurrentLocation({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            timestamp: pos.timestamp,
            isFallback: false,
            addressName: 'Live Verified GPS Coordinates',
            geofenceZone: userConfig.sapsSector || 'SAPS 10111 Flying Squad',
            nearestStation: 'SAPS Local Precinct (Active)',
          });
        },
        () => {},
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 }
      );
    }

    return () => {
      if (geoWatchIdRef.current !== null && typeof window !== 'undefined' && 'geolocation' in navigator) {
        navigator.geolocation.clearWatch(geoWatchIdRef.current);
      }
    };
  }, [refreshLocation, userConfig.sapsSector]);

  // Trigger 1: Active 2-Second Hold from Security Dashboard
  const handleTriggerActiveSOS = () => {
    if (emergencyState.isActive) return;

    setEmergencyState((prev) => ({
      ...prev,
      isActive: true,
      triggerType: 'active_hold',
      startedAt: Date.now(),
      isSilent: false,
      isAudioRecording: true,
    }));

    addBeaconLog('CRITICAL: Active 2-Second SOS Button Triggered. Full dispatch engaged.', 'danger');
    triggerHaptic(HAPTIC_PATTERNS.emergencyLoop);
  };

  // Trigger 2: Stealth 3-Second Hold from Weather Header
  const handleTriggerStealthSOS = () => {
    setEmergencyState((prev) => ({
      ...prev,
      isActive: true,
      triggerType: 'stealth_header_hold',
      startedAt: Date.now(),
      isSilent: true,
      isAudioRecording: true,
    }));

    addBeaconLog('STEALTH: Weather Header 3-second hold detected. Silent background beacon active.', 'alert');
    // Silent vibration pulse only
    triggerHaptic(HAPTIC_PATTERNS.stealthTrigger);
  };

  // Trigger 3: Duress PIN entered in Weather Search Bar
  const handleTriggerDuressLockdown = () => {
    setEmergencyState((prev) => ({
      ...prev,
      isActive: true,
      triggerType: 'duress_pin',
      startedAt: Date.now(),
      isSilent: true,
      isAudioRecording: true,
    }));

    addBeaconLog('DURESS: Forced PIN entered. Displaying Fake 503 Server Error. Silent beacon dispatch active.', 'danger');
    triggerHaptic(HAPTIC_PATTERNS.stealthTrigger);
    setActiveView('lockdown');
  };

  // Trigger 4: Wind Speed metric tap in Weather Disguise UI
  const handleTriggerWindSpeedPanic = () => {
    setEmergencyState((prev) => ({
      ...prev,
      isActive: true,
      triggerType: 'windspeed_tap',
      startedAt: Date.now(),
      isSilent: false,
      isAudioRecording: true,
      smsDispatched: true,
      sapsNotified: true,
      iceNotified: true,
    }));

    addBeaconLog('PANIC ALERT: Wind Speed metric tapped. Emergency panic beacon & dispatch engaged.', 'danger');
    triggerHaptic(HAPTIC_PATTERNS.emergencyLoop);
    if (userConfig.enableSirens) {
      soundEngine.playArmedChirp();
    }
  };

  // Safe Stand Down / Cancel Alarm (Requires Safe PIN)
  const handleCancelEmergency = (pin: string): boolean => {
    if (pin === userConfig.accessPin) {
      setEmergencyState((prev) => ({
        ...prev,
        isActive: false,
        triggerType: null,
        startedAt: null,
        isAudioRecording: false,
      }));
      addBeaconLog('STAND DOWN: Alarm safely deactivated via Safe Access PIN verification.', 'info');
      triggerHaptic(HAPTIC_PATTERNS.standDown);
      return true;
    }
    addBeaconLog('AUTH FAILED: Attempt to deactivate alarm with incorrect PIN.', 'alert');
    return false;
  };

  // Onboarding Complete Handler
  const handleOnboardingComplete = (newConfig: UserConfig) => {
    setUserConfig(newConfig);
    setActiveView('weather');
    addBeaconLog('Profile setup complete. Disguise Weather camouflage armed.', 'info');
  };

  // Logout / Return to Onboarding Handler
  const handleLogout = () => {
    setActiveView('onboarding');
    addBeaconLog('User logged out. Returned to safe setup profile screen.', 'info');
    triggerHaptic(HAPTIC_PATTERNS.tap);
  };

  // Reset App Handler
  const handleResetApp = () => {
    localStorage.removeItem(STORAGE_KEY);
    setUserConfig(DEFAULT_CONFIG);
    setActiveView('onboarding');
    setShowSettings(false);
    setEmergencyState({
      isActive: false,
      triggerType: null,
      startedAt: null,
      audioRecordingSeconds: 0,
      isAudioRecording: false,
      audioBlobUrl: null,
      smsDispatched: false,
      sapsNotified: false,
      iceNotified: false,
      isSilent: false,
      beaconLogs: [],
    });
  };

  return (
    <div className="w-full min-h-screen bg-slate-950 font-sans antialiased text-slate-100 selection:bg-emerald-500 selection:text-white">
      
      {/* View 1: Onboarding UI */}
      {activeView === 'onboarding' && (
        <OnboardingView
          onComplete={handleOnboardingComplete}
          currentLocation={currentLocation}
          onRefreshLocation={refreshLocation}
        />
      )}

      {/* View 2: Camouflage Weather Disguise UI */}
      {activeView === 'weather' && (
        <WeatherDisguiseView
          userConfig={userConfig}
          currentLocation={currentLocation}
          onUnlockDashboard={() => setActiveView('dashboard')}
          onTriggerDuressLockdown={handleTriggerDuressLockdown}
          onTriggerStealthSOS={handleTriggerStealthSOS}
          onTriggerWindSpeedPanic={handleTriggerWindSpeedPanic}
          onLogout={handleLogout}
          onOpenSettings={() => setShowSettings(true)}
        />
      )}

      {/* View 3: Security SOS Command Center Dashboard UI */}
      {activeView === 'dashboard' && (
        <SecurityDashboardView
          userConfig={userConfig}
          currentLocation={currentLocation}
          emergencyState={emergencyState}
          onTriggerActiveSOS={handleTriggerActiveSOS}
          onCancelEmergency={handleCancelEmergency}
          onRefreshLocation={refreshLocation}
          onReturnToDisguise={() => setActiveView('weather')}
          onOpenSettings={() => setShowSettings(true)}
        />
      )}

      {/* View 4: Fake 503 Lockdown Error UI */}
      {activeView === 'lockdown' && (
        <LockdownView
          userConfig={userConfig}
          currentLocation={currentLocation}
          emergencyState={emergencyState}
          onCancelEmergency={handleCancelEmergency}
          onReturnToWeather={() => setActiveView('weather')}
        />
      )}

      {/* Settings Modal */}
      {showSettings && (
        <SettingsModal
          userConfig={userConfig}
          onSave={(updated) => setUserConfig(updated)}
          onClose={() => setShowSettings(false)}
          onResetApp={handleResetApp}
        />
      )}

    </div>
  );
}
