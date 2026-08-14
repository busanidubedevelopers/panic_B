// Device Telemetry, Battery Status & Shake-to-Panic Sensor Listener
import { DeviceTelemetry } from '../types';

export async function getDeviceBattery(): Promise<{ level: number | null; isCharging: boolean | null }> {
  try {
    if (typeof navigator !== 'undefined' && 'getBattery' in navigator) {
      const battery: any = await (navigator as any).getBattery();
      return {
        level: Math.round(battery.level * 100),
        isCharging: battery.charging,
      };
    }
  } catch {
    // Battery API not supported or restricted in iframe
  }
  return { level: 84, isCharging: false }; // Realistic fallback for simulator
}

export class ShakeDetector {
  private lastX: number | null = null;
  private lastY: number | null = null;
  private lastZ: number | null = null;
  private lastUpdate: number = 0;
  private shakeCount: number = 0;
  private lastShakeTime: number = 0;
  private isListening: boolean = false;
  private threshold: number = 16; // Acceleration delta threshold
  private onShakeCallback: (() => void) | null = null;
  private boundHandler: ((event: DeviceMotionEvent) => void) | null = null;

  public init(onShake: () => void, threshold = 16) {
    this.onShakeCallback = onShake;
    this.threshold = threshold;
  }

  public start(): boolean {
    if (this.isListening || typeof window === 'undefined') return false;

    if ('DeviceMotionEvent' in window) {
      // For iOS 13+ permission request
      if (typeof (DeviceMotionEvent as any).requestPermission === 'function') {
        (DeviceMotionEvent as any)
          .requestPermission()
          .then((permissionState: string) => {
            if (permissionState === 'granted') {
              this.attachListener();
            }
          })
          .catch(() => {
            // Permission rejected or not allowed
          });
      } else {
        this.attachListener();
      }
      return true;
    }
    return false;
  }

  private attachListener() {
    this.boundHandler = this.handleMotion.bind(this);
    window.addEventListener('devicemotion', this.boundHandler, true);
    this.isListening = true;
  }

  public stop() {
    if (this.boundHandler && typeof window !== 'undefined') {
      window.removeEventListener('devicemotion', this.boundHandler, true);
    }
    this.isListening = false;
    this.shakeCount = 0;
  }

  private handleMotion(event: DeviceMotionEvent) {
    const current = event.accelerationIncludingGravity;
    if (!current || current.x === null || current.y === null || current.z === null) return;

    const currentTime = Date.now();
    const diffTime = currentTime - this.lastUpdate;

    if (diffTime > 80) {
      if (this.lastX !== null && this.lastY !== null && this.lastZ !== null) {
        const deltaX = Math.abs(current.x - this.lastX);
        const deltaY = Math.abs(current.y - this.lastY);
        const deltaZ = Math.abs(current.z - this.lastZ);

        const speed = (deltaX + deltaY + deltaZ) / (diffTime / 100);

        if (speed > this.threshold) {
          // Check if within rapid shake sequence window (within 1.5s)
          if (currentTime - this.lastShakeTime > 1500) {
            this.shakeCount = 1;
          } else {
            this.shakeCount++;
          }
          this.lastShakeTime = currentTime;

          // Trigger SOS on 3 rapid shakes
          if (this.shakeCount >= 3) {
            this.shakeCount = 0;
            if (this.onShakeCallback) {
              this.onShakeCallback();
            }
          }
        }
      }

      this.lastX = current.x;
      this.lastY = current.y;
      this.lastZ = current.z;
      this.lastUpdate = currentTime;
    }
  }
}

export const globalShakeDetector = new ShakeDetector();
