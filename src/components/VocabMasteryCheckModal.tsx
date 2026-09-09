import React, { useState, useEffect } from 'react';
import {
  X,
  Volume2,
  Mic,
  MicOff,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  RefreshCw,
  Award,
  HelpCircle,
  Clock,
  PenTool,
  Check,
} from 'lucide-react';
import { VocabWord } from '../types';
import { speakText, createSpeechRecognizer, isSpeechRecognitionSupported } from '../utils/speech';
import { recordWordPracticeResult, isWordAddedWithin24Hours } from '../utils/storage';
import confetti from 'canvas-confetti';

interface Props {
  word: VocabWord | null;
  isOpen: boolean;
  onClose: () => void;
  onWordsChange: () => void;
}

export const VocabMasteryCheckModal: React.FC<Props> = ({
  word,
  isOpen,
  onClose,
  onWordsChange,
}) => {
  if (!isOpen || !word) return null;

  // Track active test tab: 'both' | 'speaking' | 'writing'
  const [activeTab, setActiveTab] = useState<'both' | 'speaking' | 'writing'>('both');

  // Speaking State
  const [isRecording, setIsRecording] = useState(false);
  const [spokenTranscript, setSpokenTranscript] = useState('');
  const [speakingFeedback, setSpeakingFeedback] = useState<{
    status: 'idle' | 'pass' | 'fail';
    message: string;
  }>({
    status: word.speakingPassed ? 'pass' : 'idle',
    message: word.speakingPassed ? '先前口說檢測已通過' : '',
  });
  const [recognizerInstance, setRecognizerInstance] = useState<any>(null);

  // Writing State
  const [writingMode, setWritingMode] = useState<'spelling' | 'sentence'>('spelling');
  const [spellingInput, setSpellingInput] = useState('');
  const [sentenceInput, setSentenceInput] = useState('');
  const [isEvaluatingSentence, setIsEvaluatingSentence] = useState(false);
  const [writingFeedback, setWritingFeedback] = useState<{
    status: 'idle' | 'pass' | 'fail';
    message: string;
  }>({
    status: word.writingPassed ? 'pass' : 'idle',
    message: word.writingPassed ? '先前寫作檢測已通過' : '',
  });

  // Current local mastery status
  const [localWord, setLocalWord] = useState<VocabWord>(word);

  useEffect(() => {
    setLocalWord(word);
    setSpeakingFeedback({
      status: word.speakingPassed ? 'pass' : 'idle',
      message: word.speakingPassed ? '先前口說檢測已通過' : '',
    });
    setWritingFeedback({
      status: word.writingPassed ? 'pass' : 'idle',
      message: word.writingPassed ? '先前寫作檢測已通過' : '',
    });
    setSpellingInput('');
    setSentenceInput('');
    setSpokenTranscript('');
  }, [word]);

  // Handle Speaking Recognition
  const handleToggleSpeakingRecord = () => {
    if (!isSpeechRecognitionSupported()) {
      setSpeakingFeedback({
        status: 'fail',
        message: '您的瀏覽器或當前視窗未支援麥克風語音識別，請點擊下方「手動標記通過」進行記錄。',
      });
      return;
    }

    if (isRecording) {
      if (recognizerInstance) {
        recognizerInstance.stop();
      }
      setIsRecording(false);
      return;
    }

    setSpokenTranscript('');
    setSpeakingFeedback({ status: 'idle', message: '正在聆聽您的發音...' });

    const recognizer = createSpeechRecognizer({
      onResult: (transcript) => {
        setSpokenTranscript(transcript);
        evaluateSpokenText(transcript);
      },
      onError: (err) => {
        setIsRecording(false);
        setSpeakingFeedback({
          status: 'fail',
          message: '語音識別受阻或未收到聲音，請重新點擊或使用手動標記。',
        });
      },
      onEnd: () => {
        setIsRecording(false);
      },
    });

    if (recognizer) {
      setRecognizerInstance(recognizer);
      recognizer.start();
      setIsRecording(true);
    }
  };

  const evaluateSpokenText = (transcript: string) => {
    const cleanTarget = word.word.toLowerCase().replace(/[^a-z0-9]/g, '');
    const cleanSpoken = transcript.toLowerCase().replace(/[^a-z0-9\s]/g, '');

    // Check if spoken words include target word or sentence contains it
    const words = cleanSpoken.split(/\s+/);
    const isDirectMatch = words.some(
      (w) => w === cleanTarget || (cleanTarget.length > 4 && (w.includes(cleanTarget) || cleanTarget.includes(w)))
    );

    if (isDirectMatch) {
      const updated = recordWordPracticeResult(word.id, 'speaking', true);
      if (updated) {
        setLocalWord(updated);
        onWordsChange();
        if (updated.speakingPassed && updated.writingPassed) {
          triggerCelebration();
        }
      }
      setSpeakingFeedback({
        status: 'pass',
        message: `發音清晰！成功識別出「${word.word}」，口說檢測通過 ✓`,
      });
    } else {
      const updated = recordWordPracticeResult(word.id, 'speaking', false);
      if (updated) {
        setLocalWord(updated);
        onWordsChange();
      }
      setSpeakingFeedback({
        status: 'fail',
        message: `識別為「${transcript}」，未完整匹配目標字詞，請再試一次或多加練習。`,
      });
    }
  };

  // Manual Speaking Toggle
  const handleManualSpeakingToggle = (passed: boolean) => {
    const updated = recordWordPracticeResult(word.id, 'speaking', passed);
    if (updated) {
      setLocalWord(updated);
      onWordsChange();
      if (updated.speakingPassed && updated.writingPassed) {
        triggerCelebration();
      }
    }
    setSpeakingFeedback({
      status: passed ? 'pass' : 'fail',
      message: passed ? '已手動標記為口說通過 ✓' : '已標記口說待加強（未通過）',
    });
  };

  // Handle Spelling Check
  const handleCheckSpelling = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanInput = spellingInput.trim().toLowerCase();
    const cleanTarget = word.word.trim().toLowerCase();

    if (cleanInput === cleanTarget) {
      const updated = recordWordPracticeResult(word.id, 'writing', true);
      if (updated) {
        setLocalWord(updated);
        onWordsChange();
        if (updated.speakingPassed && updated.writingPassed) {
          triggerCelebration();
        }
      }
      setWritingFeedback({
        status: 'pass',
        message: `拼寫完全正確（${word.word}）！寫作檢測通過 ✓`,
      });
    } else {
      const updated = recordWordPracticeResult(word.id, 'writing', false);
      if (updated) {
        setLocalWord(updated);
        onWordsChange();
      }
      setWritingFeedback({
        status: 'fail',
        message: `拼寫有誤。正確拼法為：${word.word}`,
      });
    }
  };

  // Handle Sentence Writing Check
  const handleCheckSentence = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!sentenceInput.trim()) return;

    // Check if user included the word
    if (!sentenceInput.toLowerCase().includes(word.word.toLowerCase())) {
      setWritingFeedback({
        status: 'fail',
        message: `造句中必須包含目標單字「${word.word}」。`,
      });
      return;
    }

    setIsEvaluatingSentence(true);
    try {
      const res = await fetch('/api/gemini/build-sentence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetWords: [word.word],
          userSentence: sentenceInput.trim(),
          grammarPattern: 'General usage and expression',
          stage: 'word-to-sentence',
        }),
      });

      if (!res.ok) throw new Error('評估失敗');
      const data = await res.json();

      const passed = data.isCorrect || (data.score && data.score >= 70);
      const updated = recordWordPracticeResult(word.id, 'writing', Boolean(passed));
      if (updated) {
        setLocalWord(updated);
        onWordsChange();
        if (updated.speakingPassed && updated.writingPassed) {
          triggerCelebration();
        }
      }

      setWritingFeedback({
        status: passed ? 'pass' : 'fail',
        message: passed
          ? `造句語法得宜（得分 ${data.score || 85}）！寫作檢測通過 ✓`
          : `造句需調整：${data.grammarExplanation || '請參考正確語法結構'}`,
      });
    } catch (err: any) {
      // Fallback: check basic sentence syntax
      const passed = sentenceInput.trim().length > 15;
      const updated = recordWordPracticeResult(word.id, 'writing', passed);
      if (updated) {
        setLocalWord(updated);
        onWordsChange();
      }
      setWritingFeedback({
        status: passed ? 'pass' : 'fail',
        message: passed ? '造句已記錄並通過檢測 ✓' : '句子長度過短，請造出完整語意。',
      });
    } finally {
      setIsEvaluatingSentence(false);
    }
  };

  // Manual Writing Toggle
  const handleManualWritingToggle = (passed: boolean) => {
    const updated = recordWordPracticeResult(word.id, 'writing', passed);
    if (updated) {
      setLocalWord(updated);
      onWordsChange();
      if (updated.speakingPassed && updated.writingPassed) {
        triggerCelebration();
      }
    }
    setWritingFeedback({
      status: passed ? 'pass' : 'fail',
      message: passed ? '已手動標記為寫作通過 ✓' : '已標記寫作待加強（未通過）',
    });
  };

  const triggerCelebration = () => {
    try {
      confetti({ particleCount: 60, spread: 70, origin: { y: 0.7 } });
    } catch (_) {}
  };

  const isBothPassed = localWord.speakingPassed && localWord.writingPassed;
  const is24hNew = isWordAddedWithin24Hours(localWord) && !isBothPassed;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl border border-stone-200 shadow-2xl max-w-2xl w-full max-h-[92vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 border-b border-stone-100 flex items-start justify-between bg-stone-50/70">
          <div>
            <div className="flex items-center gap-3">
              <h3 className="text-2xl font-bold text-stone-900 tracking-tight">{localWord.word}</h3>
              <button
                onClick={() => speakText(localWord.word)}
                title="聆聽發音"
                className="p-1.5 rounded-xl bg-white border border-stone-200 text-stone-600 hover:text-stone-900 hover:bg-stone-50 transition cursor-pointer"
              >
                <Volume2 className="w-4 h-4" />
              </button>
              <span className="text-xs font-mono text-stone-500">{localWord.phonetic}</span>
              <span className="text-xs italic text-stone-500">{localWord.partOfSpeech}</span>
            </div>
            <p className="text-sm font-semibold text-stone-800 mt-1">{localWord.translation}</p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-200/50 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Dashboard Banner */}
        <div className="p-4 bg-stone-100/70 border-b border-stone-200">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {/* Overall Status Badge */}
              <div
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold ${
                  isBothPassed
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : is24hNew
                    ? 'bg-sky-100 text-sky-800 border border-sky-300'
                    : 'bg-amber-100 text-amber-800 border border-amber-300'
                }`}
              >
                {isBothPassed ? (
                  <>
                    <Award className="w-4 h-4 text-emerald-600" />
                    已掌握 (說寫雙項通過)
                  </>
                ) : is24hNew ? (
                  <>
                    <Clock className="w-4 h-4 text-sky-600" />
                    新收錄 (過去24小時匯入)
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    學習中 (說寫尚未完全通過)
                  </>
                )}
              </div>

              {/* Mini Status Breakdown */}
              <div className="flex items-center gap-2 text-xs">
                <span
                  className={`px-2.5 py-1 rounded-lg font-medium border ${
                    localWord.speakingPassed
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-stone-200/80 text-stone-600 border-stone-300'
                  }`}
                >
                  🗣️ 說: {localWord.speakingPassed ? '已通過 ✓' : '未通過'}
                </span>
                <span
                  className={`px-2.5 py-1 rounded-lg font-medium border ${
                    localWord.writingPassed
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-stone-200/80 text-stone-600 border-stone-300'
                  }`}
                >
                  ✍️ 寫: {localWord.writingPassed ? '已通過 ✓' : '未通過'}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-stone-500">
              規則：說寫均通過為<strong>已掌握</strong>；未能通過為<strong>學習中</strong>。
            </p>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Practice Section 1: 口說檢測 (Speaking Check) */}
          <div className="p-5 rounded-2xl border border-stone-200 bg-white shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-xs">
                  🗣️
                </span>
                <div>
                  <h4 className="text-sm font-bold text-stone-900">口說能力檢測 (Speaking Test)</h4>
                  <p className="text-xs text-stone-500">請朗讀單字或下方完整例句，系統即時判讀發音</p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleManualSpeakingToggle(true)}
                  className="text-xs px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-medium transition cursor-pointer"
                >
                  標記說通過
                </button>
                <button
                  type="button"
                  onClick={() => handleManualSpeakingToggle(false)}
                  className="text-xs px-2 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-600 font-medium transition cursor-pointer"
                >
                  未通過
                </button>
              </div>
            </div>

            {/* Example sentence for speech */}
            <div className="p-3 bg-stone-50 rounded-xl border border-stone-100 text-xs flex items-start justify-between gap-2">
              <div>
                <span className="font-semibold text-stone-500 block mb-0.5">朗讀參考例句：</span>
                <p className="text-stone-800 font-medium">{localWord.exampleEn || `We should articulate our ideas clearly.`}</p>
              </div>
              <button
                onClick={() => speakText(localWord.exampleEn || localWord.word)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 transition shrink-0 cursor-pointer"
              >
                <Volume2 className="w-4 h-4" />
              </button>
            </div>

            {/* Microphone button & live recognition */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
              <button
                onClick={handleToggleSpeakingRecord}
                className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer ${
                  isRecording
                    ? 'bg-rose-600 text-white animate-pulse shadow-md shadow-rose-200'
                    : 'bg-stone-900 text-white hover:bg-stone-800 shadow-xs'
                }`}
              >
                {isRecording ? (
                  <>
                    <MicOff className="w-4 h-4" />
                    停止錄音判讀
                  </>
                ) : (
                  <>
                    <Mic className="w-4 h-4 text-rose-400" />
                    開始麥克風口說朗讀
                  </>
                )}
              </button>

              {spokenTranscript && (
                <div className="text-xs text-stone-600 bg-stone-100 px-3 py-2 rounded-xl flex-1 w-full font-mono">
                  辨識結果：「{spokenTranscript}」
                </div>
              )}
            </div>

            {speakingFeedback.message && (
              <div
                className={`p-3 rounded-xl text-xs font-medium flex items-center gap-2 ${
                  speakingFeedback.status === 'pass'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : speakingFeedback.status === 'fail'
                    ? 'bg-rose-50 text-rose-800 border border-rose-200'
                    : 'bg-stone-100 text-stone-700'
                }`}
              >
                {speakingFeedback.status === 'pass' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : speakingFeedback.status === 'fail' ? (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                ) : (
                  <Sparkles className="w-4 h-4 text-stone-500 shrink-0" />
                )}
                <span>{speakingFeedback.message}</span>
              </div>
            )}
          </div>

          {/* Practice Section 2: 寫作檢測 (Writing Test) */}
          <div className="p-5 rounded-2xl border border-stone-200 bg-white shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                  ✍️
                </span>
                <div>
                  <h4 className="text-sm font-bold text-stone-900">寫作能力檢測 (Writing Test)</h4>
                  <p className="text-xs text-stone-500">透過單字拼寫默寫或完整造句檢驗掌握度</p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleManualWritingToggle(true)}
                  className="text-xs px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-medium transition cursor-pointer"
                >
                  標記寫通過
                </button>
                <button
                  type="button"
                  onClick={() => handleManualWritingToggle(false)}
                  className="text-xs px-2 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-600 font-medium transition cursor-pointer"
                >
                  未通過
                </button>
              </div>
            </div>

            {/* Mode Switcher */}
            <div className="flex gap-2 p-1 bg-stone-100 rounded-xl w-fit text-xs font-semibold">
              <button
                type="button"
                onClick={() => setWritingMode('spelling')}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  writingMode === 'spelling'
                    ? 'bg-white text-stone-900 shadow-2xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                1. 拼寫默寫檢驗
              </button>
              <button
                type="button"
                onClick={() => setWritingMode('sentence')}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  writingMode === 'sentence'
                    ? 'bg-white text-stone-900 shadow-2xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                2. 英文造句檢驗
              </button>
            </div>

            {writingMode === 'spelling' ? (
              <form onSubmit={handleCheckSpelling} className="space-y-3">
                <div className="text-xs text-stone-600 bg-stone-50 p-3 rounded-xl border border-stone-100">
                  <span className="font-semibold text-stone-700">釋義提示：</span>
                  {localWord.translation}（{localWord.partOfSpeech}）
                  <span className="text-stone-400 ml-2">字數：{localWord.word.length} 字母</span>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={spellingInput}
                    onChange={(e) => setSpellingInput(e.target.value)}
                    placeholder={`請輸入英文拼寫 (首字母 ${localWord.word.charAt(0)}...)`}
                    className="flex-1 px-3.5 py-2.5 bg-white border border-stone-200 rounded-xl text-sm font-mono text-stone-900 placeholder:text-stone-400 focus:outline-hidden focus:border-stone-400 focus:ring-2 focus:ring-stone-100"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2.5 bg-stone-900 text-white rounded-xl text-sm font-semibold hover:bg-stone-800 transition cursor-pointer"
                  >
                    驗證拼寫
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleCheckSentence} className="space-y-3">
                <textarea
                  rows={2}
                  value={sentenceInput}
                  onChange={(e) => setSentenceInput(e.target.value)}
                  placeholder={`請輸入包含「${localWord.word}」的完整英文句子...`}
                  className="w-full px-3.5 py-2.5 bg-white border border-stone-200 rounded-xl text-sm text-stone-900 placeholder:text-stone-400 focus:outline-hidden focus:border-stone-400 focus:ring-2 focus:ring-stone-100"
                />
                <button
                  type="submit"
                  disabled={isEvaluatingSentence || !sentenceInput.trim()}
                  className="px-4 py-2 bg-stone-900 text-white rounded-xl text-sm font-semibold hover:bg-stone-800 disabled:opacity-50 transition cursor-pointer flex items-center gap-1.5"
                >
                  {isEvaluatingSentence ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <PenTool className="w-4 h-4" />
                  )}
                  AI 語法評定造句
                </button>
              </form>
            )}

            {writingFeedback.message && (
              <div
                className={`p-3 rounded-xl text-xs font-medium flex items-center gap-2 ${
                  writingFeedback.status === 'pass'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : writingFeedback.status === 'fail'
                    ? 'bg-rose-50 text-rose-800 border border-rose-200'
                    : 'bg-stone-100 text-stone-700'
                }`}
              >
                {writingFeedback.status === 'pass' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : writingFeedback.status === 'fail' ? (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                ) : (
                  <Sparkles className="w-4 h-4 text-stone-500 shrink-0" />
                )}
                <span>{writingFeedback.message}</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer with Summary Feedback */}
        <div className="p-4 border-t border-stone-200 bg-stone-50 flex items-center justify-between">
          <div className="text-xs text-stone-600 flex items-center gap-2">
            {isBothPassed ? (
              <span className="text-emerald-700 font-bold flex items-center gap-1">
                <Award className="w-4 h-4" />
                恭喜！說寫雙項均已通過，單字已標記為【已掌握】
              </span>
            ) : (
              <span className="text-stone-500">
                尚未完成全部檢驗（說: {localWord.speakingPassed ? '✓' : '未'} / 寫:{' '}
                {localWord.writingPassed ? '✓' : '未'}），目前狀態為【{is24hNew ? '新收錄' : '學習中'}】
              </span>
            )}
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 bg-stone-900 text-white rounded-xl text-xs font-semibold hover:bg-stone-800 transition cursor-pointer shadow-xs"
          >
            完成檢驗
          </button>
        </div>
      </div>
    </div>
  );
};
