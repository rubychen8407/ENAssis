import React from 'react';
import { Sparkles, Compass, Lightbulb, BookOpen, Layers } from 'lucide-react';
import { VocabWord, WordEtymology } from '../types';

interface Props {
  word: VocabWord;
}

export const WordEtymologyPanel: React.FC<Props> = ({ word }) => {
  const etymology: WordEtymology = word.etymology || {
    prefix: word.word.length > 5 ? word.word.slice(0, 2) : '',
    prefixMeaning: '',
    root: word.word,
    rootMeaning: word.translation,
    suffix: '',
    suffixMeaning: `表示 ${word.partOfSpeech}`,
    breakdown: `${word.word}`,
    memoryHook: `將「${word.word}」與「${word.translation}」連結記憶。`,
  };

  return (
    <div className="space-y-4" onClick={(e) => e.stopPropagation()}>
      <div className="flex items-center gap-2 border-b border-stone-200 dark:border-stone-800 pb-2.5">
        <span className="p-1.5 rounded-lg bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300">
          <Layers className="w-4 h-4" />
        </span>
        <div>
          <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
            字根字首字尾拆解 (Morphological Etymology)
          </h4>
          <p className="text-[11px] text-stone-500">掌握構詞邏輯，背一個字等於記住一整個字族</p>
        </div>
      </div>

      {/* Structural Breakdown blocks */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
        {/* Prefix */}
        <div className="p-3 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900">
          <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">字首 (Prefix)</span>
          <p className="font-mono font-bold text-indigo-600 dark:text-indigo-400 text-sm mt-0.5">
            {etymology.prefix || '無字首 (Root Base)'}
          </p>
          <p className="text-stone-600 dark:text-stone-400 text-[11px] mt-1">
            {etymology.prefixMeaning || '直接由字根衍生'}
          </p>
        </div>

        {/* Root */}
        <div className="p-3 rounded-xl border border-indigo-200 dark:border-indigo-900/50 bg-indigo-50/50 dark:bg-indigo-950/20">
          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">核心字根 (Core Root)</span>
          <p className="font-mono font-bold text-stone-900 dark:text-stone-100 text-sm mt-0.5">
            {etymology.root || word.word}
          </p>
          <p className="text-stone-700 dark:text-stone-300 text-[11px] mt-1">
            {etymology.rootMeaning || word.translation}
          </p>
        </div>

        {/* Suffix */}
        <div className="p-3 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900">
          <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">字尾 (Suffix)</span>
          <p className="font-mono font-bold text-amber-600 dark:text-amber-400 text-sm mt-0.5">
            {etymology.suffix || '零字尾'}
          </p>
          <p className="text-stone-600 dark:text-stone-400 text-[11px] mt-1">
            {etymology.suffixMeaning || `決定詞性為 ${word.partOfSpeech}`}
          </p>
        </div>
      </div>

      {/* Memory Hook / Mnemonic */}
      {etymology.memoryHook && (
        <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/60 dark:bg-amber-950/20 dark:border-amber-900/50 flex items-start gap-2.5">
          <Lightbulb className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs">
            <span className="font-bold text-amber-900 dark:text-amber-200">高效記憶拆解口訣：</span>
            <p className="text-amber-800 dark:text-amber-300 mt-0.5 leading-relaxed font-medium">
              {etymology.memoryHook}
            </p>
          </div>
        </div>
      )}

      {/* Etymology origin */}
      {etymology.origin && (
        <div className="text-[11px] text-stone-500 dark:text-stone-400 flex items-center gap-1.5 px-2">
          <BookOpen className="w-3.5 h-3.5 shrink-0" />
          <span>詞源脈絡：{etymology.origin}</span>
        </div>
      )}
    </div>
  );
};
