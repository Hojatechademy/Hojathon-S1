import React from "react";

interface Props {
  phase: "listening" | "processing";
  transcript: string;
  onStop: () => void;
}

/** Centered, Google-Assistant-style listening indicator shown while the mic is active. */
export default function VoiceOverlay({ phase, transcript, onStop }: Props) {
  return (
    <div className="voice-overlay" role="dialog" aria-modal="true" aria-label="Voice input">
      <button
        className="voice-orb-wrap"
        onClick={phase === "listening" ? onStop : undefined}
        disabled={phase !== "listening"}
        aria-label={phase === "listening" ? "Stop listening" : "Processing"}
      >
        <span className="voice-ring r1" />
        <span className="voice-ring r2" />
        <span className="voice-ring r3" />
        <span className="voice-orb">{phase === "listening" ? "🎤" : "⏳"}</span>
      </button>

      <p className="voice-status">{phase === "listening" ? "Listening…" : "Processing…"}</p>

      <p className="voice-transcript">{transcript || (phase === "listening" ? "Say something…" : "")}</p>

      {phase === "listening" && (
        <button className="voice-stop-btn" onClick={onStop}>
          Tap to stop
        </button>
      )}
    </div>
  );
}
