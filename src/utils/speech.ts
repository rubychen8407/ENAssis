/**
 * Speech synthesis & recognition utilities
 */

let currentAudioElement: HTMLAudioElement | null = null;
let ttsRequestToken = 0; // guards against a stale/slow request resolving after a newer speakText() call

// Play browser native speech synthesis (used as the final fallback)
function speakTextBrowser(
  text: string,
  options: {
    rate?: number;
    pitch?: number;
    lang?: string;
    onEnd?: () => void;
    onError?: (err: any) => void;
  } = {}
): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    console.warn('Speech synthesis not supported');
    options.onError?.('Speech synthesis not supported');
    return;
  }

  window.speechSynthesis.cancel();

  if (!text || text.trim() === '') return;

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = options.lang || 'en-US';
  utterance.rate = options.rate || 1.0;
  utterance.pitch = options.pitch || 1.0;

  // Prefer natural English voices if available
  const voices = window.speechSynthesis.getVoices();
  const naturalVoice = voices.find(
    (v) =>
      v.lang.startsWith('en') &&
      (v.name.includes('Natural') ||
        v.name.includes('Google') ||
        v.name.includes('Samantha') ||
        v.name.includes('Daniel'))
  ) || voices.find((v) => v.lang.startsWith('en'));

  if (naturalVoice) {
    utterance.voice = naturalVoice;
  }

  if (options.onEnd) {
    utterance.onend = () => options.onEnd?.();
  }

  if (options.onError) {
    utterance.onerror = (e) => options.onError?.(e);
  }

  window.speechSynthesis.speak(utterance);
}

/**
 * Speak text using the most natural available voice.
 * Order: ElevenLabs (server picks the first model that isn't out of quota) → browser speech synthesis.
 * Callable exactly like before (fire-and-forget, no await needed at call sites) — the ElevenLabs
 * attempt happens asynchronously in the background and falls back automatically on any failure.
 */
export function speakText(
  text: string,
  options: {
    rate?: number;
    pitch?: number;
    lang?: string;
    voiceId?: string;
    onEnd?: () => void;
    onError?: (err: any) => void;
  } = {}
): void {
  if (!text || text.trim() === '') return;

  // Stop whatever is currently playing (either engine) before starting the new one
  stopSpeaking();
  const myToken = ++ttsRequestToken;

  // Only route English text through ElevenLabs for now (matches the browser fallback's default
  // 'en-US' lang) — non-English text still uses the browser voice directly.
  const isLikelyEnglish = !options.lang || options.lang.startsWith('en');

  if (!isLikelyEnglish || typeof window === 'undefined' || typeof fetch === 'undefined') {
    speakTextBrowser(text, options);
    return;
  }

  fetch('/api/elevenlabs/tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, voiceId: options.voiceId }),
  })
    .then(async (res) => {
      if (myToken !== ttsRequestToken) return; // superseded by a newer speakText() call
      const contentType = res.headers.get('Content-Type') || '';
      if (!res.ok || !contentType.includes('audio')) {
        // ElevenLabs unavailable (no key / quota exhausted on every model) — fall back
        speakTextBrowser(text, options);
        return;
      }
      const blob = await res.blob();
      if (myToken !== ttsRequestToken) return;
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.playbackRate = options.rate || 1.0;
      currentAudioElement = audio;
      audio.onended = () => {
        URL.revokeObjectURL(url);
        if (myToken === ttsRequestToken) currentAudioElement = null;
        options.onEnd?.();
      };
      audio.onerror = (e) => {
        URL.revokeObjectURL(url);
        if (myToken === ttsRequestToken) currentAudioElement = null;
        // Playback itself failed after all — fall back to browser voice
        speakTextBrowser(text, options);
      };
      audio.play().catch(() => {
        URL.revokeObjectURL(url);
        speakTextBrowser(text, options);
      });
    })
    .catch(() => {
      if (myToken !== ttsRequestToken) return;
      speakTextBrowser(text, options);
    });
}

export function stopSpeaking(): void {
  if (activeAudioElement) {
    activeAudioElement.pause();
    activeAudioElement = null;
  }
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
  if (currentAudioElement) {
    currentAudioElement.pause();
    currentAudioElement = null;
  }
}

// Play PCM audio from Gemini TTS
export async function playPcmAudio(base64Data: string, sampleRate = 24000): Promise<void> {
  try {
    const binary = atob(base64Data);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    const int16Array = new Int16Array(bytes.buffer);
    const float32Array = new Float32Array(int16Array.length);
    for (let i = 0; i < int16Array.length; i++) {
      float32Array[i] = int16Array[i] / 32768;
    }

    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const audioCtx = new AudioContextClass({ sampleRate });
    const buffer = audioCtx.createBuffer(1, float32Array.length, sampleRate);
    buffer.copyToChannel(float32Array, 0);

    const source = audioCtx.createBufferSource();
    source.buffer = buffer;
    source.connect(audioCtx.destination);
    source.start(0);
  } catch (err) {
    console.error('Failed to play PCM audio:', err);
  }
}

// Check speech recognition capability
export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
}

export interface SpeechRecognizerOptions {
  onResult: (fullTranscript: string, isFinal: boolean, finalSegment: string, interimSegment: string) => void;
  onError: (error: any) => void;
  onEnd: () => void;
  onSpeechStart?: () => void;
  onSpeechEnd?: () => void;
}

export interface EnhancedSpeechRecognizer {
  start: () => void;
  stop: () => void;
  abort: () => void;
  setBasePrefix: (prefix: string) => void;
  reset: () => void;
  getAccumulatedText: () => string;
}

// Create robust Speech Recognition instance that preserves continuous speech without truncation
export function createSpeechRecognizer(callbacks: SpeechRecognizerOptions): EnhancedSpeechRecognizer | null {
  if (!isSpeechRecognitionSupported()) {
    return null;
  }

  const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  let recognizer: any = null;
  let basePrefix = '';
  let accumulatedSessionFinal = '';
  let isManuallyStopped = false;

  const initRecognizer = () => {
    recognizer = new SpeechRec();
    recognizer.continuous = true;
    recognizer.interimResults = true;
    recognizer.lang = 'en-US';
    recognizer.maxAlternatives = 1;

    if (callbacks.onSpeechStart) {
      recognizer.onspeechstart = () => callbacks.onSpeechStart?.();
    }
    if (callbacks.onSpeechEnd) {
      recognizer.onspeechend = () => callbacks.onSpeechEnd?.();
    }

    recognizer.onresult = (event: any) => {
      // If manually stopped or aborted, ignore any trailing buffered results arriving late from the browser
      if (isManuallyStopped) {
        return;
      }

      let currentSessionFinal = '';
      let currentSessionInterim = '';

      // Loop over ALL results from 0 to results.length - 1
      for (let i = 0; i < event.results.length; ++i) {
        const item = event.results[i];
        if (item && item[0]) {
          const text = item[0].transcript;
          if (item.isFinal) {
            currentSessionFinal += (currentSessionFinal ? ' ' : '') + text.trim();
          } else {
            currentSessionInterim += (currentSessionInterim ? ' ' : '') + text.trim();
          }
        }
      }

      // Store accumulated final for current session
      if (currentSessionFinal) {
        accumulatedSessionFinal = currentSessionFinal;
      }

      // Combine prefix with session final and interim
      const parts = [basePrefix, accumulatedSessionFinal, currentSessionInterim].filter(Boolean);
      const combined = parts.join(' ').replace(/\s+/g, ' ').trim();
      const finalParts = [basePrefix, accumulatedSessionFinal].filter(Boolean);
      const fullFinal = finalParts.join(' ').replace(/\s+/g, ' ').trim();

      callbacks.onResult(combined, Boolean(currentSessionFinal), fullFinal, currentSessionInterim);
    };

    recognizer.onerror = (event: any) => {
      // Don't treat benign 'no-speech' as fatal error
      if (event.error === 'no-speech') {
        return;
      }
      callbacks.onError(event.error);
    };

    recognizer.onend = () => {
      if (!isManuallyStopped) {
        // If the browser terminated unexpectedly, consolidate session text into basePrefix
        if (accumulatedSessionFinal) {
          basePrefix = [basePrefix, accumulatedSessionFinal].filter(Boolean).join(' ').trim();
          accumulatedSessionFinal = '';
        }
      }
      callbacks.onEnd();
    };
  };

  initRecognizer();

  return {
    start: () => {
      isManuallyStopped = false;
      try {
        recognizer?.start();
      } catch (e) {
        // If already started, re-init and start
        initRecognizer();
        try {
          recognizer?.start();
        } catch (_) {}
      }
    },
    stop: () => {
      isManuallyStopped = true;
      basePrefix = '';
      accumulatedSessionFinal = '';
      try {
        recognizer?.stop();
      } catch (_) {}
    },
    abort: () => {
      isManuallyStopped = true;
      basePrefix = '';
      accumulatedSessionFinal = '';
      try {
        recognizer?.abort();
      } catch (_) {}
    },
    setBasePrefix: (prefix: string) => {
      basePrefix = prefix.trim();
      accumulatedSessionFinal = '';
    },
    reset: () => {
      basePrefix = '';
      accumulatedSessionFinal = '';
      isManuallyStopped = true;
    },
    getAccumulatedText: () => {
      return [basePrefix, accumulatedSessionFinal].filter(Boolean).join(' ').trim();
    },
  };
}

// Audio volume level detector for real-time visual waveform and silence measurement
export interface AudioLevelMeter {
  start: (onLevel: (level: number) => void) => Promise<boolean>;
  stop: () => void;
}

export function createAudioLevelMeter(): AudioLevelMeter {
  let audioContext: AudioContext | null = null;
  let mediaStream: MediaStream | null = null;
  let analyser: AnalyserNode | null = null;
  let animationFrameId: number | null = null;

  return {
    start: async (onLevel: (level: number) => void) => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          return false;
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
        });
        mediaStream = stream;

        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        audioContext = new AudioContextClass();
        const source = audioContext.createMediaStreamSource(stream);
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.5;
        source.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        const checkLevel = () => {
          if (!analyser) return;
          analyser.getByteFrequencyData(dataArray);

          // Calculate average volume level (0 to 100)
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const avg = sum / dataArray.length;
          const normalized = Math.min(100, Math.round((avg / 128) * 100));
          onLevel(normalized);

          animationFrameId = requestAnimationFrame(checkLevel);
        };

        checkLevel();
        return true;
      } catch (err) {
        console.warn('Microphone audio level meter unavailable:', err);
        return false;
      }
    },
    stop: () => {
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
      if (mediaStream) {
        mediaStream.getTracks().forEach((track) => track.stop());
        mediaStream = null;
      }
      if (audioContext && audioContext.state !== 'closed') {
        audioContext.close().catch(() => {});
        audioContext = null;
      }
      analyser = null;
    },
  };
}
