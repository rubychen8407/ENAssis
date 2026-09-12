import React, { useState } from 'react';
import { Sparkles, X, Check, RefreshCw, BookOpen, Volume2 } from 'lucide-react';
import { VocabWord } from '../types';
import { speakText } from '../utils/speech';
import { toTraditionalChinese } from '../utils/chineseConverter';
import { updateWord } from '../utils/storage';

interface Props {
  word: VocabWord;
  isOpen: boolean;
  onClose: () => void;
  onSaved: (updatedWord: VocabWord) => void;
}

export const WordExampleEditorModal: React.FC<Props> = ({
  word,
  isOpen,
  onClose,
  onSaved,
}) => {
  const [exampleEn, setExampleEn] = useState(word.exampleEn || '');
  const [exampleZh, setExampleZh] = useState(word.exampleZh || '');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSave = () => {
    const trimmedEn = exampleEn.trim();
    const trimmedZh = exampleZh.trim();
    const updated = updateWord(word.id, {
      exampleEn: trimmedEn,
      exampleZh: trimmedZh,
    });
    if (updated) {
      onSaved(updated);
    }
    onClose();
  };

  const handleAIGenerate = async (theme?: string) => {
    setIsGenerating(true);
    setGenerateError(null);
    try {
      const res = await fetch('/api/gemini/quick-lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          word: word.word,
          contextSentence: theme ? `IELTS Academic context: ${theme}` : 'IELTS Academic Writing or Speaking Task context',
        }),
      });
      if (!res.ok) throw new Error('生成失敗');
      const data = await res.json();
      if (data.exampleEn) {
        setExampleEn(data.exampleEn);
        setExampleZh(toTraditionalChinese(data.exampleZh || ''));
      }
    } catch (err: any) {
      setGenerateError('AI 生成例句逾時或失敗，請手動輸入或再試一次。');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-5 shadow-2xl space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
              <BookOpen className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                編輯例句：{word.word}
              </h3>
              <p className="text-[11px] text-stone-500">自訂最能引發記憶的雅思真題語境或個人例句</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Senses options if available */}
        {word.senses && word.senses.length > 0 && (
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
              權威字典語義候選例句 (點擊直接套用)：
            </span>
            <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
              {word.senses.map((sense, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    if (sense.exampleEn) setExampleEn(sense.exampleEn);
                    if (sense.exampleZh) setExampleZh(sense.exampleZh);
                  }}
                  className="p-2 rounded-xl bg-stone-50 dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-750 border border-stone-200 dark:border-stone-700 text-xs cursor-pointer transition flex items-start justify-between gap-2"
                >
                  <div>
                    <span className="font-bold text-amber-700 dark:text-amber-400 mr-1">
                      {sense.partOfSpeech}
                    </span>
                    <span className="text-stone-600 dark:text-stone-300 font-medium">
                      {sense.definitionZh}
                    </span>
                    <p className="text-stone-800 dark:text-stone-200 mt-1 italic">
                      "{sense.exampleEn}"
                    </p>
                  </div>
                  <span className="text-[10px] text-stone-400 shrink-0">套用</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* English Sentence */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <label className="font-bold text-stone-700 dark:text-stone-300">英文例句 (English Sentence)</label>
            <button
              type="button"
              onClick={() => speakText(exampleEn)}
              disabled={!exampleEn}
              className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-300 disabled:opacity-30 inline-flex items-center gap-1 cursor-pointer"
            >
              <Volume2 className="w-3.5 h-3.5" /> 朗讀
            </button>
          </div>
          <textarea
            rows={3}
            value={exampleEn}
            onChange={(e) => setExampleEn(e.target.value)}
            placeholder={`輸入包含「${word.word}」的英文例句...`}
            className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs text-stone-900 dark:text-stone-100 outline-none focus:ring-2 focus:ring-amber-500/30"
          />
        </div>

        {/* Chinese Translation */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-stone-700 dark:text-stone-300">中文翻譯 (Chinese Translation)</label>
          <input
            type="text"
            value={exampleZh}
            onChange={(e) => setExampleZh(e.target.value)}
            placeholder="例句的中文翻譯..."
            className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs text-stone-900 dark:text-stone-100 outline-none focus:ring-2 focus:ring-amber-500/30"
          />
        </div>

        {generateError && (
          <p className="text-xs text-rose-600 dark:text-rose-400">{generateError}</p>
        )}

        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={() => handleAIGenerate()}
            disabled={isGenerating}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-700 dark:text-stone-200 text-xs font-semibold hover:bg-stone-100 dark:hover:bg-stone-750 disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
            {isGenerating ? 'AI 生成雅思真題例句中…' : '✨ AI 生成真實雅思例句'}
          </button>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 rounded-xl text-xs font-semibold text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!exampleEn.trim()}
              className="inline-flex items-center gap-1 px-4 py-2 rounded-xl bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 text-xs font-bold hover:bg-stone-800 disabled:opacity-50 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" /> 儲存修改
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
