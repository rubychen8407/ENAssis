import React from 'react';
import { Layers3, Brain, Upload } from 'lucide-react';

interface Props {
  studyMode: 'study' | 'exam';
  onToggleMode: () => void;
  onBatchImport: () => void;
  newWordsCount?: number;
}

/**
 * Material Design 3 (M3) Vertical Floating Toolbar
 * Specs reference: https://m3.material.io/components/toolbars/specs
 * - Vertical orientation (aria-orientation="vertical")
 * - 56dp container width (w-14) with fully rounded 28dp pill container (rounded-[28px])
 * - Elevated surface container with elevation shadow & border
 * - 48x48dp touch targets with standard 24x24dp icons
 * - Standard M3 1dp horizontal divider separating actions
 * - M3 plain tooltips anchored to the left of each action
 */
export const VocabToolbar: React.FC<Props> = ({
  studyMode,
  onToggleMode,
  onBatchImport,
  newWordsCount = 0,
}) => {
  const isStudy = studyMode === 'study';

  return (
    <nav
      id="vocab-vertical-floating-toolbar"
      role="toolbar"
      aria-orientation="vertical"
      aria-label="生字簿功能工具列"
      className="fixed right-4 md:right-6 bottom-6 z-40 flex flex-col items-center gap-1.5 p-2 rounded-[28px] bg-stone-900/95 dark:bg-stone-900/95 backdrop-blur-md border border-stone-800 shadow-2xl ring-1 ring-white/10 w-14 transition-all duration-200"
    >
      {/* 1. 單一按鈕切換 Study Mode 與 Exam Mode */}
      <div className="relative group">
        <button
          id="btn-vocab-toggle-mode"
          type="button"
          onClick={onToggleMode}
          className={`relative w-11 h-11 flex items-center justify-center rounded-full transition-all duration-200 cursor-pointer select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 active:scale-95 ${
            isStudy
              ? 'bg-stone-800 hover:bg-stone-700/90 text-sky-400 hover:text-sky-300'
              : 'bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold shadow-md shadow-amber-950/20'
          }`}
          title={isStudy ? '切換為測驗模式 (Exam Mode)' : '切換為字卡模式 (Study Mode)'}
          aria-label={isStudy ? '切換為測驗模式 (Exam Mode)' : '切換為字卡模式 (Study Mode)'}
        >
          {isStudy ? (
            <>
              <Brain className="w-5 h-5 stroke-[2.2]" />
              {newWordsCount > 0 && (
                <span
                  className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-stone-900 animate-pulse"
                  aria-label={`${newWordsCount} 個新單字`}
                />
              )}
            </>
          ) : (
            <Layers3 className="w-5 h-5 stroke-[2.4]" />
          )}
        </button>

        {/* M3 Plain Tooltip (Anchored to the left) */}
        <div
          role="tooltip"
          className="absolute right-full mr-3 top-1/2 -translate-y-1/2 px-2.5 py-1.5 rounded-lg bg-stone-900/95 text-stone-100 text-xs font-semibold shadow-xl border border-stone-700/80 pointer-events-none opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity duration-150 whitespace-nowrap z-50 flex items-center gap-1.5"
        >
          <span>{isStudy ? '切換為測驗模式' : '切換為字卡模式'}</span>
          <span className="text-[10px] font-mono px-1 py-0.5 rounded bg-stone-800 text-stone-300">
            {isStudy ? 'Exam' : 'Study'}
          </span>
          {/* Subtle triangle indicator */}
          <span className="absolute left-full top-1/2 -translate-y-1/2 border-4 border-transparent border-l-stone-900/95" />
        </div>
      </div>

      {/* M3 1dp Divider */}
      <div
        className="w-7 h-[1px] bg-stone-700/60 my-0.5"
        role="separator"
        aria-orientation="horizontal"
      />

      {/* 2. 批次匯入按鈕 */}
      <div className="relative group">
        <button
          id="btn-vocab-batch-import"
          type="button"
          onClick={onBatchImport}
          className="relative w-11 h-11 flex items-center justify-center rounded-full bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white transition-all duration-200 cursor-pointer shadow-md shadow-emerald-950/20 select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
          title="批次匯入單字（剪貼簿、文件或網址文章分析）"
          aria-label="批次匯入單字"
        >
          <Upload className="w-5 h-5 stroke-[2.2]" />
        </button>

        {/* M3 Plain Tooltip (Anchored to the left) */}
        <div
          role="tooltip"
          className="absolute right-full mr-3 top-1/2 -translate-y-1/2 px-2.5 py-1.5 rounded-lg bg-stone-900/95 text-stone-100 text-xs font-semibold shadow-xl border border-stone-700/80 pointer-events-none opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity duration-150 whitespace-nowrap z-50 flex items-center gap-1.5"
        >
          <span>批次匯入單字</span>
          <span className="text-[10px] font-mono px-1 py-0.5 rounded bg-stone-800 text-stone-300">
            Import
          </span>
          <span className="absolute left-full top-1/2 -translate-y-1/2 border-4 border-transparent border-l-stone-900/95" />
        </div>
      </div>
    </nav>
  );
};
