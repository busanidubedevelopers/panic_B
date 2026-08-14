/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { UserConfig, LocationData, EmergencyState, ActiveView, BeaconLog, DeviceTelemetry, SafetyTimer } from './types';
import { OnboardingView } from './components/OnboardingView';
import { TutorialGuideView } from './components/TutorialGuideView';
import { WeatherDisguiseView } from './components/WeatherDisguiseView';
import { SecurityDashboardView } from './components/SecurityDashboardView';
import { LockdownView } from './components/LockdownView';
import { ResponderTrackingView } from './components/ResponderTrackingView';
import { SettingsModal } from './components/SettingsModal';
import { triggerHaptic, HAPTIC_PATTERNS } from './utils/haptics';
import { soundEngine } from './utils/sound';
import { getDeviceBattery, globalShakeDetector } from './utils/deviceSensors';

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
  enableShakeToPanic: true,
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

  // 4. Device Telemetry (Battery & Motion)
  const [telemetry, setTelemetry] = useState<DeviceTelemetry>({
    batteryLevel: 88,
    isCharging: false,
    motionSupported: true,
    shakeArmed: true,
    networkOnline: true,
  });

  // 5. "Walk With Me" Safety Escort Dead Man's Switch Timer
  const [safetyTimer, setSafetyTimer] = useState<SafetyTimer>({
    isActive: false,
    durationMinutes: 5,
    remainingSeconds: 300,
    startedAt: null,
    targetTimestamp: null,
    label: 'Walking to Car',
  });

  // 6. Emergency State
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

  // 7. Settings Modal State
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

  // Initialize Battery Hardware Telemetry
  useEffect(() => {
    getDeviceBattery().then((batt) => {
      setTelemetry((prev) => ({
        ...prev,
        batteryLevel: batt.level,
        isCharging: batt.isCharging,
      }));
    });
  }, []);

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

  // Trigger 1: Active Hold from Security Dashboard
  const handleTriggerActiveSOS = (triggerType: string = 'active_hold') => {
    if (emergencyState.isActive) return;

    setEmergencyState((prev) => ({
      ...prev,
      isActive: true,
      triggerType: triggerType as any,
      startedAt: Date.now(),
      isSilent: false,
      isAudioRecording: true,
    }));

    addBeaconLog(`CRITICAL: Emergency Alarm Triggered (${triggerType.toUpperCase()}). Full dispatch engaged.`, 'danger');
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

  // Trigger 5: Hardware Shake Gesture Trigger
  const handleTriggerShakeSOS = useCallback(() => {
    if (emergencyState.isActive) return;

    setTelemetry((prev) => ({ ...prev, shakeArmed: false }));
    setEmergencyState((prev) => ({
      ...prev,
      isActive: true,
      triggerType: 'shake_motion',
      startedAt: Date.now(),
      isSilent: true,
      isAudioRecording: true,
    }));

    addBeaconLog('MOTION SENSOR: Rapid pocket shake detected. Silent background panic beacon engaged.', 'danger');
    triggerHaptic(HAPTIC_PATTERNS.emergencyLoop);
  }, [emergencyState.isActive, addBeaconLog]);

  // Bind hardware Shake detector on mount
  useEffect(() => {
    globalShakeDetector.init(handleTriggerShakeSOS);
    return () => {
      globalShakeDetector.stop();
    };
  }, [handleTriggerShakeSOS]);

  // Safety Escort Countdown Tick Engine
  useEffect(() => {
    if (!safetyTimer.isActive) return;

    const interval = setInterval(() => {
      setSafetyTimer((prev) => {
        if (!prev.isActive) return prev;
        if (prev.remainingSeconds <= 1) {
          // Timer expired! Trigger Dead Man's Panic
          handleTriggerActiveSOS('dead_man_timer');
          return { ...prev, isActive: false, remainingSeconds: 0 };
        }
        return { ...prev, remainingSeconds: prev.remainingSeconds - 1 };
      });
    }, 1000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [safetyTimer.isActive]);

  const handleStartSafetyTimer = (minutes: number, label: string) => {
    setSafetyTimer({
      isActive: true,
      durationMinutes: minutes,
      remainingSeconds: minutes * 60,
      startedAt: Date.now(),
      label,
    });
    addBeaconLog(`SAFETY ESCORT: Countdown armed for ${minutes} min ("${label}"). Safe PIN required to cancel.`, 'info');
  };

  const handleCancelSafetyTimer = (pin: string): boolean => {
    if (pin === userConfig.accessPin) {
      setSafetyTimer((prev) => ({
        ...prev,
        isActive: false,
      }));
      addBeaconLog('SAFETY ESCORT: Cancelled countdown safely with Safe PIN.', 'info');
      return true;
    }
    addBeaconLog('SAFETY ESCORT: Failed cancel attempt (Incorrect PIN).', 'alert');
    return false;
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

  // Onboarding Complete Handler - transitions to How-To-Use Tutorial layer
  const handleOnboardingComplete = (newConfig: UserConfig) => {
    setUserConfig(newConfig);
    setActiveView('tutorial');
    addBeaconLog('Profile setup complete. Calibration walkthrough launched.', 'info');
  };

  // Proceed from Tutorial to Disguise Weather Main Screen
  const handleProceedFromTutorialToWeather = () => {
    setActiveView('weather');
    addBeaconLog('Calibration complete. Disguise Weather camouflage armed.', 'info');
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

      {/* View 2: How To Use App Walkthrough Layer (After Setup/Login) */}
      {activeView === 'tutorial' && (
        <TutorialGuideView
          userConfig={userConfig}
          currentLocation={currentLocation}
          onProceedToWeather={handleProceedFromTutorialToWeather}
        />
      )}

      {/* View 3: Camouflage Weather Disguise UI */}
      {activeView === 'weather' && (
        <WeatherDisguiseView
          userConfig={userConfig}
          currentLocation={currentLocation}
          telemetry={telemetry}
          safetyTimer={safetyTimer}
          onUnlockDashboard={() => setActiveView('dashboard')}
          onTriggerDuressLockdown={handleTriggerDuressLockdown}
          onTriggerStealthSOS={handleTriggerStealthSOS}
          onTriggerWindSpeedPanic={handleTriggerWindSpeedPanic}
          onTriggerShakeSOS={handleTriggerShakeSOS}
          onLogout={handleLogout}
          onOpenSettings={() => setShowSettings(true)}
          onOpenResponderPortal={() => setActiveView('responder')}
          onOpenTutorial={() => setActiveView('tutorial')}
        />
      )}

      {/* View 4: Security SOS Command Center Dashboard UI */}
      {activeView === 'dashboard' && (
        <SecurityDashboardView
          userConfig={userConfig}
          currentLocation={currentLocation}
          emergencyState={emergencyState}
          telemetry={telemetry}
          safetyTimer={safetyTimer}
          onTriggerActiveSOS={handleTriggerActiveSOS}
          onCancelEmergency={handleCancelEmergency}
          onRefreshLocation={refreshLocation}
          onReturnToDisguise={() => setActiveView('weather')}
          onOpenSettings={() => setShowSettings(true)}
          onOpenResponderPortal={() => setActiveView('responder')}
          onStartSafetyTimer={handleStartSafetyTimer}
          onCancelSafetyTimer={handleCancelSafetyTimer}
        />
      )}

      {/* View 5: Fake 503 Lockdown Error UI */}
      {activeView === 'lockdown' && (
        <LockdownView
          userConfig={userConfig}
          currentLocation={currentLocation}
          emergencyState={emergencyState}
          onCancelEmergency={handleCancelEmergency}
          onReturnToWeather={() => setActiveView('weather')}
        />
      )}

      {/* View 6: Live Responder CAD Portal */}
      {activeView === 'responder' && (
        <ResponderTrackingView
          userConfig={userConfig}
          currentLocation={currentLocation}
          emergencyState={emergencyState}
          telemetry={telemetry}
          onClose={() => setActiveView('dashboard')}
        />
      )}

      {/* Settings Modal */}
      {showSettings && (
        <SettingsModal
          userConfig={userConfig}
          onSave={(updated) => setUserConfig(updated)}
          onClose={() => setShowSettings(false)}
          onResetApp={handleResetApp}
          onOpenTutorial={() => setActiveView('tutorial')}
        />
      )}

    </div>
  );
}
