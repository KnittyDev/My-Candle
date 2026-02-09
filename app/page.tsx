"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function Home() {
  const [minutes, setMinutes] = useState(1);
  const [remainingSeconds, setRemainingSeconds] = useState(60);
  const [isRunning, setIsRunning] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [isLit, setIsLit] = useState(false);
  
  // Audio State
  const [volume, setVolume] = useState(0.5);
  const [isMuted, setIsMuted] = useState(false);
  
  // Animation state
  const [candleHeight, setCandleHeight] = useState(200);
  const maxCandleHeight = 200;
  
  // Refs
  const requestRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const durationRef = useRef<number>(0);
  const pausedProgressRef = useRef<number>(0);
  
  // Audio refs
  const startSoundRef = useRef<HTMLAudioElement | null>(null);
  const bgMusicRef = useRef<HTMLAudioElement | null>(null);
  const shouldPlayBgAfterStartRef = useRef(false);
  const bgMusicStartTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initialize audio (once)
  useEffect(() => {
    startSoundRef.current = new Audio("/firestart.mp3");
    startSoundRef.current.volume = isMuted ? 0 : volume;

    bgMusicRef.current = new Audio("/Fireplacesound.mp3");
    bgMusicRef.current.loop = true;
    bgMusicRef.current.volume = isMuted ? 0 : volume;

    // When start sound ends, play background music (ref = no stale closure)
    startSoundRef.current.onended = () => {
      if (shouldPlayBgAfterStartRef.current && bgMusicRef.current) {
        shouldPlayBgAfterStartRef.current = false;
        if (bgMusicStartTimeoutRef.current) {
          clearTimeout(bgMusicStartTimeoutRef.current);
          bgMusicStartTimeoutRef.current = null;
        }
        bgMusicRef.current.play().catch((e) => console.warn("Bg music play failed", e));
      }
    };

    return () => {
      if (bgMusicStartTimeoutRef.current) clearTimeout(bgMusicStartTimeoutRef.current);
      if (startSoundRef.current) {
        startSoundRef.current.pause();
        startSoundRef.current.onended = null;
      }
      if (bgMusicRef.current) {
        bgMusicRef.current.pause();
      }
    };
  }, []);

  // Handle Volume/Mute changes
  useEffect(() => {
    const effectiveVolume = isMuted ? 0 : volume;
    
    if (startSoundRef.current) {
        startSoundRef.current.volume = effectiveVolume;
    }
    if (bgMusicRef.current) {
        bgMusicRef.current.volume = effectiveVolume;
    }
  }, [volume, isMuted]);

  // Update timer display when minutes input changes
  useEffect(() => {
    if (!isRunning && pausedProgressRef.current === 0) {
      const totalSecs = minutes * 60;
      setRemainingSeconds(totalSecs);
      setCandleHeight(maxCandleHeight);
      setIsFinished(false);
    }
  }, [minutes, isRunning]);

  const animate = (time: number) => {
    if (!startTimeRef.current) startTimeRef.current = time;
    
    const elapsed = time - startTimeRef.current;
    const totalDuration = durationRef.current;
    
    let progress = (elapsed / totalDuration) + pausedProgressRef.current;
    
    if (progress >= 1) {
      progress = 1;
      setIsFinished(true);
      setIsRunning(false);
      setIsLit(false);
      setRemainingSeconds(0);
      setCandleHeight(0);
      
      // Stop music when finished
      if (bgMusicRef.current) {
          bgMusicRef.current.pause();
          bgMusicRef.current.currentTime = 0;
      }
      return;
    }

    const totalOriginalSeconds = minutes * 60;
    setRemainingSeconds(Math.ceil(totalOriginalSeconds * (1 - progress)));
    setCandleHeight(maxCandleHeight * (1 - progress));

    requestRef.current = requestAnimationFrame(animate);
  };

  const handleStart = () => {
    if (isFinished) {
        handleReset();
        pausedProgressRef.current = 0;
        setIsFinished(false);
    }

    // Play start sound when first lighting; bg music starts in onended (or fallback after 2.5s)
    if (!isRunning && !isLit) {
        shouldPlayBgAfterStartRef.current = true;
        if (startSoundRef.current) {
            startSoundRef.current.currentTime = 0;
            startSoundRef.current.play().catch((e) => console.warn("Start sound play failed", e));
        }
        // Fallback: some browsers block play() inside onended; start bg music after 2.5s
        bgMusicStartTimeoutRef.current = setTimeout(() => {
            if (shouldPlayBgAfterStartRef.current && bgMusicRef.current) {
                shouldPlayBgAfterStartRef.current = false;
                bgMusicRef.current.play().catch((e) => console.warn("Bg music play failed", e));
            }
            bgMusicStartTimeoutRef.current = null;
        }, 2500);
    } else if (!isRunning && isLit) {
        // Resuming from pause - play bg music directly
        if (bgMusicRef.current) {
            bgMusicRef.current.play().catch((e) => console.warn("Bg music resume failed", e));
        }
    }

    setIsLit(true);
    setIsRunning(true);
    
    const totalDurationMs = minutes * 60 * 1000;
    durationRef.current = totalDurationMs;
    startTimeRef.current = 0;
    
    requestRef.current = requestAnimationFrame(animate);
  };

  const handlePause = () => {
    setIsRunning(false);
    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
    }
    
    // Pause music
    if (bgMusicRef.current) {
        bgMusicRef.current.pause();
    }
    
    const currentProgress = 1 - (candleHeight / maxCandleHeight);
    pausedProgressRef.current = currentProgress;
  };

  const handleReset = () => {
    setIsRunning(false);
    setIsFinished(false);
    setIsLit(false);
    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
    }
    if (bgMusicStartTimeoutRef.current) {
      clearTimeout(bgMusicStartTimeoutRef.current);
      bgMusicStartTimeoutRef.current = null;
    }
    shouldPlayBgAfterStartRef.current = false;

    // Stop all audio
    if (startSoundRef.current) {
        startSoundRef.current.pause();
        startSoundRef.current.currentTime = 0;
    }
    if (bgMusicRef.current) {
        bgMusicRef.current.pause();
        bgMusicRef.current.currentTime = 0;
    }
    
    const totalSecs = minutes * 60;
    setRemainingSeconds(totalSecs);
    setCandleHeight(maxCandleHeight);
    pausedProgressRef.current = 0;
  };

  const getFormattedTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return {
      minutes: m.toString().padStart(2, '0'),
      seconds: s.toString().padStart(2, '0')
    };
  };

  const { minutes: minStr, seconds: secStr } = getFormattedTime(remainingSeconds);

  return (
    <div className="candle-page">
      {/* Volume Control - Top Right */}
      <div className="absolute top-6 right-6 z-50 flex items-center gap-3 bg-black/20 backdrop-blur-md p-3 rounded-full border border-white/10 hover:bg-black/30 transition-colors">
        <button 
            onClick={() => setIsMuted(!isMuted)}
            className="text-zinc-300 hover:text-white transition-colors"
        >
            {isMuted || volume === 0 ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line></svg>
            ) : volume < 0.5 ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
            ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
            )}
        </button>
        <input 
            type="range" 
            min="0" 
            max="1" 
            step="0.01" 
            value={isMuted ? 0 : volume}
            onChange={(e) => {
                setVolume(parseFloat(e.target.value));
                if (isMuted) setIsMuted(false);
            }}
            className="w-24 h-1.5 bg-zinc-600 rounded-lg appearance-none cursor-pointer accent-[#d4a856]"
        />
      </div>

      <div className="main-layout">
        {/* Controls Side */}
        <div className="controls-panel">
          <div className="text-center">
            <h2 className="text-xl font-bold mb-1 text-zinc-300 uppercase tracking-widest text-xs">Timer</h2>
            
            {/* Animated Time Display */}
            <div className="time-display-container">
              <div className="digit-wrapper">
                <AnimatePresence mode="popLayout">
                  <motion.span
                    key={`m1-${minStr[0]}`}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -20, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="digit absolute"
                  >
                    {minStr[0]}
                  </motion.span>
                </AnimatePresence>
              </div>
              <div className="digit-wrapper">
                <AnimatePresence mode="popLayout">
                  <motion.span
                    key={`m2-${minStr[1]}`}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -20, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="digit absolute"
                  >
                    {minStr[1]}
                  </motion.span>
                </AnimatePresence>
              </div>
              
              <div className="separator">:</div>
              
              <div className="digit-wrapper">
                <AnimatePresence mode="popLayout">
                  <motion.span
                    key={`s1-${secStr[0]}`}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -20, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="digit absolute"
                  >
                    {secStr[0]}
                  </motion.span>
                </AnimatePresence>
              </div>
              <div className="digit-wrapper">
                <AnimatePresence mode="popLayout">
                  <motion.span
                    key={`s2-${secStr[1]}`}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -20, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="digit absolute"
                  >
                    {secStr[1]}
                  </motion.span>
                </AnimatePresence>
              </div>
            </div>
          </div>
          
          <div className="input-group">
            <label className="text-sm font-medium text-zinc-400">Duration (min):</label>
            <input 
              type="number" 
              min="1" 
              max="120"
              value={minutes} 
              onChange={(e) => {
                  const val = Math.max(1, parseInt(e.target.value) || 0);
                  setMinutes(val);
              }}
              className="time-input"
              disabled={isRunning || (pausedProgressRef.current > 0 && !isFinished)}
            />
          </div>

          <div className="flex gap-3 justify-center w-full mt-2">
            {!isRunning ? (
              <button className="btn btn-primary flex-1" onClick={handleStart}>
                {pausedProgressRef.current > 0 && !isFinished ? (
                   <>
                     <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                     Resume
                   </>
                ) : (
                   <>
                     <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 12l-8.5 8.5c-.83.83-2.17.83-3 0 0 0 0 0 0 0a2.12 2.12 0 0 1 0-3L12 9"></path><path d="M17.64 15L22 10.64"></path><path d="M20.91 11.26a2 2 0 1 0 2.83 2.83l-3.75-3.75a2 2 0 0 0-2.83 2.83l3.75 3.75"></path></svg>
                     Light Candle
                   </>
                )}
              </button>
            ) : (
               <button className="btn btn-secondary flex-1" onClick={handlePause}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>
                Pause
              </button>
            )}
            <button className="btn btn-secondary flex-1" onClick={handleReset}>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path></svg>
              Reset
            </button>
          </div>
        </div>

        {/* Candle Side */}
        <div className="candle-section">
          <div className="candle-container">
            {/* Flame & Wick Group - Only visible if Lit */}
            <div 
                style={{ 
                    opacity: isLit ? 1 : 0, 
                    transition: 'opacity 0.5s ease-in-out',
                    marginBottom: -5,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    transform: isFinished ? 'scale(0.8)' : 'scale(1)',
                }}
            >
                 {/* Flame Wrapper containing Flame and Glow */}
                <div className="flame-wrapper">
                    <div className="glow" />
                    <div className="flame">
                        <div className="flame-inner" />
                    </div>
                </div>
            </div>
            
            {!isLit && (
                 <div className="wick" style={{ marginBottom: -5, opacity: 0.6 }} />
            )}
            {isLit && (
                 <div className="wick" style={{ marginBottom: -5 }} />
            )}

            {/* Candle body with dynamic height */}
            <div 
                className="candle-body" 
                style={{ 
                    height: `${Math.max(5, candleHeight)}px`,
                }}
            >
              {/* Wax drips */}
              {isLit && candleHeight > 40 && (
                  <>
                    <div className="drip drip-1" />
                    <div className="drip drip-2" />
                    <div className="drip drip-3" />
                  </>
              )}
            </div>

            {/* Candle base / holder */}
            <div className="candle-holder">
              <div className="candle-holder-rim" />
              <div className="candle-holder-body" />
            </div>

            {/* Reflection on surface */}
            <div className="surface-reflection" style={{ opacity: isLit ? 1 : 0, transition: 'opacity 1s' }} />
          </div>
        </div>
      </div>
    </div>
  );
}
