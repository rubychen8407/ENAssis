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
  SlidersHorizontal,
  MessageSquare,
  Dice5,
  ChevronRight,
  PartyPopper,
} from 'lucide-react';
import { VoiceMessage, VocabWord, RoleplayScenario } from '../types';
import { GeneralSettings } from '../types/ielts';
import { getGeneralSettings, DEFAULT_SPEAKING_SETTINGS } from '../utils/ielts';
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
import { SpeakingToolbar } from './SpeakingToolbar';
import { SpeakingScenarioModal, SPEAKING_SCENARIOS } from './SpeakingScenarioModal';

interface Props {
  savedWords: VocabWord[];
  prefilledWord?: VocabWord | null;
  settings?: GeneralSettings;
  onOpenSettings?: () => void;
}

// Pool of instant creative conversational icebreakers to guarantee variety without delay
const DIVERSE_OPENERS = [
  {
    category: 'Daily Life',
    text: "Hey there! It's so great to practice with you today. How has your week been going so far? Anything fun or unexpected happen?",
    translationZh: "哈囉！很高興今天能和你聊天。這週過得怎麼樣呢？有發生什麼有趣或意想不到的事嗎？",
    suggestedFollowUps: [
      "It's been pretty busy with work, but going well!",
      "Actually, I tried something new and exciting yesterday.",
    ],
  },
  {
    category: 'Daily Life',
    text: "Hi! Welcome in. I was just thinking about how our morning routines set the tone for the entire day. What's the very first thing you like to do after waking up?",
    translationZh: "嗨，歡迎！我剛才在想晨間作息如何影響一整天的心情。你起床後最喜歡做的第一件事是什麼？",
    suggestedFollowUps: [
      "I always start with a fresh cup of coffee and quiet reading.",
      "Honestly, I check my phone and stretch for a few minutes.",
    ],
  },
  {
    category: 'Travel & Culture',
    text: "Hello! If you could hop on a plane right this moment and travel anywhere in the world, where would you go first and why?",
    translationZh: "哈囉！如果你現在就能立刻搭上飛機前往世界上任何一個地方，你最想去哪裡？為什麼呢？",
    suggestedFollowUps: [
      "I'd love to visit Kyoto to experience traditional tea culture.",
      "I've always dreamed of road-tripping across Iceland's nature.",
    ],
  },
  {
    category: 'Philosophy & Tech',
    text: "Hi there! I've been reading about how AI tools are reshaping how people work and learn. From your perspective, how has technology changed your daily productivity recently?",
    translationZh: "嗨！我最近在讀關於 AI 工具如何重塑人們工作與學習方式的文章。從你的角度來看，科技最近如何改變了你的日常效率？",
    suggestedFollowUps: [
      "It has definitely saved me time on routine tasks.",
      "I find it helpful, though I try not to over-rely on it.",
    ],
  },
  {
    category: 'IELTS Speaking',
    text: "Good day! Let's do some engaging spoken practice. Tell me a little bit about your hometown or the neighborhood where you currently live — what makes it special to you?",
    translationZh: "你好！讓我們開始今天的口說練習吧。能跟我聊聊你的家鄉或目前居住的社區嗎？有什麼特別吸引你的地方？",
    suggestedFollowUps: [
      "My hometown is known for its friendly community and great food.",
      "I live in a bustling city center where everything is convenient.",
    ],
  },
  {
    category: 'Career',
    text: "Hello! When you reflect on your professional journey so far, what is one challenge you faced that taught you the most valuable lesson?",
    translationZh: "哈囉！回顧你至今的職涯歷程，哪一個挑戰帶給你最深刻寶貴的收穫？",
    suggestedFollowUps: [
      "Leading a fast-paced project under a tight deadline.",
      "Learning to communicate effectively across diverse teams.",
    ],
  },
];

export const VoiceDialogue: React.FC<Props> = ({ savedWords, prefilledWord, settings, onOpenSettings }) => {
  const [selectedScenario, setSelectedScenario] = useState<RoleplayScenario>(SPEAKING_SCENARIOS[0]);
  const [isScenarioModalOpen, setIsScenarioModalOpen] = useState(false);
  const [messages, setMessages] = useState<VoiceMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const inputTextRef = useRef<string>('');

  const updateInputText = useCallback((val: string) => {
    inputTextRef.current = val;
    setInputText(val);
  }, []);

  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingStarter, setIsGeneratingStarter] = useState(false);

  // Initialize speaking settings from GeneralSettings
  const initialSpeakingSettings = settings?.speakingSettings || getGeneralSettings().speakingSettings || DEFAULT_SPEAKING_SETTINGS;
  const [autoSpeak, setAutoSpeak] = useState(initialSpeakingSettings.autoSpeak);
  const [speechRate, setSpeechRate] = useState<number>(initialSpeakingSettings.speechRate);
  const [showTranslations, setShowTranslations] = useState<boolean>(initialSpeakingSettings.showTranslations);

  // Auto-send on silence configuration
  const [autoSendOnSilence, setAutoSendOnSilence] = useState<boolean>(initialSpeakingSettings.autoSendOnSilence);
  const [silenceDelaySec, setSilenceDelaySec] = useState<number>(initialSpeakingSettings.silenceDelaySec);
  const [handsFreeMode, setHandsFreeMode] = useState<boolean>(initialSpeakingSettings.handsFreeMode);
  const [silenceCountdown, setSilenceCountdown] = useState<number | null>(null);
  const [audioLevel, setAudioLevel] = useState<number>(0);

  // Synchronize state when settings prop updates
  useEffect(() => {
    if (settings?.speakingSettings) {
      setAutoSpeak(settings.speakingSettings.autoSpeak);
      setSpeechRate(settings.speakingSettings.speechRate);
      setShowTranslations(settings.speakingSettings.showTranslations);
      setAutoSendOnSilence(settings.speakingSettings.autoSendOnSilence);
      setSilenceDelaySec(settings.speakingSettings.silenceDelaySec);
      setHandsFreeMode(settings.speakingSettings.handsFreeMode);
    }
  }, [settings?.speakingSettings]);

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

  // Safe ref for handleSendMessage
  const handleSendMessageRef = useRef<(textToSend?: string) => Promise<void>>(async () => {});

  // Stop recording cleanly
  const stopRecording = useCallback(() => {
    isRecordingIntentRef.current = false;
    clearSilenceTimers();

    if (recognizerRef.current) {
      try {
        recognizerRef.current.stop();
      } catch (_) {}
      recognizerRef.current = null;
    }

    if (audioMeterRef.current) {
      try {
        audioMeterRef.current.stop();
      } catch (_) {}
      audioMeterRef.current = null;
    }

    setIsRecording(false);
    setAudioLevel(0);
  }, [clearSilenceTimers]);

  // Schedule auto-send when silence is detected
  const scheduleSilenceAutoSend = useCallback(
    (transcriptCandidate?: string) => {
      if (!autoSendOnSilenceRef.current || !isRecordingIntentRef.current) return;

      const currentText = (transcriptCandidate || latestTranscriptRef.current || inputTextRef.current).trim();
      if (!currentText || currentText.length === 0) return;

      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
        silenceTimeoutRef.current = null;
      }
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }

      const totalDelayMs = Math.max(1200, Math.min(4000, (silenceDelaySecRef.current || 2.0) * 1000));
      const startTime = Date.now();
      const endTime = startTime + totalDelayMs;

      setSilenceCountdown(parseFloat((totalDelayMs / 1000).toFixed(1)));

      countdownIntervalRef.current = setInterval(() => {
        const remaining = Math.max(0, endTime - Date.now());
        const secondsLeft = parseFloat((remaining / 1000).toFixed(1));
        setSilenceCountdown(secondsLeft);
        if (remaining <= 50) {
          clearInterval(countdownIntervalRef.current);
          countdownIntervalRef.current = null;
        }
      }, 100);

      silenceTimeoutRef.current = setTimeout(() => {
        clearSilenceTimers();
        const finalText = (latestTranscriptRef.current || inputTextRef.current).trim();
        if (finalText.length > 0 && isRecordingIntentRef.current) {
          handleSendMessageRef.current(finalText);
        }
      }, totalDelayMs);
    },
    [clearSilenceTimers]
  );

  // Start speech recording
  const startRecording = useCallback(() => {
    if (!isSpeechRecognitionSupported()) {
      alert('您的瀏覽器尚未支援即時語音識別，請使用最新版 Chrome、Edge 或 Safari，或直接打字輸入。');
      return;
    }

    stopSpeaking();
    clearSilenceTimers();

    if (recognizerRef.current) {
      try {
        recognizerRef.current.abort();
      } catch (_) {}
      recognizerRef.current = null;
    }
    if (audioMeterRef.current) {
      try {
        audioMeterRef.current.stop();
      } catch (_) {}
      audioMeterRef.current = null;
    }

    isRecordingIntentRef.current = true;
    setIsRecording(true);

    const meter = createAudioLevelMeter();
    meter.start((level) => {
      setAudioLevel(level);
      if (level > 18 && latestTranscriptRef.current.trim().length > 0) {
        if (silenceTimeoutRef.current) {
          scheduleSilenceAutoSend(latestTranscriptRef.current);
        }
      }
    });
    audioMeterRef.current = meter;

    const recognizer = createSpeechRecognizer({
      onResult: (fullTranscript) => {
        if (!isRecordingIntentRef.current) return;
        latestTranscriptRef.current = fullTranscript;
        updateInputText(fullTranscript);

        if (fullTranscript.trim().length > 0) {
          scheduleSilenceAutoSend(fullTranscript);
        }
      },
      onError: (err) => {
        console.warn('Speech recognition error event:', err);
        if (err === 'not-allowed' || err === 'service-not-allowed') {
          stopRecording();
        }
      },
      onEnd: () => {
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

    const priorHistory = [...messages];
    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setIsLoading(true);

    try {
      const vocabList = savedWords.map((w) => w.word);
      let data: any = null;
      let lastErr: any = null;

      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          const res = await fetch('/api/gemini/voice-dialogue', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              scenario: selectedScenario.title,
              scenarioDetails: selectedScenario.description,
              history: priorHistory.slice(-8),
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
            if (handsFreeModeRef.current) {
              setTimeout(() => {
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

  handleSendMessageRef.current = handleSendMessage;

  const getScenarioStorageKey = useCallback(
    (scId: string) => `linguacraft_voice_chat_v3_${scId}`,
    []
  );

  // Generate dynamic, fresh conversational opener (ElevenLabs-style)
  const generateDynamicStarter = useCallback(
    async (scenario: RoleplayScenario, customTopic?: string) => {
      setIsGeneratingStarter(true);
      stopSpeaking();
      stopRecording();
      clearSilenceTimers();

      try {
        const vocabList = savedWords.map((w) => w.word);
        const res = await fetch('/api/gemini/voice-dialogue-starter', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            scenario: scenario.id,
            scenarioTitle: scenario.title,
            scenarioDetails: scenario.description,
            customTopic,
            targetVocabWords: vocabList.slice(0, 5),
          }),
        });

        if (res.ok) {
          const starterData = await res.json();
          const initialMsg: VoiceMessage = {
            id: `ai_${Date.now()}`,
            sender: 'ai',
            text: starterData.starter,
            translationZh: starterData.translationZh,
            timestamp: Date.now(),
            suggestedFollowUps: starterData.suggestedFollowUps || [],
          };

          setMessages([initialMsg]);

          try {
            localStorage.setItem(
              getScenarioStorageKey(scenario.id),
              JSON.stringify([initialMsg])
            );
          } catch (_) {}

          if (autoSpeakRef.current) {
            speakText(initialMsg.text, {
              rate: speechRateRef.current,
              onEnd: () => {
                if (handsFreeModeRef.current) {
                  setTimeout(() => {
                    latestTranscriptRef.current = '';
                    updateInputText('');
                    startRecording();
                  }, 400);
                }
              },
            });
          }
          return;
        }
      } catch (e) {
        console.warn('Failed to fetch dynamic starter from API, using dynamic pool fallback:', e);
      } finally {
        setIsGeneratingStarter(false);
      }

      // Dynamic pool fallback
      const matchingOpeners = DIVERSE_OPENERS.filter((o) => o.category === scenario.category);
      const pool = matchingOpeners.length > 0 ? matchingOpeners : DIVERSE_OPENERS;
      const picked = pool[Math.floor(Math.random() * pool.length)];

      const fallbackMsg: VoiceMessage = {
        id: `ai_${Date.now()}`,
        sender: 'ai',
        text: picked.text,
        translationZh: picked.translationZh,
        timestamp: Date.now(),
        suggestedFollowUps: picked.suggestedFollowUps,
      };

      setMessages([fallbackMsg]);
      try {
        localStorage.setItem(
          getScenarioStorageKey(scenario.id),
          JSON.stringify([fallbackMsg])
        );
      } catch (_) {}

      if (autoSpeakRef.current) {
        speakText(fallbackMsg.text, {
          rate: speechRateRef.current,
          onEnd: () => {
            if (handsFreeModeRef.current) {
              setTimeout(() => {
                latestTranscriptRef.current = '';
                updateInputText('');
                startRecording();
              }, 400);
            }
          },
        });
      }
    },
    [getScenarioStorageKey, savedWords, clearSilenceTimers, startRecording, stopRecording, updateInputText]
  );

  // Surprise new topic generator
  const handleSurpriseTopic = useCallback(() => {
    const randomScenarios = SPEAKING_SCENARIOS.filter((s) => s.id !== selectedScenario.id);
    const surpriseScenario = randomScenarios[Math.floor(Math.random() * randomScenarios.length)] || SPEAKING_SCENARIOS[0];
    setSelectedScenario(surpriseScenario);
    generateDynamicStarter(surpriseScenario);
  }, [selectedScenario.id, generateDynamicStarter]);

  // Reset conversation for current scenario
  const handleResetConversation = useCallback(() => {
    try {
      localStorage.removeItem(getScenarioStorageKey(selectedScenario.id));
    } catch (_) {}
    generateDynamicStarter(selectedScenario);
  }, [selectedScenario, getScenarioStorageKey, generateDynamicStarter]);

  // Handle scenario selection from modal
  const handleSelectScenario = useCallback(
    (scenario: RoleplayScenario, customTopic?: string) => {
      setSelectedScenario(scenario);
      // Check if past conversation exists
      try {
        const stored = localStorage.getItem(getScenarioStorageKey(scenario.id));
        if (stored && !customTopic) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setMessages(parsed);
            return;
          }
        }
      } catch (_) {}

      // If no past conversation or custom topic, generate dynamic starter!
      generateDynamicStarter(scenario, customTopic);
    },
    [getScenarioStorageKey, generateDynamicStarter]
  );

  // Initialize on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(getScenarioStorageKey(selectedScenario.id));
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
          return;
        }
      }
    } catch (_) {}

    generateDynamicStarter(selectedScenario);

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
  }, []);

  // Save history
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

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="max-w-4xl mx-auto w-full flex flex-col h-[calc(100vh-140px)] min-h-[580px] animate-in fade-in duration-200">
      {/* Speaking Chat Container */}
      <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm flex flex-col flex-1 overflow-hidden relative">
        {/* Top Header Bar */}
        <div className="px-5 py-3.5 border-b border-stone-100 dark:border-stone-800 bg-stone-50/80 dark:bg-stone-900/80 backdrop-blur-xs flex items-center justify-between gap-3">
          {/* AI Partner Profile & Scenario Chip */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-500 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                E
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-stone-900" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-stone-900 dark:text-stone-100 truncate">
                  Emma (AI 口說教練)
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 shrink-0">
                  即時語音對話
                </span>
              </div>

              {/* Clickable Scenario Switcher Chip */}
              <button
                type="button"
                onClick={() => setIsScenarioModalOpen(true)}
                className="text-xs text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white flex items-center gap-1 transition cursor-pointer group truncate mt-0.5"
                title="點擊切換話題情境"
              >
                <span className="font-medium truncate max-w-[240px] md:max-w-[340px]">
                  {selectedScenario.title}
                </span>
                <ChevronRight className="w-3 h-3 text-stone-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
              </button>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Surprise / Change Topic */}
            <button
              type="button"
              onClick={handleSurpriseTopic}
              disabled={isGeneratingStarter}
              className="px-2.5 py-1.5 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 text-xs font-medium flex items-center gap-1.5 transition cursor-pointer active:scale-95"
              title="隨機換個全新話題"
            >
              <Dice5 className="w-3.5 h-3.5 text-rose-500" />
              <span className="hidden sm:inline">換個話題</span>
            </button>

            {/* Translation Toggle */}
            <button
              type="button"
              onClick={() => setShowTranslations(!showTranslations)}
              className={`p-2 rounded-xl transition cursor-pointer ${
                showTranslations
                  ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700'
              }`}
              title={showTranslations ? '已開啟中文翻譯對照' : '點擊開啟中文翻譯對照'}
            >
              <Languages className="w-4 h-4" />
            </button>

            {/* Auto Speak Toggle */}
            <button
              type="button"
              onClick={() => setAutoSpeak(!autoSpeak)}
              className={`p-2 rounded-xl transition cursor-pointer ${
                autoSpeak
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-400 hover:bg-stone-200'
              }`}
              title={autoSpeak ? '語音朗讀已開啟' : '語音朗讀已關閉'}
            >
              {autoSpeak ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Message Flow Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
          {isGeneratingStarter && (
            <div className="flex items-center justify-center p-6 text-xs text-stone-500 gap-2 animate-pulse">
              <Sparkles className="w-4 h-4 text-amber-500 animate-spin" />
              <span>Emma 正在為您構思今天專屬的生動對話開場...</span>
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'} animate-in fade-in duration-150`}
            >
              {/* Message Bubble */}
              <div
                className={`max-w-[85%] md:max-w-[80%] rounded-2xl p-4 shadow-xs text-sm leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-stone-900 text-white rounded-tr-xs'
                    : 'bg-stone-100 dark:bg-stone-800/80 text-stone-900 dark:text-stone-100 rounded-tl-xs border border-stone-200/60 dark:border-stone-700/60'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="font-normal">{msg.text}</div>
                  {msg.sender === 'ai' && (
                    <button
                      type="button"
                      onClick={() => speakText(msg.text, { rate: speechRate })}
                      className="p-1 text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 transition cursor-pointer shrink-0 mt-0.5"
                      title="重播語音"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Translation display */}
                {showTranslations && msg.translationZh && (
                  <div
                    className={`mt-2 pt-2 text-xs border-t leading-normal ${
                      msg.sender === 'user'
                        ? 'border-stone-800 text-stone-300'
                        : 'border-stone-200/70 dark:border-stone-700 text-stone-500 dark:text-stone-400'
                    }`}
                  >
                    {msg.translationZh}
                  </div>
                )}

                {/* Retry prompt if error */}
                {msg.retryText && (
                  <div className="mt-3">
                    <button
                      onClick={() => handleSendMessage(msg.retryText)}
                      className="px-3 py-1.5 bg-stone-900 text-white text-xs font-semibold rounded-lg hover:bg-stone-800 transition cursor-pointer flex items-center gap-1.5"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      點擊重試送出
                    </button>
                  </div>
                )}
              </div>

              {/* Real-time Coaching Card for User's spoken speech */}
              {msg.coaching && (
                <div className="w-full max-w-[85%] md:max-w-[80%] mt-2 p-3.5 rounded-2xl bg-amber-50/90 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/60 text-xs space-y-2">
                  <div className="flex items-center gap-1.5 text-amber-900 dark:text-amber-200 font-semibold">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    即時口說教練反饋 (Real-time Speech Coaching)
                  </div>

                  {msg.coaching.grammarCorrection && (
                    <div className="space-y-0.5">
                      <span className="font-semibold text-amber-950 dark:text-amber-100">語法建議：</span>
                      <div className="text-amber-900 dark:text-amber-200 font-medium">{msg.coaching.grammarCorrection}</div>
                      {msg.coaching.grammarRuleZh && (
                        <div className="text-stone-600 dark:text-stone-400">{msg.coaching.grammarRuleZh}</div>
                      )}
                    </div>
                  )}

                  {msg.coaching.nativeAlternative && (
                    <div className="space-y-0.5 pt-1.5 border-t border-amber-200/60 dark:border-amber-800/40">
                      <span className="font-semibold text-amber-950 dark:text-amber-100">母語者更自然的表達：</span>
                      <div className="flex items-center justify-between text-amber-900 dark:text-amber-200 font-medium">
                        <span>"{msg.coaching.nativeAlternative}"</span>
                        <button
                          onClick={() => speakText(msg.coaching?.nativeAlternative || '', { rate: speechRate })}
                          className="p-1 hover:text-amber-950 dark:hover:text-amber-100 cursor-pointer"
                        >
                          <Volume2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  )}

                  {msg.coaching.pronunciationTrickyWords && msg.coaching.pronunciationTrickyWords.length > 0 && (
                    <div className="pt-1.5 border-t border-amber-200/60 dark:border-amber-800/40 flex items-center gap-2">
                      <span className="font-semibold text-amber-950 dark:text-amber-100">注意發音：</span>
                      <div className="flex gap-1.5 flex-wrap">
                        {msg.coaching.pronunciationTrickyWords.map((word, i) => (
                          <button
                            key={i}
                            onClick={() => speakText(word)}
                            className="px-2 py-0.5 rounded-md bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-200 border border-amber-200 dark:border-amber-800 font-mono hover:bg-amber-100 transition cursor-pointer"
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
                <div className="mt-2 flex flex-wrap gap-1.5 max-w-[85%] md:max-w-[80%]">
                  {msg.suggestedFollowUps.map((suggested, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(suggested)}
                      className="text-left text-xs px-2.5 py-1.5 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 font-medium transition cursor-pointer flex items-center gap-1"
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
            <div className="flex items-center gap-2 text-xs text-stone-500 italic p-3 bg-stone-50 dark:bg-stone-800 rounded-xl max-w-xs">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-stone-700 dark:text-stone-300" />
              Emma 正在用心聆聽並準備回應...
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar with Real-time Microphone, Silence Detection & Audio Visualizer */}
        <div className="p-4 border-t border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 space-y-2">
          {/* Active Silence Countdown Banner */}
          {isRecording && silenceCountdown !== null && (
            <div className="flex items-center justify-between px-3.5 py-2 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-900 dark:text-emerald-200 animate-in fade-in duration-150">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600"></span>
                </span>
                <span className="font-semibold">
                  偵測到停頓，將在 <span className="font-mono text-emerald-800 dark:text-emerald-300 font-bold">{silenceCountdown}s</span> 後自動送出...
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
                  className="px-2.5 py-1 bg-white dark:bg-stone-800 hover:bg-emerald-100 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700 rounded-lg font-medium text-[11px] transition cursor-pointer"
                >
                  繼續說
                </button>
              </div>
            </div>
          )}

          {/* Recording Status & Audio Visualizer */}
          {isRecording && silenceCountdown === null && (
            <div className="flex items-center justify-between px-3.5 py-2 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-800 dark:text-rose-200">
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
                <span className="text-[10px] text-rose-600 dark:text-rose-400 ml-1 font-mono">
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
              className={`p-3 rounded-2xl transition cursor-pointer shadow-xs flex items-center justify-center shrink-0 ${
                isRecording
                  ? 'bg-rose-500 text-white shadow-rose-200 animate-pulse'
                  : 'bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200'
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
              className="flex-1 px-4 py-3 bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 rounded-2xl text-sm text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-hidden focus:border-stone-400 focus:bg-white transition"
            />

            {/* Send Button */}
            <button
              type="submit"
              disabled={isLoading || !inputText.trim()}
              className="p-3 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded-2xl hover:bg-stone-800 dark:hover:bg-white disabled:opacity-50 transition cursor-pointer shadow-xs shrink-0"
              title="送出"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>

      {/* Floating Bottom-Right Toolbar for Speaking */}
      <SpeakingToolbar
        onOpenScenarios={() => setIsScenarioModalOpen(true)}
        onSurpriseTopic={handleSurpriseTopic}
        onResetConversation={handleResetConversation}
        onOpenSettings={onOpenSettings}
        scenarioTitle={selectedScenario.title.split('(')[0].trim()}
      />

      {/* Scenario & Topic Selection Modal */}
      <SpeakingScenarioModal
        isOpen={isScenarioModalOpen}
        onClose={() => setIsScenarioModalOpen(false)}
        currentScenario={selectedScenario}
        onSelectScenario={handleSelectScenario}
        onSurpriseTopic={handleSurpriseTopic}
      />
    </div>
  );
};
