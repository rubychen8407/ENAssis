import React, { useEffect, useMemo, useState } from 'react';
import { Brain, CheckCircle2, ChevronRight, RefreshCw, Sparkles, Volume2, XCircle } from 'lucide-react';
import { VocabWord } from '../types';
import { speakText } from '../utils/speech';

type QuizType = 'meaning' | 'context' | 'collocation' | 'recall' | 'association';

type QuizQuestion = {
  id: string;
  type: QuizType;
  word: VocabWord;
  prompt: string;
  options: string[];
  answer: string;
  explanation: string;
  context?: string;
};

interface Props {
  words: VocabWord[];
}

const shuffle = <T,>(items: T[]): T[] => {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

const pickDistinctWords = (words: VocabWord[], count: number) => {
  const priority = [...words].sort((a, b) => {
    const score = (w: VocabWord) => (w.masteryLevel === 'new' ? 0 : w.masteryLevel === 'learning' ? 1 : 2);
    return score(a) - score(b);
  });
  return shuffle(priority.slice(0, Math.max(count, Math.min(words.length, 12)))).slice(0, count);
};

const makeMeaningQuestion = (word: VocabWord, pool: VocabWord[], index: number): QuizQuestion => {
  const distractors = shuffle(pool.filter((w) => w.id !== word.id && w.translation).map((w) => w.translation)).slice(0, 3);
  const options = shuffle([word.translation, ...distractors]);
  return {
    id: `${word.id}-meaning-${index}`,
    type: 'meaning',
    word,
    prompt: `「${word.word}」最接近哪個意思？`,
    options,
    answer: word.translation,
    explanation: word.definitionEn ? `${word.translation}。英文定義：${word.definitionEn}` : word.translation,
  };
};

const makeRecallQuestion = (word: VocabWord, pool: VocabWord[], index: number): QuizQuestion => {
  const distractors = shuffle(pool.filter((w) => w.id !== word.id).map((w) => w.word)).slice(0, 3);
  const options = shuffle([word.word, ...distractors]);
  return {
    id: `${word.id}-recall-${index}`,
    type: 'recall',
    word,
    prompt: `看到「${word.translation}」，你能回想出英文單字嗎？`,
    options,
    answer: word.word,
    explanation: `${word.word} ${word.phonetic ? `(${word.phonetic})` : ''}。${word.grammarNotes || ''}`,
  };
};

const makeCollocationQuestion = (word: VocabWord, pool: VocabWord[], index: number): QuizQuestion => {
  const correct = word.collocations?.[0];
  if (!correct) return makeMeaningQuestion(word, pool, index);
  const distractors = shuffle(
    pool.flatMap((w) => w.collocations || []).filter((c) => c && c !== correct)
  ).slice(0, 3);
  if (distractors.length < 3) return makeMeaningQuestion(word, pool, index);
  const options = shuffle([correct, ...distractors]);
  return {
    id: `${word.id}-collocation-${index}`,
    type: 'collocation',
    word,
    prompt: `哪一個是「${word.word}」的自然搭配？`,
    options,
    answer: correct,
    explanation: `常見搭配：${word.collocations.join('、')}`,
  };
};

const makeAssociationQuestion = (word: VocabWord, pool: VocabWord[], index: number): QuizQuestion => {
  const example = word.exampleEn || `Use ${word.word} naturally in a sentence.`;
  const options = shuffle([
    example,
    ...shuffle(pool.filter((w) => w.id !== word.id && w.exampleEn).map((w) => w.exampleEn)).slice(0, 3),
  ]);
  return {
    id: `${word.id}-association-${index}`,
    type: 'association',
    word,
    prompt: `哪個情境最能幫助你把「${word.word}」和實際語境連起來？`,
    options,
    answer: example,
    explanation: word.exampleZh ? `${example}\n${word.exampleZh}` : example,
  };
};

export const VocabAIQuiz: React.FC<Props> = ({ words }) => {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiContexts, setAiContexts] = useState<Record<string, string>>({});
  const [round, setRound] = useState(0);

  const eligibleWords = useMemo(() => words.filter((w) => w.word && w.translation), [words]);

  const generateQuiz = async () => {
    if (eligibleWords.length < 2) return;
    setIsGenerating(true);
    setSelected(null);
    setScore(0);
    setCurrentIndex(0);
    const chosen = pickDistinctWords(eligibleWords, Math.min(5, eligibleWords.length));

    // Use the existing Gemini sentence-generation endpoint to create fresh contextual cues.
    const contextEntries = await Promise.all(
      chosen.slice(0, 3).map(async (word) => {
        try {
          const res = await fetch('/api/gemini/build-sentence', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              targetWords: [word.word],
              grammarPattern: 'Natural everyday or IELTS-style usage',
              stage: 'word-to-sentence',
            }),
          });
          if (!res.ok) return [word.id, word.exampleEn || ''] as const;
          const data = await res.json();
          const generated = data.nativeAlternatives?.[0] || data.correctedSentence || data.grammarExplanation || word.exampleEn || '';
          return [word.id, generated] as const;
        } catch (_) {
          return [word.id, word.exampleEn || ''] as const;
        }
      })
    );

    const contexts = Object.fromEntries(contextEntries);
    const generated: QuizQuestion[] = [];
    chosen.forEach((word, index) => {
      if (index === 0) {
        const base = contexts[word.id] || word.exampleEn;
        const context = base ? base.replace(new RegExp(word.word, 'ig'), '_____') : '';
        generated.push({
          id: `${word.id}-context-${round}-${index}`,
          type: 'context',
          word,
          prompt: context ? `填入最適合的單字：\n${context}` : `哪個單字最適合放進例句？`,
          options: shuffle([
            word.word,
            ...shuffle(eligibleWords.filter((w) => w.id !== word.id).map((w) => w.word)).slice(0, 3),
          ]),
          answer: word.word,
          explanation: word.exampleEn ? `${word.exampleEn}${word.exampleZh ? `\n${word.exampleZh}` : ''}` : word.translation,
          context,
        });
      } else if (index === 1) {
        generated.push(makeCollocationQuestion(word, chosen, index));
      } else if (index === 2) {
        generated.push(makeAssociationQuestion(word, chosen, index));
      } else if (index === 3) {
        generated.push(makeRecallQuestion(word, chosen, index));
      } else {
        generated.push(makeMeaningQuestion(word, chosen, index));
      }
    });

    setAiContexts(contexts);
    setQuestions(shuffle(generated));
    setRound((value) => value + 1);
    setIsGenerating(false);
  };

  useEffect(() => {
    if (eligibleWords.length >= 2 && questions.length === 0) {
      void generateQuiz();
    }
  }, [eligibleWords.length]);

  const current = questions[currentIndex];
  const answered = selected !== null;
  const isLast = currentIndex === questions.length - 1;

  const choose = (option: string) => {
    if (answered || !current) return;
    setSelected(option);
    if (option === current.answer) setScore((value) => value + 1);
  };

  const next = () => {
    if (!current) return;
    if (isLast) {
      void generateQuiz();
    } else {
      setCurrentIndex((value) => value + 1);
      setSelected(null);
    }
  };

  if (eligibleWords.length < 2) {
    return (
      <div className="rounded-2xl border border-violet-300 bg-violet-50 p-5 text-sm text-violet-900">
        <div className="flex items-center gap-2 font-bold"><Brain className="w-5 h-5" /> AI 單字考題</div>
        <p className="mt-1 text-xs">至少收錄 2 個單字後，AI 才能產生混合題型。</p>
      </div>
    );
  }

  return (
    <section className="rounded-2xl border border-violet-300 bg-violet-50/70 p-5 shadow-sm space-y-4 dark-vocab-quiz">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-violet-200 text-violet-900"><Brain className="w-5 h-5" /></span>
            <div>
              <h3 className="font-bold text-violet-950">AI 單字考題・反覆記憶</h3>
              <p className="text-xs text-violet-800">主動回想＋變化語境＋搭配辨識；優先考新收錄與學習中的單字。</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {current && <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-white/80 border border-violet-200 text-violet-900">第 {currentIndex + 1} / {questions.length}</span>}
          <button
            type="button"
            onClick={() => void generateQuiz()}
            disabled={isGenerating}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-violet-700 text-white text-xs font-semibold hover:bg-violet-800 disabled:opacity-50 cursor-pointer"
          >
            {isGenerating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            再出一組
          </button>
        </div>
      </div>

      {isGenerating ? (
        <div className="py-10 text-center text-sm text-violet-800"><RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />AI 正在依你的生字產生新語境…</div>
      ) : current ? (
        <div className="space-y-4">
          <div className="rounded-2xl bg-white/80 border border-violet-200 p-4">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-[11px] uppercase tracking-wide font-bold text-violet-700">
                {current.type === 'context' ? '語境填空' : current.type === 'collocation' ? '搭配辨識' : current.type === 'recall' ? '反向回想' : current.type === 'association' ? '情境關聯' : '意思辨識'}
              </span>
              <button type="button" onClick={() => speakText(current.word.word)} className="p-1.5 rounded-lg text-violet-700 hover:bg-violet-100 cursor-pointer" title="聽發音"><Volume2 className="w-4 h-4" /></button>
            </div>
            <h4 className="text-base sm:text-lg font-bold text-violet-950 whitespace-pre-line leading-relaxed">{current.prompt}</h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {current.options.map((option) => {
              const isCorrect = option === current.answer;
              const isSelected = option === selected;
              let className = 'bg-white border-violet-200 text-stone-800 hover:border-violet-400 hover:bg-violet-100';
              if (answered && isCorrect) className = 'bg-emerald-100 border-emerald-400 text-emerald-900';
              if (answered && isSelected && !isCorrect) className = 'bg-rose-100 border-rose-400 text-rose-900';
              return (
                <button key={option} type="button" onClick={() => choose(option)} disabled={answered} className={`text-left rounded-xl border p-3 text-sm transition cursor-pointer disabled:cursor-default ${className}`}>
                  {option}
                </button>
              );
            })}
          </div>

          {answered && (
            <div className={`rounded-xl border p-3 text-sm ${selected === current.answer ? 'bg-emerald-50 border-emerald-300 text-emerald-900' : 'bg-rose-50 border-rose-300 text-rose-900'}`}>
              <div className="flex items-start gap-2">
                {selected === current.answer ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" /> : <XCircle className="w-4 h-4 shrink-0 mt-0.5" />}
                <div>
                  <p className="font-bold">{selected === current.answer ? '答對了！' : `答案：${current.answer}`}</p>
                  <p className="mt-1 whitespace-pre-line text-xs leading-relaxed">{current.explanation}</p>
                  {aiContexts[current.word.id] && current.type !== 'context' && <p className="mt-2 text-xs opacity-80">AI 新語境：{aiContexts[current.word.id]}</p>}
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-1">
            <span className="text-xs font-medium text-violet-800">本組得分：{score} / {questions.slice(0, currentIndex + (answered ? 1 : 0)).length}</span>
            <button type="button" disabled={!answered} onClick={next} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-700 text-white text-sm font-semibold hover:bg-violet-800 disabled:opacity-40 cursor-pointer">
              {isLast ? '完成並再測一組' : '下一題'} <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
};
