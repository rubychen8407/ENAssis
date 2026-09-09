import React, { useMemo, useState } from 'react';
import {
  Brain,
  CheckCircle2,
  ChevronRight,
  Mic,
  RefreshCw,
  Sparkles,
  Volume2,
  XCircle,
  PenLine,
  ListChecks,
  Link2,
  FileText,
} from 'lucide-react';
import { VocabWord } from '../types';
import { speakText, createSpeechRecognizer, isSpeechRecognitionSupported } from '../utils/speech';
import { recordVocabExamResult } from '../utils/storage';

interface Props {
  words: VocabWord[];
  onWordsChange: () => void;
}

type QuestionType = 'choice' | 'speaking' | 'writing' | 'collocation' | 'article';

type Question = {
  id: string;
  type: QuestionType;
  word: VocabWord;
  prompt: string;
  options?: string[];
  answer?: string;
  explanation?: string;
};

const shuffle = <T,>(items: T[]): T[] => {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

const pickWords = (words: VocabWord[], count: number) => {
  return shuffle(
    [...words].sort((a, b) => {
      const status = (w: VocabWord) => {
        if (w.examStatus === 'review') return 0;
        if (w.masteryLevel === 'new') return 1;
        if (w.masteryLevel === 'learning') return 2;
        return 3;
      };
      return status(a) - status(b);
    }).slice(0, Math.max(count, Math.min(words.length, 14)))
  ).slice(0, count);
};

const typeLabel: Record<QuestionType, string> = {
  choice: '選擇題',
  speaking: '口說',
  writing: '寫作',
  collocation: '搭配字詞',
  article: '文章填空',
};

export const VocabAIQuiz: React.FC<Props> = ({ words, onWordsChange }) => {
  const eligibleWords = useMemo(() => words.filter((w) => w.word && w.translation), [words]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [transcript, setTranscript] = useState('');
  const [feedback, setFeedback] = useState<{ passed: boolean; text: string } | null>(null);
  const [sessionResults, setSessionResults] = useState<Array<{ wordId: string; word: string; passed: boolean }>>([]);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recognizer, setRecognizer] = useState<any>(null);
  const [sessionFinished, setSessionFinished] = useState(false);

  const generateExam = () => {
    if (eligibleWords.length < 2) return;
    const chosen = pickWords(eligibleWords, Math.min(8, eligibleWords.length));
    const plan: QuestionType[] = ['choice', 'speaking', 'writing', 'collocation', 'article', 'choice', 'speaking', 'article'];
    const generated = chosen.map((word, i) => {
      const type = plan[i % plan.length];
      if (type === 'choice') {
        const distractors = shuffle(eligibleWords.filter((w) => w.id !== word.id)).slice(0, 3).map((w) => w.translation);
        return {
          id: `${word.id}-choice-${Date.now()}-${i}`,
          type,
          word,
          prompt: `「${word.word}」最接近哪個意思？`,
          options: shuffle([word.translation, ...distractors]),
          answer: word.translation,
          explanation: word.definitionEn || word.translation,
        };
      }
      if (type === 'collocation') {
        const correct = word.collocations?.[0];
        const pool = shuffle(eligibleWords.flatMap((w) => w.collocations || []).filter(Boolean)).filter((c) => c !== correct);
        if (!correct || pool.length < 2) {
          return {
            id: `${word.id}-choice-${Date.now()}-${i}`,
            type: 'choice' as const,
            word,
            prompt: `「${word.word}」最接近哪個意思？`,
            options: shuffle([word.translation, ...shuffle(eligibleWords.filter((w) => w.id !== word.id)).slice(0, 3).map((w) => w.translation)]),
            answer: word.translation,
            explanation: word.definitionEn || word.translation,
          };
        }
        return {
          id: `${word.id}-collocation-${Date.now()}-${i}`,
          type,
          word,
          prompt: `哪一個是「${word.word}」最自然的搭配？`,
          options: shuffle([correct, ...pool.slice(0, 3)]),
          answer: correct,
          explanation: `常見搭配：${word.collocations.join('、')}`,
        };
      }
      if (type === 'article') {
        const source = word.exampleEn || `The team learned to use ${word.word} in a real-world situation.`;
        return {
          id: `${word.id}-article-${Date.now()}-${i}`,
          type,
          word,
          prompt: `閱讀語境後填入最適合的單字：\n${source.replace(new RegExp(word.word, 'ig'), '_____')}`,
          answer: word.word,
          explanation: `${word.exampleEn || ''}${word.exampleZh ? `\n${word.exampleZh}` : ''}`,
        };
      }
      if (type === 'speaking') {
        return {
          id: `${word.id}-speaking-${Date.now()}-${i}`,
          type,
          word,
          prompt: `請說出英文單字「${word.word}」，並說一個包含它的簡短句子。`,
          explanation: `目標字：${word.word}${word.phonetic ? ` ${word.phonetic}` : ''}`,
        };
      }
      return {
        id: `${word.id}-writing-${Date.now()}-${i}`,
        type: 'writing' as const,
        word,
        prompt: `請用「${word.word}」造一個自然、完整的英文句子。`,
        explanation: word.translation,
      };
    });

    setQuestions(shuffle(generated));
    setIndex(0);
    setSelected(null);
    setInput('');
    setTranscript('');
    setFeedback(null);
    setSessionResults([]);
    setSessionFinished(false);
  };

  React.useEffect(() => {
    if (eligibleWords.length >= 2 && questions.length === 0) generateExam();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eligibleWords.length]);

  const current = questions[index];
  const answered = Boolean(feedback);

  const registerResult = (passed: boolean, text: string) => {
    if (!current || feedback) return;
    recordVocabExamResult(current.word.id, passed);
    onWordsChange();
    setSessionResults((prev) => [...prev, { wordId: current.word.id, word: current.word.word, passed }]);
    setFeedback({ passed, text });
  };

  const choose = (option: string) => {
    if (!current || current.type === 'speaking' || current.type === 'writing' || answered) return;
    registerResult(option === current.answer, option === current.answer ? '答對了！' : `答案：${current.answer}`);
    setSelected(option);
  };

  const submitTextAnswer = async () => {
    if (!current || answered || !input.trim()) return;
    if (current.type === 'article') {
      const passed = input.trim().toLowerCase() === current.answer?.toLowerCase();
      registerResult(passed, passed ? '填答正確！' : `正確答案：${current.answer}`);
      return;
    }

    setIsEvaluating(true);
    try {
      const res = await fetch('/api/gemini/build-sentence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetWords: [current.word.word],
          userSentence: input.trim(),
          grammarPattern: 'Natural English usage',
          stage: 'word-to-sentence',
        }),
      });
      const data = await res.json();
      const passed = Boolean(data.isCorrect || (data.score && data.score >= 70));
      registerResult(passed, passed ? `造句通過（${data.score || 85} 分）` : `需要再練習：${data.grammarExplanation || '句型仍需調整'}`);
    } catch (_) {
      registerResult(input.trim().toLowerCase().includes(current.word.word.toLowerCase()), 'AI 評估暫時不可用，已用基本字詞檢查。');
    } finally {
      setIsEvaluating(false);
    }
  };

  const startSpeaking = () => {
    if (!current || answered) return;
    if (!isSpeechRecognitionSupported()) {
      registerResult(false, '此瀏覽器不支援語音辨識，請改用其他題型。');
      return;
    }
    if (isRecording) {
      recognizer?.stop?.();
      setIsRecording(false);
      return;
    }
    setTranscript('');
    const instance = createSpeechRecognizer({
      onResult: (text) => {
        setTranscript(text);
        const normalized = text.toLowerCase().replace(/[^a-z0-9\s-]/g, ' ');
        const target = current.word.word.toLowerCase();
        const passed = normalized.split(/\s+/).includes(target) || normalized.includes(target);
        registerResult(passed, passed ? `成功辨識「${current.word.word}」，口說通過！` : `未辨識到「${current.word.word}」，可以再試一次。`);
      },
      onError: () => {
        setIsRecording(false);
        setFeedback({ passed: false, text: '語音辨識失敗，請再試一次。' });
      },
      onEnd: () => setIsRecording(false),
    });
    if (instance) {
      setRecognizer(instance);
      instance.start();
      setIsRecording(true);
    }
  };

  const next = () => {
    if (!current || !answered) return;
    if (index >= questions.length - 1) {
      setSessionFinished(true);
      return;
    }
    setIndex((v) => v + 1);
    setSelected(null);
    setInput('');
    setTranscript('');
    setFeedback(null);
  };

  const summary = useMemo(() => {
    const correct = sessionResults.filter((r) => r.passed).length;
    const total = sessionResults.length;
    const accuracy = total ? Math.round((correct / total) * 100) : 0;
    return { correct, total, accuracy };
  }, [sessionResults]);

  if (eligibleWords.length < 2) {
    return (
      <section className="rounded-2xl border border-violet-300 bg-violet-50 p-5 dark:bg-violet-950/50 dark:border-violet-700">
        <div className="flex items-center gap-2 text-violet-950 dark:text-violet-100 font-bold"><Brain className="w-5 h-5" /> AI 考題</div>
        <p className="mt-1 text-xs text-violet-800 dark:text-violet-200">至少收錄 2 個單字後才能開始考題。</p>
      </section>
    );
  }

  if (sessionFinished) {
    const learned = summary.accuracy >= 80;
    return (
      <section className="rounded-2xl border border-violet-300 bg-violet-50 p-6 dark:bg-violet-950/50 dark:border-violet-700">
        <div className="flex items-center gap-3">
          {learned ? <CheckCircle2 className="w-8 h-8 text-emerald-400" /> : <RefreshCw className="w-8 h-8 text-amber-300" />}
          <div>
            <h3 className="text-xl font-bold text-violet-950 dark:text-violet-100">本輪考核：{learned ? '已學習' : '需要再學習'}</h3>
            <p className="text-sm text-violet-800 dark:text-violet-200 mt-0.5">答對 {summary.correct} / {summary.total}，正確率 {summary.accuracy}%</p>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {sessionResults.map((result) => (
            <div key={`${result.wordId}-${Math.random()}`} className={`rounded-xl border px-3 py-2 ${result.passed ? 'bg-emerald-950/70 border-emerald-700' : 'bg-rose-950/70 border-rose-700'}`}>
              <div className={`font-semibold text-sm ${result.passed ? 'text-emerald-100' : 'text-rose-100'}`}>{result.word}</div>
              <div className={`text-xs mt-0.5 ${result.passed ? 'text-emerald-200' : 'text-rose-200'}`}>{result.passed ? '答對' : '需要再複習'}</div>
            </div>
          ))}
        </div>
        <button onClick={generateExam} className="mt-5 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-700 text-white font-semibold text-sm hover:bg-violet-800 cursor-pointer">
          <Sparkles className="w-4 h-4" /> 再考一輪（優先考弱項）
        </button>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-violet-300 bg-violet-50 p-5 shadow-sm dark:bg-violet-950/50 dark:border-violet-700">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="p-2.5 rounded-xl bg-violet-200 text-violet-950 dark:bg-violet-900 dark:text-violet-100"><Brain className="w-5 h-5" /></span>
          <div>
            <h3 className="font-bold text-violet-950 dark:text-violet-100 text-lg">AI 生字考試</h3>
            <p className="text-xs text-violet-800 dark:text-violet-200">選擇＋口說＋寫作＋搭配＋文章填空；答題表現會自動標記「已學習 / 需要再學習」。</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-white/80 border border-violet-200 text-violet-900 dark:bg-violet-900/70 dark:border-violet-700 dark:text-violet-100">第 {index + 1} / {questions.length}</span>
          <button onClick={generateExam} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-violet-700 text-white text-xs font-semibold hover:bg-violet-800 cursor-pointer">
            <RefreshCw className="w-3.5 h-3.5" /> 換一組
          </button>
        </div>
      </div>

      {current && (
        <div className="mt-4 space-y-4">
          <div className="rounded-2xl bg-white border border-violet-200 p-4 dark:bg-stone-900 dark:border-violet-800">
            <div className="flex items-center justify-between mb-2">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-violet-700 dark:text-violet-200 uppercase tracking-wide">
                {current.type === 'choice' && <ListChecks className="w-3.5 h-3.5" />}
                {current.type === 'speaking' && <Mic className="w-3.5 h-3.5" />}
                {current.type === 'writing' && <PenLine className="w-3.5 h-3.5" />}
                {current.type === 'collocation' && <Link2 className="w-3.5 h-3.5" />}
                {current.type === 'article' && <FileText className="w-3.5 h-3.5" />}
                {typeLabel[current.type]}
              </span>
              <button onClick={() => speakText(current.word.word)} className="p-1.5 rounded-lg text-violet-700 hover:bg-violet-100 dark:text-violet-200 dark:hover:bg-violet-900 cursor-pointer" title="聽發音">
                <Volume2 className="w-4 h-4" />
              </button>
            </div>
            <h4 className="text-lg font-bold text-stone-900 dark:text-stone-50 whitespace-pre-line leading-relaxed">{current.prompt}</h4>
          </div>

          {current.options && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {current.options.map((option) => {
                const isCorrect = option === current.answer;
                const isSelected = option === selected;
                let cls = 'bg-white border-violet-200 text-stone-800 hover:border-violet-400 hover:bg-violet-50 dark:bg-stone-900 dark:border-violet-800 dark:text-stone-100 dark:hover:bg-violet-950';
                if (answered && isCorrect) cls = 'bg-emerald-950/80 border-emerald-600 text-emerald-100';
                if (answered && isSelected && !isCorrect) cls = 'bg-rose-950/80 border-rose-600 text-rose-100';
                return <button key={option} onClick={() => choose(option)} disabled={answered} className={`rounded-xl border p-3 text-left text-sm transition cursor-pointer disabled:cursor-default ${cls}`}>{option}</button>;
              })}
            </div>
          )}

          {current.type === 'speaking' && !answered && (
            <div className="space-y-3">
              <button onClick={startSpeaking} className={`inline-flex items-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm cursor-pointer ${isRecording ? 'bg-rose-600 text-white' : 'bg-violet-700 text-white hover:bg-violet-800'}`}>
                <Mic className="w-4 h-4" /> {isRecording ? '停止錄音' : '開始口說作答'}
              </button>
              {transcript && <div className="rounded-xl bg-white border border-violet-200 p-3 text-sm dark:bg-stone-900 dark:border-violet-800 dark:text-stone-100">辨識結果：{transcript}</div>}
            </div>
          )}

          {(current.type === 'writing' || current.type === 'article') && !answered && (
            <div className="space-y-2">
              <textarea value={input} onChange={(e) => setInput(e.target.value)} rows={current.type === 'writing' ? 4 : 1} placeholder={current.type === 'writing' ? '輸入英文句子...' : '輸入答案單字...'} className="w-full rounded-xl border border-violet-200 bg-white p-3 text-sm text-stone-900 outline-none focus:ring-2 focus:ring-violet-200 dark:bg-stone-900 dark:border-violet-800 dark:text-stone-100" />
              <button disabled={isEvaluating || !input.trim()} onClick={submitTextAnswer} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-700 text-white text-sm font-semibold hover:bg-violet-800 disabled:opacity-40 cursor-pointer">
                {isEvaluating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />} 送出答案
              </button>
            </div>
          )}

          {feedback && (
            <div className={`rounded-xl border p-3 ${feedback.passed ? 'bg-emerald-950/80 border-emerald-700 text-emerald-100' : 'bg-rose-950/80 border-rose-700 text-rose-100'}`}>
              <div className="flex items-start gap-2">
                {feedback.passed ? <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" /> : <XCircle className="w-4 h-4 mt-0.5 shrink-0" />}
                <div>
                  <p className="font-bold">{feedback.text}</p>
                  <p className="text-xs mt-1 opacity-90">{current.explanation}</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-end pt-1">
            <button disabled={!answered} onClick={next} className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-violet-700 text-white text-sm font-semibold hover:bg-violet-800 disabled:opacity-40 cursor-pointer">
              {index === questions.length - 1 ? '查看本輪結果' : '下一題'} <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </section>
  );
};
