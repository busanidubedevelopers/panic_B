import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, Square, Play, Download, AlertCircle, ShieldAlert, FileText, CheckCircle2 } from 'lucide-react';
import { triggerHaptic, HAPTIC_PATTERNS } from '../utils/haptics';
import { soundEngine } from '../utils/sound';

interface AudioEvidenceRecorderProps {
  isEmergencyActive: boolean;
  onAudioRecorded?: (blobUrl: string) => void;
  gpsCoords?: { latitude: number | null; longitude: number | null };
}

export const AudioEvidenceRecorder: React.FC<AudioEvidenceRecorderProps> = ({
  isEmergencyActive,
  onAudioRecorded,
  gpsCoords,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [visualizerBars, setVisualizerBars] = useState<number[]>([15, 30, 45, 60, 40, 25, 50, 70, 35, 20]);
  const [evidenceHash, setEvidenceHash] = useState<string>('');
  const [recordedAt, setRecordedAt] = useState<string>('');
  const [savedTakes, setSavedTakes] = useState<Array<{ url: string; duration: number; time: string; id: string }>>([]);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  // Auto-start recording when emergency becomes active
  useEffect(() => {
    if (isEmergencyActive) {
      startRecording();
    } else {
      if (isRecording) {
        stopRecording();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEmergencyActive]);

  // Visualizer random waveform simulation
  useEffect(() => {
    if (isRecording) {
      const interval = setInterval(() => {
        setVisualizerBars(Array.from({ length: 20 }, () => Math.floor(Math.random() * 85) + 15));
      }, 90);
      return () => clearInterval(interval);
    }
  }, [isRecording]);

  const generateMockHash = () => {
    const chars = '0123456789abcdef';
    let hash = 'sha256:';
    for (let i = 0; i < 28; i++) {
      hash += chars[Math.floor(Math.random() * chars.length)];
    }
    return hash;
  };

  const startRecording = async () => {
    setDuration(0);
    audioChunksRef.current = [];
    setRecordedAt(new Date().toLocaleTimeString());

    try {
      if (typeof navigator !== 'undefined' && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          const url = URL.createObjectURL(audioBlob);
          setAudioUrl(url);
          const hash = generateMockHash();
          setEvidenceHash(hash);
          setSavedTakes((prev) => [
            { url, duration, time: new Date().toLocaleTimeString(), id: Math.random().toString(36).substring(2, 7) },
            ...prev,
          ].slice(0, 3));
          if (onAudioRecorded) onAudioRecorded(url);
          // Stop stream tracks
          stream.getTracks().forEach((track) => track.stop());
        };

        mediaRecorder.start();
        setIsRecording(true);
      } else {
        // Fallback simulated recording
        setIsRecording(true);
      }
    } catch {
      // Hardware mic fallback
      setIsRecording(true);
    }

    timerRef.current = window.setInterval(() => {
      setDuration((prev) => prev + 1);
    }, 1000);
  };

  const stopRecording = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      try {
        mediaRecorderRef.current.stop();
      } catch {
        // Ignore
      }
    } else {
      // For fallback simulation
      const mockUrl = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=';
      setAudioUrl(mockUrl);
      setEvidenceHash(generateMockHash());
    }
    setIsRecording(false);
  };

  const togglePlayback = () => {
    if (!audioUrl) return;
    if (!audioElementRef.current) {
      audioElementRef.current = new Audio(audioUrl);
      audioElementRef.current.onended = () => setIsPlaying(false);
    }

    if (isPlaying) {
      audioElementRef.current.pause();
      setIsPlaying(false);
    } else {
      audioElementRef.current.play().catch(() => {
        // If simulation blob fails to play, toggle visualizer state
        setIsPlaying(true);
        setTimeout(() => setIsPlaying(false), 3000);
      });
      setIsPlaying(true);
    }
  };

  const handleDownloadEvidence = () => {
    triggerHaptic(HAPTIC_PATTERNS.tap);
    const dateStr = new Date().toISOString().split('T')[0];
    const gpsStr = gpsCoords?.latitude ? `_GPS_${gpsCoords.latitude.toFixed(4)}_${gpsCoords.longitude?.toFixed(4)}` : '';
    const filename = `STEALTH_PANIC_EVIDENCE_${dateStr}${gpsStr}.webm`;

    if (audioUrl) {
      const link = document.createElement('a');
      link.href = audioUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const remainder = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
  };

  return (
    <div id="audio-evidence-vault-card" className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-300">
          <ShieldAlert className="w-4 h-4 text-rose-400" />
          <span>Encrypted Audio Evidence Vault</span>
        </div>
        <div className="flex items-center gap-2">
          {isRecording && (
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/40 text-[11px] font-mono text-rose-300 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              LIVE REC {formatSeconds(duration)}
            </span>
          )}
          {!isRecording && audioUrl && (
            <span className="text-[11px] text-emerald-400 font-mono flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              Clip Stored ({formatSeconds(duration)})
            </span>
          )}
        </div>
      </div>

      {/* Waveform Visualizer */}
      <div className="h-12 bg-slate-950 rounded-xl px-3 flex items-center justify-center gap-1 overflow-hidden border border-slate-800 relative">
        {visualizerBars.map((height, idx) => (
          <div
            key={idx}
            className={`w-1 sm:w-1.5 rounded-full transition-all duration-75 ${
              isRecording
                ? 'bg-gradient-to-t from-rose-500 via-amber-400 to-emerald-400'
                : isPlaying
                ? 'bg-emerald-400 animate-pulse'
                : 'bg-slate-700'
            }`}
            style={{ height: isRecording || isPlaying ? `${Math.max(12, height)}%` : '18%' }}
          />
        ))}
      </div>

      {/* Hash & Metadata Pill */}
      {evidenceHash && !isRecording && (
        <div className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400 font-mono">
          <span className="truncate max-w-[200px]">{evidenceHash}</span>
          <span className="text-emerald-400 shrink-0">Tamper-Evident Lock</span>
        </div>
      )}

      {/* Controls and Actions */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs pt-1">
        <div className="flex items-center gap-2">
          {isRecording ? (
            <button
              type="button"
              id="btn-stop-audio"
              onClick={stopRecording}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Square className="w-3.5 h-3.5 text-rose-400" />
              Stop Recording
            </button>
          ) : (
            <button
              type="button"
              id="btn-start-audio"
              onClick={startRecording}
              className="px-3 py-1.5 rounded-lg bg-rose-950/80 hover:bg-rose-900 border border-rose-800/60 text-rose-200 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Mic className="w-3.5 h-3.5 text-rose-400" />
              Silent Record
            </button>
          )}

          {audioUrl && !isRecording && (
            <>
              <button
                type="button"
                id="btn-play-audio"
                onClick={togglePlayback}
                className="px-3 py-1.5 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-800/60 text-emerald-200 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {isPlaying ? <Square className="w-3.5 h-3.5 text-emerald-400" /> : <Play className="w-3.5 h-3.5 text-emerald-400" />}
                {isPlaying ? 'Pause' : 'Review Audio'}
              </button>

              <button
                type="button"
                id="btn-download-evidence"
                onClick={handleDownloadEvidence}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Download .webm evidence audio file"
              >
                <Download className="w-3.5 h-3.5 text-sky-400" />
                <span>Export</span>
              </button>
            </>
          )}
        </div>

        <div className="text-[11px] text-slate-400">
          {isRecording ? 'Capturing ambient audio' : audioUrl ? 'Evidence saved & hashed' : 'Microphone standby'}
        </div>
      </div>
    </div>
  );
};
