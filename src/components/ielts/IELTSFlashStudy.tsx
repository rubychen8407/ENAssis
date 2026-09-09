import React, { useState } from 'react';
import {
  BookOpen,
  ArrowLeft,
  CheckCircle2,
  HelpCircle,
  Volume2,
  Plus,
  Compass,
  FileText,
  Search,
  Check,
} from 'lucide-react';
import { IELTSExam, IELTSQuestionExplanation } from '../../types/ielts';
import { speakText } from '../../utils/speech';
import { addWordToVocabulary } from '../../utils/storage';

interface Props {
  exam: IELTSExam;
  onBackToArena: () => void;
  onBackToBank: () => void;
  onWordAdded?: () => void;
}

export const IELTSFlashStudy: React.FC<Props> = ({
  exam,
  onBackToArena,
  onBackToBank,
  onWordAdded,
}) => {
  // Flatten explanations from both single items and grouped items
  const flattenedExplanations = React.useMemo(() => {
    const list: { questionId: string; questionNumber?: number; text: string }[] = [];
    (exam.explanations || []).forEach((exp) => {
      if (exp.items && Array.isArray(exp.items) && exp.items.length > 0) {
        exp.items.forEach((item: any) => {
          if (item && (item.questionId || item.questionNumber)) {
            list.push({
              questionId: item.questionId || `q${item.questionNumber}`,
              questionNumber: item.questionNumber,
              text: item.text || exp.text || '',
            });
          }
        });
      } else if (exp.questionId) {
        list.push({
          questionId: exp.questionId,
          questionNumber: exp.questionNumber,
          text: exp.text || '',
        });
      }
    });

    if (list.length === 0) {
      Object.keys(exam.answerKey).forEach((qId, idx) => {
        list.push({
          questionId: qId,
          questionNumber: idx + 1,
          text: `標準答案為：${exam.answerKey[qId]}。請在閱讀文章中比對對應段落與同義詞改寫。`,
        });
      });
    }

    return list;
  }, [exam]);

  const [activeQuestionId, setActiveQuestionId] = useState<string>(
    flattenedExplanations[0]?.questionId || 'q1'
  );
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [addedWords, setAddedWords] = useState<Set<string>>(new Set());

  // Clean passage HTML
  const sanitizedPassageHtml = exam.passageHtml || '';

  // Get active explanation
  const currentExplanation = flattenedExplanations.find((e) => e.questionId === activeQuestionId);

  // Quick word lookup from text
  const handlePassageMouseUp = () => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) return;
    const txt = sel.toString().trim();
    if (txt && txt.length > 1 && txt.length < 35 && !txt.includes('\n')) {
      setSelectedWord(txt);
    }
  };

  const handleAddSelectedWord = () => {
    if (!selectedWord) return;
    addWordToVocabulary({
      word: selectedWord,
      phonetic: '',
      partOfSpeech: 'n./v.',
      translation: '雅思閱讀精讀單字',
      definitionEn: '',
      collocations: [],
      exampleEn: `From IELTS Reading: ${exam.title}`,
      exampleZh: '',
      grammarNotes: `精析篇目：${exam.title}`,
      masteryLevel: 'new',
      tags: ['IELTS-Reading', '背題定位'],
    });
    setAddedWords((prev) => new Set(prev).add(selectedWord.toLowerCase()));
    if (onWordAdded) onWordAdded();
    setSelectedWord(null);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] min-h-[640px] bg-stone-100/80 rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
      {/* Top Header */}
      <div className="bg-white px-5 py-3 border-b border-stone-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToBank}
            className="p-1.5 rounded-xl hover:bg-stone-100 text-stone-600 hover:text-stone-900 transition cursor-pointer"
            title="返回題庫"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-600 text-white font-mono">
                背題定位精析模式
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-stone-100 text-stone-700">
                {exam.category} • {exam.frequency}
              </span>
              <h2 className="text-sm font-bold text-stone-900 truncate max-w-sm sm:max-w-md">
                {exam.title}
              </h2>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onBackToArena}
            className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-stone-900 hover:bg-stone-800 text-white transition shadow-2xs cursor-pointer flex items-center gap-1.5"
          >
            <FileText className="w-3.5 h-3.5" />
            切換至作答模式
          </button>
        </div>
      </div>

      {/* Word popover */}
      {selectedWord && (
        <div className="bg-stone-900 text-white px-4 py-2 flex items-center justify-between text-xs z-30 shadow-md">
          <div className="flex items-center gap-2">
            <span className="font-serif font-bold text-amber-300">“{selectedWord}”</span>
            <span className="text-stone-400 text-[11px]">選取此生字</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => speakText(selectedWord, { rate: 0.85 })}
              className="px-2 py-1 rounded bg-stone-800 hover:bg-stone-700 text-[11px] flex items-center gap-1 cursor-pointer"
            >
              <Volume2 className="w-3 h-3 text-stone-300" /> 發音
            </button>
            <button
              onClick={handleAddSelectedWord}
              className="px-2.5 py-1 rounded bg-amber-400 text-stone-950 font-bold hover:bg-amber-300 text-[11px] flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3 h-3" /> 加入生字庫
            </button>
            <button
              onClick={() => setSelectedWord(null)}
              className="text-stone-400 hover:text-white ml-2 text-xs"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Main Split: Left Passage & Right Question Locator Explanations */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Left: Reading Passage */}
        <div
          onMouseUp={handlePassageMouseUp}
          className="w-full md:w-1/2 h-1/2 md:h-full overflow-y-auto p-6 md:p-8 border-r border-stone-200/80 bg-white select-text"
        >
          <div className="max-w-2xl mx-auto space-y-4">
            <div className="pb-3 border-b border-stone-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-stone-400 uppercase font-mono">
                  AUTHENTIC PASSAGE TEXT
                </span>
                <h3 className="text-lg font-serif font-bold text-stone-900">{exam.title}</h3>
              </div>
              <span className="text-xs text-stone-400 font-mono">選字即查詞</span>
            </div>

            <div
              className="prose prose-stone max-w-none text-stone-800 text-sm leading-relaxed [&>div]:mb-5 [&_p]:mb-4 [&_strong]:text-stone-900"
              dangerouslySetInnerHTML={{ __html: sanitizedPassageHtml }}
            />
          </div>
        </div>

        {/* Right: Explanations & Locators */}
        <div className="w-full md:w-1/2 h-1/2 md:h-full overflow-y-auto p-6 md:p-8 bg-stone-50/70">
          <div className="max-w-xl mx-auto space-y-6">
            <div className="bg-white rounded-2xl p-5 border border-stone-200/90 shadow-2xs">
              <h4 className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-3">
                選擇題號查看真題考點與定位 (Question Navigator)
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {flattenedExplanations.map((exp, idx) => {
                  const qId = exp.questionId;
                  const displayNum = exam.questionDisplayMap?.[qId] || exp.questionNumber || idx + 1;
                  const isActive = qId === activeQuestionId;
                  const ans = exam.answerKey[qId] || '';

                  return (
                    <button
                      key={qId}
                      onClick={() => setActiveQuestionId(qId)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold font-mono transition cursor-pointer flex items-center gap-1.5 ${
                        isActive
                          ? 'bg-stone-900 text-white shadow-2xs scale-105'
                          : 'bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200'
                      }`}
                    >
                      <span>Q{displayNum}</span>
                      <span
                        className={`text-[10px] px-1 rounded ${
                          isActive ? 'bg-amber-400 text-stone-900' : 'text-stone-500'
                        }`}
                      >
                        {ans}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Current Selected Question Deep Dive */}
            {currentExplanation ? (
              <div className="bg-white rounded-2xl p-6 border border-stone-200/90 shadow-2xs space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-xl bg-amber-500 text-white font-mono font-bold text-xs flex items-center justify-center">
                      Q{exam.questionDisplayMap?.[activeQuestionId] || currentExplanation.questionNumber || activeQuestionId}
                    </span>
                    <span className="font-bold text-stone-900 text-sm">
                      官方答案與定位句解析
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-stone-400 font-medium">標準答案:</span>
                    <span className="px-2.5 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono font-bold text-xs">
                      {exam.answerKey[activeQuestionId] || '—'}
                    </span>
                  </div>
                </div>

                {/* Explanation Content */}
                <div className="bg-stone-50/80 p-4 rounded-xl border border-stone-100 text-xs text-stone-800 leading-relaxed whitespace-pre-line space-y-3 font-sans">
                  {currentExplanation.text}
                </div>

                <div className="pt-2 flex items-center justify-between text-xs text-stone-500">
                  <span className="flex items-center gap-1">
                    <Compass className="w-3.5 h-3.5 text-amber-600" />
                    定位提示：請對照左側原文中相應段落的同義詞改寫 (Paraphrasing)
                  </span>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-8 text-center border border-stone-200 text-stone-400 text-xs">
                請在上方點選題號查看詳細官方考點與定位句。
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
