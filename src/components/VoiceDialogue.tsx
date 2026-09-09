import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Send,
  Sparkles,
  RefreshCw,
  Lightbulb,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Languages,
  Clock,
  Radio,
} from 'lucide-react';
import { VoiceMessage, VocabWord, RoleplayScenario } from '../types';
import { recordWordPracticeResult } from '../utils/storage';
import {
  speakText,
  stopSpeaking,
  isSpeechRecognitionSupported,
  createSpeechRecognizer,
  createAudioLevelMeter,
  EnhancedSpeechRecognizer,
  AudioLevelMeter,
} from '../utils/speech';

interface Props {
  savedWords: VocabWord[];
  prefilledWord?: VocabWord | null;
}

const DEFAULT_SCENARIOS: RoleplayScenario[] = [
  {
    id: 'opinions-debate',
    title: '深度想法與觀點表達 (Expressing In-depth Thoughts)',
    category: 'Advanced Speaking',
    description: '練習清晰、條理分明地表達個人立場與完整思想，如科技對生活的影響。',
    aiPersona: 'Emma (Thoughtful Discussion Partner)',
    startingPrompt: "Hi there! I've been reflecting on how AI and technology are shifting our daily lifestyles. From your perspective, what's one significant habit that has changed for you recently?",
    suggestedVocab: ['perspective', 'articulate', 'spontaneous'],
  },
  {
    id: 'daily-cafe',
    title: '咖啡館與日常生活漫談 (Cafe & Casual Talk)',
    category: 'Daily Life',
    description: '輕鬆自然的日常對話，練習生活點滴與休閒話題。',
    aiPersona: 'Emma (Friendly Barista & Friend)',
    startingPrompt: "Hello! Welcome in. It's great to see you today. Are you having your usual coffee, or would you like to try something spontaneous today?",
    suggestedVocab: ['spontaneous', 'subtle'],
  },
  {
    id: 'job-interview',
    title: '職場商務與面試 (Career & Job Interview)',
    category: 'Career',
    description: '模擬職場專業溝通、自我介紹與專案挑戰應對。',
    aiPersona: 'Emma (Senior Interviewer)',
    startingPrompt: "Good morning! Thank you for meeting with me today. To begin, could you articulate your proudest achievement and how you overcame a subtle challenge in your past projects?",
    suggestedVocab: ['articulate', 'comprehend', 'perspective'],
  },
  {
    id: 'vocab-practice',
    title: '我的生字庫專屬口說實戰 (My Vocabulary Talk)',
    category: 'Vocabulary Immersion',
    description: '針對您個人儲存的生字，AI 特別設計話題讓您在真實語音對話中說出來。',
    aiPersona: 'Emma (Vocabulary Coach)',
    startingPrompt: "Let's put your personal vocabulary words to work! Tell me about an experience where you had to comprehend a brand new concept.",
    suggestedVocab: [],
  },
];

export const VoiceDialogue: React.FC<Props> = ({ savedWords, prefilledWord }) => {
  const [selectedScenario, setSelectedScenario] = useState<RoleplayScenario>(DEFAULT_SCENARIOS[0]);
  const [messages, setMessages] = useState<VoiceMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const inputTextRef = useRef<string>('');

  const updateInputText = useCallback((val: string) => {
    inputTextRef.current = val;
    setInputText(val);
  }, []);

  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [speechRate, setSpeechRate] = useState<number>(0.8);
  const [showTranslations, setShowTranslations] = useState<boolean>(true);

  // Auto-send on silence configuration
  const [autoSendOnSilence, setAutoSendOnSilence] = useState<boolean>(true);
  const [silenceDelaySec, setSilenceDelaySec] = useState<number>(2.0); // 1.5s, 2.0s, 2.8s
  const [handsFreeMode, setHandsFreeMode] = useState<boolean>(true); // Default true: Automatically re-listen after AI finishes speaking
  const [silenceCountdown, setSilenceCountdown] = useState<number | null>(null);
  const [audioLevel, setAudioLevel] = useState<number>(0);

  // References for reliable async & event access
  const recognizerRef = useRef<EnhancedSpeechRecognizer | null>(null);
  const audioMeterRef = useRef<AudioLevelMeter | null>(null);
  const isRecordingIntentRef = useRef<boolean>(false);
  const latestTranscriptRef = useRef<string>('');
  const autoSendOnSilenceRef = useRef<boolean>(true);
  const silenceDelaySecRef = useRef<number>(2.0);
  const handsFreeModeRef = useRef<boolean>(true);
  const autoSpeakRef = useRef<boolean>(true);
  const speechRateRef = useRef<number>(0.8);
  const silenceTimeoutRef = useRef<any>(null);
  const countdownIntervalRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Keep refs in sync with states
  useEffect(() => {
    autoSendOnSilenceRef.current = autoSendOnSilence;
  }, [autoSendOnSilence]);

  useEffect(() => {
    silenceDelaySecRef.current = silenceDelaySec;
  }, [silenceDelaySec]);

  useEffect(() => {
    handsFreeModeRef.current = handsFreeMode;
  }, [handsFreeMode]);

  useEffect(() => {
    autoSpeakRef.current = autoSpeak;
  }, [autoSpeak]);

  useEffect(() => {
    speechRateRef.current = speechRate;
  }, [speechRate]);

  // Clear silence detection timers
  const clearSilenceTimers = useCallback(() => {
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    setSilenceCountdown(null);
  }, []);

  // Stop recording safely and abort buffers
  const stopRecording = useCallback(() => {
    isRecordingIntentRef.current = false;
    clearSilenceTimers();
    setAudioLevel(0);

    if (audioMeterRef.current) {
      audioMeterRef.current.stop();
      audioMeterRef.current = null;
    }

    if (recognizerRef.current) {
      recognizerRef.current.abort();
      recognizerRef.current.reset();
    }

    setIsRecording(false);
  }, [clearSilenceTimers]);

  // Forward declaration for handleSendMessage
  const handleSendMessageRef = useRef<(textToSend?: string) => Promise<void>>(async () => {});

  // Trigger silence countdown and auto-submission
  const scheduleSilenceAutoSend = useCallback((transcript: string) => {
    clearSilenceTimers();

    if (!autoSendOnSilenceRef.current) return;
    const cleanText = transcript.trim();
    if (cleanText.length === 0) return;

    const delayMs = silenceDelaySecRef.current * 1000;
    const startTime = Date.now();
    setSilenceCountdown(silenceDelaySecRef.current);

    countdownIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remainingMs = Math.max(0, delayMs - elapsed);
      const remainingSec = parseFloat((remainingMs / 1000).toFixed(1));
      setSilenceCountdown(remainingSec);

      if (remainingMs <= 0) {
        if (countdownIntervalRef.current) {
          clearInterval(countdownIntervalRef.current);
          countdownIntervalRef.current = null;
        }
      }
    }, 100);

    silenceTimeoutRef.current = setTimeout(() => {
      clearSilenceTimers();
      const textToSubmit = latestTranscriptRef.current.trim();
      if (textToSubmit.length > 0 && isRecordingIntentRef.current) {
        stopRecording();
        handleSendMessageRef.current(textToSubmit);
      }
    }, delayMs);
  }, [clearSilenceTimers, stopRecording]);

  // Start speech recording with clean session boundary
  const startRecording = useCallback(() => {
    if (!isSpeechRecognitionSupported()) {
      alert('您的瀏覽器不支援 Web Speech 語音識別，請直接在輸入框鍵盤輸入（推薦使用 Chrome 或 Edge）。');
      return;
    }

    stopSpeaking();
    clearSilenceTimers();

    // Abort and reset any existing recognizer before starting a new recording session
    if (recognizerRef.current) {
      recognizerRef.current.abort();
      recognizerRef.current.reset();
      recognizerRef.current = null;
    }

    isRecordingIntentRef.current = true;
    setIsRecording(true);

    // Start audio volume visualizer
    const audioMeter = createAudioLevelMeter();
    audioMeterRef.current = audioMeter;
    audioMeter.start((level) => {
      setAudioLevel(level);
      // If significant voice energy is detected (> 18) while countdown is ticking, reset silence timer
      if (level > 18 && latestTranscriptRef.current.trim().length > 0) {
        if (silenceTimeoutRef.current) {
          scheduleSilenceAutoSend(latestTranscriptRef.current);
        }
      }
    });

    const recognizer = createSpeechRecognizer({
      onResult: (fullTranscript, isFinal, finalSegment, interimSegment) => {
        // If recording was stopped or cancelled, do not accept late results
        if (!isRecordingIntentRef.current) return;

        latestTranscriptRef.current = fullTranscript;
        updateInputText(fullTranscript);

        if (fullTranscript.trim().length > 0) {
          scheduleSilenceAutoSend(fullTranscript);
        }
      },
      onError: (err) => {
        console.warn('Speech recognition error event:', err);
        // Only stop if user aborted or permission was denied
        if (err === 'not-allowed' || err === 'service-not-allowed') {
          stopRecording();
        }
      },
      onEnd: () => {
        // ANTI-TRUNCATION: Chrome's Web Speech API terminates unexpectedly after pauses or 8-10 seconds.
        // If the user hasn't explicitly stopped recording or sent the message, seamlessly restart!
        if (isRecordingIntentRef.current) {
          try {
            recognizerRef.current?.start();
          } catch (_) {}
        } else {
          setIsRecording(false);
        }
      },
    });

    if (recognizer) {
      // NOTE: For clean separation across conversation turns,
      // only adopt existing draft if user explicitly typed a non-empty draft
      const currentDraft = inputTextRef.current.trim();
      if (currentDraft) {
        recognizer.setBasePrefix(currentDraft);
        latestTranscriptRef.current = currentDraft;
      } else {
        latestTranscriptRef.current = '';
        recognizer.reset();
      }
      recognizerRef.current = recognizer;
      recognizer.start();
    }
  }, [clearSilenceTimers, scheduleSilenceAutoSend, stopRecording, updateInputText]);

  // Toggle speech recording
  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  // Send message
  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputTextRef.current || latestTranscriptRef.current).trim();
    if (!text || isLoading) return;

    stopSpeaking();
    stopRecording();
    clearSilenceTimers();

    // CRITICAL FIX: Immediately abort recognizer, clear input, and clear transcripts
    // so no words from this turn can bleed into the next turn!
    if (recognizerRef.current) {
      recognizerRef.current.abort();
      recognizerRef.current.reset();
    }
    latestTranscriptRef.current = '';
    updateInputText('');

    const userMsg: VoiceMessage = {
      id: `user_${Date.now()}`,
      sender: 'user',
      text,
      timestamp: Date.now(),
    };

    // Prior history is current `messages` (excluding userMsg which is sent separately as userMessage)
    const priorHistory = [...messages];
    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setIsLoading(true);

    try {
      const vocabList = savedWords.map((w) => w.word);
      let data: any = null;
      let lastErr: any = null;

      // Resilient retry: attempt up to 2 times
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          const res = await fetch('/api/gemini/voice-dialogue', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              scenario: selectedScenario.title,
              scenarioDetails: selectedScenario.description,
              history: priorHistory.slice(-8), // Send up to 8 prior turns so the dialogue context is preserved and influences the next reply
              userMessage: text,
              targetVocabWords: vocabList.slice(0, 5),
            }),
          });

          if (res.ok) {
            data = await res.json();
            break;
          } else {
            lastErr = new Error(`Server returned ${res.status}`);
          }
        } catch (fetchErr) {
          lastErr = fetchErr;
        }

        if (attempt < 2) {
          await new Promise((r) => setTimeout(r, 400));
        }
      }

      if (!data) {
        throw lastErr || new Error('連線暫時不穩');
      }

      const aiMsg: VoiceMessage = {
        id: `ai_${Date.now()}`,
        sender: 'ai',
        text: data.reply,
        translationZh: data.translationZh,
        timestamp: Date.now(),
        coaching: data.coaching,
        suggestedFollowUps: data.suggestedFollowUps,
      };

      setMessages((prev) => [...prev, aiMsg]);

      // If user naturally spoke any target vocabulary words, update speaking practice status!
      const lowerText = text.toLowerCase();
      vocabList.forEach((vWord) => {
        if (lowerText.includes(vWord.toLowerCase())) {
          recordWordPracticeResult(vWord, 'speaking', true);
        }
      });

      // Play audio response automatically if enabled
      if (autoSpeakRef.current) {
        speakText(aiMsg.text, {
          rate: speechRateRef.current,
          onEnd: () => {
            // If hands-free continuous dialogue is enabled, auto-start mic after AI finishes talking!
            if (handsFreeModeRef.current) {
              setTimeout(() => {
                // Ensure buffers are completely clean before starting next turn
                latestTranscriptRef.current = '';
                updateInputText('');
                startRecording();
              }, 400);
            }
          },
        });
      }
    } catch (err: any) {
      console.error('Voice dialogue error:', err);
      const errorMsg: VoiceMessage = {
        id: `ai_${Date.now()}`,
        sender: 'ai',
        text: "I'm having a little trouble connecting right now, but please try saying that again!",
        translationZh: '連線暫時不穩，您可以點擊下方按鈕直接重試！',
        timestamp: Date.now(),
        retryText: text,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  // Bind ref for async callbacks
  handleSendMessageRef.current = handleSendMessage;

  // Storage helper to retain conversation across tab switches & reloads
  const getScenarioStorageKey = useCallback(
    (scId: string) => `linguacraft_voice_chat_v2_${scId}`,
    []
  );

  // Load conversation memory or create initial prompt
  const getOrInitScenarioMessages = useCallback((scenario: RoleplayScenario): VoiceMessage[] => {
    try {
      const stored = localStorage.getItem(`linguacraft_voice_chat_v2_${scenario.id}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (_) {}

    return [
      {
        id: `ai_${Date.now()}`,
        sender: 'ai',
        text: scenario.startingPrompt,
        translationZh:
          scenario.id === 'opinions-debate'
            ? '嗨！我一直在思考人工智慧與科技如何改變我們的日常作息。從你的角度來看，你最近有哪一項生活習慣產生了顯著的改變？'
            : scenario.id === 'daily-cafe'
            ? '哈囉！歡迎光臨。很高興見到你。今天要點平常常喝的咖啡，還是想要隨興嘗試點不一樣的呢？'
            : '讓我們開始今天的對話吧！',
        timestamp: Date.now(),
        suggestedFollowUps: [
          'From my perspective, I rely much more on digital tools nowadays.',
          'To be honest, it has made my daily schedule more flexible.',
        ],
      },
    ];
  }, []);

  // Save current conversation history whenever messages update
  useEffect(() => {
    if (messages.length > 0) {
      try {
        localStorage.setItem(
          getScenarioStorageKey(selectedScenario.id),
          JSON.stringify(messages.slice(-30))
        );
      } catch (_) {}
    }
  }, [messages, selectedScenario.id, getScenarioStorageKey]);

  // Reset conversation to a clean, fresh state (clears retained memory for this scenario)
  const handleResetConversation = useCallback(() => {
    stopSpeaking();
    stopRecording();
    clearSilenceTimers();

    if (recognizerRef.current) {
      recognizerRef.current.abort();
      recognizerRef.current.reset();
    }
    latestTranscriptRef.current = '';
    updateInputText('');

    try {
      localStorage.removeItem(getScenarioStorageKey(selectedScenario.id));
    } catch (_) {}

    const initialMsg: VoiceMessage = {
      id: `ai_${Date.now()}`,
      sender: 'ai',
      text: selectedScenario.startingPrompt,
      translationZh:
        selectedScenario.id === 'opinions-debate'
          ? '嗨！我一直在思考人工智慧與科技如何改變我們的日常作息。從你的角度來看，你最近有哪一項生活習慣產生了顯著的改變？'
          : selectedScenario.id === 'daily-cafe'
          ? '哈囉！歡迎光臨。很高興見到你。今天要點平常常喝的咖啡，還是想要隨興嘗試點不一樣的呢？'
          : '讓我們開始今天的對話吧！',
      timestamp: Date.now(),
      suggestedFollowUps: [
        'From my perspective, I rely much more on digital tools nowadays.',
        'To be honest, it has made my daily schedule more flexible.',
      ],
    };

    setMessages([initialMsg]);
    if (autoSpeakRef.current) {
      speakText(initialMsg.text, {
        rate: speechRateRef.current,
        onEnd: () => {
          if (handsFreeModeRef.current) {
            setTimeout(() => {
              latestTranscriptRef.current = '';
              updateInputText('');
              startRecording();
            }, 500);
          }
        },
      });
    }
  }, [selectedScenario, stopRecording, clearSilenceTimers, updateInputText, startRecording, getScenarioStorageKey]);

  // Retain conversation when switching scenarios or mounting
  useEffect(() => {
    const loaded = getOrInitScenarioMessages(selectedScenario);
    setMessages(loaded);

    return () => {
      stopSpeaking();
      stopRecording();
      clearSilenceTimers();
      if (recognizerRef.current) {
        recognizerRef.current.abort();
        recognizerRef.current.reset();
      }
      latestTranscriptRef.current = '';
      updateInputText('');
    };
  }, [selectedScenario.id, getOrInitScenarioMessages, stopRecording, clearSilenceTimers, updateInputText]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left Column: Scenarios & Voice Controls */}
      <div className="lg:col-span-4 space-y-4">
        {/* Scenario Picker */}
        <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-stone-900">對話情境選擇</h3>
            <span className="text-[11px] font-medium text-stone-500">
              {DEFAULT_SCENARIOS.length} 種模式
            </span>
          </div>

          <div className="space-y-2">
            {DEFAULT_SCENARIOS.map((sc) => (
              <button
                key={sc.id}
                onClick={() => setSelectedScenario(sc)}
                className={`w-full text-left p-3 rounded-xl border text-xs transition cursor-pointer ${
                  selectedScenario.id === sc.id
                    ? 'border-stone-900 bg-stone-900 text-white'
                    : 'border-stone-200 bg-stone-50 text-stone-700 hover:border-stone-300'
                }`}
              >
                <div className="font-semibold">{sc.title}</div>
                <div className={`text-[11px] mt-1 line-clamp-2 ${selectedScenario.id === sc.id ? 'text-stone-300' : 'text-stone-500'}`}>
                  {sc.description}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Audio & Silence Detection settings */}
        <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-stone-900">語音與自動送出設定</h3>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              免按送出
            </span>
          </div>

          {/* Auto-send on silence toggle */}
          <div className="space-y-2 pt-1 border-t border-stone-100">
            <div className="flex items-center justify-between text-xs text-stone-800 font-medium">
              <div>
                <span>自動偵測停頓送出</span>
                <p className="text-[11px] text-stone-400 font-normal">說完話靜音自動發送，不需手動按送出</p>
              </div>
              <button
                type="button"
                onClick={() => setAutoSendOnSilence(!autoSendOnSilence)}
                className={`w-10 h-6 flex items-center rounded-full p-1 transition cursor-pointer ${
                  autoSendOnSilence ? 'bg-stone-900 justify-end' : 'bg-stone-200 justify-start'
                }`}
              >
                <span className="bg-white w-4 h-4 rounded-full shadow-xs"></span>
              </button>
            </div>

            {/* Silence pause threshold */}
            {autoSendOnSilence && (
              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between text-xs text-stone-600">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-stone-400" />
                    停頓偵測時間 (Pause Duration)
                  </span>
                  <span className="font-mono font-semibold text-stone-900">{silenceDelaySec} 秒</span>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { sec: 1.5, label: '1.5s 敏捷' },
                    { sec: 2.0, label: '2.0s 標準' },
                    { sec: 2.8, label: '2.8s 充裕' },
                  ].map(({ sec, label }) => (
                    <button
                      key={sec}
                      type="button"
                      onClick={() => setSilenceDelaySec(sec)}
                      className={`py-1.5 rounded-lg border text-xs font-medium cursor-pointer transition ${
                        silenceDelaySec === sec
                          ? 'border-stone-900 bg-stone-900 text-white'
                          : 'border-stone-200 bg-stone-50 text-stone-600 hover:bg-stone-100'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Hands-free continuous dialogue toggle */}
          <div className="flex items-center justify-between text-xs text-stone-800 font-medium pt-2 border-t border-stone-100">
            <div>
              <span className="flex items-center gap-1">
                <Radio className="w-3.5 h-3.5 text-rose-500" />
                免動手連續對話 (Hands-free Mode)
              </span>
              <p className="text-[11px] text-stone-400 font-normal">AI 回答完後自動重啟麥克風聆聽</p>
            </div>
            <button
              type="button"
              onClick={() => setHandsFreeMode(!handsFreeMode)}
              className={`w-10 h-6 flex items-center rounded-full p-1 transition cursor-pointer ${
                handsFreeMode ? 'bg-rose-500 justify-end' : 'bg-stone-200 justify-start'
              }`}
            >
              <span className="bg-white w-4 h-4 rounded-full shadow-xs"></span>
            </button>
          </div>

          {/* AI Auto Speak */}
          <div className="flex items-center justify-between text-xs text-stone-700 pt-2 border-t border-stone-100">
            <span>AI 自動語音朗讀 (Auto Speak)</span>
            <button
              onClick={() => setAutoSpeak(!autoSpeak)}
              className={`p-1.5 rounded-lg transition cursor-pointer ${
                autoSpeak ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-100 text-stone-400'
              }`}
            >
              {autoSpeak ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
          </div>

          {/* Show translation */}
          <div className="flex items-center justify-between text-xs text-stone-700">
            <span>顯示中文對照翻譯</span>
            <button
              onClick={() => setShowTranslations(!showTranslations)}
              className={`p-1.5 rounded-lg transition cursor-pointer ${
                showTranslations ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-400'
              }`}
            >
              <Languages className="w-4 h-4" />
            </button>
          </div>

          {/* Speech Rate */}
          <div className="space-y-1 text-xs text-stone-700 pt-1 border-t border-stone-100">
            <div className="flex justify-between">
              <span>AI 語速 (Speech Rate)</span>
              <span className="font-mono font-medium">{speechRate}x</span>
            </div>
            <div className="flex gap-2">
              {[0.8, 1.0, 1.2].map((rate) => (
                <button
                  key={rate}
                  onClick={() => setSpeechRate(rate)}
                  className={`flex-1 py-1 rounded-lg border text-xs font-medium cursor-pointer ${
                    speechRate === rate
                      ? 'border-stone-900 bg-stone-900 text-white'
                      : 'border-stone-200 bg-stone-50 text-stone-600 hover:bg-stone-100'
                  }`}
                >
                  {rate}x
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Chat Box & Voice Interaction */}
      <div className="lg:col-span-8 flex flex-col bg-white rounded-2xl border border-stone-200 shadow-xs h-[680px] overflow-hidden">
        {/* Chat header */}
        <div className="p-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
          <div className="flex items-center gap-2.5">
            <span className={`w-3 h-3 rounded-full ${isRecording ? 'bg-rose-500 animate-ping' : 'bg-emerald-500'}`}></span>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-stone-900">{selectedScenario.aiPersona}</h4>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
                  會話記憶保留中
                </span>
                {handsFreeMode && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 font-medium">
                    連續對話中
                  </span>
                )}
              </div>
              <p className="text-[11px] text-stone-500">{selectedScenario.title}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleResetConversation}
              title="清空紀錄並開啟全新話題"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-xs font-semibold text-stone-700 shadow-2xs transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-stone-500" />
              重新開始新對話
            </button>
          </div>
        </div>

        {/* Messages Stream */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl p-4 shadow-2xs space-y-1.5 ${
                  msg.sender === 'user'
                    ? 'bg-stone-900 text-white rounded-br-xs'
                    : 'bg-stone-50 text-stone-900 border border-stone-200/80 rounded-bl-xs'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm leading-relaxed">{msg.text}</p>
                  <button
                    onClick={() => speakText(msg.text, { rate: speechRate })}
                    className={`shrink-0 p-1 rounded-md transition cursor-pointer ${
                      msg.sender === 'user'
                        ? 'text-stone-300 hover:text-white hover:bg-stone-800'
                        : 'text-stone-400 hover:text-stone-800 hover:bg-stone-200'
                    }`}
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {showTranslations && msg.translationZh && (
                  <p className={`text-xs pt-1 border-t ${
                    msg.sender === 'user' ? 'border-stone-800 text-stone-400' : 'border-stone-200/60 text-stone-500'
                  }`}>
                    {msg.translationZh}
                  </p>
                )}

                {msg.retryText && (
                  <div className="pt-2 border-t border-rose-100 flex items-center justify-between gap-2">
                    <span className="text-[11px] text-rose-600 font-medium">連線已自動準備就緒</span>
                    <button
                      onClick={() => handleSendMessage(msg.retryText)}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      點擊重試送出
                    </button>
                  </div>
                )}
              </div>

              {/* Coaching Card for User's spoken speech */}
              {msg.coaching && (
                <div className="w-full max-w-[85%] mt-2 p-3.5 rounded-xl bg-amber-50/80 border border-amber-200/80 text-xs space-y-2">
                  <div className="flex items-center gap-1.5 text-amber-900 font-semibold">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    即時口說教練反饋 (Real-time Speech Coaching)
                  </div>

                  {msg.coaching.grammarCorrection && (
                    <div className="space-y-0.5">
                      <span className="font-semibold text-amber-950">語法建議：</span>
                      <div className="text-amber-900 font-medium">{msg.coaching.grammarCorrection}</div>
                      {msg.coaching.grammarRuleZh && (
                        <div className="text-stone-600">{msg.coaching.grammarRuleZh}</div>
                      )}
                    </div>
                  )}

                  {msg.coaching.nativeAlternative && (
                    <div className="space-y-0.5 pt-1.5 border-t border-amber-200/60">
                      <span className="font-semibold text-amber-950">母語者更自然的說法：</span>
                      <div className="flex items-center justify-between text-amber-900 font-medium">
                        <span>"{msg.coaching.nativeAlternative}"</span>
                        <button
                          onClick={() => speakText(msg.coaching?.nativeAlternative || '', { rate: speechRate })}
                          className="p-1 hover:text-amber-950 cursor-pointer"
                        >
                          <Volume2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  )}

                  {msg.coaching.pronunciationTrickyWords && msg.coaching.pronunciationTrickyWords.length > 0 && (
                    <div className="pt-1.5 border-t border-amber-200/60 flex items-center gap-2">
                      <span className="font-semibold text-amber-950">注意發音細節：</span>
                      <div className="flex gap-1.5 flex-wrap">
                        {msg.coaching.pronunciationTrickyWords.map((word, i) => (
                          <button
                            key={i}
                            onClick={() => speakText(word)}
                            className="px-2 py-0.5 rounded-md bg-white text-stone-800 border border-amber-200 font-mono hover:bg-amber-100 transition cursor-pointer"
                          >
                            {word} 🔊
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Follow-up suggestions */}
              {msg.suggestedFollowUps && msg.suggestedFollowUps.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5 max-w-[85%]">
                  {msg.suggestedFollowUps.map((suggested, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(suggested)}
                      className="text-left text-xs px-2.5 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-medium transition cursor-pointer flex items-center gap-1"
                    >
                      <Lightbulb className="w-3 h-3 text-amber-500 shrink-0" />
                      <span>{suggested}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-2 text-xs text-stone-500 italic p-3 bg-stone-50 rounded-xl max-w-xs">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-stone-700" />
              Emma 正在用心聆聽並準備回應...
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar with Real-time Microphone, Silence Detection & Waveform */}
        <div className="p-4 border-t border-stone-200 bg-white space-y-2">
          {/* Active Silence Countdown Banner */}
          {isRecording && silenceCountdown !== null && (
            <div className="flex items-center justify-between px-3.5 py-2 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 animate-in fade-in duration-200">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600"></span>
                </span>
                <span className="font-semibold">
                  偵測到停頓，將在 <span className="font-mono text-emerald-800 font-bold">{silenceCountdown}s</span> 後自動送出...
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    clearSilenceTimers();
                    handleSendMessage();
                  }}
                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium text-[11px] transition cursor-pointer"
                >
                  立即送出
                </button>
                <button
                  type="button"
                  onClick={() => {
                    clearSilenceTimers();
                  }}
                  className="px-2.5 py-1 bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg font-medium text-[11px] transition cursor-pointer"
                >
                  繼續說
                </button>
              </div>
            </div>
          )}

          {/* Recording Status & Audio Visualizer */}
          {isRecording && silenceCountdown === null && (
            <div className="flex items-center justify-between px-3.5 py-2 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>
                <span className="font-semibold">正在聆聽您的英文發音（支援長句連續對話，不截斷）</span>
              </div>

              {/* Dynamic Audio Waveform */}
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((bar) => {
                  const height = Math.max(4, Math.min(18, (audioLevel / 100) * 18 * (bar % 2 === 0 ? 1.2 : 0.8)));
                  return (
                    <span
                      key={bar}
                      style={{ height: `${height}px` }}
                      className="w-1 bg-rose-500 rounded-full transition-all duration-75"
                    ></span>
                  );
                })}
                <span className="text-[10px] text-rose-600 ml-1 font-mono">
                  {autoSendOnSilence ? '停頓自動送出' : '點擊麥克風停止'}
                </span>
              </div>
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            {/* Mic Toggle Button */}
            <button
              type="button"
              onClick={toggleRecording}
              className={`p-3 rounded-xl transition cursor-pointer shadow-xs flex items-center justify-center shrink-0 ${
                isRecording
                  ? 'bg-rose-500 text-white shadow-rose-200 animate-pulse'
                  : 'bg-stone-100 hover:bg-stone-200 text-stone-800'
              }`}
              title={isRecording ? '點擊結束錄音' : '開啟即時語音對話'}
            >
              {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            {/* Text input */}
            <input
              id="input-voice-chat-text"
              type="text"
              value={inputText}
              onChange={(e) => {
                updateInputText(e.target.value);
                latestTranscriptRef.current = e.target.value;
              }}
              placeholder={
                isRecording
                  ? '正在識別語音中，請直接開口...（說完停頓會自動送出）'
                  : '開口說英文或在此鍵入您的想法...'
              }
              className="flex-1 px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-sm text-stone-900 placeholder:text-stone-400 focus:outline-hidden focus:border-stone-400 focus:bg-white transition"
            />

            {/* Send Button */}
            <button
              type="submit"
              disabled={isLoading || !inputText.trim()}
              className="p-3 bg-stone-900 text-white rounded-xl hover:bg-stone-800 disabled:opacity-50 transition cursor-pointer shadow-xs shrink-0"
              title="送出"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

