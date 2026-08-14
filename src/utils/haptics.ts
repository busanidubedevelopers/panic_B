/**
 * Haptic feedback utility using Web Vibration API where supported
 */
export function triggerHaptic(pattern: number | number[] = 50) {
  try {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  } catch {
    // Ignore unsupported or blocked vibration requests
  }
}

export const HAPTIC_PATTERNS = {
  tap: 30,
  holdTick: 15,
  armed: [80, 50, 120],
  stealthTrigger: [40, 60, 40],
  emergencyLoop: [200, 100, 200, 100, 400],
  standDown: [50, 50, 50],
};
