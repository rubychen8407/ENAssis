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
} from 'lucide-react';
import { VocabWord } from '../types';
import { speakText, createSpeechRecognizer, isSpeechRecognitionSupported } from '../utils/speech';
import { recordWordPracticeResult } from '../utils/storage';
import confetti from 'canvas-confetti';

interface Props {
  word: VocabWord;
  onWordsChange: () => void;
}

/**
 * Inline speaking + writing mastery check — same checking logic as the old modal,
 * but rendered directly on a flipped word card (no dialog/overlay).
 */
export const VocabMasteryCheckPanel: React.FC<Props> = ({ word, onWordsChange }) => {
  // Speaking State
  const [isRecording, setIsRecording] = useState(false);
  const [spokenTranscript, setSpokenTranscript] = useState('');
  const [speakingFeedback, setSpeakingFeedback] = useState<{ status: 'idle' | 'pass' | 'fail'; message: string }>({
    status: word.speakingPassed ? 'pass' : 'idle',
    message: word.speakingPassed ? '先前口說檢測已通過' : '',
  });
  const [recognizerInstance, setRecognizerInstance] = useState<any>(null);

  // Writing State
  const [writingMode, setWritingMode] = useState<'spelling' | 'sentence'>('spelling');
  const [spellingInput, setSpellingInput] = useState('');
  const [sentenceInput, setSentenceInput] = useState('');
  const [isEvaluatingSentence, setIsEvaluatingSentence] = useState(false);
  const [writingFeedback, setWritingFeedback] = useState<{ status: 'idle' | 'pass' | 'fail'; message: string }>({
    status: word.writingPassed ? 'pass' : 'idle',
    message: word.writingPassed ? '先前寫作檢測已通過' : '',
  });

  const [localWord, setLocalWord] = useState<VocabWord>(word);

  useEffect(() => {
    setLocalWord(word);
    setSpeakingFeedback({ status: word.speakingPassed ? 'pass' : 'idle', message: word.speakingPassed ? '先前口說檢測已通過' : '' });
    setWritingFeedback({ status: word.writingPassed ? 'pass' : 'idle', message: word.writingPassed ? '先前寫作檢測已通過' : '' });
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
      setSpeakingFeedback({ status: 'fail', message: '您的瀏覽器或當前視窗未支援麥克風語音識別，請點擊下方「手動標記通過」進行記錄。' });
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
        setSpeakingFeedback({ status: 'fail', message: '語音識別受阻或未收到聲音，請重新點擊或使用手動標記。' });
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
    const cleanTarget = word.word.toLowerCase().replace(/[^a-z0-9]/g, '');
    const cleanSpoken = transcript.toLowerCase().replace(/[^a-z0-9\s]/g, '');
    const words = cleanSpoken.split(/\s+/);
    const isDirectMatch = words.some((w) => w === cleanTarget || (cleanTarget.length > 4 && (w.includes(cleanTarget) || cleanTarget.includes(w))));
    if (isDirectMatch) {
      const updated = recordWordPracticeResult(word.id, 'speaking', true);
      if (updated) {
        setLocalWord(updated);
        onWordsChange();
        if (updated.speakingPassed && updated.writingPassed) triggerCelebration();
      }
      setSpeakingFeedback({ status: 'pass', message: `發音清晰！成功識別出「${word.word}」，口說檢測通過 ✓` });
    } else {
      const updated = recordWordPracticeResult(word.id, 'speaking', false);
      if (updated) {
        setLocalWord(updated);
        onWordsChange();
      }
      setSpeakingFeedback({ status: 'fail', message: `識別為「${transcript}」，未完整匹配目標字詞，請再試一次或多加練習。` });
    }
  };

  const handleManualSpeakingToggle = (e: React.MouseEvent, passed: boolean) => {
    e.stopPropagation();
    const updated = recordWordPracticeResult(word.id, 'speaking', passed);
    if (updated) {
      setLocalWord(updated);
      onWordsChange();
      if (updated.speakingPassed && updated.writingPassed) triggerCelebration();
    }
    setSpeakingFeedback({ status: passed ? 'pass' : 'fail', message: passed ? '已手動標記為口說通過 ✓' : '已標記口說待加強（未通過）' });
  };

  const handleCheckSpelling = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanInput = spellingInput.trim().toLowerCase();
    const cleanTarget = word.word.trim().toLowerCase();
    if (cleanInput === cleanTarget) {
      const updated = recordWordPracticeResult(word.id, 'writing', true);
      if (updated) {
        setLocalWord(updated);
        onWordsChange();
        if (updated.speakingPassed && updated.writingPassed) triggerCelebration();
      }
      setWritingFeedback({ status: 'pass', message: `拼寫完全正確（${word.word}）！寫作檢測通過 ✓` });
    } else {
      const updated = recordWordPracticeResult(word.id, 'writing', false);
      if (updated) {
        setLocalWord(updated);
        onWordsChange();
      }
      setWritingFeedback({ status: 'fail', message: `拼寫有誤。正確拼法為：${word.word}` });
    }
  };

  const handleCheckSentence = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!sentenceInput.trim()) return;
    if (!sentenceInput.toLowerCase().includes(word.word.toLowerCase())) {
      setWritingFeedback({ status: 'fail', message: `造句中必須包含目標單字「${word.word}」。` });
      return;
    }
    setIsEvaluatingSentence(true);
    try {
      const res = await fetch('/api/gemini/build-sentence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetWords: [word.word], userSentence: sentenceInput.trim(), grammarPattern: 'General usage and expression', stage: 'word-to-sentence' }),
      });
      if (!res.ok) throw new Error('評估失敗');
      const data = await res.json();
      const passed = data.isCorrect || (data.score && data.score >= 70);
      const updated = recordWordPracticeResult(word.id, 'writing', Boolean(passed));
      if (updated) {
        setLocalWord(updated);
        onWordsChange();
        if (updated.speakingPassed && updated.writingPassed) triggerCelebration();
      }
      setWritingFeedback({
        status: passed ? 'pass' : 'fail',
        message: passed ? `造句語法得宜（得分 ${data.score || 85}）！寫作檢測通過 ✓` : `造句需調整：${data.grammarExplanation || '請參考正確語法結構'}`,
      });
    } catch {
      const passed = sentenceInput.trim().length > 15;
      const updated = recordWordPracticeResult(word.id, 'writing', passed);
      if (updated) {
        setLocalWord(updated);
        onWordsChange();
      }
      setWritingFeedback({ status: passed ? 'pass' : 'fail', message: passed ? '造句已記錄並通過檢測 ✓' : '句子長度過短，請造出完整語意。' });
    } finally {
      setIsEvaluatingSentence(false);
    }
  };

  const handleManualWritingToggle = (e: React.MouseEvent, passed: boolean) => {
    e.stopPropagation();
    const updated = recordWordPracticeResult(word.id, 'writing', passed);
    if (updated) {
      setLocalWord(updated);
      onWordsChange();
      if (updated.speakingPassed && updated.writingPassed) triggerCelebration();
    }
    setWritingFeedback({ status: passed ? 'pass' : 'fail', message: passed ? '已手動標記為寫作通過 ✓' : '已標記寫作待加強（未通過）' });
  };

  const isBothPassed = localWord.speakingPassed && localWord.writingPassed;

  return (
    <div className="space-y-4" onClick={(e) => e.stopPropagation()}>
      {isBothPassed && (
        <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
          <Award className="w-4 h-4" /> 恭喜！說寫雙項均已通過，單字已標記為【已掌握】
        </div>
      )}

      {/* 口說檢測 */}
      <div className="p-4 rounded-2xl border border-stone-200 bg-white space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-xs">🗣️</span>
            <h4 className="text-sm font-bold text-stone-900">口說檢測</h4>
          </div>
          <div className="flex items-center gap-1.5">
            <button type="button" onClick={(e) => handleManualSpeakingToggle(e, true)} className="text-[11px] px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-medium transition cursor-pointer">通過</button>
            <button type="button" onClick={(e) => handleManualSpeakingToggle(e, false)} className="text-[11px] px-2 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-600 font-medium transition cursor-pointer">未通過</button>
          </div>
        </div>

        <div className="p-2.5 bg-stone-50 rounded-xl border border-stone-100 text-xs flex items-start justify-between gap-2">
          <p className="text-stone-800 font-medium">{localWord.exampleEn || `We should articulate our ideas clearly.`}</p>
          <button onClick={(e) => { e.stopPropagation(); speakText(localWord.exampleEn || localWord.word); }} className="p-1 rounded-lg text-stone-400 hover:text-stone-700 transition shrink-0 cursor-pointer"><Volume2 className="w-4 h-4" /></button>
        </div>

        <button
          onClick={handleToggleSpeakingRecord}
          className={`w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer ${isRecording ? 'bg-rose-600 text-white animate-pulse' : 'bg-stone-900 text-white hover:bg-stone-800'}`}
        >
          {isRecording ? <><MicOff className="w-4 h-4" /> 停止錄音判讀</> : <><Mic className="w-4 h-4 text-rose-400" /> 開始麥克風口說</>}
        </button>

        {spokenTranscript && <div className="text-xs text-stone-600 bg-stone-100 px-3 py-2 rounded-xl font-mono">辨識結果：「{spokenTranscript}」</div>}

        {speakingFeedback.message && (
          <div className={`p-2.5 rounded-xl text-xs font-medium flex items-center gap-2 ${speakingFeedback.status === 'pass' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : speakingFeedback.status === 'fail' ? 'bg-rose-50 text-rose-800 border border-rose-200' : 'bg-stone-100 text-stone-700'}`}>
            {speakingFeedback.status === 'pass' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : speakingFeedback.status === 'fail' ? <AlertCircle className="w-4 h-4 shrink-0" /> : <Sparkles className="w-4 h-4 shrink-0" />}
            <span>{speakingFeedback.message}</span>
          </div>
        )}
      </div>

      {/* 寫作檢測 */}
      <div className="p-4 rounded-2xl border border-stone-200 bg-white space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">✍️</span>
            <h4 className="text-sm font-bold text-stone-900">寫作檢測</h4>
          </div>
          <div className="flex items-center gap-1.5">
            <button type="button" onClick={(e) => handleManualWritingToggle(e, true)} className="text-[11px] px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-medium transition cursor-pointer">通過</button>
            <button type="button" onClick={(e) => handleManualWritingToggle(e, false)} className="text-[11px] px-2 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-600 font-medium transition cursor-pointer">未通過</button>
          </div>
        </div>

        <div className="flex gap-2 p-1 bg-stone-100 rounded-xl w-fit text-xs font-semibold">
          <button type="button" onClick={(e) => { e.stopPropagation(); setWritingMode('spelling'); }} className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${writingMode === 'spelling' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-600'}`}>拼寫</button>
          <button type="button" onClick={(e) => { e.stopPropagation(); setWritingMode('sentence'); }} className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${writingMode === 'sentence' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-600'}`}>造句</button>
        </div>

        {writingMode === 'spelling' ? (
          <form onSubmit={handleCheckSpelling} onClick={(e) => e.stopPropagation()} className="space-y-2">
            <div className="text-xs text-stone-600 bg-stone-50 p-2.5 rounded-xl border border-stone-100">
              <span className="font-semibold text-stone-700">釋義提示：</span>{localWord.translation}（{localWord.partOfSpeech}）
            </div>
            <div className="flex gap-2">
              <input type="text" value={spellingInput} onChange={(e) => setSpellingInput(e.target.value)} onClick={(e) => e.stopPropagation()} placeholder={`請輸入英文拼寫 (首字母 ${localWord.word.charAt(0)}...)`} className="flex-1 px-3 py-2 bg-white border border-stone-200 rounded-xl text-sm font-mono text-stone-900 placeholder:text-stone-400 outline-none focus:ring-2 focus:ring-stone-100" />
              <button type="submit" className="px-3.5 py-2 bg-stone-900 text-white rounded-xl text-sm font-semibold hover:bg-stone-800 transition cursor-pointer">驗證</button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleCheckSentence} onClick={(e) => e.stopPropagation()} className="space-y-2">
            <textarea rows={2} value={sentenceInput} onChange={(e) => setSentenceInput(e.target.value)} onClick={(e) => e.stopPropagation()} placeholder={`請輸入包含「${localWord.word}」的完整英文句子...`} className="w-full px-3 py-2 bg-white border border-stone-200 rounded-xl text-sm text-stone-900 placeholder:text-stone-400 outline-none focus:ring-2 focus:ring-stone-100" />
            <button type="submit" disabled={isEvaluatingSentence || !sentenceInput.trim()} className="px-3.5 py-2 bg-stone-900 text-white rounded-xl text-sm font-semibold hover:bg-stone-800 disabled:opacity-50 transition cursor-pointer inline-flex items-center gap-1.5">
              {isEvaluatingSentence ? <RefreshCw className="w-4 h-4 animate-spin" /> : <PenTool className="w-4 h-4" />} AI 評定造句
            </button>
          </form>
        )}

        {writingFeedback.message && (
          <div className={`p-2.5 rounded-xl text-xs font-medium flex items-center gap-2 ${writingFeedback.status === 'pass' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : writingFeedback.status === 'fail' ? 'bg-rose-50 text-rose-800 border border-rose-200' : 'bg-stone-100 text-stone-700'}`}>
            {writingFeedback.status === 'pass' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : writingFeedback.status === 'fail' ? <AlertCircle className="w-4 h-4 shrink-0" /> : <Sparkles className="w-4 h-4 shrink-0" />}
            <span>{writingFeedback.message}</span>
          </div>
        )}
      </div>
    </div>
  );
};
