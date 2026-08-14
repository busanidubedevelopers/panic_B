export interface UserConfig {
  fullName: string;
  phoneNumber: string;
  primaryAddress: string;
  iceContactName: string;
  iceContactPhone: string;
  accessPin: string;
  duressPin: string;
  sapsSector: string;
  campusSecurityPhone: string;
  enableAudioRecording: boolean;
  enableHaptics: boolean;
  enableSirens: boolean;
  isSetupComplete: boolean;
}

export interface LocationData {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  timestamp: number | null;
  isFallback: boolean;
  addressName: string;
  geofenceZone: string;
  nearestStation: string;
}

export interface BeaconLog {
  id: string;
  timestamp: number;
  message: string;
  type: 'info' | 'alert' | 'danger' | 'gps' | 'audio';
  data?: Record<string, unknown>;
}

export interface EmergencyState {
  isActive: boolean;
  triggerType: 'active_hold' | 'stealth_header_hold' | 'duress_pin' | 'test_drill' | 'windspeed_tap' | null;
  startedAt: number | null;
  audioRecordingSeconds: number;
  isAudioRecording: boolean;
  audioBlobUrl: string | null;
  smsDispatched: boolean;
  sapsNotified: boolean;
  iceNotified: boolean;
  isSilent: boolean;
  beaconLogs: BeaconLog[];
}

export interface WeatherCondition {
  city: string;
  province: string;
  temp: number;
  condition: string;
  icon: string;
  high: number;
  low: number;
  humidity: number;
  windSpeed: number;
  feelsLike: number;
  uvIndex: number;
  airQuality: string;
  precipitationChance: number;
  hourly: Array<{
    time: string;
    temp: number;
    icon: string;
    pop: number;
  }>;
  daily: Array<{
    day: string;
    condition: string;
    icon: string;
    high: number;
    low: number;
    pop: number;
  }>;
}

export type ActiveView = 'onboarding' | 'weather' | 'dashboard' | 'lockdown';
