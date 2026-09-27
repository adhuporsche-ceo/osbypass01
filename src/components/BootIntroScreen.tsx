import React, { useState, useEffect } from "react";
import { PeacockLogo } from "./PeacockLogo";

interface BootIntroScreenProps {
  onComplete: () => void;
  durationMs?: number; // default 3000ms (3 seconds)
}

export const BootIntroScreen: React.FC<BootIntroScreenProps> = ({
  onComplete,
  durationMs = 3000,
}) => {
  const [progress, setProgress] = useState<number>(0);
  const [bootMessageIndex, setBootMessageIndex] = useState<number>(0);
  const [isFadingOut, setIsFadingOut] = useState<boolean>(false);

  const bootMessages = [
    "Starting Distrobyetz Core v1.0.0-native...",
    "Mounting kernel subsystem & memory architecture...",
    "Loading real-time autonomous remediation telemetry...",
    "Distrobyetz environment initialized. Welcome.",
  ];

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, Math.round((elapsed / durationMs) * 100));
      setProgress(pct);

      if (pct < 30) {
        setBootMessageIndex(0);
      } else if (pct < 60) {
        setBootMessageIndex(1);
      } else if (pct < 88) {
        setBootMessageIndex(2);
      } else {
        setBootMessageIndex(3);
      }

      if (elapsed >= durationMs) {
        clearInterval(interval);
        setIsFadingOut(true);
        setTimeout(() => {
          onComplete();
        }, 350); // smooth fade transition
      }
    }, 40);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === " ") {
        clearInterval(interval);
        setIsFadingOut(true);
        setTimeout(onComplete, 200);
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      clearInterval(interval);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [durationMs, onComplete]);

  return (
    <div
      id="distrobyetz-os-boot-screen"
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-white text-black select-none transition-opacity duration-300 ease-out ${
        isFadingOut ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      {/* Background Subtle Radial Gradient & Grid Gridlines */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_35%,rgba(6,182,212,0.08),rgba(255,255,255,1))] pointer-events-none" />
      <div 
        className="absolute inset-0 opacity-[0.035] pointer-events-none"
        style={{
          backgroundImage: "linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)",
          backgroundSize: "40px 40px"
        }}
      />

      {/* Top Bar with Skip Prompt */}
      <div className="absolute top-5 right-6 flex items-center gap-2">
        <button
          id="skip-boot-screen-btn"
          onClick={() => {
            setIsFadingOut(true);
            setTimeout(onComplete, 200);
          }}
          className="px-3 py-1 rounded-full bg-black/5 hover:bg-black/10 border border-black/10 text-zinc-700 hover:text-black text-[11px] font-mono tracking-wider transition cursor-pointer backdrop-blur-xs"
        >
          Skip [Esc]
        </button>
      </div>

      {/* Center OS Boot Hero Section */}
      <div className="relative z-10 flex flex-col items-center max-w-md w-full px-6 text-center">
        {/* Glowing Peacock Logo (Vibrant Peacock Colors Preserved Exactly) */}
        <div className="relative mb-6 group">
          {/* Ambient luminous glow pulses */}
          <div className="absolute -inset-4 bg-gradient-to-tr from-cyan-400/20 via-teal-400/20 to-emerald-400/20 rounded-full blur-xl animate-pulse pointer-events-none" />
          
          <div className="relative transform transition-transform duration-700 hover:scale-105">
            <PeacockLogo size={152} withGlow={true} animated={false} theme="vibrant" />
          </div>
        </div>

        {/* OS Name: Distrobyetz in High-Contrast Black */}
        <div className="space-y-1.5 mb-2">
          <h1 className="text-3xl sm:text-4xl font-black tracking-widest text-black font-sans uppercase drop-shadow-xs">
            Distrobyetz
          </h1>
          
          {/* Developer Attribution as requested */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/5 border border-black/15 text-black font-mono text-xs sm:text-sm font-semibold tracking-wide shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-cyan-500 animate-ping" />
            <span>Developed By ~ADHITHYA</span>
          </div>
        </div>

        {/* Subtitle / System Descriptor */}
        <p className="text-xs text-zinc-600 font-mono tracking-wider mb-8 font-medium">
          Next-Generation Autonomous Linux Operating System
        </p>

        {/* OS Boot Loader Animation (Classic OS Spinner Dots + High-Precision Progress Bar) */}
        <div className="w-full max-w-xs space-y-4">
          {/* OS Loading Spinner: Rotating Ring of Dots */}
          <div className="flex justify-center items-center py-2">
            <div className="relative w-9 h-9">
              {/* Modern spinning dots loader reminiscent of OS boot loaders */}
              <div className="absolute inset-0 rounded-full border-2 border-black/10" />
              <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-cyan-600 border-r-teal-600 animate-spin" />
              <div className="absolute inset-2 rounded-full border-2 border-transparent border-b-black opacity-80 animate-[spin_1.5s_linear_infinite_reverse]" />
            </div>
          </div>

          {/* Slim OS Boot Progress Bar */}
          <div className="relative w-full h-1.5 bg-zinc-200 rounded-full overflow-hidden border border-black/10 shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-cyan-600 via-teal-500 to-emerald-500 transition-all duration-75 ease-out shadow-[0_0_8px_rgba(6,182,212,0.4)]"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Real-time System Loading Telemetry Status */}
          <div className="flex items-center justify-between text-[11px] font-mono text-zinc-600 px-0.5">
            <span className="text-zinc-800 font-medium truncate max-w-[220px]">
              {bootMessages[bootMessageIndex]}
            </span>
            <span className="text-black font-bold tabular-nums">
              {progress}%
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Footer OS Kernel Stamp in Black / Dark Tones */}
      <div className="absolute bottom-6 flex flex-col items-center gap-1 text-[11px] font-mono text-zinc-600">
        <div className="flex items-center gap-2">
          <span>Linux 6.8-native</span>
          <span>•</span>
          <span>x86_64</span>
          <span>•</span>
          <span className="text-black font-semibold">UEFI Secure Boot</span>
        </div>
        <div className="text-[10px] text-zinc-500">
          3-Second Express Boot Sequence • Distrobyetz Platform
        </div>
      </div>
    </div>
  );
};
