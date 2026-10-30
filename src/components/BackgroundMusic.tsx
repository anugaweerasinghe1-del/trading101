import { useEffect, useRef, useState } from "react";
import { Music2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Floating ambient-music toggle. Persists user preference in localStorage.
 * Track: "Long Road Ahead" by Kevin MacLeod — incompetech.com (CC BY 4.0).
 * Bundled locally so playback is reliable and no third-party request is needed.
 */
const TRACK_URL = "/audio/long-road-ahead-kevin-macleod.mp3";
const TRACK_TITLE = "Long Road Ahead · Kevin MacLeod (CC BY 4.0)";
const STORAGE_KEY = "tradehq:bg-music-on";

export function BackgroundMusic() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const a = new Audio(TRACK_URL);
    a.loop = true;
    a.volume = 0.18;
    a.preload = "auto";
    audioRef.current = a;
    setReady(true);

    const wanted = localStorage.getItem(STORAGE_KEY) === "1";
    if (wanted) {
      a.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    }

    return () => {
      a.pause();
      audioRef.current = null;
    };
  }, []);

  const toggle = () => {
    const a = audioRef.current;
    if (!a) return;
    if (playing) {
      a.pause();
      setPlaying(false);
      localStorage.setItem(STORAGE_KEY, "0");
    } else {
      // Re-prime the source in case a previous load failed
      if (a.error || a.readyState === 0) {
        a.src = TRACK_URL;
        a.load();
      }
      a.play()
        .then(() => {
          setPlaying(true);
          localStorage.setItem(STORAGE_KEY, "1");
        })
        .catch((err) => {
          console.warn("[BackgroundMusic] play failed:", err);
          setPlaying(false);
        });
    }
  };

  if (!ready) return null;

  return (
    <button
      onClick={toggle}
      aria-label={playing ? "Mute background music" : "Play background music"}
      title={`${playing ? "Mute" : "Play"} ambient music · ${TRACK_TITLE}`}
      className={cn(
        "fixed z-40 bottom-20 right-4 md:bottom-6 md:right-6",
        "h-11 w-11 rounded-full flex items-center justify-center",
        "border border-white/10 backdrop-blur-xl transition-all active:scale-90",
        "shadow-[0_6px_24px_-6px_hsl(0_0%_0%/0.6)]",
        playing
          ? "bg-primary/20 border-primary/40 text-primary"
          : "bg-black/40 text-foreground/70 hover:text-foreground hover:bg-black/60 [.light_&]:bg-white [.light_&]:text-neutral-800 [.light_&]:border-neutral-500 [.light_&]:hover:bg-neutral-100 [.light_&]:hover:text-neutral-900",
      )}
    >
      {playing ? (
        <Music2 className="w-4 h-4 animate-pulse" />
      ) : (
        <VolumeX className="w-4 h-4" />
      )}
      {playing && (
        <span
          aria-hidden
          className="absolute inset-0 rounded-full border border-primary/40 animate-ping"
        />
      )}
    </button>
  );
}