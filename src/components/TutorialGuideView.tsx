import React, { useState } from 'react';
import { UserConfig, LocationData } from '../types';
import {
  Shield,
  Search,
  Wind,
  Smartphone,
  Fingerprint,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Eye,
  KeyRound,
  Lock,
  ArrowRight,
  Radio,
  HelpCircle,
  Sparkles,
} from 'lucide-react';
import { triggerHaptic, HAPTIC_PATTERNS } from '../utils/haptics';
import { soundEngine } from '../utils/sound';

interface TutorialGuideViewProps {
  userConfig: UserConfig;
  currentLocation: LocationData | null;
  onProceedToWeather: () => void;
}

export const TutorialGuideView: React.FC<TutorialGuideViewProps> = ({
  userConfig,
  currentLocation,
  onProceedToWeather,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [interactiveSearch, setInteractiveSearch] = useState('');
  const [searchUnlocked, setSearchUnlocked] = useState(false);
  const [shakeSimulated, setShakeSimulated] = useState(false);
  const [windTapped, setWindTapped] = useState(false);

  const steps = [
    {
      id: 'unlock',
      title: 'Secret Vault Access',
      tag: 'Step 1 of 4: Unlocking the Real App',
      icon: <KeyRound className="w-6 h-6 text-sky-400" />,
      description:
        'When you open the app, it looks and functions as a standard weather forecast. To open your hidden SOS Command Hub, type your 4-digit PIN into the City Search bar.',
      color: 'from-sky-500/20 to-blue-600/10',
      borderColor: 'border-sky-500/30',
    },
    {
      id: 'triggers',
      title: 'Rapid Panic Triggers',
      tag: 'Step 2 of 4: Silent & Direct SOS',
      icon: <Radio className="w-6 h-6 text-emerald-400" />,
      description:
        'In an emergency where you cannot open menus, use these disguised physical shortcuts to instantly dispatch police & emergency SMS with live GPS tracking.',
      color: 'from-emerald-500/20 to-teal-600/10',
      borderColor: 'border-emerald-500/30',
    },
    {
      id: 'duress',
      title: 'Duress & Hostage Lockout',
      tag: 'Step 3 of 4: Forced Unlock Protection',
      icon: <AlertTriangle className="w-6 h-6 text-rose-400" />,
      description:
        'If an attacker forces you to unlock your phone, enter your Duress PIN instead. It renders a fake 503 Server Crash screen while silently transmitting your location to responders.',
      color: 'from-rose-500/20 to-amber-600/10',
      borderColor: 'border-rose-500/30',
    },
    {
      id: 'diagnostics',
      title: 'Stealth Reminder & Diagnostics',
      tag: 'Step 4 of 4: Emergency Cheat-Sheet',
      icon: <HelpCircle className="w-6 h-6 text-indigo-400" />,
      description:
        'If you ever forget the secret controls, tap the footer text "Atmosphere Engine v3.4" at the bottom of the weather screen. It opens an innocent-looking diagnostics window containing your operational cheatsheet.',
      color: 'from-indigo-500/20 to-purple-600/10',
      borderColor: 'border-indigo-500/30',
    },
  ];

  const handleNext = () => {
    triggerHaptic(HAPTIC_PATTERNS.tap);
    soundEngine.playBeep(520, 'sine', 0.08);
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      triggerHaptic(HAPTIC_PATTERNS.armed);
      soundEngine.playArmedChirp();
      onProceedToWeather();
    }
  };

  const handlePrev = () => {
    triggerHaptic(HAPTIC_PATTERNS.tap);
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleInteractiveSearch = (val: string) => {
    setInteractiveSearch(val);
    if (val.trim() === userConfig.accessPin) {
      setSearchUnlocked(true);
      triggerHaptic(HAPTIC_PATTERNS.armed);
      soundEngine.playArmedChirp();
    } else {
      setSearchUnlocked(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 sm:p-6 select-none">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        
        {/* Top Progress Header */}
        <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 font-bold text-xs">
              {currentStep + 1}/4
            </div>
            <div>
              <span className="text-xs font-semibold text-sky-300 block">
                Atmosphere Operational Calibration
              </span>
              <span className="text-[11px] text-slate-400">
                How to operate under surveillance
              </span>
            </div>
          </div>

          <button
            type="button"
            id="btn-skip-tutorial"
            onClick={() => {
              triggerHaptic(HAPTIC_PATTERNS.tap);
              onProceedToWeather();
            }}
            className="text-xs text-slate-400 hover:text-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            Skip to Weather →
          </button>
        </div>

        {/* Progress Dots Bar */}
        <div className="w-full bg-slate-800 h-1 flex">
          {steps.map((_, idx) => (
            <div
              key={idx}
              className={`flex-1 transition-all duration-300 ${
                idx <= currentStep ? 'bg-gradient-to-r from-sky-400 to-emerald-400' : 'bg-slate-800'
              }`}
            />
          ))}
        </div>

        {/* Step Body Content */}
        <div className="p-6 sm:p-8 space-y-6 flex-1 flex flex-col justify-between">
          
          <div className="space-y-4">
            
            {/* Step Badge & Title */}
            <div className="space-y-1">
              <span className="inline-block px-2.5 py-0.5 rounded-full bg-slate-800 text-[11px] font-mono font-medium text-slate-300 border border-slate-700">
                {steps[currentStep].tag}
              </span>
              <div className="flex items-center gap-3 pt-1">
                <div className={`p-2.5 rounded-2xl bg-gradient-to-br ${steps[currentStep].color} border ${steps[currentStep].borderColor}`}>
                  {steps[currentStep].icon}
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                    {steps[currentStep].title}
                  </h2>
                </div>
              </div>
            </div>

            <p className="text-sm text-slate-300 leading-relaxed">
              {steps[currentStep].description}
            </p>

            {/* Interactive Step Previews */}

            {/* STEP 1: Search Bar & Safe PIN */}
            {currentStep === 0 && (
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-semibold text-sky-300">Try typing your Safe PIN below:</span>
                  <span className="font-mono bg-sky-950 px-2 py-0.5 rounded text-sky-300 border border-sky-800/60">
                    Safe PIN: {userConfig.accessPin}
                  </span>
                </div>

                <div className="relative">
                  <Search className="w-4 h-4 text-sky-400 absolute left-3.5 top-3 pointer-events-none" />
                  <input
                    type="text"
                    id="tutorial-interactive-search"
                    placeholder={`Type ${userConfig.accessPin} to test unlock...`}
                    value={interactiveSearch}
                    onChange={(e) => handleInteractiveSearch(e.target.value)}
                    className="w-full pl-10 pr-24 py-2.5 bg-slate-900 border border-slate-700 focus:border-sky-400 rounded-xl text-sm text-white placeholder-slate-500 outline-none"
                  />
                  <div className="absolute right-2 top-2">
                    <button
                      type="button"
                      onClick={() => handleInteractiveSearch(userConfig.accessPin)}
                      className="px-2 py-1 rounded bg-sky-600/40 hover:bg-sky-600 text-[11px] text-sky-200 font-mono transition-colors"
                    >
                      Autofill PIN
                    </button>
                  </div>
                </div>

                {searchUnlocked ? (
                  <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/60 text-emerald-200 text-xs flex items-center gap-2 animate-in fade-in">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span><strong>Vault Unlocked!</strong> On the real screen, this immediately transitions to your full SOS Command Hub.</span>
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-500">
                    *Tip: Searching real cities (e.g. "Durban", "London") works as expected to keep your disguise intact!
                  </p>
                )}
              </div>
            )}

            {/* STEP 2: Emergency Physical Triggers */}
            {currentStep === 1 && (
              <div className="space-y-2.5">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                  
                  {/* Trigger 1: Wind Speed Tap */}
                  <div
                    onClick={() => {
                      setWindTapped(true);
                      triggerHaptic(HAPTIC_PATTERNS.emergencyLoop);
                      setTimeout(() => setWindTapped(false), 1500);
                    }}
                    className={`p-3.5 rounded-2xl bg-slate-950 border transition-all cursor-pointer select-none space-y-1.5 ${
                      windTapped ? 'border-rose-500 ring-1 ring-rose-500 bg-rose-950/30' : 'border-slate-800 hover:border-teal-500/50'
                    }`}
                  >
                    <div className="flex items-center justify-between text-teal-300 font-bold">
                      <span className="flex items-center gap-1.5">
                        <Wind className="w-4 h-4" />
                        1. Wind Speed
                      </span>
                      <span className="text-[10px] bg-teal-950 px-1.5 py-0.5 rounded text-teal-300 border border-teal-800">Tap</span>
                    </div>
                    <p className="text-slate-400 text-[11px]">
                      Tap the <strong>Wind Speed</strong> card on the forecast screen to instantly engage panic alarms.
                    </p>
                    <span className="text-[10px] text-teal-400 font-semibold block pt-1">
                      {windTapped ? '🚨 Panic Simulated!' : 'Tap this card to test →'}
                    </span>
                  </div>

                  {/* Trigger 2: 3-Second Header Hold */}
                  <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between text-amber-300 font-bold">
                      <span className="flex items-center gap-1.5">
                        <Fingerprint className="w-4 h-4" />
                        2. Top Header Hold
                      </span>
                      <span className="text-[10px] bg-amber-950 px-1.5 py-0.5 rounded text-amber-300 border border-amber-800">Hold 3s</span>
                    </div>
                    <p className="text-slate-400 text-[11px]">
                      Press & hold the top city header for <strong>3 seconds</strong> to trigger a completely silent SOS.
                    </p>
                    <span className="text-[10px] text-amber-400 font-semibold block pt-1">
                      Zero screen flash or noise.
                    </span>
                  </div>

                  {/* Trigger 3: Hardware Shake */}
                  <div
                    onClick={() => {
                      setShakeSimulated(true);
                      triggerHaptic(HAPTIC_PATTERNS.emergencyLoop);
                      setTimeout(() => setShakeSimulated(false), 1500);
                    }}
                    className={`p-3.5 rounded-2xl bg-slate-950 border transition-all cursor-pointer select-none space-y-1.5 ${
                      shakeSimulated ? 'border-indigo-500 ring-1 ring-indigo-500 bg-indigo-950/30' : 'border-slate-800 hover:border-indigo-500/50'
                    }`}
                  >
                    <div className="flex items-center justify-between text-indigo-300 font-bold">
                      <span className="flex items-center gap-1.5">
                        <Smartphone className="w-4 h-4" />
                        3. Pocket Shake
                      </span>
                      <span className="text-[10px] bg-indigo-950 px-1.5 py-0.5 rounded text-indigo-300 border border-indigo-800">Shake</span>
                    </div>
                    <p className="text-slate-400 text-[11px]">
                      Shake phone vigorously 3 times while in pocket to activate background beaconing.
                    </p>
                    <span className="text-[10px] text-indigo-400 font-semibold block pt-1">
                      {shakeSimulated ? '🚨 Motion Triggered!' : 'Click to simulate shake →'}
                    </span>
                  </div>

                </div>
              </div>
            )}

            {/* STEP 3: Duress Forced PIN */}
            {currentStep === 2 && (
              <div className="p-4 rounded-2xl bg-slate-950 border border-rose-900/40 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-rose-400 font-bold text-xs">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Your Duress Key: <code className="bg-rose-950 px-2 py-0.5 rounded text-rose-200 border border-rose-800">{userConfig.duressPin}</code></span>
                  </div>
                  <span className="text-[11px] text-rose-400/80">Coercion Safety</span>
                </div>

                <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 text-xs space-y-2">
                  <div className="flex items-center gap-2 text-slate-300">
                    <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                    <span><strong>What an attacker sees:</strong> A realistic "503 Service Unavailable / Open-Meteo Server Outage" page.</span>
                  </div>
                  <div className="flex items-center gap-2 text-emerald-400">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span><strong>What happens silently:</strong> Live GPS coordinates, audio recording, and police dispatch begin in the background.</span>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4: Help / Diagnostics & Home Screen */}
            {currentStep === 3 && (
              <div className="p-4 rounded-2xl bg-slate-950 border border-indigo-900/40 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-indigo-300 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    Stealth Diagnostics & Phone Icon
                  </span>
                  <span className="text-slate-500 font-mono text-[10px]">v3.4.1 Disguise</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-1">
                    <span className="font-bold text-slate-200 block">Secret Diagnostics:</span>
                    <p className="text-slate-400 text-[11px]">
                      Tap the footer line <em>"Atmosphere Engine v3.4"</em> at the bottom of the screen anytime to recall all secret triggers without looking suspicious.
                    </p>
                  </div>
                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-1">
                    <span className="font-bold text-slate-200 block">Phone Home Screen:</span>
                    <p className="text-slate-400 text-[11px]">
                      Use your browser's <em>"Add to Home Screen"</em> option to install the custom <strong>Atmosphere</strong> weather icon on your phone.
                    </p>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-emerald-950/50 border border-emerald-800/40 text-[11px] text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>Your profile is armed for <strong>{userConfig.fullName}</strong> ({userConfig.sapsSector || 'SAPS 10111'}).</span>
                </div>
              </div>
            )}

          </div>

          {/* Navigation Controls */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
            <button
              type="button"
              id="btn-tutorial-prev"
              onClick={handlePrev}
              disabled={currentStep === 0}
              className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                currentStep === 0
                  ? 'opacity-30 cursor-not-allowed text-slate-500'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>

            <button
              type="button"
              id="btn-tutorial-next"
              onClick={handleNext}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-emerald-500 hover:from-sky-400 hover:to-emerald-400 text-white font-semibold text-xs sm:text-sm shadow-lg shadow-sky-950/50 transition-all flex items-center gap-2 cursor-pointer"
            >
              {currentStep < steps.length - 1 ? (
                <>
                  <span>Next Step</span>
                  <ChevronRight className="w-4 h-4" />
                </>
              ) : (
                <>
                  <span>Arm & Enter Weather Camouflage</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
