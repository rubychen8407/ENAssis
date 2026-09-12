import React, { useState, useEffect } from 'react';
import {
  Volume2,
  Mic,
  MicOff,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  RefreshCw,
  Award,
  PenTool,
  Undo2,
  Edit3,
  Lightbulb,
  Gauge,
  HelpCircle,
  Volume1,
} from 'lucide-react';
import { VocabWord } from '../types';
import { speakText, speakHumanLikeText, createSpeechRecognizer, isSpeechRecognitionSupported } from '../utils/speech';
import { recordWordPracticeResult } from '../utils/storage';
import { isPlaceholderExample, sanitizeVocabWord } from '../utils/dictionaryService';
import { WordExampleEditorModal } from './WordExampleEditorModal';
import confetti from 'canvas-confetti';

interface Props {
  word: VocabWord;
  onWordsChange: () => void;
  onFlipBack?: () => void;
}

/**
 * Inline speaking + writing mastery check — rendered directly on the flipped card face.
 */
export const VocabMasteryCheckPanel: React.FC<Props> = ({ word, onWordsChange, onFlipBack }) => {
  // Speaking State
  const [isRecording, setIsRecording] = useState(false);
  const [spokenTranscript, setSpokenTranscript] = useState('');
  const [speakingFeedback, setSpeakingFeedback] = useState<{
    status: 'idle' | 'pass' | 'fail';
    message: string;
    correctionTips?: string[];
  }>({
    status: word.speakingPassed ? 'pass' : 'idle',
    message: word.speakingPassed ? '先前口說檢測已通過' : '',
  });
  const [recognizerInstance, setRecognizerInstance] = useState<any>(null);
  const [showPronunciationGuide, setShowPronunciationGuide] = useState(false);
  const [isEditingExample, setIsEditingExample] = useState(false);

  // Writing State
  const [writingMode, setWritingMode] = useState<'spelling' | 'sentence'>('spelling');
  const [spellingInput, setSpellingInput] = useState('');
  const [sentenceInput, setSentenceInput] = useState('');
  const [isEvaluatingSentence, setIsEvaluatingSentence] = useState(false);
  const [writingFeedback, setWritingFeedback] = useState<{ status: 'idle' | 'pass' | 'fail'; message: string }>({
    status: word.writingPassed ? 'pass' : 'idle',
    message: word.writingPassed ? '先前寫作檢測已通過' : '',
  });

  const [localWord, setLocalWord] = useState<VocabWord>(() => sanitizeVocabWord(word));

  useEffect(() => {
    const clean = sanitizeVocabWord(word);
    setLocalWord(clean);
    setSpeakingFeedback({
      status: clean.speakingPassed ? 'pass' : 'idle',
      message: clean.speakingPassed ? '先前口說檢測已通過' : '',
    });
    setWritingFeedback({
      status: clean.writingPassed ? 'pass' : 'idle',
      message: clean.writingPassed ? '先前寫作檢測已通過' : '',
    });
    setSpellingInput('');
    setSentenceInput('');
    setSpokenTranscript('');
  }, [word.id]);

  const triggerCelebration = () => {
    try {
      confetti({ particleCount: 60, spread: 70, origin: { y: 0.7 } });
    } catch (_) {}
  };

  const handleToggleSpeakingRecord = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isSpeechRecognitionSupported()) {
      setSpeakingFeedback({
        status: 'fail',
        message: '您的瀏覽器或當前視窗未支援麥克風語音識別，請點擊下方「手動標記通過」進行記錄。',
      });
      return;
    }
    if (isRecording) {
      recognizerInstance?.stop?.();
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
      onError: () => {
        setIsRecording(false);
        setSpeakingFeedback({
          status: 'fail',
          message: '語音識別受阻或未收到聲音，請重新點擊或使用手動標記。',
        });
      },
      onEnd: () => setIsRecording(false),
    });
    if (recognizer) {
      setRecognizerInstance(recognizer);
      recognizer.start();
      setIsRecording(true);
    }
  };

  const evaluateSpokenText = (transcript: string) => {
    const cleanTarget = localWord.word.toLowerCase().replace(/[^a-z0-9]/g, '');
    const cleanSpoken = transcript.toLowerCase().replace(/[^a-z0-9\s]/g, '');
    const words = cleanSpoken.split(/\s+/);
    const isDirectMatch = words.some(
      (w) => w === cleanTarget || (cleanTarget.length > 4 && (w.includes(cleanTarget) || cleanTarget.includes(w)))
    );

    const tips: string[] = [];
    if (localWord.pronunciation?.tips && localWord.pronunciation.tips.length > 0) {
      tips.push(...localWord.pronunciation.tips);
    } else {
      tips.push(`請確保重音精準（音標：${localWord.phonetic}），不要吞音或漏發尾音。`);
    }

    if (isDirectMatch) {
      const updated = recordWordPracticeResult(localWord.id, 'speaking', true);
      if (updated) {
        setLocalWord(updated);
        onWordsChange();
        if (updated.speakingPassed && updated.writingPassed) triggerCelebration();
      }
      setSpeakingFeedback({
        status: 'pass',
        message: `發音清晰標準！成功識別出「${localWord.word}」，口說檢測通過 ✓`,
        correctionTips: undefined,
      });
    } else {
      const updated = recordWordPracticeResult(localWord.id, 'speaking', false);
      if (updated) {
        setLocalWord(updated);
        onWordsChange();
      }
      setSpeakingFeedback({
        status: 'fail',
        message: `系統辨識為「${transcript}」，與目標詞「${localWord.word}」存在音標差異。`,
        correctionTips: tips,
      });
      setShowPronunciationGuide(true);
    }
  };

  const handleManualSpeakingToggle = (e: React.MouseEvent, passed: boolean) => {
    e.stopPropagation();
    const updated = recordWordPracticeResult(localWord.id, 'speaking', passed);
    if (updated) {
      setLocalWord(updated);
      onWordsChange();
      if (updated.speakingPassed && updated.writingPassed) triggerCelebration();
    }
    setSpeakingFeedback({
      status: passed ? 'pass' : 'fail',
      message: passed ? '已手動標記為口說通過 ✓' : '已標記口說待加強（未通過）',
    });
  };

  const handleCheckSpelling = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanInput = spellingInput.trim().toLowerCase();
    const cleanTarget = localWord.word.trim().toLowerCase();
    if (cleanInput === cleanTarget) {
      const updated = recordWordPracticeResult(localWord.id, 'writing', true);
      if (updated) {
        setLocalWord(updated);
        onWordsChange();
        if (updated.speakingPassed && updated.writingPassed) triggerCelebration();
      }
      setWritingFeedback({ status: 'pass', message: `拼寫完全正確（${localWord.word}）！寫作檢測通過 ✓` });
    } else {
      const updated = recordWordPracticeResult(localWord.id, 'writing', false);
      if (updated) {
        setLocalWord(updated);
        onWordsChange();
      }
      setWritingFeedback({ status: 'fail', message: `拼寫有誤。正確拼法為：${localWord.word}` });
    }
  };

  const handleCheckSentence = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!sentenceInput.trim()) return;
    if (!sentenceInput.toLowerCase().includes(localWord.word.toLowerCase())) {
      setWritingFeedback({ status: 'fail', message: `造句中必須包含目標單字「${localWord.word}」。` });
      return;
    }
    setIsEvaluatingSentence(true);
    try {
      const res = await fetch('/api/gemini/build-sentence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetWords: [localWord.word],
          userSentence: sentenceInput.trim(),
          grammarPattern: 'General usage and expression',
          stage: 'word-to-sentence',
        }),
      });
      if (!res.ok) throw new Error('評估失敗');
      const data = await res.json();
      const passed = data.isCorrect || (data.score && data.score >= 70);
      const updated = recordWordPracticeResult(localWord.id, 'writing', Boolean(passed));
      if (updated) {
        setLocalWord(updated);
        onWordsChange();
        if (updated.speakingPassed && updated.writingPassed) triggerCelebration();
      }
      setWritingFeedback({
        status: passed ? 'pass' : 'fail',
        message: passed
          ? `造句語法得宜（得分 ${data.score || 85}）！寫作檢測通過 ✓`
          : `造句需調整：${data.grammarExplanation || '請參考正確語法結構'}`,
      });
    } catch {
      const passed = sentenceInput.trim().length > 15;
      const updated = recordWordPracticeResult(localWord.id, 'writing', passed);
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

  const handleManualWritingToggle = (e: React.MouseEvent, passed: boolean) => {
    e.stopPropagation();
    const updated = recordWordPracticeResult(localWord.id, 'writing', passed);
    if (updated) {
      setLocalWord(updated);
      onWordsChange();
      if (updated.speakingPassed && updated.writingPassed) triggerCelebration();
    }
    setWritingFeedback({
      status: passed ? 'pass' : 'fail',
      message: passed ? '已手動標記為寫作通過 ✓' : '已標記寫作待加強（未通過）',
    });
  };

  const isBothPassed = localWord.speakingPassed && localWord.writingPassed;

  // Clean example sentence to display
  const displaySentence = !isPlaceholderExample(localWord.exampleEn)
    ? localWord.exampleEn
    : `Studies demonstrate that understanding ${localWord.word} is vital in academic discourse.`;

  return (
    <div className="space-y-3.5" onClick={(e) => e.stopPropagation()}>
      {/* Top easy flip-back bar */}
      <div
        onClick={(e) => {
          e.stopPropagation();
          if (onFlipBack) onFlipBack();
        }}
        className="group cursor-pointer flex items-center justify-between p-2 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-750 transition border border-stone-200 dark:border-stone-700 text-xs font-semibold text-stone-700 dark:text-stone-300 shadow-2xs"
        title="點擊翻回單字卡正面"
      >
        <div className="flex items-center gap-1.5">
          <Undo2 className="w-3.5 h-3.5 text-stone-500 group-hover:-translate-x-0.5 transition" />
          <span>正在進行檢測：<strong className="text-stone-900 dark:text-stone-100">{localWord.word}</strong></span>
        </div>
        <span className="text-[11px] px-2 py-0.5 rounded-md bg-white dark:bg-stone-700 font-bold border border-stone-200 dark:border-stone-600 text-stone-800 dark:text-stone-200 group-hover:bg-amber-50 group-hover:text-amber-900 group-hover:border-amber-200 transition">
          ↩️ 點此翻回正面
        </span>
      </div>

      {isBothPassed && (
        <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
          <Award className="w-4 h-4" /> 恭喜！說寫雙項均已通過，單字已標記為【已掌握】
        </div>
      )}

      {/* 口說檢測與發音糾正 */}
      <div className="p-4 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 space-y-3 shadow-2xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-xs">🗣️</span>
            <div>
              <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100">口說檢測 & 發音糾正</h4>
              <p className="text-[10px] text-stone-400">音標朗讀 · 智能發音診斷 · 重音糾正</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={(e) => handleManualSpeakingToggle(e, true)}
              className="text-[11px] px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-medium transition cursor-pointer"
            >
              通過
            </button>
            <button
              type="button"
              onClick={(e) => handleManualSpeakingToggle(e, false)}
              className="text-[11px] px-2 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-600 font-medium transition cursor-pointer"
            >
              未通過
            </button>
          </div>
        </div>

        {/* Pronunciation breakdown badge */}
        <div className="px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200/80 dark:border-stone-700 flex items-center justify-between flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-stone-800 dark:text-stone-200">
              {localWord.pronunciation?.syllables || localWord.word}
            </span>
            <span className="font-mono text-[11px] text-stone-500">{localWord.phonetic}</span>
            {localWord.pronunciation?.primaryStress && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300 font-bold">
                重音: {localWord.pronunciation.primaryStress}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                speakHumanLikeText(localWord.word);
              }}
              className="px-2 py-1 rounded-lg bg-white dark:bg-stone-700 border border-stone-200 dark:border-stone-600 text-stone-700 dark:text-stone-200 hover:bg-stone-100 text-[11px] font-medium inline-flex items-center gap-1 cursor-pointer"
              title="真人原速朗讀"
            >
              <Volume2 className="w-3 h-3" /> 原速 1.0x
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                speakText(localWord.word, { rate: 0.75 });
              }}
              className="px-2 py-1 rounded-lg bg-white dark:bg-stone-700 border border-stone-200 dark:border-stone-600 text-stone-700 dark:text-stone-200 hover:bg-stone-100 text-[11px] font-medium inline-flex items-center gap-1 cursor-pointer"
              title="慢速拆解朗讀"
            >
              <Volume1 className="w-3 h-3" /> 慢速 0.75x
            </button>
            <button
              type="button"
              onClick={() => setShowPronunciationGuide(!showPronunciationGuide)}
              className="p-1 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 cursor-pointer"
              title="發音糾正建議"
            >
              <Lightbulb className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Pronunciation correction guide box */}
        {showPronunciationGuide && (
          <div className="p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs space-y-1.5 animate-fadeIn">
            <div className="flex items-center justify-between font-bold text-amber-900 dark:text-amber-200 text-[11px]">
              <span className="flex items-center gap-1">
                <Gauge className="w-3.5 h-3.5" /> 發音糾正與易犯錯誤提示：
              </span>
              <button
                type="button"
                onClick={() => setShowPronunciationGuide(false)}
                className="text-[10px] text-amber-700 underline cursor-pointer"
              >
                收起
              </button>
            </div>
            <ul className="list-disc list-inside text-amber-800 dark:text-amber-300 space-y-1 text-[11px] leading-relaxed">
              {(localWord.pronunciation?.tips || [
                `注意「${localWord.word}」的音標 ${localWord.phonetic}，重音位置務必清晰，避免平調。`,
                '注意母音長度與尾輔音清濁對比，避免中文發音習慣帶來的多餘尾音。',
              ]).map((t, idx) => (
                <li key={idx}>{t}</li>
              ))}
              {localWord.pronunciation?.commonMistakes?.map((m, idx) => (
                <li key={`m-${idx}`} className="text-rose-700 dark:text-rose-300 font-medium">
                  ⚠️ 盲點警示：{m}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Example sentence with edit button */}
        <div className="p-2.5 bg-stone-50 dark:bg-stone-800 rounded-xl border border-stone-200/70 dark:border-stone-700 text-xs space-y-1.5">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block mb-0.5">
                口說檢測例句 (點筆可修改/自訂)：
              </span>
              <p className="text-stone-800 dark:text-stone-200 font-medium leading-relaxed">
                {displaySentence}
              </p>
              {localWord.exampleZh && (
                <p className="text-[11px] text-stone-500 mt-0.5">{localWord.exampleZh}</p>
              )}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditingExample(true);
                }}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-200 dark:hover:bg-stone-700 transition cursor-pointer"
                title="修改/自訂此例句"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  speakHumanLikeText(displaySentence);
                }}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-200 dark:hover:bg-stone-700 transition shrink-0 cursor-pointer"
                title="真人朗讀例句"
              >
                <Volume2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Record button */}
        <button
          onClick={handleToggleSpeakingRecord}
          className={`w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer ${isRecording ? 'bg-rose-600 text-white animate-pulse shadow-md' : 'bg-stone-900 text-white hover:bg-stone-800'}`}
        >
          {isRecording ? (
            <>
              <MicOff className="w-4 h-4" /> 正在辨識您的發音... (點擊停止)
            </>
          ) : (
            <>
              <Mic className="w-4 h-4 text-rose-400" /> 開始麥克風口說辨識
            </>
          )}
        </button>

        {spokenTranscript && (
          <div className="text-xs text-stone-600 bg-stone-100 dark:bg-stone-800 px-3 py-2 rounded-xl font-mono">
            辨識音訊結果：「{spokenTranscript}」
          </div>
        )}

        {speakingFeedback.message && (
          <div
            className={`p-2.5 rounded-xl text-xs font-medium space-y-1 ${speakingFeedback.status === 'pass' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : speakingFeedback.status === 'fail' ? 'bg-rose-50 text-rose-800 border border-rose-200' : 'bg-stone-100 text-stone-700'}`}
          >
            <div className="flex items-center gap-2">
              {speakingFeedback.status === 'pass' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : speakingFeedback.status === 'fail' ? (
                <AlertCircle className="w-4 h-4 shrink-0" />
              ) : (
                <Sparkles className="w-4 h-4 shrink-0" />
              )}
              <span>{speakingFeedback.message}</span>
            </div>
            {speakingFeedback.correctionTips && speakingFeedback.correctionTips.length > 0 && (
              <div className="pl-6 pt-1 text-[11px] text-rose-700 dark:text-rose-300">
                <strong>發音糾正關鍵：</strong> {speakingFeedback.correctionTips[0]}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 寫作檢測 */}
      <div className="p-4 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 space-y-3 shadow-2xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">✍️</span>
            <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100">寫作檢測</h4>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={(e) => handleManualWritingToggle(e, true)}
              className="text-[11px] px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-medium transition cursor-pointer"
            >
              通過
            </button>
            <button
              type="button"
              onClick={(e) => handleManualWritingToggle(e, false)}
              className="text-[11px] px-2 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-600 font-medium transition cursor-pointer"
            >
              未通過
            </button>
          </div>
        </div>

        <div className="flex gap-2 p-1 bg-stone-100 dark:bg-stone-800 rounded-xl w-fit text-xs font-semibold">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setWritingMode('spelling');
            }}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${writingMode === 'spelling' ? 'bg-white text-stone-900 shadow-2xs dark:bg-stone-700 dark:text-stone-100' : 'text-stone-600 dark:text-stone-400'}`}
          >
            拼寫
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setWritingMode('sentence');
            }}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${writingMode === 'sentence' ? 'bg-white text-stone-900 shadow-2xs dark:bg-stone-700 dark:text-stone-100' : 'text-stone-600 dark:text-stone-400'}`}
          >
            造句
          </button>
        </div>

        {writingMode === 'spelling' ? (
          <form onSubmit={handleCheckSpelling} onClick={(e) => e.stopPropagation()} className="space-y-2">
            <div className="text-xs text-stone-600 dark:text-stone-300 bg-stone-50 dark:bg-stone-800 p-2.5 rounded-xl border border-stone-100 dark:border-stone-700">
              <span className="font-semibold text-stone-700 dark:text-stone-200">釋義提示：</span>
              {localWord.translation}（{localWord.partOfSpeech}）
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={spellingInput}
                onChange={(e) => setSpellingInput(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                placeholder={`請輸入英文拼寫 (首字母 ${localWord.word.charAt(0)}...)`}
                className="flex-1 px-3 py-2 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-sm font-mono text-stone-900 dark:text-stone-100 placeholder:text-stone-400 outline-none focus:ring-2 focus:ring-amber-500/30"
              />
              <button
                type="submit"
                className="px-3.5 py-2 bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 rounded-xl text-sm font-semibold hover:bg-stone-800 transition cursor-pointer"
              >
                驗證
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleCheckSentence} onClick={(e) => e.stopPropagation()} className="space-y-2">
            <textarea
              rows={2}
              value={sentenceInput}
              onChange={(e) => setSentenceInput(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              placeholder={`請輸入包含「${localWord.word}」的完整英文句子...`}
              className="w-full px-3 py-2 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-sm text-stone-900 dark:text-stone-100 placeholder:text-stone-400 outline-none focus:ring-2 focus:ring-amber-500/30"
            />
            <button
              type="submit"
              disabled={isEvaluatingSentence || !sentenceInput.trim()}
              className="px-3.5 py-2 bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 rounded-xl text-sm font-semibold hover:bg-stone-800 disabled:opacity-50 transition cursor-pointer inline-flex items-center gap-1.5"
            >
              {isEvaluatingSentence ? <RefreshCw className="w-4 h-4 animate-spin" /> : <PenTool className="w-4 h-4" />}
              AI 評定造句
            </button>
          </form>
        )}

        {writingFeedback.message && (
          <div
            className={`p-2.5 rounded-xl text-xs font-medium flex items-center gap-2 ${writingFeedback.status === 'pass' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : writingFeedback.status === 'fail' ? 'bg-rose-50 text-rose-800 border border-rose-200' : 'bg-stone-100 text-stone-700'}`}
          >
            {writingFeedback.status === 'pass' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : writingFeedback.status === 'fail' ? (
              <AlertCircle className="w-4 h-4 shrink-0" />
            ) : (
              <Sparkles className="w-4 h-4 shrink-0" />
            )}
            <span>{writingFeedback.message}</span>
          </div>
        )}
      </div>

      {/* Bottom return / flip-back button */}
      <div className="pt-2 flex items-center justify-between">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (onFlipBack) onFlipBack();
          }}
          className="w-full py-2.5 px-4 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-750 text-stone-700 dark:text-stone-200 text-xs font-bold transition inline-flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
        >
          <Undo2 className="w-4 h-4" /> 點擊翻回單字卡正面 (或按 Esc)
        </button>
      </div>

      {/* Modal for editing example sentence */}
      <WordExampleEditorModal
        word={localWord}
        isOpen={isEditingExample}
        onClose={() => setIsEditingExample(false)}
        onSaved={(updated) => {
          setLocalWord(updated);
          onWordsChange();
        }}
      />
    </div>
  );
};

