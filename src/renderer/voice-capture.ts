/**
 * Microphone capture, adapted from the proven sample-bot1 reference
 * (client/src/App.jsx: downsampleTo16k / int16ToBase64 / startRecording /
 * stopRecording) — same resampling math, same 16-bit PCM @ 16kHz mono
 * target (the Live API's actual realtime audio input format), same
 * ScriptProcessor capture approach. Only the transport changed: chunks go
 * over IPC (window.api.aiVoiceAudioChunk) instead of a WebSocket message.
 */
const MIC_SAMPLE_RATE = 16000;
const MIN_VOICE_SAMPLES = 6400; // ignore taps shorter than ~0.4s

function downsampleTo16k(input: Float32Array, inRate: number): Int16Array {
  const convert = (samples: Float32Array): Int16Array => {
    const out = new Int16Array(samples.length);
    for (let i = 0; i < samples.length; i++) {
      const s = Math.max(-1, Math.min(1, samples[i]));
      out[i] = s < 0 ? s * 32768 : s * 32767;
    }
    return out;
  };
  if (!inRate || inRate === MIC_SAMPLE_RATE) return convert(input);
  const ratio = inRate / MIC_SAMPLE_RATE;
  const outLen = Math.floor(input.length / ratio);
  const resampled = new Float32Array(outLen);
  for (let i = 0; i < outLen; i++) {
    const pos = i * ratio;
    const idx = Math.floor(pos);
    const frac = pos - idx;
    const a = input[idx] || 0;
    const b = input[idx + 1] || 0;
    resampled[i] = a + (b - a) * frac;
  }
  return convert(resampled);
}

function int16ToBase64(int16: Int16Array): string {
  const bytes = new Uint8Array(int16.buffer, int16.byteOffset, int16.byteLength);
  let bin = "";
  const CHUNK = 8192;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    bin += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + CHUNK)));
  }
  return btoa(bin);
}

export interface VoiceCaptureHandle {
  stop: () => Promise<{ samples: number }>;
}

export type VoiceCaptureErrorKind = "permission-denied" | "unsupported" | "other";

export async function startVoiceCapture(
  onChunk: (base64: string) => void,
  onError: (kind: VoiceCaptureErrorKind, message: string) => void
): Promise<VoiceCaptureHandle | null> {
  if (!navigator.mediaDevices?.getUserMedia) {
    onError("unsupported", "Microphone is not available in this environment.");
    return null;
  }
  const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) {
    onError("unsupported", "Audio capture is not supported here.");
    return null;
  }

  let stream: MediaStream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true } });
  } catch (err) {
    const name = (err as { name?: string })?.name ?? "";
    onError(
      name === "NotAllowedError" ? "permission-denied" : "other",
      name === "NotAllowedError" ? "Microphone permission was denied. Allow access and try again." : "Could not start the microphone."
    );
    return null;
  }

  const ctx = new AC();
  if (ctx.state === "suspended") {
    try {
      await ctx.resume();
    } catch {
      /* ignore */
    }
  }
  const src = ctx.createMediaStreamSource(stream);
  // ScriptProcessorNode is deprecated but remains the simplest reliable
  // cross-browser path for raw PCM access; matches the proven reference.
  const proc = ctx.createScriptProcessor(4096, 1, 1);
  let samples = 0;
  let active = true;

  proc.onaudioprocess = (e) => {
    if (!active) return;
    const input = e.inputBuffer.getChannelData(0);
    const pcm = downsampleTo16k(input, e.inputBuffer.sampleRate);
    if (!pcm.length) return;
    samples += pcm.length;
    onChunk(int16ToBase64(pcm));
  };
  src.connect(proc);
  const sink = ctx.createGain(); // keep the processor running without audible output
  sink.gain.value = 0;
  proc.connect(sink);
  sink.connect(ctx.destination);

  return {
    stop: async () => {
      active = false;
      try {
        proc.disconnect();
      } catch {
        /* ignore */
      }
      try {
        await ctx.close();
      } catch {
        /* ignore */
      }
      try {
        stream.getTracks().forEach((t) => t.stop());
      } catch {
        /* ignore */
      }
      return { samples };
    }
  };
}

export { MIN_VOICE_SAMPLES };
